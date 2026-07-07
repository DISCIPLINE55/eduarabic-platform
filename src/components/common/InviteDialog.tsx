import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Mail, Copy, CheckCheck, Link2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';

interface InviteDialogProps {
  orgId?: string;
  orgName?: string;
  /** roles admin is allowed to invite */
  allowedRoles?: string[];
}

const ROLE_OPTIONS = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'parent', label: 'Parent' },
  { value: 'student', label: 'Student' },
  { value: 'admin', label: 'Admin' },
];

function buildInviteLink(role: string, orgId: string, inviterName: string): string {
  const base = window.location.origin;
  const tokenPayload = btoa(`${orgId}|${role}|${Date.now()}`);
  const params = new URLSearchParams({ role, org: orgId, by: inviterName, token: tokenPayload });
  return `${base}/invite?${params.toString()}`;
}

export function InviteDialog({ orgId, orgName, allowedRoles }: InviteDialogProps) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(allowedRoles?.[0] ?? 'teacher');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  // For super_admin who has no fixed org — allow picking
  const isSuperAdmin = profile?.role === 'super_admin';
  const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState(orgId ?? '');

  useEffect(() => {
    if (isSuperAdmin && open && !orgId) {
      supabase.from('institutions').select('id, name').order('name').then(({ data }) => {
        setInstitutions(data ?? []);
      });
    }
  }, [isSuperAdmin, open, orgId]);

  const effectiveOrgId = orgId ?? selectedOrgId;
  const effectiveOrgName = orgName
    ?? institutions.find(i => i.id === selectedOrgId)?.name
    ?? profile?.organization_id
    ?? 'your institution';
  const inviterName = profile?.full_name ?? 'Admin';

  const roleOptions = allowedRoles
    ? ROLE_OPTIONS.filter(r => allowedRoles.includes(r.value))
    : ROLE_OPTIONS;

  const handleGenerate = () => {
    if (!effectiveOrgId) { toast.error('Please select an institution first'); return; }
    const link = buildInviteLink(role, effectiveOrgId, inviterName);
    setGeneratedLink(link);
    setCopied(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success('Invite link copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleClose = () => {
    setOpen(false);
    setGeneratedLink('');
    setCopied(false);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Mail className="h-4 w-4 mr-2" />Invite by Link
      </Button>
      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />Invite by Email Link
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <p className="text-sm text-muted-foreground text-pretty">
              Generate a unique invite link pre-filled with the role and institution.
              Share it via email or any channel — the invitee clicks it and creates their account instantly.
            </p>

            {/* Institution — fixed badge or picker for super_admin */}
            {isSuperAdmin && !orgId ? (
              <div className="space-y-1.5">
                <Label>Institution *</Label>
                <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select institution..." />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map(i => (
                      <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : effectiveOrgName ? (
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground shrink-0">Institution</Label>
                <Badge variant="outline" className="text-xs">{effectiveOrgName}</Badge>
              </div>
            ) : null}

            {/* Role selector */}
            <div className="space-y-1.5">
              <Label>Role for Invitee</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roleOptions.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleGenerate} variant="outline" className="w-full gap-2">
              <Link2 className="h-4 w-4" />Generate Invite Link
            </Button>

            {generatedLink && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Invite Link (share this)</Label>
                <div className="flex gap-2 items-start">
                  <Input
                    readOnly value={generatedLink}
                    className="px-3 text-xs font-mono bg-muted"
                    onClick={e => (e.target as HTMLInputElement).select()}
                  />
                  <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0 gap-1">
                    {copied ? <CheckCheck className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-pretty">
                  The invitee will be automatically assigned the{' '}
                  <strong>{role}</strong> role at <strong>{effectiveOrgName}</strong>.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
