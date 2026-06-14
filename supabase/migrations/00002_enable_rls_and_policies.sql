
-- Enable RLS on all tables
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hifz_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT role = 'super_admin' FROM profiles WHERE id = uid;
$$;

-- Helper: check if user is admin or above in their org
CREATE OR REPLACE FUNCTION is_org_admin(uid uuid, org_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = uid AND organization_id = org_id
    AND role IN ('admin', 'secretary', 'super_admin')
  );
$$;

-- Helper: check if user belongs to org
CREATE OR REPLACE FUNCTION user_in_org(uid uuid, org_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = uid AND organization_id = org_id
  );
$$;

-- Profiles policies
CREATE POLICY "Super admin full access profiles" ON profiles
  FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM get_user_role(auth.uid()));

-- Org members can see other members of same org
CREATE POLICY "Org members can view profiles in org" ON profiles
  FOR SELECT TO authenticated USING (
    organization_id IS NOT NULL AND organization_id = get_user_org(auth.uid())
  );

-- Institutions policies
CREATE POLICY "Super admin manages institutions" ON institutions
  FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

CREATE POLICY "Org members can view own institution" ON institutions
  FOR SELECT TO authenticated USING (
    id = get_user_org(auth.uid())
  );

-- Students policies
CREATE POLICY "Org staff manages students" ON students
  FOR ALL TO authenticated USING (
    organization_id = get_user_org(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'secretary', 'teacher', 'super_admin')
  );

CREATE POLICY "Students can view own record" ON students
  FOR SELECT TO authenticated USING (
    profile_id = auth.uid()
  );

CREATE POLICY "Parents can view their children" ON students
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'parent'
      AND p.organization_id = students.organization_id
    )
  );

-- Classes policies
CREATE POLICY "Org members can view classes" ON classes
  FOR SELECT TO authenticated USING (
    organization_id = get_user_org(auth.uid())
  );

CREATE POLICY "Org admins manage classes" ON classes
  FOR ALL TO authenticated USING (
    organization_id = get_user_org(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'secretary', 'super_admin')
  );

CREATE POLICY "Teachers can update own classes" ON classes
  FOR UPDATE TO authenticated USING (
    teacher_id = auth.uid()
  );

-- Class enrollments policies
CREATE POLICY "Org members can view enrollments" ON class_enrollments
  FOR SELECT TO authenticated USING (
    organization_id = get_user_org(auth.uid())
  );

CREATE POLICY "Org admins manage enrollments" ON class_enrollments
  FOR ALL TO authenticated USING (
    organization_id = get_user_org(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'secretary', 'super_admin')
  );

-- Attendance policies
CREATE POLICY "Org staff view attendance" ON attendance
  FOR SELECT TO authenticated USING (
    organization_id = get_user_org(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'secretary', 'teacher', 'super_admin')
  );

CREATE POLICY "Staff can manage attendance" ON attendance
  FOR ALL TO authenticated USING (
    organization_id = get_user_org(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'secretary', 'teacher', 'super_admin')
  );

CREATE POLICY "Students can view own attendance" ON attendance
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM students s WHERE s.id = attendance.student_id AND s.profile_id = auth.uid()
    )
  );

-- Subjects policies
CREATE POLICY "Org members view subjects" ON subjects
  FOR SELECT TO authenticated USING (
    organization_id = get_user_org(auth.uid())
  );

CREATE POLICY "Teachers manage own subjects" ON subjects
  FOR ALL TO authenticated USING (
    organization_id = get_user_org(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'teacher', 'super_admin')
  );

-- Lessons policies
CREATE POLICY "Org members view published lessons" ON lessons
  FOR SELECT TO authenticated USING (
    organization_id = get_user_org(auth.uid())
  );

CREATE POLICY "Teachers manage lessons" ON lessons
  FOR ALL TO authenticated USING (
    organization_id = get_user_org(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'teacher', 'super_admin')
  );

