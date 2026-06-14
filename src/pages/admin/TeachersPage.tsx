import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, UserPlus, Shield, Loader2, Users } from 'lucide-react';
import { InviteDialog } from '@/components/common/InviteDialog';
import type { UserRole } from '@/types/types';

interface OrgUser {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  organization_id: string | null;
  created_at: string;
  is_profile_complete: boolean;
}

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin', admin: 'Admin', secretary: 'Secretary',
  teacher: 'Teacher', parent: 'Parent', student: 'Student',
};
const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: 'bg-destructive/10 text-destructive border-destructive/30',
  admin: 'bg-primary/10 text-primary border-primary/30',
  secretary: 'bg-info/10 text-info border-info/30',
  teacher: 'bg-success/10 text-success border-success/30',
  parent: 'bg-warning/10 text-warning border-warning/30',
  student: 'bg-secondary text-secondary-foreground border-border',
};
const ASSIGNABLE_ROLES: UserRole[] = ['teacher', 'secretary', 'parent', 'student'];

export default function TeachersPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [editUser, setEditUser] = useState<OrgUser | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('teacher');
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ full_name: '', email: '', password: '', role: 'teacher' as UserRole });
  const [creating, setCreating] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, organization_id, created_at, is_profile_complete')
      .eq('organization_id', orgId)
      .order('full_name');
    setUsers((data as OrgUser[]) ?? []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u => {
    const matchSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const openEdit = (u: OrgUser) => { setEditUser(u); setEditRole(u.role); };

  const handleSaveRole = async () => {
    if (!editUser) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ role: editRole }).eq('id', editUser.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${editUser.full_name || editUser.email} updated to ${ROLE_LABELS[editRole]}`);
    setEditUser(null);
    fetchUsers();
  };

  const handleCreateUser = async () => {
    const { full_name, email, password, role } = createForm;
    if (!email || !password) { toast.error('Email and password are required'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setCreating(true);
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email, password, options: { data: { full_name } },
    });
    if (signUpError) { toast.error(signUpError.message); setCreating(false); return; }
    if (!authData.user) { toast.error('Failed to create user'); setCreating(false); return; }
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authData.user.id, email, full_name: full_name || null,
      role, organization_id: orgId, is_profile_complete: true, must_change_password: true,
    });
    setCreating(false);
    if (profileError) { toast.error(profileError.message); return; }
    toast.success(`${full_name || email} created as ${ROLE_LABELS[role]}`);
    setShowCreate(false);
    setCreateForm({ full_name: '', email: '', password: '', role: 'teacher' });
    fetchUsers();
  };

  const roleCounts = ASSIGNABLE_ROLES.reduce((acc, r) => { acc[r] = users.filter(u => u.role === r).length; return acc; }, {} as Record<UserRole, number>);

  return (
    <div className="space-y-6">
      <PageHeader title="Staff & Members" description="Manage all staff and members — assign roles and create new accounts">
        <div className="flex gap-2 flex-wrap">
          <InviteDialog allowedRoles={['teacher', 'secretary', 'parent', 'student']} />
          <Button onClick={() => setShowCreate(true)}><UserPlus className="h-4 w-4 mr-2" />Add Member</Button>
        </div>
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        {ASSIGNABLE_ROLES.map(r => (
          <button key={r} onClick={() => setFilterRole(filterRole === r ? 'all' : r)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterRole === r ? ROLE_COLORS[r] + ' ring-2 ring-offset-1 ring-primary/40' : 'bg-muted text-muted-foreground border-border hover:bg-accent'}`}>
            {ROLE_LABELS[r]} ({roleCounts[r] ?? 0})
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 px-9" />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="All roles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {ASSIGNABLE_ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Member</TableHead>
                  <TableHead className="whitespace-nowrap">Email</TableHead>
                  <TableHead className="whitespace-nowrap">Role</TableHead>
                  <TableHead className="whitespace-nowrap">Joined</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No members found</p>
                  </TableCell></TableRow>
                ) : filtered.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary font-semibold text-sm">{(u.full_name?.[0] || u.email?.[0] || '?').toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{u.full_name || '—'}</p>
                          {!u.is_profile_complete && <span className="text-[10px] text-warning">Incomplete profile</span>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{u.email || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap"><Badge variant="outline" className={ROLE_COLORS[u.role]}>{ROLE_LABELS[u.role]}</Badge></TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <Button variant="outline" size="sm" onClick={() => openEdit(u)} className="h-7 text-xs px-2"
                        disabled={u.role === 'admin' || u.role === 'super_admin'}>
                        <Shield className="h-3 w-3 mr-1" />Change Role
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">{filtered.length} of {users.length} members</p>
        </CardContent>
      </Card>

      <Dialog open={!!editUser} onOpenChange={open => { if (!open) setEditUser(null); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader><DialogTitle>Change Member Role</DialogTitle></DialogHeader>
          {editUser && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-semibold">{(editUser.full_name?.[0] || editUser.email?.[0] || '?').toUpperCase()}</span>
                </div>
                <div><p className="font-medium text-sm">{editUser.full_name || '—'}</p><p className="text-xs text-muted-foreground">{editUser.email}</p></div>
              </div>
              <div className="space-y-1.5">
                <Label>New Role</Label>
                <Select value={editRole} onValueChange={v => setEditRole(v as UserRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ASSIGNABLE_ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleSaveRole} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}Save Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader><DialogTitle>Add New Member</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Full Name</Label><Input placeholder="Full name" value={createForm.full_name} onChange={e => setCreateForm(f => ({ ...f, full_name: e.target.value }))} className="px-3" /></div>
            <div className="space-y-1.5"><Label>Email <span className="text-destructive">*</span></Label><Input type="email" placeholder="email@example.com" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} className="px-3" /></div>
            <div className="space-y-1.5"><Label>Password <span className="text-destructive">*</span></Label><Input type="password" placeholder="Min 6 characters" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} className="px-3" /></div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={createForm.role} onValueChange={v => setCreateForm(f => ({ ...f, role: v as UserRole }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ASSIGNABLE_ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground rounded bg-muted p-2">The new member will be automatically assigned to your institution.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreateUser} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}Create Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
