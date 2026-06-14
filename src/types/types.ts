// EduArabic Type Definitions

export type UserRole = 'super_admin' | 'admin' | 'secretary' | 'teacher' | 'parent' | 'student';
export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'late';
export type AssessmentType = 'quiz' | 'exam' | 'practice' | 'assignment' | 'makeup';
export type AssessmentStatus = 'draft' | 'published' | 'reviewed' | 'results_published';
export type QuestionType = 'mcq' | 'true_false' | 'fill_blank' | 'matching' | 'short_answer';
export type ContentType = 'text' | 'pdf' | 'audio' | 'video';
export type HifzStatus = 'not_started' | 'in_progress' | 'memorized' | 'needs_revision';
export type CertificateType = 'completion' | 'attendance' | 'hifz' | 'academic';
export type SubmissionStatus = 'submitted' | 'graded' | 'published';
export type AiDecision = 'accepted' | 'modified' | 'rejected';
export type GenderType = 'male' | 'female';
export type StudentStatus = 'active' | 'inactive' | 'graduated';
export type AnnouncementType = 'general' | 'class' | 'parent' | 'student';

export interface Institution {
  id: string;
  name: string;
  code: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  region?: string;
  logo_url?: string;
  is_active: boolean;
  subscription_status: string;
  subscription_expires_at?: string;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  version: number;
}

export interface NotificationPreferences {
  email_announcements: boolean;
  email_assessment_results: boolean;
  email_attendance_updates: boolean;
  email_fee_reminders: boolean;
  email_hifz_feedback: boolean;
  push_announcements: boolean;
  push_assessment_results: boolean;
  push_attendance_updates: boolean;
  push_fee_reminders: boolean;
  push_hifz_feedback: boolean;
}

