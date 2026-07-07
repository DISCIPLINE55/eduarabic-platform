-- Drop all recursive self-referencing policies on profiles
DROP POLICY IF EXISTS "super_admin_can_read_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "super_admin_can_insert_profiles" ON public.profiles;
DROP POLICY IF EXISTS "super_admin_can_update_any_profile" ON public.profiles;
DROP POLICY IF EXISTS "admin_can_read_org_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admin_can_insert_org_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admin_can_update_org_member_profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin full access profiles" ON public.profiles;

-- Ensure is_super_admin SECURITY DEFINER function exists (no RLS bypass needed — uses SET search_path)
CREATE OR REPLACE FUNCTION public.is_super_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = uid AND role = 'super_admin');
$$;

-- Ensure is_admin SECURITY DEFINER function exists
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = uid AND role = 'admin');
$$;

-- Ensure get_user_role SECURITY DEFINER function exists
CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid)
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = uid;
$$;

-- Ensure get_user_org SECURITY DEFINER function exists
CREATE OR REPLACE FUNCTION public.get_user_org(uid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = uid;
$$;

-- Re-create all policies using SECURITY DEFINER functions (no recursion)

-- Super admin: full access to all profiles
CREATE POLICY "super_admin_select_all_profiles"
  ON public.profiles FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "super_admin_insert_profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "super_admin_update_any_profile"
  ON public.profiles FOR UPDATE
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "super_admin_delete_profiles"
  ON public.profiles FOR DELETE
  USING (public.is_super_admin(auth.uid()));

-- Admin: read/write profiles within same org
CREATE POLICY "admin_select_org_profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()) AND public.get_user_org(auth.uid()) = organization_id);

CREATE POLICY "admin_insert_org_profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (
    public.is_admin(auth.uid())
    AND public.get_user_org(auth.uid()) = organization_id
    AND role NOT IN ('super_admin', 'admin')
  );

CREATE POLICY "admin_update_org_profiles"
  ON public.profiles FOR UPDATE
  USING (
    public.is_admin(auth.uid())
    AND public.get_user_org(auth.uid()) = organization_id
    AND role NOT IN ('super_admin', 'admin')
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    AND public.get_user_org(auth.uid()) = organization_id
  );