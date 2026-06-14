import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { routes } from '@/routes';
import type { UserRole } from '@/types/types';

interface RouteGuardProps {
  children: React.ReactNode;
}

// System-level public routes (no need to register in routes.tsx)
const SYSTEM_PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password', '/change-password', '/403', '/404'];

// Derived from routes.tsx: all routes marked with public: true
const routePublicPaths = routes.filter(r => r.public).map(r => r.path);

const PUBLIC_ROUTES = [...SYSTEM_PUBLIC_ROUTES, ...routePublicPaths];

// Path prefixes each role is allowed to access
const ROLE_PREFIXES: Record<UserRole, string[]> = {
  super_admin: ['/super-admin'],
  admin: ['/admin'],
  secretary: ['/secretary'],
  teacher: ['/teacher'],
  parent: ['/parent'],
  student: ['/student'],
};

// Shared paths accessible by any authenticated user
const SHARED_PATHS = ['/profile-completion', '/profile'];

function matchPublicRoute(path: string, patterns: string[]) {
  return patterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(path);
    }
    return path === pattern;
  });
}

function isAllowedForRole(pathname: string, role: UserRole): boolean {
  if (SHARED_PATHS.some(p => pathname.startsWith(p))) return true;
  const allowed = ROLE_PREFIXES[role] ?? [];
  return allowed.some(prefix => pathname === prefix || pathname.startsWith(prefix + '/'));
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, profile, profileLoaded, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wait until both auth state and profile fetch are complete
    if (loading || !profileLoaded) return;

    const isPublic = matchPublicRoute(location.pathname, PUBLIC_ROUTES);

    if (!user && !isPublic) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
      return;
    }

    if (user && profile) {
      // Force password change if flagged
      if (profile.must_change_password && location.pathname !== '/change-password') {
        navigate('/change-password', { replace: true });
        return;
      }
      // Redirect away if accessing a path outside their role's allowed prefixes
      if (!isPublic && !isAllowedForRole(location.pathname, profile.role as UserRole)) {
        navigate('/403', { replace: true });
      }
    }

    // user exists but profile is null (fetch failed / no profile row) — force re-login
    if (user && !profile && !isPublic) {
      navigate('/login', { replace: true });
    }
  }, [user, profile, profileLoaded, loading, location.pathname, navigate]);

  // Show spinner only while initial auth/profile load is in progress
  if (loading || !profileLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <img
            src="https://miaoda-conversation-file.s3cdn.medo.dev/user-c9di7v8v0yyo/app-c9divjmf78xt/20260611/logo.png"
            alt="EduArabic"
            className="w-12 h-12 rounded object-contain animate-pulse"
          />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}