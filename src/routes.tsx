import type { ReactNode } from 'react';

// Auth
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfileCompletionPage from './pages/ProfileCompletionPage';

// Error
import ForbiddenPage from './pages/ForbiddenPage';

// Super Admin
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard';
import InstitutionsPage from './pages/super-admin/InstitutionsPage';
import SubscriptionsPage from './pages/super-admin/SubscriptionsPage';
import PlatformAnalyticsPage from './pages/super-admin/PlatformAnalyticsPage';
import PlatformSettingsPage from './pages/super-admin/PlatformSettingsPage';
import HealthMonitoringPage from './pages/super-admin/HealthMonitoringPage';
import SuperAdminUsersPage from './pages/super-admin/UsersPage';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentsPage from './pages/admin/StudentsPage';
import TeachersPage from './pages/admin/TeachersPage';
import ClassesPage from './pages/admin/ClassesPage';
import AttendancePage from './pages/admin/AttendancePage';
import FinancesPage from './pages/admin/FinancesPage';
import CertificatesPage from './pages/admin/CertificatesPage';
import ReportsPage from './pages/admin/ReportsPage';
import AdminAssessmentsPage from './pages/admin/AdminAssessmentsPage';

// Secretary
import SecretaryDashboard from './pages/secretary/SecretaryDashboard';

// Teacher
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import LessonsPage from './pages/teacher/LessonsPage';
import AssessmentsPage from './pages/teacher/AssessmentsPage';
import QuestionBankPage from './pages/teacher/QuestionBankPage';
import HifzPage from './pages/teacher/HifzPage';
import AudioReviewsPage from './pages/teacher/AudioReviewsPage';

// Parent
import ParentDashboard from './pages/parent/ParentDashboard';
import ParentFeesPage from './pages/parent/ParentFeesPage';
import ParentProgressPage from './pages/parent/ParentProgressPage';
import ParentAttendancePage from './pages/parent/ParentAttendancePage';
import ParentAssessmentsPage from './pages/parent/ParentAssessmentsPage';
import ParentHifzPage from './pages/parent/ParentHifzPage';

// Student
import StudentDashboard from './pages/student/StudentDashboard';
import StudentCoursesPage from './pages/student/StudentCoursesPage';
import StudentAssessmentsPage from './pages/student/StudentAssessmentsPage';
import StudentHifzPage from './pages/student/StudentHifzPage';
import StudentAttendancePage from './pages/student/StudentAttendancePage';
import StudentCertificatesPage from './pages/student/StudentCertificatesPage';

// Shared
import AnnouncementsPage from './pages/shared/AnnouncementsPage';
import QuranViewerPage from './pages/shared/QuranViewerPage';
import UserProfilePage from './pages/shared/UserProfilePage';
import ChangePasswordPage from './pages/shared/ChangePasswordPage';
import InviteSignupPage from './pages/shared/InviteSignupPage';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  public?: boolean;
}

