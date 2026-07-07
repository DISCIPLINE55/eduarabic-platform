import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  CheckCircle2, XCircle, Clock, Search, Users, Filter,
  GraduationCap, User, Calendar, MessageSquare, RefreshCw, Mail
} from 'lucide-react';

interface EnrollmentRequest {
  id: string;
  guest_user_id: string;
  institution_id: string;
  requested_role: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
}

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  icon: Clock,       color: 'bg-warning/10 text-warning border-warning/20' },
  approved: { label: 'Approved', icon: CheckCircle2, color: 'bg-success/10 text-success border-success/20' },
  rejected: { label: 'Rejected', icon: XCircle,     color: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const ROLE_LABELS: Record<string, string> = {
  student: 'Student', parent: 'Parent / Guardian',
  teacher: 'Teacher', secretary: 'Secretary',
};

export default function EnrollmentRequestsPage() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; req: EnrollmentRequest | null; action: 'approved' | 'rejected' }>({
    open: false, req: null, action: 'approved',
  });

  const loadRequests = async () => {
    if (!profile?.organization_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('enrollment_requests')
      .select('id, guest_user_id, institution_id, requested_role, message, status, reviewed_by, reviewed_at, created_at, profiles(full_name, email)')
      .eq('institution_id', profile.organization_id)
      .order('created_at', { ascending: false });

    if (error) { toast.error('Failed to load requests: ' + error.message); }
    else { setRequests((data as unknown as EnrollmentRequest[]) || []); }
    setLoading(false);
  };

  useEffect(() => { loadRequests(); }, [profile?.organization_id]);

  const handleAction = async (req: EnrollmentRequest, newStatus: 'approved' | 'rejected') => {
    setProcessingId(req.id);
    const { error } = await supabase
      .from('enrollment_requests')
      .update({
        status: newStatus,
        reviewed_by: profile?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', req.id);

    setProcessingId(null);
    setConfirmDialog({ open: false, req: null, action: 'approved' });

    if (error) {
      toast.error('Failed to update request: ' + error.message);
    } else {
      toast.success(
        newStatus === 'approved'
          ? `✅ ${req.profiles?.full_name || req.profiles?.email || 'User'} approved as ${ROLE_LABELS[req.requested_role] || req.requested_role}`
          : `❌ Request from ${req.profiles?.full_name || req.profiles?.email || 'User'} rejected`
      );
      loadRequests();
    }
  };

  const filtered = requests.filter(r => {
    const q = search.toLowerCase();
    const nameMatch = (r.profiles?.full_name || '').toLowerCase().includes(q);
    const emailMatch = (r.profiles?.email || '').toLowerCase().includes(q);
    const roleMatch = roleFilter === 'all' || r.requested_role === roleFilter;
    const statusMatch = statusFilter === 'all' || r.status === statusFilter;
    return (nameMatch || emailMatch || !q) && roleMatch && statusMatch;
  });

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Enrollment Requests"
        description="Review and approve guest users requesting to join your institution."
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(s => {
          const cfg = s === 'all'
            ? { label: 'Total', color: 'text-foreground', bg: 'bg-muted/60', icon: Users }
            : { ...STATUS_CONFIG[s], bg: STATUS_CONFIG[s].color };
          const Icon = cfg.icon;
          return (
            <Card
              key={s}
              className={`cursor-pointer transition-all ${statusFilter === s ? 'ring-2 ring-primary' : 'hover:border-primary/40'}`}
              onClick={() => setStatusFilter(s)}
            >
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${s === 'all' ? 'bg-muted' : cfg.bg}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl font-bold">{counts[s]}</p>
                  <p className="text-xs text-muted-foreground capitalize">{s === 'all' ? 'Total' : cfg.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input className="pl-9 px-9" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-44 px-3">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {Object.entries(ROLE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={loadRequests} className="shrink-0" title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Request list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-14 flex flex-col items-center gap-3 text-center">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No enrollment requests found</p>
            <p className="text-sm text-muted-foreground">
              {statusFilter !== 'all' ? `No ${statusFilter} requests.` : 'Guests who request to join your institution will appear here.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            const isPending = req.status === 'pending';
            const isProcessing = processingId === req.id;

            return (
              <Card key={req.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Avatar + info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm truncate">
                            {req.profiles?.full_name || 'Unknown User'}
                          </span>
                          <Badge variant="outline" className={`text-[10px] flex items-center gap-1 ${cfg.color}`}>
                            <StatusIcon className="h-3 w-3" /> {cfg.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {req.profiles?.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {req.profiles.email}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" /> {ROLE_LABELS[req.requested_role] || req.requested_role}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {req.message && (
                          <div className="flex items-start gap-1.5 mt-2 p-2.5 rounded-md bg-muted/50 border border-border">
                            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground italic text-pretty">{req.message}</p>
                          </div>
                        )}
                        {req.status !== 'pending' && req.reviewed_at && (
                          <p className="text-[10px] text-muted-foreground">
                            Reviewed on {new Date(req.reviewed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {isPending && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                          disabled={isProcessing}
                          onClick={() => setConfirmDialog({ open: true, req, action: 'rejected' })}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1.5"
                          disabled={isProcessing}
                          onClick={() => setConfirmDialog({ open: true, req, action: 'approved' })}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirm dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={open => !open && setConfirmDialog(d => ({ ...d, open: false }))}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.action === 'approved' ? '✅ Approve Enrollment' : '❌ Reject Enrollment'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === 'approved'
                ? `This will grant ${confirmDialog.req?.profiles?.full_name || 'this user'} the role of ${ROLE_LABELS[confirmDialog.req?.requested_role || ''] || confirmDialog.req?.requested_role} and give them full access to the platform.`
                : `This will reject the enrollment request from ${confirmDialog.req?.profiles?.full_name || 'this user'}. They will remain as a guest.`
              }
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <DialogFooter className="gap-2 flex-col-reverse md:flex-row">
            <Button variant="outline" onClick={() => setConfirmDialog(d => ({ ...d, open: false }))}>Cancel</Button>
            <Button
              variant={confirmDialog.action === 'approved' ? 'default' : 'destructive'}
              disabled={!!processingId}
              onClick={() => confirmDialog.req && handleAction(confirmDialog.req, confirmDialog.action)}
            >
              {confirmDialog.action === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
