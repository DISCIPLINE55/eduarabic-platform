# EduArabic – Database Schema

## Supabase Project
- **Project ID**: mvxzpmngsoutksienfay
- **Region**: us-west-1
- **Database**: PostgreSQL 15

## Table Overview

| Table | Description |
|-------|-------------|
| `institutions` | Multi-tenant root table — one row per school/academy |
| `profiles` | User profiles linked to Supabase Auth users |
| `students` | Student records with guardian info and auto-generated Student IDs |
| `classes` | Class/group definitions per institution |
| `class_enrollments` | Many-to-many: students ↔ classes |
| `subjects` | Academic subjects per class |
| `lessons` | Lesson content (text, PDF, audio, video) |
| `assessments` | Quiz/Exam/Practice/Assignment definitions |
| `questions` | Question bank items per assessment |
| `assessment_submissions` | Student answers and scores |
| `attendance` | Daily attendance records per student |
| `hifz_progress` | Quran memorization tracking per student |
| `audio_submissions` | Student recitation uploads + AI Tajweed analysis |
| `certificates` | Issued certificates with QR codes |
| `fee_structures` | Fee definitions per class or institution |
| `student_payments` | Payment records per student |
| `announcements` | Institution/class/role-targeted announcements |
| `audit_logs` | Immutable log of all create/update/delete operations |

## Standard Column Pattern
All major tables include:
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
organization_id uuid REFERENCES institutions(id) ON DELETE CASCADE
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
created_by      uuid REFERENCES auth.users(id)
version         integer DEFAULT 1  -- Optimistic Concurrency Control
```

## Key Business Rules in Schema

### Student ID Generation
```sql
-- Auto-generated trigger: INSTITUTIONCODE-YEAR-SEQUENCE
-- Example: MQI-2026-0001
```

### Soft Deletes
Tables with `deleted_at timestamptz` support soft deletion:
- `classes`, `lessons`, `assessments` — queries always filter `IS NULL deleted_at`

### Audio Submission Columns
```
audio_url              text        — Supabase Storage URL
teacher_text_feedback  text        — Teacher's written feedback
teacher_decisions      jsonb       — [{rule, note, accepted: true/false/null}]
ai_transcript          text        — Whisper transcription
ai_confidence          numeric     — Overall confidence score
ai_tajweed_suggestions jsonb       — AI-detected rule violations
```

### Certificate Columns
```
certificate_code  text UNIQUE  — CERT-YEAR-RANDOM (e.g. CERT-2026-A3F9XZ)
issued_date       date         — Issue date
qr_data           text         — Verification payload for QR code
is_revoked        boolean      — Soft revocation
```

## Row Level Security
All tables have RLS enabled. Policy pattern:
- Super Admin: unrestricted access
- Admin/Secretary: own institution only (`organization_id = auth_org()`)
- Teacher: own classes and students
- Student: own records only
- Parent: linked child's records only

## Indexes
```sql
idx_students_org          ON students(organization_id)
idx_attendance_student    ON attendance(student_id, date)
idx_hifz_student          ON hifz_progress(student_id)
idx_assessments_org       ON assessments(organization_id, status)
idx_certificates_org      ON certificates(organization_id)
```
