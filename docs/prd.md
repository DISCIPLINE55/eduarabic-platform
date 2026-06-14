# Requirements Document

## 1. Application Overview

### 1.1 Application Name
EduArabic - AI-Powered Islamic Education Management Platform

### 1.2 Application Description
EduArabic is a comprehensive multi-tenant SaaS platform designed for Islamic educational institutions. It integrates Learning Management System (LMS), School Management, Assessment Management, Hifz (Quran Memorization) Management, AI-Assisted Teaching, and Parent Engagement capabilities. The platform supports offline-first operations, multi-institution management, and provides role-based access for Super Admins, Institution Admins, Secretaries, Teachers, Parents, and Students.

### 1.3 Brand Identity
Logo URL: https://miaoda-conversation-file.s3cdn.medo.dev/user-c9di7v8v0yyo/app-c9divjmf78xt/20260611/logo.png
Primary Brand Color: Deep Crimson/Maroon (#8B0000 or similar)

## 2. Users and Usage Scenarios

### 2.1 Target Users
1. **Super Admin**: Platform owner managing multiple institutions, subscriptions, platform settings, health monitoring, and analytics
2. **Institution Admin**: Manages teachers, students, classes, fees, attendance, and assessments within their institution
3. **Secretary**: Handles student registration, records management, attendance tracking, and fee management
4. **Teacher**: Creates lessons and assessments, reviews audio submissions, manages attendance, tracks Hifz progress
5. **Parent**: Views child's progress, attendance, assessment results, Hifz reports, and fee status
6. **Student**: Accesses learning materials, submits assignments, records Quran recitations, takes quizzes/exams, tracks personal progress

### 2.2 Core Usage Scenarios
- **Institution Management**: Super Admin onboards new institutions, manages subscriptions, monitors platform health
- **Academic Operations**: Institution Admin and Secretary manage student enrollment, class assignments, teacher allocation
- **Teaching and Learning**: Teachers create content, conduct assessments; Students access materials, complete assignments
- **Hifz Tracking**: Teachers evaluate Quran memorization progress; Students record recitations for review
- **Assessment Workflow**: Teachers create/publish assessments, students take them, teachers review and publish results
- **Parent Engagement**: Parents monitor child's academic performance, attendance, and fee status
- **Offline Operations**: Users perform critical tasks (attendance, assessments, audio recording) without internet connectivity
- **Quran Study**: Students and teachers access full Quran text, pages, and audio recitations for study and memorization
- **Profile Management**: Users update personal information, avatar, and notification preferences
- **Theme Customization**: Users toggle between dark and light mode
- **Notification Monitoring**: Users receive and view real-time announcements via notification bell

## 3. Page Structure and Functional Description

### 3.1 Page Structure

```
EduArabic Platform
├── Authentication Pages
│   ├── Login Page
│   ├── Forgot Password Page
│   ├── Reset Password Page
│   ├── Registration Page
│   └── Profile Completion Page
├── Error Pages
│   └── 403 Forbidden Page
├── Shared Pages (All Roles)
│   └── User Profile Settings Page
├── Super Admin Portal
│   ├── Dashboard
│   ├── Institution Management
│   ├── Subscription Management
│   ├── Platform Settings
│   ├── Health Monitoring
│   └── Analytics
├── Institution Admin Portal
│   ├── Dashboard
│   ├── Student Management
│   ├── Teacher Management
│   ├── Class Management
│   ├── Attendance Management
│   ├── Assessment Management
│   ├── Financial Management
│   └── Reports
├── Secretary Portal
│   ├── Dashboard
│   ├── Student Registration
│   ├── Student Records
│   ├── Attendance Tracking
│   └── Fee Management
├── Teacher Portal
│   ├── Dashboard
│   ├── Learning Center
│   │   ├── Subjects
│   │   ├── Lessons
│   │   └── Resources
│   ├── Assessment Center
│   │   ├── Create Assessment
│   │   ├── Question Bank
│   │   ├── AI Question Generation
│   │   ├── Assessment List
│   │   └── Review Submissions
│   ├── Hifz Management
│   │   ├── Student Hifz Tracking
│   │   ├── Audio Review Queue
│   │   └── Progress Reports
│   ├── Attendance Management
│   ├── Class Management
│   └── Quran Viewer
│       ├── Surah List
│       ├── Page Viewer
│       └── Audio Player
├── Parent Portal
│   ├── Dashboard
│   ├── Child Progress
│   ├── Attendance Records
│   ├── Assessment Results
│   ├── Hifz Progress
│   ├── Fee Status
│   └── Announcements
├── Student Portal
│   ├── Dashboard
│   ├── Learning Center
│   │   ├── My Courses
│   │   ├── Lessons
│   │   └── Resources
│   ├── Assessments
│   │   ├── Available Assessments
│   │   ├── Take Assessment
│   │   └── My Results
│   ├── Hifz Tracker
│   │   ├── My Progress
│   │   ├── Record Recitation
│   │   └── Teacher Feedback
│   ├── Attendance
│   ├── Certificates
│   └── Quran Viewer
│       ├── Surah List
│       ├── Page Viewer
│       └── Audio Player
└── Shared Components
    ├── Navigation Header
    ├── Communication Center
    ├── Certificate System
    └── Offline Sync Manager
```

### 3.2 Authentication Pages

#### 3.2.1 Login Page
- User enters email and password to log in
- Password field includes show/hide toggle button (Eye/EyeOff icon) to toggle password visibility
- Alternative login options: Google Login, Apple Login
- Display \"Forgot password?\" link below password field
- Redirect to appropriate portal based on user role after successful authentication
- Fully responsive from 375px mobile to 1920px desktop

#### 3.2.2 Forgot Password Page
- User enters email address
- System sends password reset email via Supabase Auth
- Display confirmation message: \"Password reset email sent. Please check your inbox.\"
- Provide link to return to login page
- Fully responsive from 375px mobile to 1920px desktop

#### 3.2.3 Reset Password Page
- User accesses page via link in password reset email
- User enters new password and confirms new password
- Both password fields include show/hide toggle button (Eye/EyeOff icon) to toggle password visibility
- System validates password strength and match
- System updates password via Supabase Auth
- Display success message and redirect to login page
- Fully responsive from 375px mobile to 1920px desktop

#### 3.2.4 Registration Page
- User provides email, password, and basic information to create account
- Password field and confirm password field both include show/hide toggle button (Eye/EyeOff icon) to toggle password visibility
- Support for Google and Apple registration
- Trigger profile completion workflow after registration
- Fully responsive from 375px mobile to 1920px desktop

#### 3.2.5 Profile Completion Page
- User completes full name
- User selects role: Student, Teacher, Parent, Secretary, Admin
- User selects institution from dropdown list
- User provides date of birth, gender, phone number, address
- System validates all required fields
- On submit, system updates profiles table and sets is_profile_complete=true
- Redirect to role-specific dashboard after completion
- Fully responsive from 375px mobile to 1920px desktop

### 3.3 Error Pages

#### 3.3.1 403 Forbidden Page
- Display clear message: \"Access Denied - You do not have permission to access this page\"
- Display user's current role
- Provide button to return to user's role-appropriate dashboard
- Triggered by RouteGuard when authenticated user accesses unauthorized route
- Fully responsive from 375px mobile to 1920px desktop

### 3.4 Shared Pages (All Roles)

#### 3.4.1 User Profile Settings Page
- User views current profile information: full name, email, role, institution, avatar
- User edits full name via text input field
- User uploads or changes avatar image via file upload component
- User manages notification preferences with toggle switches for each notification type:
  + Email notifications toggle
  + Push notifications toggle
  + Notification types include: Announcements, Assessment Results, Attendance Updates, Fee Reminders, Hifz Feedback
- User saves changes; system updates profiles table
- Display success message after successful update
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All form elements properly sized for mobile interaction

### 3.5 Super Admin Portal

#### 3.5.1 Dashboard
- Display platform-wide metrics: total institutions, total users, revenue, AI usage statistics
- Show recent activities and system health status
- Display functional content with real stats cards querying Supabase:
  + Total Institutions count with trend indicator
  + Total Users count with trend indicator
  + Monthly Revenue in GHS with trend indicator
  + AI API Usage count with trend indicator
- Show recent activities list with timestamp, user, and action description from audit table
- Display system health indicators: API status, database status, storage status
- Provide navigation cards to Institution Management, Subscription Management, Platform Settings, Health Monitoring, Analytics
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.5.2 Institution Management
- Create new institutions with name, code, contact information, address, region
- View list of all institutions with status and subscription details
- Edit institution information and deactivate institutions
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.5.3 Subscription Management
- Manage subscription plans for institutions
- Track subscription status, renewal dates, and payment history
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.5.4 Platform Settings
- Configure global platform settings
- Manage default configurations for new institutions
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.5.5 Health Monitoring
- Monitor system performance and uptime
- View error logs and system alerts
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.5.6 Analytics
- View aggregated analytics across all institutions
- Generate reports on user engagement, feature usage, and revenue
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

### 3.6 Institution Admin Portal

#### 3.6.1 Dashboard
- Display institution-specific metrics: total students, teachers, classes, attendance rate, assessment completion rate
- Show recent activities within the institution
- Display functional content with real stats cards querying Supabase:
  + Total Students count with trend indicator
  + Total Teachers count with trend indicator
  + Total Classes count
  + Attendance Rate percentage with trend indicator
  + Assessment Completion Rate percentage with trend indicator
- Show recent activities list with timestamp, user, and action description from audit table
- Provide navigation cards to Student Management, Teacher Management, Class Management, Attendance Management, Assessment Management, Financial Management, Reports
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.6.2 Student Management
- Register new students with full name, gender, date of birth, guardian name, guardian phone, address, region
- Generate unique Student ID in format: INSTITUTIONCODE-YEAR-SEQUENCE (e.g., MQI-2026-0001)
- View and edit student profiles
- Track student academic history, attendance history, assessment history, Hifz history
- Manage student status (Active, Inactive, Graduated)
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.6.3 Teacher Management
- Create teacher profiles with name, contact information, subjects taught
- Assign teachers to classes
- View teacher attendance and performance reports
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.6.4 Class Management
- Create classes with name, academic level, assigned teacher, assigned students
- Support multiple sessions per class
- Support weekend classes
- Edit class assignments and schedules
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.6.5 Attendance Management
- View attendance reports for students and teachers
- Generate attendance analytics and trends
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.6.6 Assessment Management
- View all assessments created within the institution
- Monitor assessment completion rates and results
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.6.7 Financial Management
- Define fee structures for different classes or student groups
- View student ledger with payment records and outstanding balances
- Generate financial reports
- Primary currency: Ghana Cedi (GHS)
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.6.8 Reports
- Generate comprehensive reports on students, teachers, attendance, assessments, finances
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

### 3.7 Secretary Portal

#### 3.7.1 Dashboard
- Display summary of pending tasks: new registrations, attendance updates, fee payments
- Display functional content with real stats cards querying Supabase:
  + Pending Registrations count
  + Pending Attendance Updates count
  + Pending Fee Payments count
  + Today's Attendance Completion percentage
- Show recent activities list with timestamp and action description from audit table
- Provide navigation cards to Student Registration, Student Records, Attendance Tracking, Fee Management
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.7.2 Student Registration
- Register new students with required information
- Generate Student ID automatically
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.7.3 Student Records
- View and update student information
- Manage guardian information
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.7.4 Attendance Tracking
- Record daily attendance for students and teachers
- Mark attendance status: Present, Absent, Excused, Late
- Support offline attendance recording with background sync
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.7.5 Fee Management
- Record fee payments for students
- Update student ledger
- View outstanding balances
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

### 3.8 Teacher Portal

#### 3.8.1 Dashboard
- Display teacher-specific metrics: classes taught, attendance trends, assessment performance, Hifz progress, audio review queue count
- Display functional content with real stats cards querying Supabase:
  + Classes Taught count
  + Today's Attendance Rate percentage
  + Pending Assessments count
  + Audio Review Queue count
  + Students' Average Hifz Progress percentage
- Show recent activities list with timestamp and action description from audit table
- Provide navigation cards to Learning Center, Assessment Center, Hifz Management, Attendance Management, Class Management, Quran Viewer
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.8.2 Learning Center - Subjects
- View subjects assigned to teacher
- Create new subjects with name and description
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.8.3 Learning Center - Lessons
- Create lessons under subjects with title, description, content
- Content types: Text, PDF, Audio, Video
- Option to create lessons manually or use AI to generate lesson content
- Attach resources to lessons
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.8.4 Learning Center - Resources
- Upload and manage learning resources (PDFs, audio files, video files)
- Organize resources by subject or lesson
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.8.5 Assessment Center - Create Assessment
- Create assessments with title, subject, type (Quiz, Exam, Practice, Assignment, Make-Up Assessment), duration, access code
- Add questions manually or use AI Question Generation
- Set assessment as Draft or Published
- Configure anti-cheat settings and timer
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.8.6 Assessment Center - Question Bank
- Store and manage reusable questions
- Question types: Multiple Choice, True/False, Fill in the Blank, Matching, Short Answer
- Each question includes question text, options (if applicable), correct answer, marking scheme
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.8.7 Assessment Center - AI Question Generation
- Teacher provides subject, topic, academic level, number of questions
- AI generates questions with options, correct answers, and marking scheme
- For Arabic courses: questions in English, answers may contain Arabic text
- Teacher reviews and edits AI-generated questions before adding to assessment
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.8.8 Assessment Center - Assessment List
- View all assessments created by teacher
- Filter by status: Draft, Published, Reviewed, Results Published
- Edit or delete draft assessments
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.8.9 Assessment Center - Review Submissions
- View student submissions for assessments
- Auto-grading for objective questions (MCQ, True/False)
- Manual grading for subjective questions (Short Answer, Fill in the Blank)
- Provide feedback and moderate scores
- Publish results after review
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.8.10 Hifz Management - Student Hifz Tracking
- View list of students with Hifz progress
- Track memorization and revision for each student: Surah, Ayah Range, Completion Percentage, Revision Status
- Set daily and weekly memorization targets
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.8.11 Hifz Management - Audio Review Queue
- View queue of audio recitations submitted by students
- Listen to audio recordings
- Provide text feedback and optional voice feedback
- Grade recitation and publish score
- AI provides transcription, pronunciation analysis, and Tajweed suggestions (Madd, Shaddah, Sukoon, Ghunnah)
- Teacher reviews AI suggestions and decides to Accept, Modify, or Reject each suggestion
- Store transcript, confidence score, segments, AI suggestions, and teacher decisions
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.8.12 Hifz Management - Progress Reports
- Generate Hifz progress reports for individual students or entire class
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.8.13 Attendance Management
- Record attendance for assigned classes
- Mark student attendance status: Present, Absent, Excused, Late
- Support offline attendance recording
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.8.14 Class Management
- View classes assigned to teacher
- View student list for each class
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.8.15 Quran Viewer - Surah List
- Display list of all 114 surahs
- Show surah name in Arabic and transliteration
- Show verse count and revelation type (Meccan/Medinan)
- Revelation type badges use semantic color tokens: Meccan badge uses semantic token for Meccan revelation type, Medinan badge uses semantic token for Medinan revelation type
- User selects surah to view pages or play audio
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.8.16 Quran Viewer - Page Viewer
- Display Quran pages using public Quran pages API
- Navigate between pages
- View page number and juz information
- All colored elements use semantic color tokens instead of direct Tailwind color classes
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.8.17 Quran Viewer - Audio Player
- Play full recitation audio per surah or ayah using public Quran audio CDN
- Controls: play, pause, stop, next surah, previous surah
- Support verse-by-verse playback
- Support repeat mode
- Support playback speed control
- All colored elements use semantic color tokens instead of direct Tailwind color classes
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

### 3.9 Parent Portal

#### 3.9.1 Dashboard
- Display summary of child's recent activities: attendance, assessment results, Hifz progress, fee status
- Display functional content with real stats cards querying Supabase:
  + Child's Attendance Rate percentage with trend indicator
  + Latest Assessment Score with subject name
  + Hifz Progress percentage
  + Outstanding Fee Balance in GHS
- Show recent activities list with timestamp and description from audit table
- Provide navigation cards to Child Progress, Attendance Records, Assessment Results, Hifz Progress, Fee Status, Announcements
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.9.2 Child Progress
- View overall academic progress for child
- View progress by subject
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.9.3 Attendance Records
- View child's attendance history
- View attendance percentage
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.9.4 Assessment Results
- View child's assessment results with scores and teacher feedback
- View detailed breakdown of performance by question type
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.9.5 Hifz Progress
- View child's Hifz memorization and revision progress
- View teacher evaluations and feedback on recitations
- Listen to audio feedback from teacher
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.9.6 Fee Status
- View fee structure for child
- View payment history and outstanding balances
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.9.7 Announcements
- View announcements from institution and teachers
- Receive push notifications for important updates
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

### 3.10 Student Portal

#### 3.10.1 Dashboard
- Display student's progress summary: attendance percentage, assessment completion rate, Hifz completion percentage
- Show upcoming assessments and assignments
- Display functional content with real stats cards querying Supabase:
  + Attendance Rate percentage with trend indicator
  + Assessment Completion Rate percentage
  + Hifz Progress percentage with current surah name
  + Upcoming Assessments count
- Show recent activities list with timestamp and description from audit table
- Provide navigation cards to Learning Center, Assessments, Hifz Tracker, Attendance, Certificates, Quran Viewer
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.10.2 Learning Center - My Courses
- View list of enrolled courses/subjects
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.10.3 Learning Center - Lessons
- Access lessons for enrolled courses
- View lesson content (text, PDF, audio, video)
- Download resources for offline access
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.10.4 Learning Center - Resources
- Access all learning resources provided by teachers
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.10.5 Assessments - Available Assessments
- View list of available assessments (Quiz, Exam, Practice, Assignment)
- View assessment details: title, subject, duration, due date
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.10.6 Assessments - Take Assessment
- Enter access code (if required) to start assessment
- Answer questions within time limit
- Submit assessment upon completion
- Support offline assessment taking with background sync
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.10.7 Assessments - My Results
- View results for completed assessments
- View score, teacher feedback, and correct answers (if enabled)
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.10.8 Hifz Tracker - My Progress
- View personal Hifz memorization and revision progress
- View daily and weekly targets
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.10.9 Hifz Tracker - Record Recitation
- Record Quran recitation audio
- Upload recorded audio for teacher review
- Support offline recording with background upload
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.10.10 Hifz Tracker - Teacher Feedback
- View teacher feedback on submitted recitations
- Listen to voice feedback from teacher
- View score and Tajweed suggestions
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.10.11 Attendance
- View personal attendance history
- View attendance percentage
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.10.12 Certificates
- View earned certificates: Completion, Attendance, Hifz, Academic Certificates
- Download certificates as PDF
- Verify certificate authenticity via QR code and unique Certificate ID
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.10.13 Quran Viewer - Surah List
- Display list of all 114 surahs
- Show surah name in Arabic and transliteration
- Show verse count and revelation type (Meccan/Medinan)
- Revelation type badges use semantic color tokens: Meccan badge uses semantic token for Meccan revelation type, Medinan badge uses semantic token for Medinan revelation type
- User selects surah to view pages or play audio
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.10.14 Quran Viewer - Page Viewer
- Display Quran pages using public Quran pages API
- Navigate between pages
- View page number and juz information
- All colored elements use semantic color tokens instead of direct Tailwind color classes
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.10.15 Quran Viewer - Audio Player
- Play full recitation audio per surah or ayah using public Quran audio CDN
- Controls: play, pause, stop, next surah, previous surah
- Support verse-by-verse playback
- Support repeat mode
- Support playback speed control
- All colored elements use semantic color tokens instead of direct Tailwind color classes
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

### 3.11 Shared Components

#### 3.11.1 Navigation Header
- Desktop sidebar header displays:
  + Platform logo
  + Dark/Light mode toggle button
  + Notification bell icon with unread count badge
  + User avatar with dropdown menu (Profile Settings, Logout)
- Mobile top header displays:
  + Menu toggle button (opens Sheet overlay sidebar)
  + Platform logo
  + Dark/Light mode toggle button
  + Notification bell icon with unread count badge
  + User avatar with dropdown menu (Profile Settings, Logout)
- Notification bell:
  + Displays count of unread announcements as badge
  + Updates in real-time via Supabase Realtime subscription
  + Clicking bell opens announcements list
- Dark/Light mode toggle:
  + Switches between dark and light theme
  + Persists user preference in profiles table
  + Applies theme globally across all pages
- Fully responsive from 375px mobile to 1920px desktop

#### 3.11.2 Communication Center
- Institution Admin and Teachers create announcements
- Send push notifications to specific user groups (all parents, specific class, all students)
- View announcement history
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.11.3 Certificate System
- Generate certificates based on predefined templates
- Certificate types: Completion, Attendance, Hifz, Academic
- Each certificate includes unique Certificate ID and QR code for verification
- Export certificates as PDF
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.11.4 Offline Sync Manager
- Queue offline actions: attendance records, lesson access, assessment submissions, audio recordings, profile updates
- Sync queued actions when internet connection is restored
- Detect conflicts between local and server data
- Provide conflict resolution interface for protected data: attendance, Hifz progress, assessment results, audio reviews, student profiles, payments
- Resolution options: Keep Local, Keep Server, Merge Text Fields
- Audit all conflict resolutions with timestamp and user action
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

## 4. Business Rules and Logic

### 4.1 Multi-Tenancy and Data Isolation
- Every academic record contains organization_id field
- Row Level Security ensures users can only access data from their assigned institution
- Student ID format: INSTITUTIONCODE-YEAR-SEQUENCE (e.g., MQI-2026-0001)
- Year is based on registration year
- Sequence resets annually per institution

### 4.2 Authentication and Authorization
- Users can log in via Email, Google, or Apple
- Users can reset password via Forgot Password flow using Supabase Auth password reset email
- After registration, users complete profile with real-name validation, role selection, institution selection, and additional information
- Role assignment: Super Admin assigns roles to Institution Admins; Institution Admins assign roles to Secretaries, Teachers, Parents, Students
- Institution assignment: Users select institution during profile completion
- Role-based access control restricts features and data access based on user role
- RouteGuard redirects unauthorized users to 403 Forbidden page
- All 6 roles (super_admin, admin, secretary, teacher, parent, student) are fully operational:
  + Login redirects to correct role-specific dashboard based on user's role
  + RouteGuard enforces role-based path access for all routes
  + Profile completion flow correctly assigns role and institution to user profile
  + Each role has access only to authorized routes and features

### 4.3 Profile Completion Workflow
- After registration, user is redirected to Profile Completion Page
- User must complete all required fields: full name, role, institution, date of birth, gender, phone, address
- System validates all fields before allowing submission
- On successful submission, system updates profiles table and sets is_profile_complete=true
- User is redirected to role-appropriate dashboard based on selected role

### 4.4 User Profile Management
- Any authenticated user can access User Profile Settings Page
- User can edit full name and upload/change avatar image
- User can manage notification preferences with toggle switches for each notification type
- Notification types: Announcements, Assessment Results, Attendance Updates, Fee Reminders, Hifz Feedback
- Each notification type has separate toggles for Email and Push notifications
- System updates profiles table with new values
- Changes take effect immediately

### 4.5 Theme Management
- User can toggle between dark and light mode via button in navigation header
- Theme preference is stored in profiles table
- Theme applies globally across all pages and components
- Theme persists across sessions

### 4.6 Real-time Notifications
- Notification bell icon displays count of unread announcements
- Count updates in real-time via Supabase Realtime subscription to announcements table
- Clicking bell opens announcements list
- User can mark announcements as read
- Unread count decreases when announcements are marked as read

### 4.7 Data Source Requirements
- All dashboard pages must query real data from Supabase tables
- Stats cards must display actual counts, percentages, and trends calculated from database
- Recent activities lists must pull from audit table
- Charts and graphs must render data from relevant tables
- No hardcoded or mock data arrays allowed in production code

### 4.8 Assessment Workflow
- Teacher creates assessment in Draft status
- Teacher publishes assessment, changing status to Published
- Students can access and take Published assessments
- After submission, assessment status changes to Teacher Reviewed for that student
- Teacher reviews submission, provides feedback, and publishes results
- Assessment status changes to Results Published for that student

### 4.9 Audio Assessment Workflow
- Student records or uploads Quran recitation audio
- Audio is submitted to teacher's review queue
- Teacher listens to audio and provides text feedback and optional voice feedback
- AI generates transcript, pronunciation analysis, and Tajweed suggestions
- Teacher reviews AI suggestions and decides to Accept, Modify, or Reject each suggestion
- Teacher assigns score and publishes feedback
- Student can view feedback, listen to teacher's voice feedback, and see score

### 4.10 Quran Viewer Integration
- Quran Viewer is accessible to Students and Teachers
- System retrieves Quran pages from public Quran pages API
- System retrieves audio recitations from public Quran audio CDN
- No API keys required for Quran data access
- Audio player supports play, pause, stop, next, previous, repeat, and speed control

### 4.11 AI Governance
- AI can generate lessons, quizzes, exams, homework, analyze audio, and generate Tajweed suggestions
- AI cannot publish scores, override teacher decisions, or modify records without teacher approval
- Teacher has final authority over all AI-generated content and suggestions
- All AI suggestions must be reviewed and approved by teacher before being applied

### 4.12 Offline-First Operations
- Critical operations support offline mode: attendance recording, lesson access, assessment taking, audio recording, profile updates
- Offline actions are queued locally and synced when internet connection is restored
- Conflict detection for protected data: attendance, Hifz progress, assessment results, audio reviews, student profiles, payments
- Conflicts are flagged and presented to user for resolution
- User can choose to Keep Local, Keep Server, or Merge Text Fields
- All conflict resolutions are audited

### 4.13 Financial Management
- Primary currency is Ghana Cedi (GHS)
- Institution Admin defines fee structures for different classes or student groups
- Secretary records fee payments and updates student ledger
- Outstanding balances are calculated automatically
- Parents can view fee status and payment history

### 4.14 Certificate Generation
- Certificates are generated based on predefined templates
- Certificate types: Completion (course completion), Attendance (attendance threshold), Hifz (memorization milestone), Academic (academic achievement)
- Each certificate includes unique Certificate ID and QR code
- Certificates can be verified by scanning QR code or entering Certificate ID

### 4.15 Data Versioning and Audit
- All major tables include version field for optimistic concurrency control
- All create, update, delete operations are logged in audit table
- Audit log includes user, timestamp, action, old value, new value

### 4.16 Responsive Design Requirements
- Every page, sidebar, toggle, and component must be fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar must use Sheet overlay component with proper close-on-navigate behavior
- All tables must be wrapped in overflow-x-auto container to prevent horizontal scroll
- All grids must collapse properly on mobile viewports
- No horizontal scroll allowed at any viewport width
- All touch targets must be at least 44x44px on mobile devices
- All text must be readable without zooming on mobile devices

## 5. Exception and Boundary Conditions

| Scenario | Handling |
|----------|----------|
| User attempts to log in with incorrect credentials | Display error message: Invalid email or password |
| User clicks Forgot Password link and enters invalid email | Display error message: Email not found |
| User enters mismatched passwords on Reset Password page | Display error message: Passwords do not match |
| User attempts to access feature not permitted by role | Redirect to 403 Forbidden page |
| User attempts to submit Profile Completion form with missing required fields | Display error message: Please complete all required fields |
| User selects invalid institution during profile completion | Display error message: Invalid institution selection |
| User uploads avatar image exceeding size limit | Display error message: Image size exceeds limit (max 5MB) |
| User uploads avatar in unsupported format | Display error message: Unsupported image format (supported: JPG, PNG, GIF) |
| User attempts to save profile settings with invalid data | Display error message: Please correct the highlighted fields |
| Supabase Realtime connection fails | Display warning: Real-time updates unavailable, refresh page to see latest data |
| User clicks notification bell with no announcements | Display message: No new announcements |
| Theme toggle fails to apply | Display error message: Unable to change theme, please try again |
| Student attempts to take assessment before published | Assessment not visible in Available Assessments list |
| Student attempts to take assessment after deadline | Display error message: Assessment deadline has passed |
| Student submits assessment without answering all questions | Allow submission with warning: Some questions are unanswered |
| Teacher attempts to publish assessment results before reviewing all submissions | Display error message: All submissions must be reviewed before publishing results |
| User records attendance offline and another user records conflicting attendance online | Flag conflict in Offline Sync Manager; user resolves conflict by choosing Keep Local, Keep Server, or Merge |
| Student uploads audio file exceeding size limit | Display error message: File size exceeds limit |
| AI fails to generate questions | Display error message: AI generation failed, please try again or create questions manually |
| AI fails to transcribe audio | Teacher can still review audio and provide feedback without AI suggestions |
| Quran pages API fails to load | Display error message: Unable to load Quran pages, please try again later |
| Quran audio CDN fails to load | Display error message: Unable to load audio, please check your connection |
| User attempts to delete student with existing academic records | Soft delete: Mark student as Inactive instead of permanent deletion |
| Institution subscription expires | Restrict access to platform features; display message: Subscription expired, please contact administrator |
| User attempts to create duplicate Student ID | System prevents duplicate by enforcing unique constraint; display error message |
| Parent attempts to view another parent's child data | Row Level Security prevents access; display error message: Access denied |
| Offline sync fails due to network error | Retry sync automatically; if repeated failures, notify user to check internet connection |
| User attempts to access platform on viewport narrower than 375px | Display warning message: For best experience, please use a device with minimum width of 375px |
| User attempts to access platform on viewport wider than 1920px | Layout scales appropriately with max-width constraints to maintain readability |
| Dashboard queries return no data | Display empty state message: No data available yet |
| Dashboard queries fail due to database error | Display error message: Unable to load data, please refresh page |

## 6. Acceptance Criteria

1. User clicks \"Forgot password?\" link on login page, enters email, receives password reset email via Supabase Auth, clicks link in email, enters new password on Reset Password page with password visibility toggle, successfully updates password, and logs in with new password
2. User with Student role attempts to access Institution Admin route, system redirects to 403 Forbidden page displaying \"Access Denied\" message and user's current role (Student), user clicks button to return to Student dashboard
3. New user completes registration with password visibility toggle on password fields, is redirected to Profile Completion Page, fills in full name, selects role (Teacher), selects institution from dropdown, provides date of birth, gender, phone, and address, submits form, system updates profiles table and sets is_profile_complete=true, user is redirected to Teacher dashboard
4. Authenticated user navigates to User Profile Settings Page on mobile device (375px width), edits full name, uploads new avatar image, toggles email notifications off for Announcements, toggles push notifications on for Assessment Results, saves changes, system updates profiles table, success message displays, changes persist after page refresh
5. User clicks dark mode toggle button in desktop sidebar header, theme switches from light to dark, all pages and components render in dark theme, user preference is saved in profiles table, user logs out and logs back in, dark theme persists
6. Teacher creates new announcement on desktop (1920px width), announcement is published, Parent user's notification bell icon immediately shows unread count badge of 1 via Supabase Realtime, Parent clicks bell, views announcement, marks as read, unread count badge disappears
7. Super Admin views dashboard on desktop, all stats cards display real data queried from Supabase (total institutions count, total users count, monthly revenue in GHS, AI usage count), recent activities list shows actual audit log entries, no hardcoded data present
8. Institution Admin views dashboard on tablet (768px width), stats cards display real data (total students, total teachers, total classes, attendance rate, assessment completion rate), recent activities list pulls from audit table, all data is current and accurate
9. Student accesses Quran Viewer on mobile device (375px width), views list of 114 surahs with Arabic names and transliteration, revelation type badges display with semantic color tokens (Meccan and Medinan), selects Surah Al-Fatiha, views Quran page displaying surah text without horizontal scroll, plays audio recitation using semantic color tokens for player controls, pauses audio, resumes playback, navigates to next surah, enables repeat mode, adjusts playback speed to 0.75x, all interactions work smoothly on mobile viewport
10. Institution Admin successfully registers a new student with full name, gender, date of birth, guardian information, and address on tablet device (768px width); system generates unique Student ID in format INSTITUTIONCODE-YEAR-SEQUENCE; form layout adapts properly to tablet viewport
11. Teacher creates a new lesson with title, description, and text content on desktop (1920px width); lesson is saved and visible to assigned students in Learning Center; page layout utilizes full desktop width appropriately
12. Teacher creates a quiz with 5 multiple-choice questions using AI Question Generation on mobile device (375px width); teacher reviews and edits AI-generated questions; teacher publishes quiz; all form elements and buttons are accessible and properly sized for mobile interaction
13. Student accesses published quiz on mobile device, answers all questions within time limit using mobile-optimized interface, and submits quiz; submission is recorded; no horizontal scroll occurs during quiz taking
14. Teacher reviews student's quiz submission on tablet device, system auto-grades multiple-choice questions, teacher publishes results using responsive interface; student views score and feedback in My Results on mobile device
15. Student records Quran recitation audio on mobile device and uploads for teacher review; audio is added to teacher's review queue; upload progress indicator displays properly on mobile
16. Teacher listens to audio on desktop, reviews AI-generated Tajweed suggestions, accepts or modifies suggestions, provides text feedback, assigns score, and publishes feedback; student views feedback and score on mobile device
17. Secretary records daily attendance for a class on tablet device, marking students as Present, Absent, Excused, or Late using responsive table wrapped in overflow-x-auto; attendance is saved and visible in attendance reports
18. Parent logs in on mobile device and views child's attendance percentage, latest assessment results, and Hifz progress on dashboard with functional stats cards querying real Supabase data; mobile sidebar opens as Sheet overlay and closes properly on navigation
19. Institution Admin generates a Completion Certificate for a student on desktop; certificate includes unique Certificate ID and QR code; certificate is exported as PDF and can be verified by scanning QR code on mobile device
20. All 6 user roles (super_admin, admin, secretary, teacher, parent, student) can successfully log in, are redirected to their correct role-specific dashboard, and can access only their authorized routes; RouteGuard properly enforces role-based access control
21. User logs in on mobile device, clicks notification bell in mobile header, views list of announcements with unread count badge, marks announcement as read, unread count updates in real-time, clicks dark mode toggle, theme switches to dark, all pages render correctly in dark theme on mobile viewport

## 7. Out of Scope for Current Release

- SMS integration for parent notifications
- WhatsApp integration for communication
- Multi-currency support beyond Ghana Cedi (GHS)
- Advanced AI features beyond question generation and audio transcription (e.g., personalized learning recommendations, predictive analytics)
- Mobile native apps for iOS and Android (current release focuses on Progressive Web App)
- Integration with external Learning Management Systems
- Video conferencing for live classes
- Gamification features (badges, leaderboards, rewards)
- Advanced reporting and business intelligence dashboards
- Automated backup and disaster recovery configuration
- Custom branding for individual institutions beyond logo and primary color
- Multi-language support beyond English and Arabic
- Advanced access control with custom roles and permissions
- Integration with payment gateways for online fee payment
- Student self-registration and enrollment
- Bulk import/export of student and teacher data
- Advanced scheduling and timetable management
- Library management system
- Transport management system
- Hostel management system
- Inventory management for school supplies
- HR and payroll management for staff
- Quran translation display in multiple languages
- Quran tafsir (commentary) integration
- Bookmarking and note-taking in Quran Viewer
- Custom reciter selection for Quran audio
- Two-factor authentication (2FA)
- Biometric authentication
- Social login beyond Google and Apple
- Advanced notification filtering and categorization
- Notification scheduling and delivery time preferences
- In-app messaging between users
- Email digest of notifications