
-- Enums
CREATE TYPE public.user_role AS ENUM ('super_admin', 'admin', 'secretary', 'teacher', 'parent', 'student');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'excused', 'late');
CREATE TYPE public.assessment_type AS ENUM ('quiz', 'exam', 'practice', 'assignment', 'makeup');
CREATE TYPE public.assessment_status AS ENUM ('draft', 'published', 'reviewed', 'results_published');
CREATE TYPE public.question_type AS ENUM ('mcq', 'true_false', 'fill_blank', 'matching', 'short_answer');
CREATE TYPE public.content_type AS ENUM ('text', 'pdf', 'audio', 'video');
CREATE TYPE public.hifz_status AS ENUM ('not_started', 'in_progress', 'memorized', 'needs_revision');
CREATE TYPE public.certificate_type AS ENUM ('completion', 'attendance', 'hifz', 'academic');
CREATE TYPE public.submission_status AS ENUM ('submitted', 'graded', 'published');
CREATE TYPE public.ai_decision AS ENUM ('accepted', 'modified', 'rejected');
CREATE TYPE public.gender_type AS ENUM ('male', 'female');
CREATE TYPE public.student_status AS ENUM ('active', 'inactive', 'graduated');
CREATE TYPE public.announcement_type AS ENUM ('general', 'class', 'parent', 'student');

-- Institutions table
CREATE TABLE public.institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  contact_email text,
  contact_phone text,
  address text,
  region text,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  subscription_status text NOT NULL DEFAULT 'active',
  subscription_expires_at timestamptz,
  settings jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  version integer NOT NULL DEFAULT 1
);

-- Profiles table (synced with auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  phone text,
  full_name text,
  gender gender_type,
  date_of_birth date,
  avatar_url text,
  role user_role NOT NULL DEFAULT 'student',
  organization_id uuid REFERENCES public.institutions(id),
  is_profile_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1
);

-- Handle new user trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    'student'::public.user_role
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- get_user_role helper
CREATE OR REPLACE FUNCTION get_user_role(uid uuid)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = uid;
$$;

-- get_user_org helper
CREATE OR REPLACE FUNCTION get_user_org(uid uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = uid;
$$;

-- Students table
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.institutions(id),
  profile_id uuid REFERENCES public.profiles(id),
  student_id_code text NOT NULL,
  full_name text NOT NULL,
  gender gender_type,
  date_of_birth date,
  guardian_name text,
  guardian_phone text,
  guardian_email text,
  address text,
  region text,
  status student_status NOT NULL DEFAULT 'active',
  enrollment_date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz,
  UNIQUE(organization_id, student_id_code)
);

-- Student ID sequence function
CREATE OR REPLACE FUNCTION generate_student_id(org_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  inst_code text;
  current_year text;
  next_seq integer;
BEGIN
  SELECT code INTO inst_code FROM institutions WHERE id = org_id;
  current_year := EXTRACT(YEAR FROM now())::text;
  SELECT COALESCE(MAX(CAST(SPLIT_PART(student_id_code, '-', 3) AS integer)), 0) + 1
    INTO next_seq
    FROM students
    WHERE organization_id = org_id
      AND student_id_code LIKE inst_code || '-' || current_year || '-%';
  RETURN inst_code || '-' || current_year || '-' || LPAD(next_seq::text, 4, '0');
END;
$$;

-- Classes table
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.institutions(id),
  name text NOT NULL,
  description text,
  academic_level text,
  is_weekend_class boolean NOT NULL DEFAULT false,
  schedule jsonb DEFAULT '[]',
  teacher_id uuid REFERENCES public.profiles(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz
);

-- Class enrollments
CREATE TABLE public.class_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.institutions(id),
  class_id uuid NOT NULL REFERENCES public.classes(id),
  student_id uuid NOT NULL REFERENCES public.students(id),
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);

-- Attendance table
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.institutions(id),
  class_id uuid REFERENCES public.classes(id),
  student_id uuid REFERENCES public.students(id),
  teacher_id uuid REFERENCES public.profiles(id),
  date date NOT NULL,
  status attendance_status NOT NULL DEFAULT 'present',
  is_teacher boolean NOT NULL DEFAULT false,
  notes text,
  recorded_by uuid REFERENCES public.profiles(id),
  is_offline_record boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  version integer NOT NULL DEFAULT 1
);

-- Subjects table
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.institutions(id),
  name text NOT NULL,
  description text,
  teacher_id uuid REFERENCES public.profiles(id),
  class_id uuid REFERENCES public.classes(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  version integer NOT NULL DEFAULT 1
);

-- Lessons table
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.institutions(id),
  subject_id uuid REFERENCES public.subjects(id),
  title text NOT NULL,
  description text,
  content text,
  content_type content_type NOT NULL DEFAULT 'text',
  file_url text,
  is_ai_generated boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz
);

-- Assessments table
CREATE TABLE public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.institutions(id),
  subject_id uuid REFERENCES public.subjects(id),
  class_id uuid REFERENCES public.classes(id),
  title text NOT NULL,
  description text,
  type assessment_type NOT NULL DEFAULT 'quiz',
  status assessment_status NOT NULL DEFAULT 'draft',
  duration_minutes integer,
  access_code text,
  max_attempts integer DEFAULT 1,
  passing_score integer DEFAULT 50,
  due_date timestamptz,
  instructions text,
  is_ai_generated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz
);

