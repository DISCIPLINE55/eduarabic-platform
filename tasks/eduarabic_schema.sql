-- ============================================================
-- EduArabic Platform — Complete Database Schema
-- Run this in your Supabase SQL Editor (Project: mwydnvqvobsngqjhgxgm)
-- URL: https://app.supabase.com/project/mwydnvqvobsngqjhgxgm/sql/new
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SECTION 1: CORE TABLES
-- ============================================================

-- 1.1 Institutions (multi-tenant root)
CREATE TABLE institutions (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                    text NOT NULL,
  code                    text UNIQUE NOT NULL,
  contact_email           text,
  contact_phone           text,
  address                 text,
  region                  text,
  logo_url                text,
  is_active               boolean NOT NULL DEFAULT true,
  subscription_status     text NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('active','trial','expired')),
  subscription_expires_at timestamptz,
  settings                jsonb DEFAULT '{}'::jsonb,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  created_by              uuid,
  version                 integer NOT NULL DEFAULT 1
);

-- 1.2 Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id                    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 text,
  phone                 text,
  full_name             text,
  gender                text CHECK (gender IN ('male','female')),
  date_of_birth         date,
  avatar_url            text,
  role                  text NOT NULL DEFAULT 'student' CHECK (role IN ('super_admin','admin','secretary','teacher','parent','student')),
  organization_id       uuid REFERENCES institutions(id) ON DELETE SET NULL,
  is_profile_complete   boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  version               integer NOT NULL DEFAULT 1
);

-- Public read-only view (safe to expose)
CREATE OR REPLACE VIEW public_profiles AS
  SELECT id, full_name, avatar_url, role, organization_id FROM profiles;

-- ============================================================
-- SECTION 2: ACADEMIC TABLES
-- ============================================================

-- 2.1 Students
CREATE TABLE students (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id    uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  profile_id         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  student_id_code    text NOT NULL,
  full_name          text NOT NULL,
  gender             text CHECK (gender IN ('male','female')),
  date_of_birth      date,
  guardian_name      text,
  guardian_phone     text,
  guardian_email     text,
  address            text,
  region             text,
  status             text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','graduated')),
  enrollment_date    date DEFAULT CURRENT_DATE,
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  created_by         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  version            integer NOT NULL DEFAULT 1,
  deleted_at         timestamptz,
  UNIQUE(organization_id, student_id_code)
);

-- 2.2 Classes
CREATE TABLE classes (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name             text NOT NULL,
  description      text,
  academic_level   text,
  is_weekend_class boolean NOT NULL DEFAULT false,
  schedule         jsonb DEFAULT '[]'::jsonb,
  teacher_id       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  created_by       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  version          integer NOT NULL DEFAULT 1,
  deleted_at       timestamptz
);