export interface Profile {
  id: string;
  email?: string;
  phone?: string;
  full_name?: string;
  gender?: GenderType;
  date_of_birth?: string;
  avatar_url?: string;
  role: UserRole;
  organization_id?: string;
  is_profile_complete: boolean;
  must_change_password?: boolean;
  theme_preference?: 'light' | 'dark' | 'system';
  notification_preferences?: NotificationPreferences;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface Student {
  id: string;
  organization_id: string;
  profile_id?: string;
  student_id_code: string;
  full_name: string;
  gender?: GenderType;
  date_of_birth?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  address?: string;
  region?: string;
  status: StudentStatus;
  enrollment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  version: number;
  deleted_at?: string;
}

export interface Class {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  academic_level?: string;
  is_weekend_class: boolean;
  schedule?: unknown[];
  teacher_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  version: number;
  deleted_at?: string;
  teacher?: Profile;
}

export interface ClassEnrollment {
  id: string;
  organization_id: string;
  class_id: string;
  student_id: string;
  enrolled_at: string;
  status: string;
  created_at: string;
  updated_at: string;
  student?: Student;
  class?: Class;
}

export interface AttendanceRecord {
  id: string;
  organization_id: string;
  class_id?: string;
  student_id?: string;
  teacher_id?: string;
  date: string;
  status: AttendanceStatus;
  is_teacher: boolean;
  notes?: string;
  recorded_by?: string;
  is_offline_record: boolean;
  created_at: string;
  updated_at: string;
  version: number;
  student?: Student;
  teacher?: Profile;
}

export interface Subject {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  teacher_id?: string;
  class_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  version: number;
  teacher?: Profile;
  class?: Class;
}

export interface Lesson {
  id: string;
  organization_id: string;
  subject_id?: string;
  title: string;
  description?: string;
  content?: string;
  content_type: ContentType;
  file_url?: string;
  is_ai_generated: boolean;
  is_published: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  version: number;
  deleted_at?: string;
  subject?: Subject;
}

export interface Assessment {
  id: string;
  organization_id: string;
  subject_id?: string;
  class_id?: string;
  title: string;
  description?: string;
  type: AssessmentType;
  status: AssessmentStatus;
  duration_minutes?: number;
  access_code?: string;
  max_attempts: number;
  passing_score: number;
  due_date?: string;
  instructions?: string;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  version: number;
  deleted_at?: string;
  subject?: Subject;
  class?: Class;
  questions?: Question[];
}

export interface Question {
  id: string;
  organization_id: string;
  assessment_id?: string;
  question_text: string;
  type: QuestionType;
  options: string[];
  correct_answer?: string;
  marking_scheme?: string;
  points: number;
  order_index: number;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  version: number;
}

export interface AssessmentSubmission {
  id: string;
  organization_id: string;
  assessment_id: string;
  student_id: string;
  answers: Record<string, string>;
  score?: number;
  max_score?: number;
  status: SubmissionStatus;
  feedback?: string;
  submitted_at?: string;
  graded_at?: string;
  graded_by?: string;
  created_at: string;
  updated_at: string;
  version: number;
  student?: Student;
  assessment?: Assessment;
}

export interface HifzProgress {
  id: string;
  organization_id: string;
  student_id: string;
  teacher_id?: string;
  surah_number: number;
  surah_name: string;
  ayah_from: number;
  ayah_to: number;
  total_ayahs: number;
  status: HifzStatus;
  memorization_date?: string;
  last_revision_date?: string;
  revision_count: number;
  completion_percentage: number;
  teacher_notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  version: number;
  student?: Student;
}

export interface AudioSubmission {
  id: string;
  organization_id: string;
  student_id: string;
  teacher_id?: string;
  hifz_progress_id?: string;
  audio_url: string;
  duration_seconds?: number;
  surah_name?: string;
  ayah_range?: string;
  status: string;
  score?: number;
  teacher_text_feedback?: string;
  teacher_audio_feedback_url?: string;
  ai_transcript?: string;
  ai_confidence?: number;
  ai_segments: unknown[];
  ai_tajweed_suggestions: TajweedSuggestion[];
  teacher_decisions: TeacherDecision[];
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  version: number;
  student?: Student;
}

export interface TajweedSuggestion {
  id: string;
  rule: string;
  text: string;
  position?: number;
  suggestion: string;
  severity: 'error' | 'warning' | 'info';
}

export interface TeacherDecision {
  suggestion_id: string;
  decision: AiDecision;
  modified_text?: string;
  notes?: string;
  decided_at: string;
}

export interface FeeStructure {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  class_id?: string;
  frequency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  version: number;
  class?: Class;
}

export interface StudentPayment {
  id: string;
  organization_id: string;
  student_id: string;
  fee_structure_id?: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
  updated_at: string;
  version: number;
  student?: Student;
  fee_structure?: FeeStructure;
}

export interface Certificate {
  id: string;
  organization_id: string;
  student_id: string;
  certificate_type: CertificateType;
  title: string;
  description?: string;
  certificate_code: string;
  issued_date: string;
  issued_by?: string;
  qr_data?: string;
  is_revoked: boolean;
  created_at: string;
  updated_at: string;
  version: number;
  student?: Student;
}

export interface Announcement {
  id: string;
  organization_id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  target_class_id?: string;
  created_by?: string;
  is_published: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  version: number;
  class?: Class;
  author?: Profile;
}

export const SURAH_LIST = [
  { number: 1, name: 'Al-Fatihah', ayahs: 7 },
  { number: 2, name: 'Al-Baqarah', ayahs: 286 },
  { number: 3, name: "Ali 'Imran", ayahs: 200 },
  { number: 4, name: 'An-Nisa', ayahs: 176 },
  { number: 5, name: 'Al-Maidah', ayahs: 120 },
  { number: 6, name: 'Al-Anam', ayahs: 165 },
  { number: 7, name: 'Al-Araf', ayahs: 206 },
  { number: 8, name: 'Al-Anfal', ayahs: 75 },
  { number: 9, name: 'At-Tawbah', ayahs: 129 },
  { number: 10, name: 'Yunus', ayahs: 109 },
  { number: 36, name: 'Ya-Sin', ayahs: 83 },
  { number: 67, name: 'Al-Mulk', ayahs: 30 },
  { number: 78, name: 'An-Naba', ayahs: 40 },
  { number: 87, name: 'Al-Ala', ayahs: 19 },
  { number: 96, name: 'Al-Alaq', ayahs: 19 },
  { number: 108, name: 'Al-Kawthar', ayahs: 3 },
  { number: 110, name: 'An-Nasr', ayahs: 3 },
  { number: 112, name: 'Al-Ikhlas', ayahs: 4 },
  { number: 113, name: 'Al-Falaq', ayahs: 5 },
  { number: 114, name: 'An-Nas', ayahs: 6 },
];
