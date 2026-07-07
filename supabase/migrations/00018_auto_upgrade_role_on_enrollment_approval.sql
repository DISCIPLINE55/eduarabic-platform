
-- Function: auto-upgrade guest profile role + org when enrollment is approved
CREATE OR REPLACE FUNCTION public.handle_enrollment_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Only act when status changes TO 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    UPDATE public.profiles
    SET
      role            = NEW.requested_role,
      organization_id = NEW.institution_id,
      updated_at      = now()
    WHERE id = NEW.guest_user_id
      AND role = 'guest';           -- safety: only upgrade if still a guest
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to enrollment_requests
DROP TRIGGER IF EXISTS trg_enrollment_approval ON public.enrollment_requests;
CREATE TRIGGER trg_enrollment_approval
  AFTER UPDATE ON public.enrollment_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_enrollment_approval();

-- Allow admins to update reviewed_by + reviewed_at columns too (extend existing update policy)
DROP POLICY IF EXISTS "admin_update_org_requests" ON public.enrollment_requests;
CREATE POLICY "admin_update_org_requests" ON public.enrollment_requests
  FOR UPDATE
  USING (
    institution_id = get_user_org(auth.uid()) AND is_admin(auth.uid())
  )
  WITH CHECK (
    institution_id = get_user_org(auth.uid()) AND is_admin(auth.uid())
  );

-- Index to speed up admin fetch of pending requests
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_pending
  ON public.enrollment_requests(institution_id, status)
  WHERE status = 'pending';