-- Questions table
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.institutions(id),
  assessment_id uuid REFERENCES public.assessments(id),
  question_text text NOT NULL,
  type question_type NOT NULL DEFAULT 'mcq',
  options jsonb DEFAULT '[]',
  correct_answer text,
  marking_scheme text,
  points integer NOT NULL DEFAULT 1,
  order_index integer DEFAULT 0,
  is_ai_generated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  version integer NOT NULL DEFAULT 1
);

-- Assessment submissions
CREATE TABLE public.assessment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.institutions(id),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id),
  student_id uuid NOT NULL REFERENCES public.students(id),
  answers jsonb DEFAULT '{}',
  score numeric,
  max_score numeric,
  status submission_status NOT NULL DEFAULT 'submitted',
  feedback text,
  submitted_at timestamptz DEFAULT now(),
  graded_at timestamptz,
  graded_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1
);

-- Hifz progress table
CREATE TABLE public.hifz_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.institutions(id),
  student_id uuid NOT NULL REFERENCES public.students(id),
  teacher_id uuid REFERENCES public.profiles(id),
  surah_number integer NOT NULL,
  surah_name text NOT NULL,
  ayah_from integer NOT NULL DEFAULT 1,
  ayah_to integer NOT NULL,
  total_ayahs integer NOT NULL DEFAULT 1,
  status hifz_status NOT NULL DEFAULT 'not_started',
  memorization_date date,
  last_revision_date date,
  revision_count integer NOT NULL DEFAULT 0,
  completion_percentage numeric DEFAULT 0,
  teacher_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  version integer NOT NULL DEFAULT 1
);

-- Audio submissions
CREATE TABLE public.audio_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.institutions(id),
  student_id uuid NOT NULL REFERENCES public.students(id),
  teacher_id uuid REFERENCES public.profiles(id),
  hifz_progress_id uuid REFERENCES public.hifz_progress(id),
  audio_url text NOT NULL,
  duration_seconds integer,
  surah_name text,
  ayah_range text,
  status text NOT NULL DEFAULT 'pending',
  score numeric,
  teacher_text_feedback text,
  teacher_audio_feedback_url text,
  ai_transcript text,
  ai_confidence numeric,
  ai_segments jsonb DEFAULT '[]',
  ai_tajweed_suggestions jsonb DEFAULT '[]',
  teacher_decisions jsonb DEFAULT '[]',
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  version integer NOT NULL DEFAULT 1
);

-- Fee structures
CREATE TABLE public.fee_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.institutions(id),
  name text NOT NULL,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'GHS',
  class_id uuid REFERENCES public.classes(id),
  frequency text NOT NULL DEFAULT 'monthly',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  version integer NOT NULL DEFAULT 1
);

-- Student payments
CREATE TABLE public.student_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.institutions(id),
  student_id uuid NOT NULL REFERENCES public.students(id),
  fee_structure_id uuid REFERENCES public.fee_structures(id),
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'GHS',
  payment_date date DEFAULT CURRENT_DATE,
  payment_method text,
  reference_number text,
  notes text,
  recorded_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  version integer NOT NULL DEFAULT 1
);

-- Certificates
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.institutions(id),
  student_id uuid NOT NULL REFERENCES public.students(id),
  certificate_type certificate_type NOT NULL DEFAULT 'completion',
  title text NOT NULL,
  description text,
  certificate_code text NOT NULL UNIQUE DEFAULT 'CERT-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  issued_date date DEFAULT CURRENT_DATE,
  issued_by uuid REFERENCES public.profiles(id),
  qr_data text,
  is_revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  version integer NOT NULL DEFAULT 1
);

-- Announcements
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.institutions(id),
  title text NOT NULL,
  content text NOT NULL,
  type announcement_type NOT NULL DEFAULT 'general',
  target_class_id uuid REFERENCES public.classes(id),
  created_by uuid REFERENCES public.profiles(id),
  is_published boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid,
  user_id uuid REFERENCES public.profiles(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_students_org ON public.students(organization_id);
CREATE INDEX idx_students_status ON public.students(status);
CREATE INDEX idx_classes_org ON public.classes(organization_id);
CREATE INDEX idx_attendance_org_date ON public.attendance(organization_id, date);
CREATE INDEX idx_attendance_student ON public.attendance(student_id);
CREATE INDEX idx_lessons_subject ON public.lessons(subject_id);
CREATE INDEX idx_assessments_org ON public.assessments(organization_id);
CREATE INDEX idx_questions_assessment ON public.questions(assessment_id);
CREATE INDEX idx_submissions_assessment ON public.assessment_submissions(assessment_id);
CREATE INDEX idx_hifz_student ON public.hifz_progress(student_id);
CREATE INDEX idx_audio_student ON public.audio_submissions(student_id);
CREATE INDEX idx_payments_student ON public.student_payments(student_id);
CREATE INDEX idx_profiles_org ON public.profiles(organization_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_institutions_updated BEFORE UPDATE ON public.institutions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_students_updated BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_classes_updated BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_attendance_updated BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subjects_updated BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_lessons_updated BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_assessments_updated BEFORE UPDATE ON public.assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_hifz_updated BEFORE UPDATE ON public.hifz_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_audio_updated BEFORE UPDATE ON public.audio_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.student_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_certificates_updated BEFORE UPDATE ON public.certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_announcements_updated BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at();
