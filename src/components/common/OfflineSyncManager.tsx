/**
 * OfflineSyncManager
 *
 * A self-contained offline queue that:
 *  - Stores pending actions in localStorage (no Dexie dependency)
 *  - Detects online/offline transitions via the browser Network API
 *  - Auto-syncs on reconnect
 *  - Shows a dismissible banner when offline with a pending-action count
 *  - Shows a conflict-resolution dialog when a sync conflict is detected
 *  - Lets the user resolve each conflict: Keep Local / Keep Server
 *
 * Usage: mount once near the root, e.g. in App.tsx or MainLayout.
 *   <OfflineSyncManager />
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { WifiOff, RefreshCw, AlertTriangle, CheckCircle, Trash2, Loader2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionType = 'attendance' | 'assessment_answer' | 'audio_submission' | 'hifz_update';

interface QueuedAction {
  id: string;
  type: ActionType;
  table: string;
  payload: Record<string, unknown>;
  enqueuedAt: string;
  retries: number;
}

interface SyncConflict {
  action: QueuedAction;
  serverValue: Record<string, unknown>;
}

const STORAGE_KEY = 'edu_offline_queue';
const MAX_RETRIES = 3;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadQueue(): QueuedAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedAction[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(q: QueuedAction[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(q)); } catch { /* quota */ }
}

function removeFromQueue(id: string) {
  const q = loadQueue().filter(a => a.id !== id);
  saveQueue(q);
}

function incrementRetry(id: string) {
  const q = loadQueue().map(a => a.id === id ? { ...a, retries: a.retries + 1 } : a);
  saveQueue(q);
}

