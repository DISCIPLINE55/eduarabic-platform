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
1. **Super Admin**: Platform owner managing multiple institutions, subscriptions, platform settings, health monitoring, analytics, user management, invite link generation, email invite sending, and audit logs
2. **Institution Admin**: Manages teachers, students, classes, fees, attendance, assessments, and student-account linking within their institution
3. **Secretary**: Handles student registration, records management, attendance tracking, fee management, and student-account linking
4. **Teacher**: Creates lessons and assessments, reviews audio submissions, manages attendance, tracks Hifz progress
5. **Parent**: Views child's progress, attendance records with detailed tracking, assessment results, Hifz reports, fee payment history with receipts, and outstanding balance
6. **Student**: Accesses learning materials, submits assignments, records Quran recitations, takes quizzes/exams, tracks personal progress, and can self-link student record

### 2.2 Core Usage Scenarios
- **Platform Administration**: Super Admin manages institutions, users, subscriptions, generates invite links, sends invite emails, monitors platform health, views audit logs
- **Edge Function Deployment**: Super Admin deploys manage-users edge function via Supabase Personal Access Token using Supabase Management API
- **Email Invite Distribution**: Super Admin generates invite link and sends it to one or more recipient email addresses via email service
- **Institution Management**: Super Admin onboards new institutions, manages subscriptions, monitors platform health
- **User Management**: Super Admin views all platform users, changes roles, performs bulk operations, creates users directly
- **Invite Link Management**: Super Admin generates invite links with pre-set roles for institutions, sets expiry, deactivates links, sends invite emails
- **Student-Account Linking**: Admin/Secretary links existing auth accounts to student records, creates new accounts and links them, unlinks accounts; Students self-link their student records
- **Academic Operations**: Institution Admin and Secretary manage student enrollment, class assignments, teacher allocation
- **Teaching and Learning**: Teachers create content, conduct assessments; Students access materials, complete assignments
- **Hifz Tracking**: Teachers evaluate Quran memorization progress; Students record recitations for review
- **Assessment Workflow**: Teachers create/publish assessments, students take them, teachers review and publish results
- **Parent Engagement**: Parents monitor child's academic performance, view detailed attendance tracking with daily status and monthly summary, view fee payment history with receipts and outstanding balance
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
│   │   ├── Institution List
│   │   ├── Create Institution
│   │   ├── Edit Institution
│   │   └── Institution Details
│   ├── User Management
│   │   ├── User List
│   │   ├── Create User
│   │   ├── Edit User Role
│   │   └── Bulk Operations
│   ├── Subscription Management
│   │   ├── Subscription List
│   │   └── Edit Subscription
│   ├── Invite Link Management
│   │   ├── Generate Invite Link
│   │   ├── Send Invite Email
│   │   ├── Invite Link List
│   │   └── Deactivate Invite Link
│   ├── Platform Analytics
│   ├── Audit Logs
│   ├── Platform Settings
│   │   └── Edge Function Deployment
│   └── System Health Panel
├── Institution Admin Portal
│   ├── Dashboard
│   ├── Student Management
│   │   ├── Student List
│   │   ├── Student Details
│   │   └── Link/Unlink Account
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
│   │   ├── Student List
│   │   ├── Student Details
│   │   └── Link/Unlink Account
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
│   ├── Attendance Tracking
│   ├── Assessment Results
│   ├── Hifz Progress
│   ├── Fee Payment History
│   └── Announcements
├── Student Portal
│   ├── Dashboard
│   │   └── Link Student Record Card (if not linked)
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
- Provide navigation cards to Institution Management, User Management, Subscription Management, Invite Link Management, Platform Analytics, Audit Logs, Platform Settings, System Health Panel
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.5.2 Institution Management - Institution List
- Display list of all institutions with columns: Institution Name, Code, Status (Active/Inactive), Subscription Plan, Contact Email, Region
- Each row includes action buttons: View Details, Edit, Toggle Active/Inactive, Delete
- Provide search and filter options by status, region, subscription plan
- Display \"Create Institution\" button at top of page
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.5.3 Institution Management - Create Institution
- Form fields: Institution Name, Institution Code, Contact Email, Contact Phone, Address, Region, Subscription Plan (dropdown: Trial/Active/Expired), Subscription Expiry Date
- System validates all required fields
- On submit, system creates new institution record in institutions table
- Display success message and redirect to Institution List
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All form elements properly sized for mobile interaction

