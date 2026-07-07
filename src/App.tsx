import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SplashScreen } from '@/components/common/SplashScreen';
import { RouteGuard } from '@/components/common/RouteGuard';
import { AppLayout } from '@/components/layouts/AppLayout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useAuth } from '@/contexts/AuthContext';
import { routes } from './routes';
import LandingPage from './pages/LandingPage';
import type { UserRole } from '@/types/types';

// Standalone (no layout) routes — public auth pages + error pages
const STANDALONE_PATHS = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/profile-completion',
  '/admin/onboarding',
  '/403',
];

const LoadingScreen = () => <SplashScreen />;

/** Redirect authenticated users to their role home; unauthenticated → /login */
function AppRedirect() {
  const { user, profile, profileLoaded, loading } = useAuth();

  if (loading || !profileLoaded) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/login" replace />;
  if (!profile.is_profile_complete) return <Navigate to="/profile-completion" replace />;
  if (profile.role === 'admin' && !profile.organization_id) return <Navigate to="/admin/onboarding" replace />;

  const roleHome: Record<UserRole, string> = {
    super_admin: '/super-admin', admin: '/admin', secretary: '/secretary',
    teacher: '/teacher', parent: '/parent', student: '/student', guest: '/guest',
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
              {/* Public marketing landing page */}
              <Route path="/" element={<LandingPage />} />

              {/* Role-based redirect for logged-in users */}
              <Route path="/app" element={<AppRedirect />} />

              {/* Standalone auth/error pages (no sidebar layout) */}
              {routes.filter(r => STANDALONE_PATHS.includes(r.path)).map((route, i) => (
                <Route key={i} path={route.path} element={route.element} />
              ))}

              {/* App pages with sidebar layout */}
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

              {/* Catch-all → landing */}
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

