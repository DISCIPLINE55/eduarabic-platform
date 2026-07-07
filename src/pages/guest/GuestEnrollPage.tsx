import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Building2, Loader2, Search, CheckCircle2, Clock, XCircle,
  PlusCircle, LogIn, ArrowRight, User
} from 'lucide-react';

interface Institution {
  id: string;
  name: string;
  type: string | null;
  country: string | null;
  city: string | null;
}

interface EnrollmentRequest {
  id: string;
  institution_id: string;
  requested_role: string;
  status: string;
  message: string | null;
  created_at: string;
  institutions: { name: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending:  { label: 'Pending Review',  icon: Clock,       color: 'bg-warning/10 text-warning border-warning/20' },
  approved: { label: 'Approved',        icon: CheckCircle2, color: 'bg-success/10 text-success border-success/20' },
  rejected: { label: 'Rejected',        icon: XCircle,     color: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const ROLE_OPTIONS = [
  { value: 'student', label: 'Student', description: 'Enroll as a learner at this institution' },
  { value: 'parent', label: 'Parent / Guardian', description: 'Monitor your child\'s progress' },
  { value: 'teacher', label: 'Teacher / Instructor', description: 'Teach classes and track student progress' },
];

export default function GuestEnrollPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [instSearch, setInstSearch] = useState('');
  const [instLoading, setInstLoading] = useState(true);

  const [selectedInst, setSelectedInst] = useState<Institution | null>(null);
  const [selectedRole, setSelectedRole] = useState('student');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [myRequests, setMyRequests] = useState<EnrollmentRequest[]>([]);
  const [reqLoading, setReqLoading] = useState(false);

  // Pre-fill from query params (coming from Explore page)
  useEffect(() => {
    const preId = searchParams.get('institution_id');
    const preName = searchParams.get('institution_name');
    if (preId && preName) {
      setSelectedInst({ id: preId, name: preName, type: null, country: null, city: null });
    }
  }, [searchParams]);

  // Load institutions
  useEffect(() => {
    supabase.from('institutions')
      .select('id, name, type, country, city')
      .order('name')
      .then(({ data }) => { setInstitutions(data || []); setInstLoading(false); });
  }, []);

  // Load my existing requests (if authenticated)
  useEffect(() => {
    if (!user) return;
    setReqLoading(true);
    supabase.from('enrollment_requests')
      .select('id, institution_id, requested_role, status, message, created_at, institutions(name)')
      .eq('guest_user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setMyRequests((data as unknown as EnrollmentRequest[]) || []); setReqLoading(false); });
  }, [user, submitted]);

  const filteredInstitutions = instSearch.trim()
    ? institutions.filter(i =>
        i.name.toLowerCase().includes(instSearch.toLowerCase()) ||
        (i.city || '').toLowerCase().includes(instSearch.toLowerCase()) ||
        (i.country || '').toLowerCase().includes(instSearch.toLowerCase())
      )
    : institutions.slice(0, 8);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      toast.error('Please sign in to submit an enrollment request.');
      navigate('/login');
      return;
    }
    if (!selectedInst) { toast.error('Please select an institution.'); return; }

    // Check for duplicate pending request
    const dup = myRequests.find(r => r.institution_id === selectedInst.id && r.status === 'pending');
    if (dup) { toast.error('You already have a pending request for this institution.'); return; }

    setSubmitting(true);
    const { error } = await supabase.from('enrollment_requests').insert({
      guest_user_id: user.id,
      institution_id: selectedInst.id,
      requested_role: selectedRole,
      message: message.trim() || null,
    });
    setSubmitting(false);

    if (error) {
      toast.error('Failed to submit request: ' + error.message);
    } else {
      toast.success('Enrollment request sent! The institution admin will review it soon.');
      setSubmitted(true);
      setMessage('');
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Enroll in an Institution"
        description="Submit a request to join a Madrasa or Islamic school on DisciNet."
      />

      {!user && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="py-4 flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Sign in required to submit a request</p>
              <p className="text-xs text-muted-foreground mt-0.5 text-pretty">
                Create a free account or sign in to send an enrollment request to an institution.
              </p>
            </div>
            <Button size="sm" className="shrink-0 gap-2" onClick={() => navigate('/login')}>
              <LogIn className="h-4 w-4" /> Sign In / Register
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Enrollment form */}
        <div className="lg:col-span-3 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-primary" /> New Enrollment Request
              </CardTitle>
              <CardDescription>Choose an institution and the role you'd like to join as.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Institution picker */}
                <div className="space-y-2">
                  <Label>Institution <span className="text-destructive">*</span></Label>
                  {selectedInst ? (
                    <div className="flex items-center gap-3 p-3 rounded-md border border-primary/30 bg-primary/5">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{selectedInst.name}</p>
                        {(selectedInst.city || selectedInst.country) && (
                          <p className="text-xs text-muted-foreground">{[selectedInst.city, selectedInst.country].filter(Boolean).join(', ')}</p>
                        )}
                      </div>
                      <Button type="button" variant="ghost" size="sm" className="text-xs shrink-0" onClick={() => setSelectedInst(null)}>
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          className="pl-9 px-9"
                          placeholder="Search institutions…"
                          value={instSearch}
                          onChange={e => setInstSearch(e.target.value)}
                        />
                      </div>
                      <div className="border border-border rounded-md divide-y divide-border max-h-52 overflow-y-auto">
                        {instLoading ? (
                          Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="px-3 py-2.5">
                              <Skeleton className="h-4 w-2/3 mb-1" />
                              <Skeleton className="h-3 w-1/3" />
                            </div>
                          ))
                        ) : filteredInstitutions.length === 0 ? (
                          <div className="px-3 py-4 text-sm text-muted-foreground text-center">No institutions found.</div>
                        ) : filteredInstitutions.map(inst => (
                          <button
                            key={inst.id}
                            type="button"
                            className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors flex items-center gap-2.5"
                            onClick={() => { setSelectedInst(inst); setInstSearch(''); }}
                          >
                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{inst.name}</p>
                              {(inst.city || inst.country) && (
                                <p className="text-xs text-muted-foreground truncate">{[inst.city, inst.country].filter(Boolean).join(', ')}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                      {!instSearch && institutions.length > 8 && (
                        <p className="text-xs text-muted-foreground text-center">Type to search all {institutions.length} institutions.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label>Requested Role <span className="text-destructive">*</span></Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="px-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map(r => (
                        <SelectItem key={r.value} value={r.value}>
                          <div>
                            <span className="font-medium">{r.label}</span>
                            <span className="text-muted-foreground text-xs block">{r.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Optional message */}
                <div className="space-y-2">
                  <Label>Message to Admin <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                  <Textarea
                    placeholder="Briefly introduce yourself or explain why you'd like to join…"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="resize-none px-3"
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full gap-2" disabled={submitting || !user || !selectedInst}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                  Submit Enrollment Request
                </Button>

                {!user && (
                  <p className="text-xs text-muted-foreground text-center">
                    You need to{' '}
                    <button type="button" className="text-primary underline" onClick={() => navigate('/login')}>sign in</button>
                    {' '}before submitting.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right: My requests + info */}
        <div className="lg:col-span-2 space-y-4">
          {/* How it works */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> What Happens Next?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { n: '1', text: 'Your request is sent to the institution admin.' },
                { n: '2', text: 'They review your details and approve or decline.' },
                { n: '3', text: 'On approval, your role is upgraded and you get full access.' },
                { n: '4', text: 'You\'ll see the status update below in real time.' },
              ].map(s => (
                <div key={s.n} className="flex items-start gap-2.5 text-sm">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{s.n}</span>
                  <span className="text-muted-foreground text-xs text-pretty">{s.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* My requests */}
          {user && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> My Requests
                </CardTitle>
                <CardDescription className="text-xs">Track the status of your enrollment requests.</CardDescription>
              </CardHeader>
              <CardContent>
                {reqLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                  </div>
                ) : myRequests.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No requests yet.</p>
                ) : (
                  <div className="space-y-2">
                    {myRequests.map(req => {
                      const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                      const Icon = cfg.icon;
                      return (
                        <div key={req.id} className="p-3 rounded-md border border-border space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-medium truncate flex-1 min-w-0">
                              {req.institutions?.name || '—'}
                            </p>
                            <Badge variant="outline" className={`text-[10px] shrink-0 flex items-center gap-1 ${cfg.color}`}>
                              <Icon className="h-3 w-3" /> {cfg.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="capitalize">{req.requested_role}</span>
                            <span>·</span>
                            <span>{new Date(req.created_at).toLocaleDateString()}</span>
                          </div>
                          {req.status === 'approved' && (
                            <Button size="sm" className="w-full mt-1 text-xs gap-1.5 h-7" onClick={() => navigate('/login')}>
                              Sign In for Full Access <ArrowRight className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