#### 3.5.4 Institution Management - Edit Institution
- Pre-populate form with existing institution data
- Allow editing of all fields except Institution Code
- On submit, system updates institution record
- Display success message and redirect to Institution List
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All form elements properly sized for mobile interaction

#### 3.5.5 Institution Management - Institution Details
- Display full institution information: Name, Code, Status, Subscription Plan, Expiry Date, Contact Email, Phone, Address, Region
- Display institution statistics: Total Students, Total Teachers, Total Classes, Total Assessments
- Display recent activities for this institution from audit table
- Provide buttons: Edit Institution, Toggle Active/Inactive, Delete Institution
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.5.6 Institution Management - Toggle Active/Inactive
- Display confirmation dialog: \"Are you sure you want to change institution status?\"
- On confirm, system updates institution status field
- Display success message
- Fully responsive from 375px mobile to 1920px desktop

#### 3.5.7 Institution Management - Delete Institution
- Display confirmation dialog: \"Are you sure you want to delete this institution? This action cannot be undone.\"
- On confirm, system performs soft delete by marking institution as deleted
- Display success message and redirect to Institution List
- Fully responsive from 375px mobile to 1920px desktop

#### 3.5.8 User Management - User List
- Display list of all platform users with columns: Full Name, Email, Role, Institution, Status (Active/Inactive), Last Login
- Each row includes action buttons: Edit Role, View Details, Deactivate/Activate
- Provide search and filter options by role, institution, status
- Display \"Create User\" button at top of page
- Support bulk operations: Select multiple users, Bulk Change Role, Bulk Deactivate/Activate
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.5.9 User Management - Create User
- Form fields: Full Name, Email, Password, Confirm Password, Role (dropdown: Super Admin/Admin/Secretary/Teacher/Parent/Student), Institution (dropdown)
- Password fields include show/hide toggle button
- System validates all required fields and password match
- On submit, system creates new auth user via Supabase Auth and creates profile record
- Display success message and redirect to User List
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All form elements properly sized for mobile interaction

#### 3.5.10 User Management - Edit User Role
- Display dialog with user's current role and institution
- Provide dropdown to select new role
- Provide dropdown to select new institution (if applicable)
- On submit, system updates user's role and institution in profiles table
- Display success message
- Fully responsive from 375px mobile to 1920px desktop

#### 3.5.11 User Management - Bulk Operations
- User selects multiple users from User List via checkboxes
- User clicks \"Bulk Actions\" button and selects action: Change Role, Deactivate, Activate
- System displays confirmation dialog with count of selected users
- On confirm, system applies action to all selected users
- Display success message with count of affected users
- Fully responsive from 375px mobile to 1920px desktop

#### 3.5.12 Subscription Management - Subscription List
- Display list of all institutions with subscription details: Institution Name, Subscription Plan (Trial/Active/Expired), Start Date, Expiry Date, Status
- Each row includes action button: Edit Subscription
- Provide filter options by plan, status
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.5.13 Subscription Management - Edit Subscription
- Display dialog with institution name
- Provide dropdown to select Subscription Plan: Trial, Active, Expired
- Provide date picker to set Subscription Expiry Date
- On submit, system updates institution's subscription_plan and subscription_expiry fields
- Display success message
- Fully responsive from 375px mobile to 1920px desktop

#### 3.5.14 Invite Link Management - Generate Invite Link
- Form fields: Institution (dropdown), Role (dropdown: Admin/Secretary/Teacher/Parent/Student), Expiry Date (date picker), Max Uses (number input, optional)
- On submit, system generates unique invite token and creates record in invite_links table
- Display generated invite link with \"Copy to Clipboard\" button
- Display \"Send via Email\" button to open Send Invite Email dialog
- Display success message: \"Invite link generated successfully\"
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All form elements properly sized for mobile interaction

