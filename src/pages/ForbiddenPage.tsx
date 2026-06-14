import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ShieldOff, Home } from 'lucide-react';
import type { UserRole } from '@/types/types';

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Institution Admin',
  secretary: 'Secretary',
  teacher: 'Teacher',
  parent: 'Parent',
  student: 'Student',
};

const ROLE_HOME: Record<UserRole, string> = {
  super_admin: '/super-admin',
  admin: '/admin',
  secretary: '/secretary',
  teacher: '/teacher',
  parent: '/parent',
  student: '/student',
};

export default function ForbiddenPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const role = profile?.role as UserRole | undefined;
  const roleLabel = role ? ROLE_LABELS[role] : 'Unknown';
  const homeUrl = role ? ROLE_HOME[role] : '/login';

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldOff className="h-12 w-12 text-destructive" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
            Error 403 — Access Denied
          </div>
          <h1 className="text-2xl font-bold text-foreground text-balance mt-2">
            You don't have permission to view this page
          </h1>
          <p className="text-muted-foreground text-sm text-pretty leading-relaxed">
            This page is not available for your role.
            {role && (
              <>
                {' '}You are signed in as{' '}
                <span className="font-semibold text-foreground">{roleLabel}</span>.
              </>
            )}
            {' '}Please contact your administrator if you believe this is a mistake.
          </p>
        </div>

        {/* Role badge */}
        {role && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-sm">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Signed in as:</span>
              <span className="font-semibold text-foreground">{roleLabel}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button onClick={() => navigate(homeUrl, { replace: true })} className="gap-2">
            <Home className="h-4 w-4" />
            Go to My Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