-- Assessments policies
CREATE POLICY "Org members view published assessments" ON assessments
  FOR SELECT TO authenticated USING (
    organization_id = get_user_org(auth.uid())
  );

CREATE POLICY "Teachers manage assessments" ON assessments
  FOR ALL TO authenticated USING (
    organization_id = get_user_org(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'teacher', 'super_admin')
  );

-- Questions policies
CREATE POLICY "Org members view questions" ON questions
  FOR SELECT TO authenticated USING (
    organization_id = get_user_org(auth.uid())
  );

CREATE POLICY "Teachers manage questions" ON questions
  FOR ALL TO authenticated USING (
    organization_id = get_user_org(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'teacher', 'super_admin')
  );

-- Assessment submissions policies
CREATE POLICY "Teachers view submissions" ON assessment_submissions
  FOR SELECT TO authenticated USING (
    organization_id = get_user_org(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'teacher', 'super_admin')
  );

CREATE POLICY "Students manage own submissions" ON assessment_submissions
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM students s WHERE s.id = assessment_submissions.student_id AND s.profile_id = auth.uid()
    )
  );

-- Hifz progress policies
CREATE POLICY "Org staff view hifz" ON hifz_progress
  FOR SELECT TO authenticated USING (
    organization_id = get_user_org(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'teacher', 'super_admin')
  );

CREATE POLICY "Teachers manage hifz" ON hifz_progress
  FOR ALL TO authenticated USING (
    organization_id = get_user_org(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'teacher', 'super_admin')
  );

CREATE POLICY "Students view own hifz" ON hifz_progress
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM students s WHERE s.id = hifz_progress.student_id AND s.profile_id = auth.uid()
    )
  );

-- Audio submissions policies
CREATE POLICY "Teachers manage audio submissions" ON audio_submissions
  FOR ALL TO authenticated USING (
    organization_id = get_user_org(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'teacher', 'super_admin')
  );

CREATE POLICY "Students manage own audio" ON audio_submissions
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM students s WHERE s.id = audio_submissions.student_id AND s.profile_id = auth.uid()
    )
  );

-- Fee structures policies
CREATE POLICY "Org admins manage fees" ON fee_structures
  FOR ALL TO authenticated USING (
    organization_id = get_user_org(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'secretary', 'super_admin')
  );

CREATE POLICY "Org members view fees" ON fee_structures
  FOR SELECT TO authenticated USING (
    organization_id = get_user_org(auth.uid())
  );

-- Payments policies
CREATE POLICY "Org staff manage payments" ON student_payments
  FOR ALL TO authenticated USING (
    organization_id = get_user_org(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'secretary', 'super_admin')
  );

CREATE POLICY "Parents view child payments" ON student_payments
  FOR SELECT TO authenticated USING (
    organization_id = get_user_org(auth.uid())
    AND get_user_role(auth.uid()) IN ('parent', 'student')
  );

-- Certificates policies
CREATE POLICY "Org staff manage certificates" ON certificates
  FOR ALL TO authenticated USING (
    organization_id = get_user_org(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'teacher', 'super_admin')
  );

CREATE POLICY "Students view own certificates" ON certificates
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM students s WHERE s.id = certificates.student_id AND s.profile_id = auth.uid()
    )
  );

-- Announcements policies
CREATE POLICY "Org members view announcements" ON announcements
  FOR SELECT TO authenticated USING (
    organization_id = get_user_org(auth.uid())
  );

CREATE POLICY "Staff manage announcements" ON announcements
  FOR ALL TO authenticated USING (
    organization_id = get_user_org(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'teacher', 'super_admin')
  );

-- Audit logs policies
CREATE POLICY "Super admin view all audit logs" ON audit_logs
  FOR SELECT TO authenticated USING (is_super_admin(auth.uid()));

CREATE POLICY "Org admins view org audit logs" ON audit_logs
  FOR SELECT TO authenticated USING (
    organization_id = get_user_org(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'super_admin')
  );

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Public view
CREATE VIEW public_profiles AS
  SELECT id, full_name, role, organization_id FROM profiles;