#### 3.5.15 Invite Link Management - Send Invite Email
- Display dialog with title \"Send Invite Email\"
- Display generated invite link (read-only)
- Form fields: Recipient Email Addresses (textarea, one email per line, supports multiple emails)
- System validates email format for all entered addresses
- On submit, system calls send-invite-email edge function with invite link, role, institution name, expiry date, and recipient email addresses
- Edge function sends branded HTML email to each recipient containing invite link, role, institution name, and expiry date
- Display success message: \"Invite email sent to [count] recipients\"
- Fully responsive from 375px mobile to 1920px desktop

#### 3.5.16 Invite Link Management - Invite Link List
- Display list of all invite links with columns: Institution, Role, Token, Expiry Date, Max Uses, Current Uses, Status (Active/Expired/Deactivated)
- Each row includes action buttons: Copy Link, Send Email, Deactivate
- Provide filter options by institution, role, status
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.5.17 Invite Link Management - Deactivate Invite Link
- Display confirmation dialog: \"Are you sure you want to deactivate this invite link?\"
- On confirm, system updates invite link status to Deactivated
- Display success message
- Fully responsive from 375px mobile to 1920px desktop

#### 3.5.18 Platform Analytics
- Display comprehensive analytics dashboard with charts and graphs
- Metrics include:
  + Total Institutions over time (line chart)
  + Total Users over time (line chart)
  + Total Students over time (line chart)
  + Total Assessments over time (line chart)
  + Monthly Growth Rate (bar chart)
  + User Distribution by Role (pie chart)
  + Institution Distribution by Region (bar chart)
  + Subscription Plan Distribution (pie chart)
- All charts query real data from Supabase tables
- Provide date range filter to view analytics for specific time periods
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All charts scale properly on mobile
- No horizontal scroll at any viewport width