-- 2.3 Class Enrollments
CREATE TABLE class_enrollments (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  class_id         uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id       uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrolled_at      timestamptz NOT NULL DEFAULT now(),
  status           text NOT NULL DEFAULT 'active' CHECK (status IN ('active','withdrawn','completed')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);

-- 2.4 Subjects
CREATE TABLE subjects (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name             text NOT NULL,
  description      text,
  teacher_id       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  class_id         uuid REFERENCES classes(id) ON DELETE SET NULL,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  created_by       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  version          integer NOT NULL DEFAULT 1
);

-- 2.5 Attendance
CREATE TABLE attendance (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id   uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  class_id          uuid REFERENCES classes(id) ON DELETE SET NULL,
  student_id        uuid REFERENCES students(id) ON DELETE CASCADE,
  teacher_id        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  date              date NOT NULL,
  status            text NOT NULL CHECK (status IN ('present','absent','excused','late')),
  is_teacher        boolean NOT NULL DEFAULT false,
  notes             text,
  recorded_by       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_offline_record boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  version           integer NOT NULL DEFAULT 1
);

-- ============================================================
-- SECTION 3: LEARNING MANAGEMENT
-- ============================================================

-- 3.1 Lessons
CREATE TABLE lessons (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  subject_id       uuid REFERENCES subjects(id) ON DELETE SET NULL,
  title            text NOT NULL,
  description      text,
  content          text,
  content_type     text NOT NULL DEFAULT 'text' CHECK (content_type IN ('text','pdf','audio','video')),
  file_url         text,
  is_ai_generated  boolean NOT NULL DEFAULT false,
  is_published     boolean NOT NULL DEFAULT false,
  order_index      integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  created_by       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  version          integer NOT NULL DEFAULT 1,
  deleted_at       timestamptz
);

-- ============================================================
-- SECTION 4: ASSESSMENT ENGINE
-- ============================================================

-- 4.1 Assessments
CREATE TABLE assessments (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  subject_id       uuid REFERENCES subjects(id) ON DELETE SET NULL,
  class_id         uuid REFERENCES classes(id) ON DELETE SET NULL,
  title            text NOT NULL,
  description      text,
  type             text NOT NULL DEFAULT 'quiz' CHECK (type IN ('quiz','exam','practice','assignment','makeup')),
  status           text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','reviewed','results_published')),
  duration_minutes integer,
  access_code      text,
  max_attempts     integer NOT NULL DEFAULT 1,
  passing_score    numeric NOT NULL DEFAULT 50,
  due_date         timestamptz,
  instructions     text,
  is_ai_generated  boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  created_by       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  version          integer NOT NULL DEFAULT 1,
  deleted_at       timestamptz
);

-- 4.2 Questions (Question Bank)
CREATE TABLE questions (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  assessment_id    uuid REFERENCES assessments(id) ON DELETE SET NULL,
  subject_id       uuid REFERENCES subjects(id) ON DELETE SET NULL,
  question_text    text NOT NULL,
  type             text NOT NULL DEFAULT 'mcq' CHECK (type IN ('mcq','true_false','fill_blank','matching','short_answer')),
  options          jsonb DEFAULT '[]'::jsonb,
  correct_answer   text,
  explanation      text,
  marking_scheme   text,
  difficulty       text DEFAULT 'intermediate' CHECK (difficulty IN ('beginner','intermediate','advanced')),
  points           integer NOT NULL DEFAULT 1,
  order_index      integer NOT NULL DEFAULT 0,
  is_ai_generated  boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  created_by       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  version          integer NOT NULL DEFAULT 1
);

-- 4.3 Assessment Submissions
CREATE TABLE assessment_submissions (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  assessment_id    uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id       uuid REFERENCES profiles(id) ON DELETE CASCADE,
  answers          jsonb DEFAULT '{}'::jsonb,
  score            numeric,
  max_score        numeric,
  status           text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','graded','published')),
  feedback         text,
  submitted_at     timestamptz DEFAULT now(),
  graded_at        timestamptz,
  graded_by        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  created_by       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  version          integer NOT NULL DEFAULT 1
);

-- ============================================================
-- SECTION 5: HIFZ (QURAN MEMORIZATION)
-- ============================================================

-- 5.1 Hifz Progress
CREATE TABLE hifz_progress (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id       uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id            uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id            uuid REFERENCES profiles(id) ON DELETE SET NULL,
  surah_number          integer NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
  surah_name            text NOT NULL DEFAULT '',
  ayah_from             integer,
  ayah_to               integer,
  total_ayahs           integer,
  status                text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','memorized','needs_revision')),
  memorization_date     date,
  last_revision_date    date,
  revision_count        integer NOT NULL DEFAULT 0,
  completion_percentage integer NOT NULL DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  teacher_notes         text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  created_by            uuid REFERENCES profiles(id) ON DELETE SET NULL,
  version               integer NOT NULL DEFAULT 1,
  UNIQUE(organization_id, student_id, surah_number)
);

-- 5.2 Audio Submissions
CREATE TABLE audio_submissions (
  id                          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id             uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id                  uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id                  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  hifz_progress_id            uuid REFERENCES hifz_progress(id) ON DELETE SET NULL,
  audio_url                   text,
  duration_seconds            integer,
  surah_number                integer,
  surah_name                  text,
  ayah_range                  text,
  student_notes               text,
  status                      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','rejected')),
  score                       numeric CHECK (score BETWEEN 0 AND 10),
  teacher_text_feedback       text,
  teacher_audio_feedback_url  text,
  ai_transcript               text,
  ai_confidence               numeric,
  ai_segments                 jsonb DEFAULT '[]'::jsonb,
  ai_tajweed_suggestions      jsonb DEFAULT '[]'::jsonb,
  teacher_decisions           jsonb DEFAULT '[]'::jsonb,
  reviewed_at                 timestamptz,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),
  created_by                  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  version                     integer NOT NULL DEFAULT 1
);

-- ============================================================
-- SECTION 6: FINANCIAL MANAGEMENT
-- ============================================================

