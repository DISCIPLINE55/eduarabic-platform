
-- Add due_date and status to student_payments if missing
ALTER TABLE public.student_payments
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue'));

-- RLS: Parents can view attendance for their linked child
DROP POLICY IF EXISTS "Parents view child attendance" ON public.attendance;
CREATE POLICY "Parents view child attendance" ON public.attendance
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = attendance.student_id
        AND (
          s.guardian_profile_id = auth.uid()
          OR s.guardian_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
        )
    )
  );

-- RLS: Parents can view payments for their linked child
DROP POLICY IF EXISTS "Parents view child payments" ON public.student_payments;
CREATE POLICY "Parents view child payments" ON public.student_payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_payments.student_id
        AND (
          s.guardian_profile_id = auth.uid()
          OR s.guardian_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
        )
    )
  );