// Public API: enqueue an action from anywhere in the app
export function enqueueOfflineAction(
  type: ActionType,
  table: string,
  payload: Record<string, unknown>,
) {
  const action: QueuedAction = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type, table, payload,
    enqueuedAt: new Date().toISOString(),
    retries: 0,
  };
  const q = loadQueue();
  q.push(action);
  saveQueue(q);
  return action.id;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OfflineSyncManager() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [queue, setQueue] = useState<QueuedAction[]>(loadQueue);
  const [syncing, setSyncing] = useState(false);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [currentConflict, setCurrentConflict] = useState<SyncConflict | null>(null);
  const syncLockRef = useRef(false);

  // Refresh queue state from localStorage
  const refreshQueue = useCallback(() => setQueue(loadQueue()), []);

  // Listen for storage changes (queue updated from other tabs / code)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) refreshQueue(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refreshQueue]);

  // Online / offline listeners
  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      toast.info('Back online — syncing offline data…');
      syncQueue();
    };
    const goOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline. Actions will be saved and synced when reconnected.');
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Auto-sync on mount if online and queue non-empty
  useEffect(() => {
    if (isOnline && queue.length > 0) syncQueue();
  }, []); // run once on mount

  const syncQueue = useCallback(async () => {
    if (syncLockRef.current) return;
    syncLockRef.current = true;
    setSyncing(true);

    const currentQueue = loadQueue();
    if (currentQueue.length === 0) { setSyncing(false); syncLockRef.current = false; return; }

    const newConflicts: SyncConflict[] = [];
    let successCount = 0;

    for (const action of currentQueue) {
      if (action.retries >= MAX_RETRIES) {
        // Give up — remove from queue, log
        removeFromQueue(action.id);
        console.warn('[OfflineSync] Dropped after max retries:', action);
        continue;
      }

      try {
        // Check for conflict: does a newer version already exist on server?
        const pkField = 'id';
        const pkValue = action.payload[pkField];
        if (pkValue) {
          const { data: existing } = await (supabase
            .from(action.table)
            .select('*')
            .eq(pkField, pkValue) as any)
            .maybeSingle();

          if (existing && existing.updated_at && action.payload.updated_at) {
            const serverTime = new Date(existing.updated_at as string).getTime();
            const localTime = new Date(action.payload.updated_at as string).getTime();
            if (serverTime > localTime) {
              // Conflict detected
              newConflicts.push({ action, serverValue: existing });
              continue;
            }
          }
        }

        // Upsert
        const { error } = await (supabase.from(action.table).upsert(action.payload) as any);
        if (error) {
          incrementRetry(action.id);
          console.warn('[OfflineSync] Upsert failed:', error.message);
        } else {
          removeFromQueue(action.id);
          successCount++;
        }
      } catch (err) {
        incrementRetry(action.id);
        console.warn('[OfflineSync] Network error:', err);
      }
    }

    refreshQueue();
    setSyncing(false);
    syncLockRef.current = false;

    if (successCount > 0) toast.success(`Synced ${successCount} offline action${successCount !== 1 ? 's' : ''}`);

    if (newConflicts.length > 0) {
      setConflicts(newConflicts);
      setCurrentConflict(newConflicts[0]);
      setShowConflictDialog(true);
    }
  }, [refreshQueue]);

  // Conflict resolution
  const resolveConflict = async (choice: 'local' | 'server') => {
    if (!currentConflict) return;
    const { action } = currentConflict;

    if (choice === 'local') {
      // Force-push local value
      await (supabase.from(action.table).upsert({ ...action.payload, _conflict_resolved: true }) as any);
      toast.success('Kept local version and pushed to server.');
    } else {
      // Discard local — server wins
      toast.info('Kept server version. Local change discarded.');
    }

    removeFromQueue(action.id);
    const remaining = conflicts.filter(c => c.action.id !== action.id);
    setConflicts(remaining);
    if (remaining.length > 0) {
      setCurrentConflict(remaining[0]);
    } else {
      setCurrentConflict(null);
      setShowConflictDialog(false);
    }
    refreshQueue();
  };

  const discardAll = () => {
    saveQueue([]);
    refreshQueue();
    toast.info('Offline queue cleared.');
  };

  // Don't render anything if online and no pending items (invisible component)
  if (isOnline && queue.length === 0 && !syncing) return null;

  const typeLabel: Record<ActionType, string> = {
    attendance: 'Attendance',
    assessment_answer: 'Assessment Answer',
    audio_submission: 'Audio Submission',
    hifz_update: 'Hifz Update',
  };

  return (
    <>
      {/* Offline / pending banner */}
      {(!isOnline || queue.length > 0) && (
        <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 rounded-xl border shadow-lg p-4
          ${!isOnline ? 'bg-warning/10 border-warning/30' : 'bg-info/10 border-info/30'}`}
        >
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 shrink-0 rounded-full p-1 ${!isOnline ? 'bg-warning/10' : 'bg-info/10'}`}>
              {syncing
                ? <Loader2 className="h-4 w-4 text-info animate-spin" />
                : !isOnline
                  ? <WifiOff className="h-4 w-4 text-warning" />
                  : <RefreshCw className="h-4 w-4 text-info" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${!isOnline ? 'text-warning' : 'text-info'}`}>
                {!isOnline ? 'Offline Mode' : syncing ? 'Syncing…' : 'Pending Sync'}
              </p>
              <p className={`text-xs mt-0.5 ${!isOnline ? 'text-warning' : 'text-info'}`}>
                {queue.length > 0
                  ? `${queue.length} action${queue.length !== 1 ? 's' : ''} queued${!isOnline ? ' — will sync when back online' : ''}`
                  : 'You are offline. Changes will be saved locally.'}
              </p>
              {queue.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(
                    queue.reduce<Record<string, number>>((acc, a) => {
                      acc[a.type] = (acc[a.type] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([type, count]) => (
                    <Badge key={type} variant="outline" className="text-xs bg-white/60">
                      {typeLabel[type as ActionType] || type} ×{count}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              {isOnline && queue.length > 0 && !syncing && (
                <Button size="sm" variant="outline" className="h-7 text-xs px-2 gap-1" onClick={syncQueue}>
                  <RefreshCw className="h-3 w-3" />Sync
                </Button>
              )}
              {queue.length > 0 && (
                <Button size="sm" variant="ghost" className="h-7 text-xs px-2 gap-1 text-muted-foreground" onClick={discardAll}>
                  <Trash2 className="h-3 w-3" />Discard
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conflict resolution dialog */}
      <Dialog open={showConflictDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg" onInteractOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-balance">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
              Sync Conflict Detected
            </DialogTitle>
          </DialogHeader>
          {currentConflict && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground text-pretty">
                The server has a newer version of this record than your offline copy.
                Choose which version to keep:
              </p>
              <div className="text-xs text-muted-foreground font-mono bg-muted rounded p-2">
                Table: <span className="font-semibold text-foreground">{currentConflict.action.table}</span>
                &nbsp;·&nbsp;Action: <span className="font-semibold text-foreground capitalize">{typeLabel[currentConflict.action.type] || currentConflict.action.type}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-info/30 bg-info/10 p-3">
                  <p className="text-xs font-semibold text-info mb-2 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />Your Local Version
                  </p>
                  <p className="text-xs text-info font-mono break-all">
                    {Object.entries(currentConflict.action.payload)
                      .filter(([k]) => !['organization_id', 'created_by', '_conflict_resolved'].includes(k))
                      .slice(0, 4)
                      .map(([k, v]) => `${k}: ${String(v)}`)
                      .join('\n')}
                  </p>
                  <p className="text-xs text-info mt-1">
                    Saved: {new Date(currentConflict.action.enqueuedAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="rounded-lg border border-success/30 bg-success/10 p-3">
                  <p className="text-xs font-semibold text-success mb-2 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />Server Version
                  </p>
                  <p className="text-xs text-success font-mono break-all">
                    {Object.entries(currentConflict.serverValue)
                      .filter(([k]) => !['organization_id', 'created_by'].includes(k))
                      .slice(0, 4)
                      .map(([k, v]) => `${k}: ${String(v)}`)
                      .join('\n')}
                  </p>
                  <p className="text-xs text-success mt-1">
                    Updated: {currentConflict.serverValue.updated_at
                      ? new Date(currentConflict.serverValue.updated_at as string).toLocaleTimeString()
                      : 'Unknown'}
                  </p>
                </div>
              </div>
              {conflicts.length > 1 && (
                <p className="text-xs text-muted-foreground text-center">
                  Conflict {conflicts.indexOf(currentConflict) + 1} of {conflicts.length}
                </p>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => resolveConflict('server')}>
              Keep Server Version
            </Button>
            <Button onClick={() => resolveConflict('local')}>
              Keep My Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default OfflineSyncManager;
