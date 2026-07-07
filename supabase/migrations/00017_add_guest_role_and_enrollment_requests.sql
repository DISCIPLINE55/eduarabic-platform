
-- 1. Add 'guest' to user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'guest' AFTER 'student';

-- 2. enrollment_requests table
CREATE TABLE IF NOT EXISTS public.enrollment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  requested_role public.user_role NOT NULL DEFAULT 'student',
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enrollment_requests_guest ON public.enrollment_requests(guest_user_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_institution ON public.enrollment_requests(institution_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_status ON public.enrollment_requests(status);

CREATE TRIGGER trg_enrollment_requests_updated
  BEFORE UPDATE ON public.enrollment_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. RLS on enrollment_requests
ALTER TABLE public.enrollment_requests ENABLE ROW LEVEL SECURITY;

-- Guests can insert their own requests
CREATE POLICY "guest_insert_own_request" ON public.enrollment_requests
  FOR INSERT WITH CHECK (guest_user_id = auth.uid());

-- Guests can read their own requests
CREATE POLICY "guest_select_own_requests" ON public.enrollment_requests
  FOR SELECT USING (guest_user_id = auth.uid());

-- Admins can see requests for their institution
CREATE POLICY "admin_select_org_requests" ON public.enrollment_requests
  FOR SELECT USING (
    institution_id = get_user_org(auth.uid()) AND is_admin(auth.uid())
  );

-- Admins can update (approve/reject) requests for their institution
CREATE POLICY "admin_update_org_requests" ON public.enrollment_requests
  FOR UPDATE USING (
    institution_id = get_user_org(auth.uid()) AND is_admin(auth.uid())
  ) WITH CHECK (
    institution_id = get_user_org(auth.uid()) AND is_admin(auth.uid())
  );

-- Super admin full access
CREATE POLICY "super_admin_all_requests" ON public.enrollment_requests
  FOR ALL USING (is_super_admin(auth.uid()));

-- 4. Allow guests (and unauthenticated) to read public institution listings
DROP POLICY IF EXISTS "public_read_institutions" ON public.institutions;
CREATE POLICY "public_read_institutions" ON public.institutions
  FOR SELECT USING (true);
