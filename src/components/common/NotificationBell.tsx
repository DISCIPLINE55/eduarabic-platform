import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnnRow {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export function NotificationBell({ className }: { className?: string }) {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [announcements, setAnnouncements] = useState<AnnRow[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('edu_read_ann') ?? '[]')); }
    catch { return new Set(); }
  });
  const [open, setOpen] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const unread = announcements.filter(a => !readIds.has(a.id)).length;

  const fetchAnnouncements = async () => {
    if (!orgId) return;
    const { data } = await supabase
      .from('announcements')
      .select('id, title, content, created_at')
      .eq('organization_id', orgId)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(20);
    setAnnouncements(data ?? []);
  };

  useEffect(() => {
    if (!orgId) return;
    fetchAnnouncements();

    // Realtime subscription
    const channel = supabase
      .channel(`notifications-${orgId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'announcements',
        filter: `organization_id=eq.${orgId}`,
      }, () => { fetchAnnouncements(); })
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [orgId]);

  const markAllRead = () => {
    const allIds = new Set(announcements.map(a => a.id));
    setReadIds(allIds);
    localStorage.setItem('edu_read_ann', JSON.stringify([...allIds]));
  };

  const markRead = (id: string) => {
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    localStorage.setItem('edu_read_ann', JSON.stringify([...next]));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative border border-sidebar-border/60 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-8 w-8', className)}
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No announcements yet</p>
          ) : (
            announcements.map(ann => {
              const isUnread = !readIds.has(ann.id);
              return (
                <button
                  key={ann.id}
                  onClick={() => markRead(ann.id)}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors',
                    isUnread && 'bg-primary/5'
                  )}
                >
                  <div className="flex items-start gap-2">
                    {isUnread && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                    <div className={cn('min-w-0', !isUnread && 'pl-4')}>
                      <p className={cn('text-sm text-balance', isUnread ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                        {ann.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(ann.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
