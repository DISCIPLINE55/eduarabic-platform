# EduArabic – Changelog

All notable changes to EduArabic are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] — 2026-06-11

### Added
#### Platform Core
- Multi-tenant SaaS architecture with complete institution isolation via Supabase RLS
- 6-role authentication system: Super Admin, Admin, Secretary, Teacher, Parent, Student
- Email-based authentication with profile completion workflow
- Role-based route protection and automatic portal redirection

#### Super Admin Portal
- Platform dashboard with institution count, user metrics, system health
- Institution management: create, edit, deactivate institutions
- Subscription status tracking

#### Institution Admin Portal
- Admin dashboard with weekly attendance and announcement feed
- Student management: registration, auto-generated Student IDs (INST-YEAR-SEQ), profile management
- Teacher management: profiles, status management
- Class management: create classes, assign teachers and students
- Daily attendance tracking by class with status counts
- Financial management: fee structures, payment recording, outstanding balances
- Certificate system: issue certificates with QR codes and unique certificate codes
- Analytics reports: enrollment trends, gender distribution charts
- Announcements: create and publish institution-wide announcements

#### Secretary Portal
- Secretary dashboard with quick-action widgets
- Shared access to student registration and attendance management

#### Teacher Portal
- Teacher dashboard: class stats, assessment metrics, audio review queue count
- Learning Center: create subjects and lessons (text, PDF, audio, video content)
- Assessment Engine: create quizzes/exams/practice assessments
- AI Question Generation: generate MCQ, T/F, fill-blank via Gemini
- Hifz Management: track student memorization progress by surah and ayah range
- Audio Review Queue: listen to recitations, review AI Tajweed suggestions, grade and publish feedback

#### Parent Portal
- Parent dashboard: child's Hifz progress, recent announcements, quick stats
- Fee status page: payment history, outstanding balance

#### Student Portal
- Student dashboard: personal stats, Hifz progress, recent assessments
- Learning Center: browse subjects, access lessons and resources
- Assessment taking: access-code entry, timed assessments, submission
- Hifz Tracker: personal progress view, audio recitation upload
- Attendance history: personal attendance records
- Certificates: view earned certificates with QR verification

#### Shared Features
- Offline-first architecture with Dexie.js IndexedDB
- Supabase Realtime subscriptions
- Responsive design: desktop-first with full mobile support
- Dark mode support
- Accessible navigation: sidebar (desktop) + Sheet drawer (mobile)

### Technical
- React 18 + TypeScript + Vite
- Supabase PostgreSQL with 19 tables, RLS policies, optimized indexes
- shadcn/ui component library with custom EduArabic brand tokens
- Tailwind CSS design system with Deep Crimson/Maroon brand colors
- Recharts for analytics visualizations
- QR code generation for certificates

---

## [Unreleased]
- PDF certificate export
- Push notifications
- Online fee payment integration
- Live audio recording (in-browser)
- Bulk CSV import
