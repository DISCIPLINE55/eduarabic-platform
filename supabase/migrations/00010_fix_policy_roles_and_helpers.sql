-- Fix 1: Drop the {public} profile policies and recreate with TO authenticated
DROP POLICY IF EXISTS "super_admin_select_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "super_admin_insert_profiles" ON public.profiles;
DROP POLICY IF EXISTS "super_admin_update_any_profile" ON public.profiles;
DROP POLICY IF EXISTS "super_admin_delete_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admin_select_org_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admin_insert_org_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admin_update_org_profiles" ON public.profiles;

-- Recreate with explicit TO authenticated
CREATE POLICY "super_admin_select_all_profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "super_admin_insert_profiles"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "super_admin_update_any_profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "super_admin_delete_profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "admin_select_org_profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) AND public.get_user_org(auth.uid()) = organization_id);

CREATE POLICY "admin_insert_org_profiles"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    AND public.get_user_org(auth.uid()) = organization_id
    AND role NOT IN ('super_admin', 'admin')
  );

CREATE POLICY "admin_update_org_profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid())
    AND public.get_user_org(auth.uid()) = organization_id
    AND role NOT IN ('super_admin', 'admin')
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    AND public.get_user_org(auth.uid()) = organization_id
  );

-- Fix 2: Add get_user_role with proper signature for UPDATE policy on profiles
-- The existing "Users can update own profile" has WITH CHECK using get_user_role — ensure it works
CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid)
RETURNS public.user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.profiles WHERE id = uid; $$;

-- Fix 3: Ensure org-based helper for other tables 
CREATE OR REPLACE FUNCTION public.get_user_org(uid uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT organization_id FROM public.profiles WHERE id = uid; $$;

CREATE OR REPLACE FUNCTION public.is_super_admin(uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = uid AND role = 'super_admin'); $$;

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = uid AND role IN ('admin', 'super_admin')); $$;

-- Fix 4: Add super_admin override for ALL tables (super_admin sees everything)
-- institutions: super admin already has "Super admin manages institutions" 
-- Fix org members policy to use SECURITY DEFINER
DROP POLICY IF EXISTS "Org members can view own institution" ON public.institutions;
CREATE POLICY "Org members can view own institution"
  ON public.institutions FOR SELECT TO authenticated
  USING (id = public.get_user_org(auth.uid()) OR public.is_super_admin(auth.uid()));

-- Fix classes policies
DROP POLICY IF EXISTS "Org admins manage classes" ON public.classes;
DROP POLICY IF EXISTS "Org members can view classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can update own classes" ON public.classes;
CREATE POLICY "Org members can view classes" ON public.classes FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()) OR public.is_super_admin(auth.uid()));
CREATE POLICY "Org admins manage classes" ON public.classes FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) AND organization_id = public.get_user_org(auth.uid()));
CREATE POLICY "Teachers can update own classes" ON public.classes FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid() AND organization_id = public.get_user_org(auth.uid()));

-- Fix students policies
DROP POLICY IF EXISTS "Org staff manages students" ON public.students;
DROP POLICY IF EXISTS "Parents can view their children" ON public.students;
DROP POLICY IF EXISTS "Students can view own record" ON public.students;
CREATE POLICY "Org staff manages students" ON public.students FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) AND organization_id = public.get_user_org(auth.uid()));
CREATE POLICY "Staff select students" ON public.students FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()));
CREATE POLICY "Students can view own record" ON public.students FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

-- Fix announcements
DROP POLICY IF EXISTS "Org members view announcements" ON public.announcements;
DROP POLICY IF EXISTS "Staff manage announcements" ON public.announcements;
CREATE POLICY "Org members view announcements" ON public.announcements FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()) OR public.is_super_admin(auth.uid()));
CREATE POLICY "Staff manage announcements" ON public.announcements FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) AND organization_id = public.get_user_org(auth.uid()));

-- Fix attendance policies
DROP POLICY IF EXISTS "Org staff view attendance" ON public.attendance;
DROP POLICY IF EXISTS "Staff can manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Students can view own attendance" ON public.attendance;
CREATE POLICY "Org staff view attendance" ON public.attendance FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()) OR public.is_super_admin(auth.uid()));
CREATE POLICY "Staff can manage attendance" ON public.attendance FOR ALL TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()));
CREATE POLICY "Students can view own attendance" ON public.attendance FOR SELECT TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()));