-- 6.1 Fee Structures
CREATE TABLE fee_structures (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name             text NOT NULL,
  description      text,
  amount           numeric NOT NULL DEFAULT 0,
  currency         text NOT NULL DEFAULT 'GHS',
  class_id         uuid REFERENCES classes(id) ON DELETE SET NULL,
  frequency        text NOT NULL DEFAULT 'termly' CHECK (frequency IN ('monthly','termly','annual','one_time')),
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  created_by       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  version          integer NOT NULL DEFAULT 1
);

-- 6.2 Student Payments
CREATE TABLE student_payments (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id    uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  student_id         uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_structure_id   uuid REFERENCES fee_structures(id) ON DELETE SET NULL,
  amount             numeric NOT NULL DEFAULT 0,
  currency           text NOT NULL DEFAULT 'GHS',
  payment_date       date NOT NULL DEFAULT CURRENT_DATE,
  payment_method     text,
  reference_number   text,
  notes              text,
  recorded_by        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  version            integer NOT NULL DEFAULT 1
);

-- ============================================================
-- SECTION 7: CERTIFICATES & ANNOUNCEMENTS
-- ============================================================

-- 7.1 Certificates
CREATE TABLE certificates (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id   uuid REFERENCES institutions(id) ON DELETE CASCADE,
  student_id        uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  certificate_type  text NOT NULL CHECK (certificate_type IN ('completion','attendance','hifz','academic')),
  title             text NOT NULL,
  description       text,
  certificate_code  text UNIQUE NOT NULL DEFAULT ('CERT-' || upper(substr(md5(random()::text), 1, 8))),
  issued_date       date NOT NULL DEFAULT CURRENT_DATE,
  issued_at         timestamptz DEFAULT now(),
  issued_by         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  qr_data           text,
  is_revoked        boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  version           integer NOT NULL DEFAULT 1
);

-- 7.2 Announcements
CREATE TABLE announcements (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  title            text NOT NULL,
  content          text NOT NULL,
  type             text NOT NULL DEFAULT 'general' CHECK (type IN ('general','class','parent','student')),
  target_class_id  uuid REFERENCES classes(id) ON DELETE SET NULL,
  created_by       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_published     boolean NOT NULL DEFAULT false,
  expires_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  version          integer NOT NULL DEFAULT 1
);

-- 7.3 Audit Logs
CREATE TABLE audit_logs (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  org_id       uuid REFERENCES institutions(id) ON DELETE CASCADE,
  action       text NOT NULL,
  table_name   text NOT NULL,
  record_id    uuid,
  old_value    jsonb,
  new_value    jsonb,
  ip_address   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- SECTION 8: INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_profiles_org      ON profiles(organization_id);
CREATE INDEX idx_profiles_role     ON profiles(role);
CREATE INDEX idx_students_org      ON students(organization_id);
CREATE INDEX idx_students_status   ON students(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_classes_org       ON classes(organization_id);
CREATE INDEX idx_classes_teacher   ON classes(teacher_id);
CREATE INDEX idx_enrollments_class ON class_enrollments(class_id);
CREATE INDEX idx_enrollments_student ON class_enrollments(student_id);
CREATE INDEX idx_attendance_org    ON attendance(organization_id, date);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_subjects_org      ON subjects(organization_id);
CREATE INDEX idx_lessons_org       ON lessons(organization_id);
CREATE INDEX idx_assessments_org   ON assessments(organization_id, status);
CREATE INDEX idx_questions_org     ON questions(organization_id);
CREATE INDEX idx_questions_assessment ON questions(assessment_id);
CREATE INDEX idx_submissions_assessment ON assessment_submissions(assessment_id);
CREATE INDEX idx_submissions_student ON assessment_submissions(student_id);
CREATE INDEX idx_hifz_student      ON hifz_progress(student_id);
CREATE INDEX idx_audio_student     ON audio_submissions(student_id, status);
CREATE INDEX idx_fees_org          ON fee_structures(organization_id);
CREATE INDEX idx_payments_student  ON student_payments(student_id);
CREATE INDEX idx_certs_org         ON certificates(organization_id);
CREATE INDEX idx_announcements_org ON announcements(organization_id, is_published);
CREATE INDEX idx_audit_org         ON audit_logs(org_id, created_at DESC);

-- ============================================================
-- SECTION 9: ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE institutions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE students            ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance          ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons             ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hifz_progress       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_submissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures      ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_payments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's organization_id
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Helper: is current user super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin');
$$;

-- Helper: is current user admin or above in same org
CREATE OR REPLACE FUNCTION is_admin_in_org(org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND organization_id = org
      AND role IN ('admin','secretary','super_admin')
  );
$$;

-- Helper: is current user teacher or above in same org
CREATE OR REPLACE FUNCTION is_teacher_in_org(org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND organization_id = org
      AND role IN ('teacher','admin','secretary','super_admin')
  );
$$;

-- ---- institutions ----
CREATE POLICY "Super admin full access on institutions"
  ON institutions FOR ALL TO authenticated
  USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Users can view own institution"
  ON institutions FOR SELECT TO authenticated
  USING (id = get_my_org_id() OR is_super_admin());

-- ---- profiles ----
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR organization_id = get_my_org_id() OR is_super_admin());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Allow insert own profile on signup"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- ---- students ----
CREATE POLICY "Org staff can manage students"
  ON students FOR ALL TO authenticated
  USING (is_teacher_in_org(organization_id))
  WITH CHECK (is_teacher_in_org(organization_id));

CREATE POLICY "Students can view own record"
  ON students FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR is_teacher_in_org(organization_id) OR is_super_admin());