export const routes: RouteConfig[] = [
  // Auth — public (no auth required)
  { name: 'Login', path: '/login', element: <LoginPage />, public: true },
  { name: 'Forgot Password', path: '/forgot-password', element: <ForgotPasswordPage />, public: true },
  { name: 'Change Password', path: '/change-password', element: <ChangePasswordPage /> },
  { name: 'Invite Signup', path: '/invite', element: <InviteSignupPage />, public: true },
  { name: 'Reset Password', path: '/reset-password', element: <ResetPasswordPage />, public: true },

  // Error pages
  { name: '403 Forbidden', path: '/403', element: <ForbiddenPage />, public: true },

  // Profile setup (authenticated, no role restriction)
  { name: 'Profile Setup', path: '/profile-completion', element: <ProfileCompletionPage /> },

  // Profile Settings (all authenticated roles)
  { name: 'Profile Settings', path: '/profile', element: <UserProfilePage /> },

  // Super Admin
  { name: 'SA Dashboard', path: '/super-admin', element: <SuperAdminDashboard /> },
  { name: 'Institutions', path: '/super-admin/institutions', element: <InstitutionsPage /> },
  { name: 'Users', path: '/super-admin/users', element: <SuperAdminUsersPage /> },
  { name: 'Subscriptions', path: '/super-admin/subscriptions', element: <SubscriptionsPage /> },
  { name: 'Platform Analytics', path: '/super-admin/analytics', element: <PlatformAnalyticsPage /> },
  { name: 'Platform Settings', path: '/super-admin/settings', element: <PlatformSettingsPage /> },
  { name: 'Health Monitoring', path: '/super-admin/health', element: <HealthMonitoringPage /> },

  // Admin
  { name: 'Admin Dashboard', path: '/admin', element: <AdminDashboard /> },
  { name: 'Students', path: '/admin/students', element: <StudentsPage /> },
  { name: 'Teachers', path: '/admin/teachers', element: <TeachersPage /> },
  { name: 'Classes', path: '/admin/classes', element: <ClassesPage /> },
  { name: 'Attendance', path: '/admin/attendance', element: <AttendancePage /> },
  { name: 'Assessments', path: '/admin/assessments', element: <AdminAssessmentsPage /> },
  { name: 'Finances', path: '/admin/finances', element: <FinancesPage /> },
  { name: 'Certificates', path: '/admin/certificates', element: <CertificatesPage /> },
  { name: 'Announcements', path: '/admin/announcements', element: <AnnouncementsPage /> },
  { name: 'Reports', path: '/admin/reports', element: <ReportsPage /> },

  // Secretary
  { name: 'Secretary Dashboard', path: '/secretary', element: <SecretaryDashboard /> },
  { name: 'Register Student', path: '/secretary/register', element: <StudentsPage /> },
  { name: 'Student Records', path: '/secretary/students', element: <StudentsPage /> },
  { name: 'Secretary Attendance', path: '/secretary/attendance', element: <AttendancePage /> },
  { name: 'Secretary Fees', path: '/secretary/fees', element: <FinancesPage /> },

  // Teacher
  { name: 'Teacher Dashboard', path: '/teacher', element: <TeacherDashboard /> },
  { name: 'My Classes', path: '/teacher/classes', element: <ClassesPage /> },
  { name: 'Learning Center', path: '/teacher/lessons', element: <LessonsPage /> },
  { name: 'Assessments', path: '/teacher/assessments', element: <AssessmentsPage /> },
  { name: 'Question Bank', path: '/teacher/questions', element: <QuestionBankPage /> },
  { name: 'Hifz Tracker', path: '/teacher/hifz', element: <HifzPage /> },
  { name: 'Audio Reviews', path: '/teacher/audio-reviews', element: <AudioReviewsPage /> },
  { name: 'Teacher Attendance', path: '/teacher/attendance', element: <AttendancePage /> },
  { name: 'Teacher Announcements', path: '/teacher/announcements', element: <AnnouncementsPage /> },
  { name: 'Quran Viewer', path: '/teacher/quran', element: <QuranViewerPage /> },

  // Parent
  { name: 'Parent Dashboard', path: '/parent', element: <ParentDashboard /> },
  { name: "Child's Progress", path: '/parent/progress', element: <ParentProgressPage /> },
  { name: 'Attendance', path: '/parent/attendance', element: <ParentAttendancePage /> },
  { name: 'Assessments', path: '/parent/assessments', element: <ParentAssessmentsPage /> },
  { name: 'Hifz Progress', path: '/parent/hifz', element: <ParentHifzPage /> },
  { name: 'Fee Status', path: '/parent/fees', element: <ParentFeesPage /> },
  { name: 'Parent Announcements', path: '/parent/announcements', element: <AnnouncementsPage /> },

  // Student
  { name: 'Student Dashboard', path: '/student', element: <StudentDashboard /> },
  { name: 'My Courses', path: '/student/courses', element: <StudentCoursesPage /> },
  { name: 'Student Assessments', path: '/student/assessments', element: <StudentAssessmentsPage /> },
  { name: 'Hifz Tracker', path: '/student/hifz', element: <StudentHifzPage /> },
  { name: 'Student Attendance', path: '/student/attendance', element: <StudentAttendancePage /> },
  { name: 'Certificates', path: '/student/certificates', element: <StudentCertificatesPage /> },
  { name: 'Student Announcements', path: '/student/announcements', element: <AnnouncementsPage /> },
  { name: 'Quran Viewer', path: '/student/quran', element: <QuranViewerPage /> },
];
