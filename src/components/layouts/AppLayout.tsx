import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Menu, Sun, Moon } from 'lucide-react';
import { OfflineSyncManager } from '@/components/common/OfflineSyncManager';
import { NotificationBell } from '@/components/common/NotificationBell';
import { useTheme } from '@/contexts/ThemeContext';

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 min-w-0 overflow-x-hidden flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center h-14 px-3 border-b border-border bg-card shrink-0 gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(true)}
                className="shrink-0"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Open menu</TooltipContent>
          </Tooltip>
          <img
            src="https://miaoda-conversation-file.s3cdn.medo.dev/user-c9di7v8v0yyo/app-c9divjmf78xt/20260611/logo.png"
            alt="EduArabic" className="w-7 h-7 rounded object-contain shrink-0"
          />
          <span className="flex-1 min-w-0 font-bold text-foreground truncate">EduArabic</span>

          {/* Right-side actions */}
          <div className="flex items-center gap-1 shrink-0">
            <NotificationBell className="border-border/60 text-foreground hover:bg-accent hover:text-accent-foreground" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-8 w-8 border border-border/60 text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  {resolvedTheme === 'dark'
                    ? <Sun className="h-4 w-4" />
                    : <Moon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
              </TooltipContent>
            </Tooltip>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      {/* Offline sync manager */}
      <OfflineSyncManager />
    </div>
  );
}
