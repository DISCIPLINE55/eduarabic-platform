# EduArabic – User Stories

## Super Admin

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| SA-01 | As a Super Admin, I want to create a new institution so schools can start using the platform | Institution created with unique code; admin can log in and access their portal |
| SA-02 | As a Super Admin, I want to view platform analytics so I can monitor growth | Dashboard shows total institutions, users, active sessions |
| SA-03 | As a Super Admin, I want to deactivate an institution so I can enforce subscription compliance | Institution disabled; all users of that institution lose access |

## Institution Admin

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| AD-01 | As an Admin, I want to register a new student so they can access the platform | Student profile created with auto-generated ID (e.g., MQI-2026-0001) |
| AD-02 | As an Admin, I want to create a class and assign a teacher so lessons can begin | Class visible in teacher portal; teacher can mark attendance |
| AD-03 | As an Admin, I want to issue a certificate to a student | Certificate appears in student portal with QR code and unique ID |
| AD-04 | As an Admin, I want to track fee payments so I know which students have outstanding balances | Payment recorded; ledger shows outstanding amount |
| AD-05 | As an Admin, I want to view enrollment and attendance reports | Charts show trends; data exportable |

## Secretary

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| SEC-01 | As a Secretary, I want to register a new student quickly | Form completed in <2 minutes; student ID generated automatically |
| SEC-02 | As a Secretary, I want to record daily attendance even without internet | Attendance saved locally; synced automatically when online |

## Teacher

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| TC-01 | As a Teacher, I want to create a quiz with AI-generated questions | AI generates 5+ questions; I review and edit before publishing |
| TC-02 | As a Teacher, I want to review student audio recitations | Audio plays in browser; I can accept/modify/reject each Tajweed suggestion |
| TC-03 | As a Teacher, I want to track each student's Hifz progress | I can see surah, ayah range, completion %, and revision status per student |
| TC-04 | As a Teacher, I want to create a lesson with a PDF attachment | Lesson published; students can view and download the PDF |
| TC-05 | As a Teacher, I want to mark class attendance and see who is absent | All students listed; status selectable; saved with one click |
| TC-06 | As a Teacher, I want to publish assessment results after grading | Results visible to students and parents only after I confirm |

## Parent

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| PA-01 | As a Parent, I want to see my child's attendance percentage | Attendance shown as % with monthly breakdown |
| PA-02 | As a Parent, I want to see my child's latest assessment score | Most recent 5 assessments shown with scores and teacher feedback |
| PA-03 | As a Parent, I want to know if my child has outstanding fees | Outstanding balance clearly shown with due date |
| PA-04 | As a Parent, I want to see my child's Hifz progress | Memorized surahs shown; revision status visible |

## Student

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| ST-01 | As a Student, I want to see my enrolled courses and access lessons | All published lessons accessible; PDF/audio/video loads correctly |
| ST-02 | As a Student, I want to take an assessment within a time limit | Timer counts down; assessment auto-submits on expiry |
| ST-03 | As a Student, I want to record and submit my recitation for teacher review | Audio recorded/uploaded; status shows "pending review" |
| ST-04 | As a Student, I want to view my Tajweed feedback | Teacher's notes visible; accepted AI suggestions shown |
| ST-05 | As a Student, I want to download my completion certificate as PDF | PDF generates with my name, certificate ID, and QR code |
| ST-06 | As a Student, I want to view my personal attendance history | Calendar/list view shows present/absent/late per day |
