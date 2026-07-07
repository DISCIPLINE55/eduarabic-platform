-- Ensure assessment_submissions INSERT works for students by adding explicit WITH CHECK
DROP POLICY IF EXISTS "Students manage own submissions" ON assessment_submissions;
CREATE POLICY "Students manage own submissions" ON assessment_submissions
  FOR ALL TO authenticated
  USING (
    student_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
  )
  WITH CHECK (
    student_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
    AND organization_id = get_user_org(auth.uid())
  );

-- Ensure org members (admin/teacher/secretary) submission policy also has WITH CHECK
DROP POLICY IF EXISTS "Org members manage submissions" ON assessment_submissions;
CREATE POLICY "Org members manage submissions" ON assessment_submissions
  FOR ALL TO authenticated
  USING (organization_id = get_user_org(auth.uid()))
  WITH CHECK (organization_id = get_user_org(auth.uid()));

-- Ensure profiles upsert works when admin creates new member (admin_insert_org_profiles)
DROP POLICY IF EXISTS "admin_insert_org_profiles" ON profiles;
CREATE POLICY "admin_insert_org_profiles" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = get_user_org(auth.uid())
    AND is_admin(auth.uid())
  );

-- Allow super_admin to insert profiles for any org
DROP POLICY IF EXISTS "super_admin_insert_profiles" ON profiles;
CREATE POLICY "super_admin_insert_profiles" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (is_super_admin(auth.uid()));

-- Grant super_admin SELECT on all tables (backup catch-all)
DROP POLICY IF EXISTS "super_admin_select_all" ON students;
CREATE POLICY "super_admin_select_all" ON students
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super_admin_select_all" ON attendance;
CREATE POLICY "super_admin_select_all" ON attendance
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super_admin_select_all" ON assessments;
CREATE POLICY "super_admin_select_all" ON assessments
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super_admin_select_all" ON announcements;
CREATE POLICY "super_admin_select_all" ON announcements
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super_admin_select_all" ON hifz_progress;
CREATE POLICY "super_admin_select_all" ON hifz_progress
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super_admin_select_all" ON certificates;
CREATE POLICY "super_admin_select_all" ON certificates
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super_admin_select_all" ON lessons;
CREATE POLICY "super_admin_select_all" ON lessons
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super_admin_select_all" ON classes;
CREATE POLICY "super_admin_select_all" ON classes
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super_admin_select_all" ON class_enrollments;
CREATE POLICY "super_admin_select_all" ON class_enrollments
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super_admin_select_all" ON fee_structures;
CREATE POLICY "super_admin_select_all" ON fee_structures
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super_admin_select_all" ON student_payments;
CREATE POLICY "super_admin_select_all" ON student_payments
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super_admin_select_all" ON subjects;
CREATE POLICY "super_admin_select_all" ON subjects
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super_admin_select_all" ON questions;
CREATE POLICY "super_admin_select_all" ON questions
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super_admin_select_all" ON assessment_submissions;
CREATE POLICY "super_admin_select_all" ON assessment_submissions
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super_admin_select_all" ON audio_submissions;
CREATE POLICY "super_admin_select_all" ON audio_submissions
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));