-- ---- classes ----
CREATE POLICY "Org members can view classes"
  ON classes FOR SELECT TO authenticated
  USING (organization_id = get_my_org_id() OR is_super_admin());

CREATE POLICY "Admins can manage classes"
  ON classes FOR ALL TO authenticated
  USING (is_admin_in_org(organization_id))
  WITH CHECK (is_admin_in_org(organization_id));

-- ---- class_enrollments ----
CREATE POLICY "Org members can view enrollments"
  ON class_enrollments FOR SELECT TO authenticated
  USING (organization_id = get_my_org_id() OR is_super_admin());

CREATE POLICY "Admins can manage enrollments"
  ON class_enrollments FOR ALL TO authenticated
  USING (is_admin_in_org(organization_id))
  WITH CHECK (is_admin_in_org(organization_id));

-- ---- subjects ----
CREATE POLICY "Org members can view subjects"
  ON subjects FOR SELECT TO authenticated
  USING (organization_id = get_my_org_id() OR is_super_admin());

CREATE POLICY "Teachers+ can manage subjects"
  ON subjects FOR ALL TO authenticated
  USING (is_teacher_in_org(organization_id))
  WITH CHECK (is_teacher_in_org(organization_id));

-- ---- attendance ----
CREATE POLICY "Org members can view attendance"
  ON attendance FOR SELECT TO authenticated
  USING (organization_id = get_my_org_id() OR is_super_admin());

CREATE POLICY "Teachers+ can manage attendance"
  ON attendance FOR ALL TO authenticated
  USING (is_teacher_in_org(organization_id))
  WITH CHECK (is_teacher_in_org(organization_id));

-- ---- lessons ----
CREATE POLICY "Org members can view published lessons"
  ON lessons FOR SELECT TO authenticated
  USING (organization_id = get_my_org_id() AND (is_published = true OR is_teacher_in_org(organization_id)) OR is_super_admin());

CREATE POLICY "Teachers+ can manage lessons"
  ON lessons FOR ALL TO authenticated
  USING (is_teacher_in_org(organization_id))
  WITH CHECK (is_teacher_in_org(organization_id));

-- ---- assessments ----
CREATE POLICY "Org members can view assessments"
  ON assessments FOR SELECT TO authenticated
  USING (organization_id = get_my_org_id() OR is_super_admin());

CREATE POLICY "Teachers+ can manage assessments"
  ON assessments FOR ALL TO authenticated
  USING (is_teacher_in_org(organization_id))
  WITH CHECK (is_teacher_in_org(organization_id));

-- ---- questions ----
CREATE POLICY "Org members can view questions"
  ON questions FOR SELECT TO authenticated
  USING (organization_id = get_my_org_id() OR is_super_admin());

CREATE POLICY "Teachers+ can manage questions"
  ON questions FOR ALL TO authenticated
  USING (is_teacher_in_org(organization_id))
  WITH CHECK (is_teacher_in_org(organization_id));

-- ---- assessment_submissions ----
CREATE POLICY "Students can submit and view own submissions"
  ON assessment_submissions FOR ALL TO authenticated
  USING (student_id = auth.uid() OR is_teacher_in_org(organization_id) OR is_super_admin())
  WITH CHECK (student_id = auth.uid() OR is_teacher_in_org(organization_id));

