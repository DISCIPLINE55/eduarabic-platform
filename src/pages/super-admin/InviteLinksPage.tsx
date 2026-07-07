import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Copy, Link2Off, Link2, RefreshCw, Search, Loader2, CheckCircle, Clock, XCircle, Mail } from 'lucide-react';
import type { UserRole } from '@/types/types';

interface InviteLink {
  id: string;
  organization_id: string;
  role: string;
  token: string;
  expires_at: string;
  max_uses: number | null;
  uses_count: number;
  is_active: boolean;
  created_at: string;
  institutions: { name: string; code: string } | null;
}

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'parent', label: 'Parent' },
  { value: 'student', label: 'Student' },
];

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-primary/10 text-primary border-primary/30',
  secretary: 'bg-info/10 text-info border-info/30',
  teacher: 'bg-success/10 text-success border-success/30',
  parent: 'bg-warning/10 text-warning border-warning/30',
  student: 'bg-muted text-muted-foreground border-border',
};

function getLinkStatus(link: InviteLink): { label: string; color: string; icon: React.ElementType } {
  if (!link.is_active) return { label: 'Deactivated', color: 'bg-muted text-muted-foreground border-border', icon: XCircle };
  if (new Date(link.expires_at) < new Date()) return { label: 'Expired', color: 'bg-destructive/10 text-destructive border-destructive/30', icon: Clock };
  if (link.max_uses != null && link.uses_count >= link.max_uses) return { label: 'Maxed Out', color: 'bg-warning/10 text-warning border-warning/30', icon: XCircle };
  return { label: 'Active', color: 'bg-success/10 text-success border-success/30', icon: CheckCircle };
}

function buildInviteUrl(token: string): string {
  return `${window.location.origin}/invite?token=${token}`;
}

