import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { RouteGuard } from '@/components/common/RouteGuard';
import { AppLayout } from '@/components/layouts/AppLayout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useAuth } from '@/contexts/AuthContext';
import { routes } from './routes';
import type { UserRole } from '@/types/types';

// Standalone (no layout) routes — public auth pages + error pages
const STANDALONE_PATHS = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/profile-completion',
  '/403',
];

const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center gap-3">
      <img src="https://miaoda-conversation-file.s3cdn.medo.dev/user-c9di7v8v0yyo/app-c9divjmf78xt/20260611/logo.png"
        alt="EduArabic" className="w-12 h-12 rounded object-contain animate-pulse" />
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  </div>
);

function RootRedirect() {
  const { user, profile, profileLoaded, loading } = useAuth();

  // Still resolving auth/profile — show spinner
  if (loading || !profileLoaded) return <LoadingScreen />;

  // Not logged in
  if (!user) return <Navigate to="/login" replace />;

  // Profile fetch failed or no profile row — send to login
  if (!profile) return <Navigate to="/login" replace />;

  // Profile incomplete — send to completion wizard
  if (!profile.is_profile_complete) return <Navigate to="/profile-completion" replace />;

  const roleHome: Record<UserRole, string> = {
    super_admin: '/super-admin', admin: '/admin', secretary: '/secretary',
    teacher: '/teacher', parent: '/parent', student: '/student',
  };
  return <Navigate to={roleHome[profile.role] ?? '/student'} replace />;
}

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <RouteGuard>
            <Routes>
              <Route path="/" element={<RootRedirect />} />

              {routes.filter(r => STANDALONE_PATHS.includes(r.path)).map((route, i) => (
                <Route key={i} path={route.path} element={route.element} />
              ))}

              <Route element={<AppLayout />}>
                {routes.filter(r => !STANDALONE_PATHS.includes(r.path)).map((route, i) => (
                  <Route
                    key={i}
                    path={route.path}
                    element={
                      <ErrorBoundary inline={false} context={route.path}>
                        {route.element}
                      </ErrorBoundary>
                    }
                  />
                ))}
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </RouteGuard>
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </Router>
    </ThemeProvider>
  );
};

export default App;