-- Fix hifz_progress policies
DROP POLICY IF EXISTS "Org staff view hifz" ON public.hifz_progress;
DROP POLICY IF EXISTS "Teachers manage hifz" ON public.hifz_progress;
DROP POLICY IF EXISTS "Students view own hifz" ON public.hifz_progress;
CREATE POLICY "Org staff view hifz" ON public.hifz_progress FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()) OR public.is_super_admin(auth.uid()));
CREATE POLICY "Teachers manage hifz" ON public.hifz_progress FOR ALL TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()));
CREATE POLICY "Students view own hifz" ON public.hifz_progress FOR SELECT TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()));

-- Fix assessments policies
DROP POLICY IF EXISTS "Org members view published assessments" ON public.assessments;
DROP POLICY IF EXISTS "Teachers manage assessments" ON public.assessments;
CREATE POLICY "Org members view published assessments" ON public.assessments FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()) OR public.is_super_admin(auth.uid()));
CREATE POLICY "Teachers manage assessments" ON public.assessments FOR ALL TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()));

-- Fix fee_structures and student_payments
DROP POLICY IF EXISTS "Org admins manage fees" ON public.fee_structures;
DROP POLICY IF EXISTS "Org members view fees" ON public.fee_structures;
CREATE POLICY "Org admins manage fees" ON public.fee_structures FOR ALL TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()));
CREATE POLICY "Org members view fees" ON public.fee_structures FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()) OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Org staff manage payments" ON public.student_payments;
DROP POLICY IF EXISTS "Parents view child payments" ON public.student_payments;
CREATE POLICY "Org staff manage payments" ON public.student_payments FOR ALL TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()));
CREATE POLICY "Parents view child payments" ON public.student_payments FOR SELECT TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()));

-- Fix certificates
DROP POLICY IF EXISTS "Org staff manage certificates" ON public.certificates;
DROP POLICY IF EXISTS "Students view own certificates" ON public.certificates;
CREATE POLICY "Org staff manage certificates" ON public.certificates FOR ALL TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()));
CREATE POLICY "Students view own certificates" ON public.certificates FOR SELECT TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()));

-- Fix lessons and subjects
DROP POLICY IF EXISTS "Org members view published lessons" ON public.lessons;
DROP POLICY IF EXISTS "Teachers manage lessons" ON public.lessons;
CREATE POLICY "Org members view published lessons" ON public.lessons FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()) OR public.is_super_admin(auth.uid()));
CREATE POLICY "Teachers manage lessons" ON public.lessons FOR ALL TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()));

DROP POLICY IF EXISTS "Org members view subjects" ON public.subjects;
DROP POLICY IF EXISTS "Teachers manage own subjects" ON public.subjects;
CREATE POLICY "Org members view subjects" ON public.subjects FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()) OR public.is_super_admin(auth.uid()));
CREATE POLICY "Teachers manage own subjects" ON public.subjects FOR ALL TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()));

-- Fix questions, assessment_submissions, audio_submissions, class_enrollments
DROP POLICY IF EXISTS "Org members view questions" ON public.questions;
DROP POLICY IF EXISTS "Teachers manage questions" ON public.questions;
CREATE POLICY "Org members view questions" ON public.questions FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()) OR public.is_super_admin(auth.uid()));
CREATE POLICY "Teachers manage questions" ON public.questions FOR ALL TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()));

DROP POLICY IF EXISTS "Students manage own submissions" ON public.assessment_submissions;
DROP POLICY IF EXISTS "Teachers view submissions" ON public.assessment_submissions;
CREATE POLICY "Org members manage submissions" ON public.assessment_submissions FOR ALL TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()));
CREATE POLICY "Students manage own submissions" ON public.assessment_submissions FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Students manage own audio" ON public.audio_submissions;
DROP POLICY IF EXISTS "Teachers manage audio submissions" ON public.audio_submissions;
CREATE POLICY "Org members manage audio" ON public.audio_submissions FOR ALL TO authenticated
  USING (organization_id = public.get_user_org(auth.uid()));

DROP POLICY IF EXISTS "Org admins manage enrollments" ON public.class_enrollments;
DROP POLICY IF EXISTS "Org members can view enrollments" ON public.class_enrollments;
CREATE POLICY "Org members view enrollments" ON public.class_enrollments FOR SELECT TO authenticated
  USING (public.get_user_org(auth.uid()) IN (
    SELECT organization_id FROM public.classes WHERE id = class_id
  ));
CREATE POLICY "Org admins manage enrollments" ON public.class_enrollments FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));