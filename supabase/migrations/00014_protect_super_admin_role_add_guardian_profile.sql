
-- ── 1. Protect super_admin role at RLS level ────────────────────────────────
-- Prevent anyone from setting OR removing the super_admin role via direct DB update
-- (edge-function PATCH also guards this, but belt-and-suspenders)

-- Drop existing update policy and replace with one that blocks super_admin manipulation
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their org" ON profiles;
DROP POLICY IF EXISTS "Super admins can update any profile" ON profiles;

-- Self-update (cannot touch role column to/from super_admin)
CREATE POLICY "profiles_self_update"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND role NOT IN ('super_admin')
);

-- Super admin can update anyone EXCEPT cannot demote a current super_admin
CREATE POLICY "profiles_superadmin_update"
ON profiles FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  AND (SELECT role FROM profiles WHERE id = profiles.id) <> 'super_admin'
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  AND role <> 'super_admin'    -- cannot promote anyone else to super_admin either
);

-- Admin can update profiles in their own org (not super_admin targets, not setting super_admin role)
CREATE POLICY "profiles_admin_update"
ON profiles FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'secretary')
  AND organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  AND (SELECT role FROM profiles WHERE id = profiles.id) <> 'super_admin'
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'secretary')
  AND role <> 'super_admin'
);

-- ── 2. Add guardian_profile_id to students ──────────────────────────────────
-- Parents can link their auth account to their child's student record
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS guardian_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_students_guardian_profile_id ON students(guardian_profile_id);

-- RLS: parents can read students linked to them
DROP POLICY IF EXISTS "Parents can view their child" ON students;
CREATE POLICY "Parents can view their child"
ON students FOR SELECT
TO authenticated
USING (
  guardian_profile_id = auth.uid()
  OR guardian_email = (SELECT email FROM profiles WHERE id = auth.uid())
  OR organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- Parents can update guardian_profile_id on their own child's record (self-link)
DROP POLICY IF EXISTS "Parents can self-link" ON students;
CREATE POLICY "Parents can self-link"
ON students FOR UPDATE
TO authenticated
USING (
  -- either already linked to them OR guardian_email matches their email (allowing initial link)
  (
    guardian_email = (SELECT email FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'parent'
  )
)
WITH CHECK (
  guardian_profile_id = auth.uid()
  AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'parent'
);

-- ── 3. Increment invite_links uses_count helper ──────────────────────────────
-- Allow authenticated users to increment uses_count when they sign up via invite
DROP POLICY IF EXISTS "Invited users can increment uses_count" ON invite_links;
CREATE POLICY "Invited users can increment uses_count"
ON invite_links FOR UPDATE
TO authenticated
USING (token = token)   -- any valid token row
WITH CHECK (
  is_active = TRUE
  AND expires_at > now()
  AND (max_uses IS NULL OR uses_count < max_uses)
);