-- ---- hifz_progress ----
CREATE POLICY "Org members can view hifz"
  ON hifz_progress FOR SELECT TO authenticated
  USING (organization_id = get_my_org_id() OR is_super_admin());

CREATE POLICY "Teachers+ can manage hifz"
  ON hifz_progress FOR ALL TO authenticated
  USING (is_teacher_in_org(organization_id))
  WITH CHECK (is_teacher_in_org(organization_id));

-- ---- audio_submissions ----
CREATE POLICY "Students can submit and view own audio"
  ON audio_submissions FOR ALL TO authenticated
  USING (
    created_by = auth.uid()
    OR is_teacher_in_org(organization_id)
    OR is_super_admin()
  )
  WITH CHECK (
    created_by = auth.uid()
    OR is_teacher_in_org(organization_id)
  );

-- ---- fee_structures ----
CREATE POLICY "Org members can view fee structures"
  ON fee_structures FOR SELECT TO authenticated
  USING (organization_id = get_my_org_id() OR is_super_admin());

CREATE POLICY "Admins can manage fee structures"
  ON fee_structures FOR ALL TO authenticated
  USING (is_admin_in_org(organization_id))
  WITH CHECK (is_admin_in_org(organization_id));

-- ---- student_payments ----
CREATE POLICY "Org staff can manage payments"
  ON student_payments FOR ALL TO authenticated
  USING (is_admin_in_org(organization_id))
  WITH CHECK (is_admin_in_org(organization_id));

CREATE POLICY "Students can view own payments"
  ON student_payments FOR SELECT TO authenticated
  USING (
    is_admin_in_org(organization_id)
    OR EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.profile_id = auth.uid())
    OR is_super_admin()
  );

-- ---- certificates ----
CREATE POLICY "Org members can view certificates"
  ON certificates FOR SELECT TO authenticated
  USING (organization_id = get_my_org_id() OR is_super_admin());

CREATE POLICY "Admins can manage certificates"
  ON certificates FOR ALL TO authenticated
  USING (is_admin_in_org(organization_id))
  WITH CHECK (is_admin_in_org(organization_id));

-- ---- announcements ----
CREATE POLICY "Org members can view published announcements"
  ON announcements FOR SELECT TO authenticated
  USING ((organization_id = get_my_org_id() AND is_published = true) OR is_teacher_in_org(organization_id) OR is_super_admin());

CREATE POLICY "Teachers+ can manage announcements"
  ON announcements FOR ALL TO authenticated
  USING (is_teacher_in_org(organization_id))
  WITH CHECK (is_teacher_in_org(organization_id));

-- ---- audit_logs ----
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT TO authenticated
  USING (org_id = get_my_org_id() AND get_my_role() IN ('admin','super_admin') OR is_super_admin());

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================
-- SECTION 10: TRIGGER — Auto-create profile on user signup
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, is_profile_complete)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SECTION 11: STORAGE BUCKETS
-- (Run these via Supabase Dashboard > Storage, or via SQL)
-- ============================================================
-- Buckets needed:
--   - audio_submissions  (for student Hifz audio uploads, 20MB limit)
--   - lesson_resources   (for lesson PDFs, audio, video)
--   - avatars            (for user profile photos)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('audio_submissions', 'audio_submissions', false, 20971520,
   ARRAY['audio/mpeg','audio/mp4','audio/wav','audio/ogg','audio/webm']),
  ('lesson_resources',  'lesson_resources',  false, 52428800,
   ARRAY['application/pdf','audio/mpeg','video/mp4','video/webm','text/plain']),
  ('avatars',           'avatars',           true,  2097152,
   ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for audio_submissions bucket
CREATE POLICY "Authenticated users can upload audio"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'audio_submissions');

CREATE POLICY "Users can view their own audio"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'audio_submissions');

CREATE POLICY "Authenticated users can upload lesson resources"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lesson_resources');

CREATE POLICY "Org members can view lesson resources"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'lesson_resources');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- ============================================================
-- DONE! Your EduArabic database is ready.
-- Next steps:
--   1. Go to Authentication > Providers and enable Email + Google + Apple
--   2. Disable email confirmation for dev (Auth > Settings > uncheck "Enable email confirmations")
--   3. Create your first Super Admin user via Auth > Users > Add user
--   4. Then run this SQL to promote them:
--        UPDATE profiles SET role = 'super_admin', is_profile_complete = true
--        WHERE email = 'your@email.com';
-- ============================================================