#### 3.5.19 Audit Logs
- Display list of all platform-wide audit logs with columns: Timestamp, User, Role, Institution, Action, Entity Type, Entity ID, Old Value, New Value
- Provide search and filter options by user, role, institution, action, entity type, date range
- Support pagination for large datasets
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.5.20 Platform Settings - Edge Function Deployment
- Display section for Edge Function Deployment
- Form fields: Supabase Personal Access Token (password input with show/hide toggle)
- Display \"Deploy manage-users Function\" button
- On click, system stores PAT as secret and calls Supabase Management API (https://api.supabase.com) to deploy manage-users edge function
- Display deployment status: In Progress, Success, Failed
- Display deployment logs
- Display success message: \"Edge function deployed successfully\"
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All form elements properly sized for mobile interaction

#### 3.5.21 Platform Settings - General
- Configure global platform settings
- Manage default configurations for new institutions
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.5.22 System Health Panel
- Display real-time system health indicators:
  + API Status (Online/Offline)
  + Database Status (Online/Offline)
  + Storage Status (Online/Offline)
  + Supabase Realtime Status (Connected/Disconnected)
  + AI Service Status (Online/Offline)
- Display system performance metrics:
  + Average Response Time
  + Error Rate
  + Active Users Count
- Display recent error logs with timestamp, error type, error message
- Provide \"Refresh\" button to update health status
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

#### 3.6.2 Student Management - Student List
- Display list of students with columns: Student ID, Full Name, Gender, Class, Guardian Name, Status, Account Link Status
- Account Link Status column displays icon: chain-link icon if profile_id is set (linked), broken-link icon if profile_id is null (not linked)
- Each row includes action buttons: View Details, Edit, Link/Unlink Account
- Provide search and filter options by class, status, account link status
- Display \"Register New Student\" button at top of page
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.6.3 Student Management - Student Details
- Display full student information: Student ID, Full Name, Gender, Date of Birth, Guardian Name, Guardian Phone, Address, Region, Class, Status, Account Link Status
- If profile_id is set, display linked auth account email and full name
- If profile_id is null, display \"No linked account\"
- Provide buttons: Edit Student, Link Account, Unlink Account (if linked), View Academic History, View Attendance History, View Assessment History, View Hifz History
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.6.4 Student Management - Link Account
- Display dialog with title \"Link Auth Account to Student\"
- Provide search input to search existing auth users by email or full name
- Display search results list with columns: Full Name, Email, Role, Institution
- User selects an auth user from search results
- Display confirmation: \"Link [Auth User Email] to [Student Name]?\"
- On confirm, system updates student record by setting profile_id to selected auth user's profile ID
- Display success message: \"Account linked successfully\"
- Fully responsive from 375px mobile to 1920px desktop

#### 3.6.5 Student Management - Create & Link Account
- Display dialog with title \"Create & Link New Auth Account\"
- Form fields: Email, Password, Confirm Password
- Password fields include show/hide toggle button
- System validates email format, password strength, and password match
- On submit, system:
  + Creates new auth user via Supabase Auth with role=student and institution=current institution
  + Creates profile record with is_profile_complete=false
  + Updates student record by setting profile_id to new auth user's profile ID
- Display success message: \"Account created and linked successfully\"
- Fully responsive from 375px mobile to 1920px desktop

#### 3.6.6 Student Management - Unlink Account
- Display confirmation dialog: \"Are you sure you want to unlink this account? The student will no longer be able to log in with this account.\"
- On confirm, system updates student record by setting profile_id to null
- Display success message: \"Account unlinked successfully\"
- Fully responsive from 375px mobile to 1920px desktop

#### 3.6.7 Student Management - Register New Student
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

#### 3.6.8 Teacher Management
- Create teacher profiles with name, contact information, subjects taught
- Assign teachers to classes
- View teacher attendance and performance reports
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.6.9 Class Management
- Create classes with name, academic level, assigned teacher, assigned students
- Support multiple sessions per class
- Support weekend classes
- Edit class assignments and schedules
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.6.10 Attendance Management
- View attendance reports for students and teachers
- Generate attendance analytics and trends
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.6.11 Assessment Management
- View all assessments created within the institution
- Monitor assessment completion rates and results
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.6.12 Financial Management
- Define fee structures for different classes or student groups
- View student ledger with payment records and outstanding balances
- Generate financial reports
- Primary currency: Ghana Cedi (GHS)
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.6.13 Reports
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

#### 3.7.3 Student Records - Student List
- Display list of students with columns: Student ID, Full Name, Gender, Class, Guardian Name, Status, Account Link Status
- Account Link Status column displays icon: chain-link icon if profile_id is set (linked), broken-link icon if profile_id is null (not linked)
- Each row includes action buttons: View Details, Edit, Link/Unlink Account
- Provide search and filter options by class, status, account link status
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.7.4 Student Records - Student Details
- Display full student information: Student ID, Full Name, Gender, Date of Birth, Guardian Name, Guardian Phone, Address, Region, Class, Status, Account Link Status
- If profile_id is set, display linked auth account email and full name
- If profile_id is null, display \"No linked account\"
- Provide buttons: Edit Student, Link Account, Unlink Account (if linked)
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.7.5 Student Records - Link Account
- Display dialog with title \"Link Auth Account to Student\"
- Provide search input to search existing auth users by email or full name
- Display search results list with columns: Full Name, Email, Role, Institution
- User selects an auth user from search results
- Display confirmation: \"Link [Auth User Email] to [Student Name]?\"
- On confirm, system updates student record by setting profile_id to selected auth user's profile ID
- Display success message: \"Account linked successfully\"
- Fully responsive from 375px mobile to 1920px desktop

#### 3.7.6 Student Records - Create & Link Account
- Display dialog with title \"Create & Link New Auth Account\"
- Form fields: Email, Password, Confirm Password
- Password fields include show/hide toggle button
- System validates email format, password strength, and password match
- On submit, system:
  + Creates new auth user via Supabase Auth with role=student and institution=current institution
  + Creates profile record with is_profile_complete=false
  + Updates student record by setting profile_id to new auth user's profile ID
- Display success message: \"Account created and linked successfully\"
- Fully responsive from 375px mobile to 1920px desktop

#### 3.7.7 Student Records - Unlink Account
- Display confirmation dialog: \"Are you sure you want to unlink this account? The student will no longer be able to log in with this account.\"
- On confirm, system updates student record by setting profile_id to null
- Display success message: \"Account unlinked successfully\"
- Fully responsive from 375px mobile to 1920px desktop

#### 3.7.8 Attendance Tracking
- Record daily attendance for students and teachers
- Mark attendance status: Present, Absent, Excused, Late
- Support offline attendance recording with background sync
- Fully responsive from 375px mobile to 1920px desktop
- Mobile sidebar uses Sheet overlay component with proper close-on-navigate behavior
- All tables wrapped in overflow-x-auto container
- All grids collapse properly on mobile
- No horizontal scroll at any viewport width

#### 3.7.9 Fee Management
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
- Provide navigation cards to Child Progress, Attendance Tracking, Assessment Results, Hifz Progress, Fee Payment History, Announcements
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

#### 3.9.3 Attendance Tracking
- Display child's attendance records with columns: Date, Day, Status (Present/Absent/Late/Excused)
- Display monthly summary chart showing attendance distribution
- Display total attendance percentage
- Provide date range filter to view attendance for specific time periods
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

#### 3.9.6 Fee Payment History
- Display child's fee records with columns: Amount (GHS), Due Date, Payment Date, Status (Paid/Pending/Overdue), Payment Method
- Display outstanding balance summary at top of page
- Provide \"Download Receipt\" button for each paid fee record
- Provide date range filter to view fee records for specific time periods
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
- If student's profile_id is not linked to any student record (no matching student record found by profile_id), display \"Link Student Record\" card:
  + Card title: \"Link Your Student Record\"
  + Card description: \"To access your academic data, please link your account to your student record.\"
  + Input field: \"Enter your Student ID\" (placeholder: e.g., MQI-2026-0001)
  + Button: \"Link Record\"
  + On submit, system searches students table for matching student_id and current institution
  + If found, system updates student record by setting profile_id to current user's profile ID
  + Display success message: \"Student record linked successfully. Please refresh the page.\"
  + If not found, display error message: \"Student ID not found. Please check your Student ID and try again.\"
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
- Parents can download receipts for paid fees

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

### 4.17 Super Admin Institution Management
- Super Admin can create new institutions with all required information
- Super Admin can edit existing institutions (except Institution Code)
- Super Admin can toggle institution status between Active and Inactive
- Super Admin can delete institutions (soft delete)
- Super Admin can view detailed institution information and statistics

### 4.18 Super Admin User Management
- Super Admin can view all platform users across all institutions
- Super Admin can create new users directly with email, password, role, and institution
- Super Admin can change user roles and institutions
- Super Admin can perform bulk operations: change role, activate, deactivate
- Super Admin can deactivate/activate individual users

### 4.19 Super Admin Subscription Management
- Super Admin can view all institution subscriptions
- Super Admin can set subscription plan for each institution: Trial, Active, Expired
- Super Admin can set subscription expiry date for each institution
- System restricts access to platform features when subscription expires

### 4.20 Super Admin Invite Link Management
- Super Admin can generate invite links for institutions with pre-set role
- Each invite link includes unique token, institution, role, expiry date, and optional max uses
- Super Admin can copy invite link to clipboard
- Super Admin can send invite link via email to one or more recipients
- Email contains invite link, role, institution name, and expiry date in branded HTML template
- Email is sent via send-invite-email edge function using email service (Resend API)
- Super Admin can view all invite links with status and usage statistics
- Super Admin can deactivate invite links
- Invite links expire automatically based on expiry date or max uses reached

### 4.21 Super Admin Platform Analytics
- Super Admin can view comprehensive platform analytics with charts and graphs
- Analytics include total institutions, users, students, assessments over time
- Analytics include monthly growth rates and distribution by role, region, subscription plan
- All analytics query real data from Supabase tables
- Super Admin can filter analytics by date range

### 4.22 Super Admin Audit Logs
- Super Admin can view all platform-wide audit logs
- Audit logs include timestamp, user, role, institution, action, entity type, entity ID, old value, new value
- Super Admin can filter audit logs by user, role, institution, action, entity type, date range
- Audit logs support pagination for large datasets

### 4.23 Super Admin System Health Monitoring
- Super Admin can view real-time system health indicators: API status, database status, storage status, Supabase Realtime status, AI service status
- Super Admin can view system performance metrics: average response time, error rate, active users count
- Super Admin can view recent error logs with timestamp, error type, error message
- Super Admin can refresh health status manually

### 4.24 Super Admin Edge Function Deployment
- Super Admin can deploy manage-users edge function via Supabase Personal Access Token
- PAT is stored as secret in platform settings
- Deployment is triggered via Supabase Management API (https://api.supabase.com)
- Deployment status is displayed: In Progress, Success, Failed
- Deployment logs are displayed for troubleshooting

### 4.25 Student-Account Linking (Admin/Secretary)
- Admin and Secretary can view student list with account link status indicator
- Account link status shows chain-link icon if profile_id is set, broken-link icon if profile_id is null
- Admin and Secretary can link existing auth account to student record by searching users by email or name
- Admin and Secretary can create new auth account and link it to student record in one step
- Admin and Secretary can unlink auth account from student record
- All linking operations update student record's profile_id field

### 4.26 Student Self-Linking
- If student's profile_id is not linked to any student record, student dashboard displays \"Link Student Record\" card
- Student enters their Student ID in the card
- System searches students table for matching student_id and current institution
- If found, system updates student record by setting profile_id to current user's profile ID
- If not found, system displays error message
- After successful linking, student can access all academic data

### 4.27 Parent Attendance Tracking
- Parent can view child's attendance records with daily status (Present/Absent/Late/Excused)
- Parent can view monthly summary chart showing attendance distribution
- Parent can view total attendance percentage
- Parent can filter attendance records by date range

### 4.28 Parent Fee Payment History
- Parent can view child's fee records with amount, due date, payment date, status, payment method
- Parent can view outstanding balance summary
- Parent can download receipt for each paid fee record
- Parent can filter fee records by date range

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
| Super Admin attempts to delete institution with active students | Display confirmation dialog with warning: This institution has active students. Are you sure you want to delete? |
| Super Admin attempts to create user with duplicate email | Display error message: Email already exists |
| Super Admin attempts to create institution with duplicate code | Display error message: Institution code already exists |
| Super Admin attempts to generate invite link with past expiry date | Display error message: Expiry date must be in the future |
| User attempts to use expired invite link | Display error message: This invite link has expired |
| User attempts to use deactivated invite link | Display error message: This invite link is no longer active |
| User attempts to use invite link that reached max uses | Display error message: This invite link has reached maximum uses |
| Admin/Secretary attempts to link auth account already linked to another student | Display error message: This account is already linked to another student |
| Admin/Secretary attempts to create account with email already in use | Display error message: Email already exists |
| Student attempts to link student record with invalid Student ID | Display error message: Student ID not found. Please check your Student ID and try again |
| Student attempts to link student record already linked to another account | Display error message: This student record is already linked to another account |
| Admin/Secretary attempts to unlink account from student with pending assessments | Display confirmation dialog with warning: This student has pending assessments. Unlinking will prevent access. Are you sure? |
| Super Admin enters invalid Supabase PAT for edge function deployment | Display error message: Invalid Personal Access Token |
| Edge function deployment fails due to API error | Display error message: Deployment failed. Check logs for details |
| Super Admin attempts to send invite email with invalid email addresses | Display error message: Invalid email address format |
| Email service fails to send invite email | Display error message: Failed to send email. Please try again later |
| Parent attempts to download receipt for unpaid fee | Display error message: Receipt not available for unpaid fees |
| Parent filters attendance records with invalid date range | Display error message: Invalid date range |

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
22. Super Admin logs in on desktop, navigates to Institution Management, clicks \"Create Institution\" button, fills in all required fields (name, code, contact email, phone, address, region, subscription plan, expiry date), submits form, system creates new institution record, success message displays, Super Admin is redirected to Institution List showing new institution with Active status
23. Super Admin navigates to Institution List on tablet device, selects an institution, clicks \"Edit\" button, updates contact email and subscription plan from Trial to Active, sets new expiry date, submits form, system updates institution record, success message displays, updated information is visible in Institution List
24. Super Admin navigates to Institution Details page on desktop, views full institution information and statistics (total students, teachers, classes, assessments), clicks \"Toggle Active/Inactive\" button, confirms action in dialog, system updates institution status to Inactive, success message displays, institution status indicator changes to Inactive
25. Super Admin navigates to User Management on desktop, views list of all platform users with columns (full name, email, role, institution, status, last login), uses search to find specific user by email, clicks \"Edit Role\" button, changes user role from Teacher to Admin, changes institution, submits form, system updates user profile, success message displays, updated role and institution are visible in User List
26. Super Admin navigates to User Management on mobile device, clicks \"Create User\" button, fills in all required fields (full name, email, password with visibility toggle, confirm password, role, institution), submits form, system creates new auth user and profile record, success message displays, new user appears in User List
27. Super Admin navigates to User List on tablet device, selects multiple users via checkboxes, clicks \"Bulk Actions\" button, selects \"Change Role\" action, selects new role (Secretary), confirms action in dialog, system updates all selected users' roles, success message displays with count of affected users, updated roles are visible in User List
28. Super Admin navigates to Subscription Management on desktop, views list of all institutions with subscription details, selects an institution, clicks \"Edit Subscription\" button, changes subscription plan from Active to Expired, sets new expiry date, submits form, system updates institution subscription, success message displays, updated subscription information is visible in Subscription List
29. Super Admin navigates to Invite Link Management on desktop, clicks \"Generate Invite Link\" button, selects institution and role (Teacher), sets expiry date (2026-12-31), sets max uses (10), submits form, system generates unique invite token and creates record, generated invite link displays with \"Copy to Clipboard\" button and \"Send via Email\" button, Super Admin clicks copy button, link is copied to clipboard, success message displays
30. Super Admin clicks \"Send via Email\" button on generated invite link, dialog opens with invite link displayed, Super Admin enters three recipient email addresses (one per line), submits form, system calls send-invite-email edge function, edge function sends branded HTML email to all three recipients containing invite link, role, institution name, and expiry date, success message displays: \"Invite email sent to 3 recipients\"
31. Super Admin navigates to Invite Link List on mobile device, views all invite links with columns (institution, role, token, expiry date, max uses, current uses, status), selects an active invite link, clicks \"Send Email\" button, enters recipient email address, submits form, email is sent successfully, success message displays
32. Super Admin navigates to Invite Link List on tablet device, selects an active invite link, clicks \"Deactivate\" button, confirms action in dialog, system updates invite link status to Deactivated, success message displays, status indicator changes to Deactivated
33. Super Admin navigates to Platform Analytics on desktop, views comprehensive analytics dashboard with charts (total institutions over time, total users over time, total students over time, monthly growth rate, user distribution by role, institution distribution by region, subscription plan distribution), all charts display real data queried from Supabase, Super Admin selects date range filter (2026-01-01 to 2026-06-16), charts update to show data for selected period
34. Super Admin navigates to Audit Logs on tablet device, views list of all platform-wide audit logs with columns (timestamp, user, role, institution, action, entity type, entity ID, old value, new value), uses filter to view only \"Create\" actions for \"Student\" entity type in date range (2026-06-01 to 2026-06-16), filtered results display, Super Admin navigates through paginated results
35. Super Admin navigates to System Health Panel on desktop, views real-time system health indicators (API status: Online, Database status: Online, Storage status: Online, Supabase Realtime status: Connected, AI service status: Online), views system performance metrics (average response time, error rate, active users count), views recent error logs, clicks \"Refresh\" button, health status updates
36. Super Admin navigates to Platform Settings on desktop, navigates to Edge Function Deployment section, enters Supabase Personal Access Token in password field with visibility toggle, clicks \"Deploy manage-users Function\" button, system stores PAT as secret and calls Supabase Management API (https://api.supabase.com), deployment status displays as \"In Progress\", deployment completes successfully, status changes to \"Success\", deployment logs display, success message displays: \"Edge function deployed successfully\"
37. Institution Admin logs in on desktop, navigates to Student Management, views student list with account link status indicators (chain-link icon for linked, broken-link icon for not linked), selects a student with broken-link icon, clicks \"Link Account\" button, dialog opens, Admin searches for existing auth user by email, selects user from search results, confirms linking action, system updates student record by setting profile_id, success message displays, student list updates to show chain-link icon for linked student
38. Secretary logs in on tablet device, navigates to Student Records, selects a student without linked account, clicks \"Create & Link Account\" button, dialog opens, Secretary enters email and password with visibility toggle, confirms password, submits form, system creates new auth user with role=student and institution=current institution, creates profile record, updates student record by setting profile_id, success message displays, student list updates to show chain-link icon
39. Institution Admin navigates to Student Details page on mobile device, views student information including linked auth account email, clicks \"Unlink Account\" button, confirmation dialog displays with warning message, Admin confirms action, system updates student record by setting profile_id to null, success message displays, student details page updates to show \"No linked account\"
40. Student logs in on mobile device for first time, student dashboard displays \"Link Student Record\" card with title, description, input field for Student ID, and \"Link Record\" button, Student enters their Student ID (e.g., MQI-2026-0001), clicks \"Link Record\" button, system searches students table for matching student_id and current institution, finds match, updates student record by setting profile_id to current user's profile ID, success message displays: \"Student record linked successfully. Please refresh the page.\", Student refreshes page, dashboard now displays full academic data with stats cards (attendance rate, assessment completion rate, Hifz progress, upcoming assessments)
41. Student logs in on desktop, student dashboard displays \"Link Student Record\" card, Student enters invalid Student ID, clicks \"Link Record\" button, system searches students table, no match found, error message displays: \"Student ID not found. Please check your Student ID and try again.\", Student corrects Student ID and tries again successfully
42. Parent logs in on mobile device, navigates to Attendance Tracking page from sidebar, views child's attendance records table with columns (Date, Day, Status), table wrapped in overflow-x-auto container, no horizontal scroll, views monthly summary chart showing attendance distribution (Present: 18 days, Absent: 2 days, Late: 1 day), views total attendance percentage (85.7%), selects date range filter (2026-06-01 to 2026-06-16), attendance records update to show filtered data
43. Parent navigates to Fee Payment History page on tablet device, views child's fee records table with columns (Amount GHS, Due Date, Payment Date, Status, Payment Method), views outstanding balance summary at top showing GHS 150.00, selects a paid fee record, clicks \"Download Receipt\" button, receipt PDF downloads successfully, Parent opens PDF and verifies fee details
44. Parent navigates to Fee Payment History page on desktop, views all fee records, selects date range filter (2026-01-01 to 2026-06-16), fee records update to show filtered data, Parent attempts to download receipt for unpaid fee, error message displays: \"Receipt not available for unpaid fees\"

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
- Advanced analytics with machine learning insights
- Automated institution onboarding workflow
- Self-service subscription management for institutions
- Multi-institution user accounts (single user accessing multiple institutions)
- Advanced invite link analytics (click tracking, conversion rates)
- Bulk student-account linking via CSV import
- Automated student-account linking based on email matching
- Student account transfer between institutions
- Archived student records management
- Advanced conflict resolution with version history comparison
- Email template customization for invite emails
- Scheduled email sending for invite links
- Email tracking and analytics for invite emails
- Automated edge function deployment via CI/CD pipeline
- Edge function version management and rollback
- Advanced parent portal features (homework tracking, behavior reports, teacher messaging)
- Parent-teacher conference scheduling
- Parent feedback and survey system