export default function InviteLinksPage() {
  const { profile } = useAuth();
  const [links, setLinks] = useState<InviteLink[]>([]);
  const [institutions, setInstitutions] = useState<{ id: string; name: string; code: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Generate dialog
  const [showGenerate, setShowGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genForm, setGenForm] = useState({ institution_id: '', role: 'teacher', expires_at: '', max_uses: '' });
  const [generatedLink, setGeneratedLink] = useState<InviteLink | null>(null);

  // Send email dialog
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailTarget, setEmailTarget] = useState<InviteLink | null>(null);
  const [recipientEmails, setRecipientEmails] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Deactivate confirmation
  const [deactivateTarget, setDeactivateTarget] = useState<InviteLink | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('invite_links')
      .select('*, institutions(name, code)')
      .order('created_at', { ascending: false });
    setLinks(data || []);
    setLoading(false);
  }, []);

  const fetchInstitutions = useCallback(async () => {
    const { data } = await supabase.from('institutions').select('id, name, code').order('name');
    setInstitutions(data || []);
  }, []);

  useEffect(() => {
    fetchLinks();
    fetchInstitutions();
  }, [fetchLinks, fetchInstitutions]);

  const filtered = links.filter(l => {
    const matchSearch =
      l.institutions?.name.toLowerCase().includes(search.toLowerCase()) ||
      l.role.toLowerCase().includes(search.toLowerCase()) ||
      l.token.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filterStatus === 'all') return true;
    const status = getLinkStatus(l);
    return status.label.toLowerCase() === filterStatus;
  });

  const handleGenerate = async () => {
    if (!genForm.institution_id || !genForm.role || !genForm.expires_at) {
      toast.error('Institution, role and expiry date are required');
      return;
    }
    if (new Date(genForm.expires_at) <= new Date()) {
      toast.error('Expiry date must be in the future');
      return;
    }
    setGenerating(true);
    const { data, error } = await supabase
      .from('invite_links')
      .insert({
        organization_id: genForm.institution_id,
        role: genForm.role,
        expires_at: new Date(genForm.expires_at).toISOString(),
        max_uses: genForm.max_uses ? parseInt(genForm.max_uses) : null,
        created_by: profile?.id,
      })
      .select('*, institutions(name, code)')
      .single();

    setGenerating(false);
    if (error) { toast.error(error.message); return; }
    setGeneratedLink(data);
    fetchLinks();
  };

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(buildInviteUrl(token));
    toast.success('Invite link copied to clipboard');
  };

  const openEmailDialog = (link: InviteLink) => {
    setEmailTarget(link);
    setRecipientEmails('');
    setShowEmailDialog(true);
  };

  const handleSendEmail = async () => {
    if (!emailTarget) return;
    const rawEmails = recipientEmails.split('\n').map(e => e.trim()).filter(Boolean);
    if (!rawEmails.length) { toast.error('Please enter at least one recipient email'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalid = rawEmails.filter(e => !emailRegex.test(e));
    if (invalid.length) { toast.error(`Invalid email address: ${invalid[0]}`); return; }

    setSendingEmail(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Not authenticated'); return; }
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invite-email`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: rawEmails,
          inviteUrl: buildInviteUrl(emailTarget.token),
          role: emailTarget.role,
          institutionName: emailTarget.institutions?.name || 'Institution',
          expiresAt: emailTarget.expires_at,
        }),
      });
      const result = await res.json();
      if (result.sent > 0) {
        toast.success(`Invite email sent to ${result.sent} recipient${result.sent > 1 ? 's' : ''}`);
        setShowEmailDialog(false);
      } else {
        toast.error('Failed to send email. Please check your Resend API key.');
      }
    } catch {
      toast.error('Email request failed');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    const { error } = await supabase
      .from('invite_links')
      .update({ is_active: false })
      .eq('id', deactivateTarget.id);
    setDeactivating(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Invite link deactivated');
    setDeactivateTarget(null);
    fetchLinks();
  };

  const stats = {
    total: links.length,
    active: links.filter(l => getLinkStatus(l).label === 'Active').length,
    used: links.reduce((s, l) => s + l.uses_count, 0),
  };

  return (
    <div>
      <PageHeader title="Invite Links" description="Generate and manage invite links for institutions">
        <Button onClick={() => { setShowGenerate(true); setGeneratedLink(null); setGenForm({ institution_id: '', role: 'teacher', expires_at: '', max_uses: '' }); }}>
          <Plus className="h-4 w-4 mr-2" />Generate Invite Link
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Link2 className="h-5 w-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-sm text-muted-foreground">Total Links</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0"><CheckCircle className="h-5 w-5 text-success" /></div>
          <div><p className="text-2xl font-bold">{stats.active}</p><p className="text-sm text-muted-foreground">Active Links</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center shrink-0"><RefreshCw className="h-5 w-5 text-info" /></div>
          <div><p className="text-2xl font-bold">{stats.used}</p><p className="text-sm text-muted-foreground">Total Uses</p></div>
        </CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by institution, role, or token..." className="pl-9 px-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Filter status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="deactivated">Deactivated</SelectItem>
                <SelectItem value="maxed out">Maxed Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Institution</TableHead>
                  <TableHead className="whitespace-nowrap">Role</TableHead>
                  <TableHead className="whitespace-nowrap">Expires</TableHead>
                  <TableHead className="whitespace-nowrap">Uses</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No invite links found</TableCell></TableRow>
                ) : filtered.map(link => {
                  const status = getLinkStatus(link);
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={link.id}>
                      <TableCell className="whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium">{link.institutions?.name || '—'}</p>
                          <p className="text-xs text-muted-foreground font-mono">{link.institutions?.code}</p>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className={`text-xs ${ROLE_COLORS[link.role] || ''}`}>{link.role}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(link.expires_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {link.uses_count}{link.max_uses != null ? ` / ${link.max_uses}` : ''}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className={`text-xs ${status.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />{status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => handleCopy(link.token)}>
                            <Copy className="h-3.5 w-3.5 mr-1" />Copy
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => openEmailDialog(link)}>
                            <Mail className="h-3.5 w-3.5 mr-1" />Email
                          </Button>
                          {link.is_active && getLinkStatus(link).label === 'Active' && (
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-destructive hover:text-destructive" onClick={() => setDeactivateTarget(link)}>
                              <Link2Off className="h-3.5 w-3.5 mr-1" />Deactivate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Generate Dialog */}
      <Dialog open={showGenerate} onOpenChange={v => { if (!v) { setShowGenerate(false); setGeneratedLink(null); } }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>Generate Invite Link</DialogTitle></DialogHeader>
          {generatedLink ? (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                <p className="text-sm font-medium text-success mb-1">Invite link generated successfully!</p>
                <p className="text-xs text-muted-foreground">Share this link with the new user so they can create their account.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Invite Link</Label>
                <div className="flex gap-2">
                  <Input value={buildInviteUrl(generatedLink.token)} readOnly className="px-3 font-mono text-xs flex-1 min-w-0" />
                  <Button variant="outline" size="icon" onClick={() => handleCopy(generatedLink.token)} className="shrink-0">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Institution: </span><span className="font-medium">{generatedLink.institutions?.name}</span></div>
                <div><span className="text-muted-foreground">Role: </span><Badge variant="outline" className={`text-xs ${ROLE_COLORS[generatedLink.role]}`}>{generatedLink.role}</Badge></div>
                <div><span className="text-muted-foreground">Expires: </span><span className="font-medium">{new Date(generatedLink.expires_at).toLocaleDateString()}</span></div>
                <div><span className="text-muted-foreground">Max Uses: </span><span className="font-medium">{generatedLink.max_uses ?? 'Unlimited'}</span></div>
              </div>
              <DialogFooter>
                <Button onClick={() => { setGeneratedLink(null); setGenForm({ institution_id: '', role: 'teacher', expires_at: '', max_uses: '' }); }}>Generate Another</Button>
                <Button variant="outline" onClick={() => openEmailDialog(generatedLink)}>
                  <Mail className="h-4 w-4 mr-1" /> Send via Email
                </Button>
                <Button variant="outline" onClick={() => setShowGenerate(false)}>Close</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Institution *</Label>
                  <Select value={genForm.institution_id} onValueChange={v => setGenForm(f => ({ ...f, institution_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select institution..." /></SelectTrigger>
                    <SelectContent>
                      {institutions.map(i => <SelectItem key={i.id} value={i.id}>{i.name} ({i.code})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Role *</Label>
                  <Select value={genForm.role} onValueChange={v => setGenForm(f => ({ ...f, role: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Expiry Date *</Label>
                    <Input type="date" value={genForm.expires_at} onChange={e => setGenForm(f => ({ ...f, expires_at: e.target.value }))} className="px-3" min={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Max Uses <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input type="number" value={genForm.max_uses} onChange={e => setGenForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="Unlimited" className="px-3" min="1" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowGenerate(false)}>Cancel</Button>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Generate Link
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={v => { if (!v) setShowEmailDialog(false); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> Send Invite Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {emailTarget && (
              <div className="p-3 rounded border border-border bg-muted/40 space-y-1 text-sm">
                <div><span className="text-muted-foreground">Institution: </span><span className="font-medium">{emailTarget.institutions?.name}</span></div>
                <div><span className="text-muted-foreground">Role: </span><Badge variant="outline" className={`text-xs ${ROLE_COLORS[emailTarget.role]}`}>{emailTarget.role}</Badge></div>
                <div><span className="text-muted-foreground">Expires: </span><span className="font-medium">{new Date(emailTarget.expires_at).toLocaleDateString()}</span></div>
                <div className="pt-1">
                  <span className="text-muted-foreground text-xs">Link: </span>
                  <span className="font-mono text-xs break-all text-foreground">{buildInviteUrl(emailTarget.token)}</span>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Recipient Email Addresses</Label>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                placeholder={"teacher@school.edu\nparent@example.com\nanother@email.com"}
                value={recipientEmails}
                onChange={e => setRecipientEmails(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Enter one email address per line.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>Cancel</Button>
            <Button onClick={handleSendEmail} disabled={sendingEmail}>
              {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation */}
      <AlertDialog open={!!deactivateTarget} onOpenChange={v => { if (!v) setDeactivateTarget(null); }}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Invite Link?</AlertDialogTitle>
            <AlertDialogDescription>
              This invite link for <strong>{deactivateTarget?.institutions?.name}</strong> ({deactivateTarget?.role}) will be deactivated and can no longer be used.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate} disabled={deactivating} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deactivating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
