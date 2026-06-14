import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { NotificationBell } from '@/components/common/NotificationBell';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardList,
  Building2, Settings, LogOut, ChevronLeft, ChevronRight, Mic,
  BookMarked, Award, DollarSign, Bell, FileText, BarChart3,
  UserCheck, School, BookOpenCheck, Activity, BookText, Sun, Moon, UserCircle
} from 'lucide-react';
import type { UserRole } from '@/types/types';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case 'super_admin':
      return [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/super-admin' },
        { label: 'Users', icon: Users, path: '/super-admin/users' },
        { label: 'Institutions', icon: Building2, path: '/super-admin/institutions' },
        { label: 'Subscriptions', icon: DollarSign, path: '/super-admin/subscriptions' },
        { label: 'Analytics', icon: BarChart3, path: '/super-admin/analytics' },
        { label: 'Health Monitor', icon: Activity, path: '/super-admin/health' },
        { label: 'Platform Settings', icon: Settings, path: '/super-admin/settings' },
      ];
    case 'admin':
      return [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
        { label: 'Students', icon: GraduationCap, path: '/admin/students' },
        { label: 'Staff & Members', icon: Users, path: '/admin/teachers' },
        { label: 'Classes', icon: School, path: '/admin/classes' },
        { label: 'Attendance', icon: ClipboardList, path: '/admin/attendance' },
        { label: 'Assessments', icon: BookOpenCheck, path: '/admin/assessments' },
        { label: 'Finances', icon: DollarSign, path: '/admin/finances' },
        { label: 'Certificates', icon: Award, path: '/admin/certificates' },
        { label: 'Announcements', icon: Bell, path: '/admin/announcements' },
        { label: 'Reports', icon: BarChart3, path: '/admin/reports' },
      ];
    case 'secretary':
      return [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/secretary' },
        { label: 'Register Student', icon: Users, path: '/secretary/register' },
        { label: 'Student Records', icon: GraduationCap, path: '/secretary/students' },
        { label: 'Attendance', icon: ClipboardList, path: '/secretary/attendance' },
        { label: 'Fee Management', icon: DollarSign, path: '/secretary/fees' },
      ];
    case 'teacher':
      return [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/teacher' },
        { label: 'My Classes', icon: School, path: '/teacher/classes' },
        { label: 'Learning Center', icon: BookOpen, path: '/teacher/lessons' },
        { label: 'Assessments', icon: BookOpenCheck, path: '/teacher/assessments' },
        { label: 'Question Bank', icon: FileText, path: '/teacher/questions' },
        { label: 'Hifz Tracker', icon: BookMarked, path: '/teacher/hifz' },
        { label: 'Audio Reviews', icon: Mic, path: '/teacher/audio-reviews' },
        { label: 'Attendance', icon: ClipboardList, path: '/teacher/attendance' },
        { label: 'Quran', icon: BookText, path: '/teacher/quran' },
        { label: 'Announcements', icon: Bell, path: '/teacher/announcements' },
      ];
    case 'parent':
      return [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/parent' },
        { label: 'Progress', icon: BarChart3, path: '/parent/progress' },
        { label: 'Attendance', icon: ClipboardList, path: '/parent/attendance' },
        { label: 'Assessments', icon: BookOpenCheck, path: '/parent/assessments' },
        { label: 'Hifz Progress', icon: BookMarked, path: '/parent/hifz' },
        { label: 'Fee Status', icon: DollarSign, path: '/parent/fees' },
        { label: 'Announcements', icon: Bell, path: '/parent/announcements' },
      ];
    case 'student':
    default:
      return [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/student' },
        { label: 'My Courses', icon: BookOpen, path: '/student/courses' },
        { label: 'Assessments', icon: BookOpenCheck, path: '/student/assessments' },
        { label: 'Hifz Tracker', icon: BookMarked, path: '/student/hifz' },
        { label: 'Attendance', icon: ClipboardList, path: '/student/attendance' },
        { label: 'Certificates', icon: Award, path: '/student/certificates' },
        { label: 'Quran', icon: BookText, path: '/student/quran' },
        { label: 'Announcements', icon: Bell, path: '/student/announcements' },
      ];
  }
}

function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    super_admin: 'Super Admin', admin: 'Admin', secretary: 'Secretary',
    teacher: 'Teacher', parent: 'Parent', student: 'Student',
  };
  return labels[role] || role;
}

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarInner({
  collapsed,
  onToggle,
  onNavClick,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavClick?: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const role = (profile?.role || 'student') as UserRole;
  const navItems = getNavItems(role);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Logo + actions row */}
      <div className={cn('flex items-center h-16 px-3 border-b border-sidebar-border shrink-0', collapsed ? 'justify-center' : 'gap-2')}>
        <img
          src="https://miaoda-conversation-file.s3cdn.medo.dev/user-c9di7v8v0yyo/app-c9divjmf78xt/20260611/logo.png"
          alt="EduArabic" className="w-8 h-8 rounded object-contain bg-white p-0.5 shrink-0"
        />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sidebar-foreground font-bold text-base leading-tight truncate">EduArabic</p>
            <p className="text-sidebar-foreground/60 text-xs leading-tight truncate">Islamic Education</p>
          </div>
        )}

        {/* Actions: bell + theme + collapse (desktop only) */}
        <div className={cn('flex items-center', collapsed ? 'flex-col gap-1 mt-1' : 'gap-1 shrink-0')}>
          {!collapsed && (
            <>
              <NotificationBell className="h-7 w-7" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="h-7 w-7 border border-sidebar-border/60 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    {resolvedTheme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                </TooltipContent>
              </Tooltip>
            </>
          )}
          {/* Collapse toggle — desktop only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="hidden lg:flex shrink-0 border border-sidebar-border/60 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-7 w-7"
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 py-2 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
              <span className="text-sidebar-accent-foreground text-sm font-semibold">
                {profile?.full_name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sidebar-foreground text-sm font-medium truncate">{profile?.full_name || 'User'}</p>
              <p className="text-sidebar-foreground/60 text-xs truncate">{getRoleLabel(role)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          const linkEl = (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors min-h-[44px]',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
          if (collapsed) {
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          }
          return linkEl;
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-sidebar-border shrink-0 space-y-1">
        {/* Profile Settings */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/profile"
              onClick={onNavClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors min-h-[44px] w-full',
                collapsed ? 'justify-center' : '',
                location.pathname === '/profile'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <UserCircle className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">Profile Settings</span>}
            </Link>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Profile Settings</TooltipContent>}
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className={cn(
                'w-full min-h-[44px] border border-sidebar-border/60 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                collapsed ? 'px-2' : 'justify-start gap-3'
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </Button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Sign Out</TooltipContent>}
        </Tooltip>
      </div>
    </div>
  );
}

export function AppSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: AppSidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col shrink-0 border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}>
        <SidebarInner collapsed={collapsed} onToggle={onToggle} />
      </aside>

      {/* Mobile overlay — Sheet component for proper a11y + close-on-nav */}
      <Sheet open={mobileOpen} onOpenChange={(open) => { if (!open) onMobileClose(); }}>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border">
          <SidebarInner collapsed={false} onToggle={onMobileClose} onNavClick={onMobileClose} />
        </SheetContent>
      </Sheet>
    </>
  );
}