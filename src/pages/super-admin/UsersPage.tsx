import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, UserPlus, Shield, Loader2, Users, RefreshCw, Mail, CheckSquare } from 'lucide-react';
import { InviteDialog } from '@/components/common/InviteDialog';
import type { UserRole } from '@/types/types';

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  organization_id: string | null;
  created_at: string;
  is_profile_complete: boolean;
  institutions: { name: string } | null;
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
  student: 'bg-muted text-muted-foreground border-border',
};

const ALL_ROLES: UserRole[] = ['super_admin', 'admin', 'secretary', 'teacher', 'parent', 'student'];

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterOrg, setFilterOrg] = useState<string>('all');

  // Single-user role change dialog
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('teacher');
  const [editOrg, setEditOrg] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Create user dialog
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ full_name: '', email: '', password: '', role: 'admin' as UserRole, organization_id: '' });
  const [creating, setCreating] = useState(false);

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBulk, setShowBulk] = useState(false);
  const [bulkRole, setBulkRole] = useState<UserRole>('teacher');
  const [bulkSaving, setBulkSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: userData }, { data: instData }] = await Promise.all([
      supabase.from('profiles')
        .select('id, full_name, email, role, organization_id, created_at, is_profile_complete, institutions(name)')
        .order('created_at', { ascending: false }),
      supabase.from('institutions').select('id, name').order('name'),
    ]);
    setUsers((userData as unknown as UserRow[]) ?? []);
    setInstitutions(instData ?? []);
    setLoading(false);
    setSelected(new Set());
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchOrg = filterOrg === 'all' || u.organization_id === filterOrg;
    return matchSearch && matchRole && matchOrg;
  });

  // Selection helpers
  const allFilteredSelected = filtered.length > 0 && filtered.every(u => selected.has(u.id));
  const someFilteredSelected = filtered.some(u => selected.has(u.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected(prev => { const n = new Set(prev); filtered.forEach(u => n.delete(u.id)); return n; });
    } else {
      setSelected(prev => { const n = new Set(prev); filtered.forEach(u => n.add(u.id)); return n; });
    }
  };

  const toggleOne = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  // Single-user role change
  const openEdit = (u: UserRow) => {
    setEditUser(u);
    setEditRole(u.role);
    setEditOrg(u.organization_id ?? '');
  };

  const handleSaveRole = async () => {
    if (!editUser) return;
    setSaving(true);
    const updates: Record<string, string | null> = { role: editRole };
    if (editOrg !== editUser.organization_id) updates.organization_id = editOrg || null;
    const { error } = await supabase.from('profiles').update(updates).eq('id', editUser.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${editUser.full_name || editUser.email} updated to ${ROLE_LABELS[editRole]}`);
    setEditUser(null);
    fetchData();
  };

  // Bulk role assignment
  const handleBulkAssign = async () => {
    if (selected.size === 0) return;
    setBulkSaving(true);
    const ids = Array.from(selected);
    const { error } = await supabase.from('profiles').update({ role: bulkRole }).in('id', ids);
    setBulkSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${ids.length} user${ids.length > 1 ? 's' : ''} assigned role: ${ROLE_LABELS[bulkRole]}`);
    setShowBulk(false);
    setSelected(new Set());
    fetchData();
  };

  // Create user
  const handleCreateUser = async () => {
    const { full_name, email, password, role, organization_id } = createForm;
    if (!email || !password) { toast.error('Email and password are required'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setCreating(true);

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name } },
    });

    if (signUpError) { toast.error(signUpError.message); setCreating(false); return; }
    if (!authData.user) { toast.error('Failed to create user'); setCreating(false); return; }

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authData.user.id, email,
      full_name: full_name || null,
      role,
      organization_id: organization_id || null,
      is_profile_complete: true,
      must_change_password: true,
    });

    setCreating(false);
    if (profileError) { toast.error(profileError.message); return; }
    toast.success(`${full_name || email} created as ${ROLE_LABELS[role]}. They must change their password on first login.`);
    setShowCreate(false);
    setCreateForm({ full_name: '', email: '', password: '', role: 'admin', organization_id: '' });
    fetchData();
  };

  const roleCounts = ALL_ROLES.reduce((acc, r) => {
    acc[r] = users.filter(u => u.role === r).length;
    return acc;
  }, {} as Record<UserRole, number>);

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" description="View, create, and manage all platform users across all institutions">
        <Button variant="ghost" size="icon" onClick={fetchData} title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <InviteDialog allowedRoles={['teacher', 'secretary', 'parent', 'student', 'admin']} />
        <Button onClick={() => setShowCreate(true)}>
          <UserPlus className="h-4 w-4 mr-2" />Create User
        </Button>
      </PageHeader>

      {/* Role summary chips */}
      <div className="flex flex-wrap gap-2">
        {ALL_ROLES.map(r => (
          <button
            key={r}
            onClick={() => setFilterRole(filterRole === r ? 'all' : r)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filterRole === r
                ? ROLE_COLORS[r] + ' ring-2 ring-offset-1 ring-primary/40'
                : 'bg-muted text-muted-foreground border-border hover:bg-accent'
            }`}
          >
            {ROLE_LABELS[r]} ({roleCounts[r]})
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Filters + bulk action bar */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 px-9"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {ALL_ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterOrg} onValueChange={setFilterOrg}>
              <SelectTrigger className="w-full md:w-52">
                <SelectValue placeholder="All institutions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All institutions</SelectItem>
                {institutions.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Bulk action banner */}
          {selected.size > 0 && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 flex-wrap">
              <span className="text-sm font-medium text-primary">
                <CheckSquare className="h-4 w-4 inline mr-1.5" />
                {selected.size} user{selected.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelected(new Set())}
                  className="h-8 text-xs"
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={() => { setBulkRole('teacher'); setShowBulk(true); }}
                  className="h-8 text-xs gap-1"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Assign Role to Selected
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allFilteredSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                      data-state={someFilteredSelected && !allFilteredSelected ? 'indeterminate' : undefined}
                    />
                  </TableHead>
                  <TableHead className="whitespace-nowrap">User</TableHead>
                  <TableHead className="whitespace-nowrap">Email</TableHead>
                  <TableHead className="whitespace-nowrap">Role</TableHead>
                  <TableHead className="whitespace-nowrap">Institution</TableHead>
                  <TableHead className="whitespace-nowrap">Joined</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No users found</p>
                    </TableCell>
                  </TableRow>
                ) : filtered.map(u => (
                  <TableRow key={u.id} className={selected.has(u.id) ? 'bg-primary/5' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(u.id)}
                        onCheckedChange={() => toggleOne(u.id)}
                        aria-label={`Select ${u.full_name ?? u.email}`}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary font-semibold text-sm">
                            {(u.full_name?.[0] || u.email?.[0] || '?').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{u.full_name || '—'}</p>
                          {!u.is_profile_complete && (
                            <span className="text-[10px] text-warning">Incomplete profile</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{u.email || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline" className={ROLE_COLORS[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {u.institutions?.name || <span className="italic text-xs">No institution</span>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <Button variant="outline" size="sm" onClick={() => openEdit(u)} className="h-7 text-xs px-2">
                        <Shield className="h-3 w-3 mr-1" />Change Role
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">
            {filtered.length} of {users.length} users
            {selected.size > 0 && <span className="ml-2 text-primary font-medium">• {selected.size} selected</span>}
          </p>
        </CardContent>
      </Card>

      {/* Bulk Role Assignment Dialog */}
      <Dialog open={showBulk} onOpenChange={v => { if (!v) setShowBulk(false); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              Bulk Role Assignment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm">
              You are about to change the role of{' '}
              <strong>{selected.size} user{selected.size > 1 ? 's' : ''}</strong>.
              This action will overwrite their current roles.
            </div>
            <div className="space-y-1.5">
              <Label>Assign Role To All Selected</Label>
              <Select value={bulkRole} onValueChange={v => setBulkRole(v as UserRole)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map(r => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowBulk(false)}>Cancel</Button>
            <Button onClick={handleBulkAssign} disabled={bulkSaving}>
              {bulkSaving
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
                : <><Shield className="h-4 w-4 mr-2" />Assign to {selected.size}</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single-user Edit Role Dialog */}
      <Dialog open={!!editUser} onOpenChange={open => { if (!open) setEditUser(null); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold">{(editUser.full_name?.[0] || '?').toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{editUser.full_name || editUser.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{editUser.email}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>New Role</Label>
                <Select value={editRole} onValueChange={v => setEditRole(v as UserRole)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Institution (optional)</Label>
                <Select value={editOrg || 'none'} onValueChange={v => setEditOrg(v === 'none' ? '' : v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="No institution" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No institution</SelectItem>
                    {institutions.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleSaveRole} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />Create New User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground text-pretty rounded-lg bg-muted p-2.5">
              The user will be required to change their password on first login.
            </p>
            {[
              { label: 'Full Name', key: 'full_name', placeholder: 'Full name', type: 'text' },
              { label: 'Email *', key: 'email', placeholder: 'user@example.com', type: 'email' },
              { label: 'Temporary Password *', key: 'password', placeholder: 'Min 6 characters', type: 'password' },
            ].map(f => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                <Input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={(createForm as any)[f.key]}
                  onChange={e => setCreateForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="px-3"
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={createForm.role} onValueChange={v => setCreateForm(p => ({ ...p, role: v as UserRole }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Institution (optional)</Label>
              <Select
                value={createForm.organization_id || 'none'}
                onValueChange={v => setCreateForm(p => ({ ...p, organization_id: v === 'none' ? '' : v }))}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Select institution" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No institution</SelectItem>
                  {institutions.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreateUser} disabled={creating}>
              {creating
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating…</>
                : <><UserPlus className="h-4 w-4 mr-2" />Create User</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
