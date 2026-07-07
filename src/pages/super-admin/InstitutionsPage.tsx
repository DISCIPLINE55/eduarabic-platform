import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Search, Building2, Edit, Loader2, Power, Trash2, Eye, Users, GraduationCap, School, BookOpen, TrendingUp, Bell, BarChart3, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { chartTooltipStyle, chartAxisTick } from '@/lib/chartStyles';
import type { Institution } from '@/types/types';

const emptyForm = { name: '', code: '', contact_email: '', contact_phone: '', address: '', region: '', subscription_status: 'trial' };

interface InstitutionDashboard {
  students: number;
  teachers: number;
  classes: number;
  assessments: number;
  announcements: { id: string; title: string; created_at: string }[];
  recentStudents: { id: string; full_name: string | null; email: string; created_at: string }[];
  attendanceChart: { day: string; present: number; absent: number }[];
}

export default function InstitutionsPage() {
  const { profile } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Dialogs
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Institution | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  // Dashboard dialog
  const [dashInst, setDashInst] = useState<Institution | null>(null);
  const [dashData, setDashData] = useState<InstitutionDashboard | null>(null);
  const [loadingDash, setLoadingDash] = useState(false);

  const [toggleTarget, setToggleTarget] = useState<Institution | null>(null);
  const [toggling, setToggling] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Institution | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchInstitutions = useCallback(async () => {
    const { data } = await supabase.from('institutions').select('*').is('deleted_at', null).order('name');
    setInstitutions(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchInstitutions(); }, [fetchInstitutions]);

  const filtered = institutions.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filterStatus === 'active') return i.is_active;
    if (filterStatus === 'inactive') return !i.is_active;
    return true;
  });

  const openCreate = () => { setEditItem(null); setForm({ ...emptyForm }); setShowForm(true); };
  const openEdit = (inst: Institution) => {
    setEditItem(inst);
    setForm({ name: inst.name, code: inst.code, contact_email: inst.contact_email || '', contact_phone: inst.contact_phone || '', address: inst.address || '', region: inst.region || '', subscription_status: inst.subscription_status });
    setShowForm(true);
  };

  const openDashboard = async (inst: Institution) => {
    setDashInst(inst);
    setLoadingDash(true);
    setDashData(null);
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    const [
      { count: students },
      { count: teachers },
      { count: classes },
      { count: assessments },
      { data: ann },
      { data: recentStudents },
      { data: attRows },
    ] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('organization_id', inst.id).is('deleted_at', null),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('organization_id', inst.id).eq('role', 'teacher'),
      supabase.from('classes').select('*', { count: 'exact', head: true }).eq('organization_id', inst.id).is('deleted_at', null),
      supabase.from('assessments').select('*', { count: 'exact', head: true }).eq('organization_id', inst.id),
      supabase.from('announcements').select('id, title, created_at').eq('organization_id', inst.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('profiles').select('id, full_name, email, created_at').eq('organization_id', inst.id).eq('role', 'student').order('created_at', { ascending: false }).limit(5),
      supabase.from('attendance').select('date, status').eq('organization_id', inst.id).gte('date', days[0]).lte('date', days[6]),
    ]);
    const grouped: Record<string, { present: number; absent: number }> = {};
    days.forEach(d => { grouped[d] = { present: 0, absent: 0 }; });
    (attRows || []).forEach((r: any) => {
      if (!grouped[r.date]) return;
      if (r.status === 'present' || r.status === 'late') grouped[r.date].present++;
      else grouped[r.date].absent++;
    });
    const attendanceChart = days.map(d => ({
      day: new Date(d + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }),
      present: grouped[d].present,
      absent: grouped[d].absent,
    }));
    setDashData({
      students: students || 0, teachers: teachers || 0, classes: classes || 0, assessments: assessments || 0,
      announcements: ann || [], recentStudents: recentStudents || [], attendanceChart,
    });
    setLoadingDash(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) { toast.error('Name and code are required'); return; }
    setSaving(true);
    if (editItem) {
      const { error } = await supabase.from('institutions').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editItem.id);
      if (error) { toast.error(error.message); } else { toast.success('Institution updated'); setShowForm(false); fetchInstitutions(); }
    } else {
      const { error } = await supabase.from('institutions').insert({ ...form, created_by: profile?.id });
      if (error) { toast.error(error.message); } else { toast.success('Institution created'); setShowForm(false); fetchInstitutions(); }
    }
    setSaving(false);
  };

  const handleToggle = async () => {
    if (!toggleTarget) return;
    setToggling(true);
    const { error } = await supabase.from('institutions').update({ is_active: !toggleTarget.is_active, updated_at: new Date().toISOString() }).eq('id', toggleTarget.id);
    setToggling(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Institution ${toggleTarget.is_active ? 'deactivated' : 'activated'}`);
    setToggleTarget(null);
    fetchInstitutions();
    if (dashInst?.id === toggleTarget.id) setDashInst(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('institutions').update({ deleted_at: new Date().toISOString() }).eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Institution deleted');
    setDeleteTarget(null);
    setDashInst(null);
    fetchInstitutions();
  };

  const stats = { total: institutions.length, active: institutions.filter(i => i.is_active).length, inactive: institutions.filter(i => !i.is_active).length };

  return (
    <div>
      <PageHeader title="Institutions" description="Manage all registered educational institutions">
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Institution</Button>
      </PageHeader>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Building2 className="h-4 w-4 text-primary" /></div>
          <div><p className="text-xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center shrink-0"><Power className="h-4 w-4 text-success" /></div>
          <div><p className="text-xl font-bold">{stats.active}</p><p className="text-xs text-muted-foreground">Active</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0"><Power className="h-4 w-4 text-muted-foreground" /></div>
          <div><p className="text-xl font-bold">{stats.inactive}</p><p className="text-xs text-muted-foreground">Inactive</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or code..." className="pl-9 px-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
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
                  <TableHead className="whitespace-nowrap">Code</TableHead>
                  <TableHead className="whitespace-nowrap">Region</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Subscription</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No institutions found</TableCell></TableRow>
                ) : filtered.map(inst => (
                  <TableRow key={inst.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{inst.name}</p>
                          <p className="text-xs text-muted-foreground">{inst.contact_email || '—'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap"><Badge variant="outline" className="font-mono text-xs">{inst.code}</Badge></TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{inst.region || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline" className={inst.is_active ? 'bg-success/10 text-success border-success/30' : 'bg-muted text-muted-foreground border-border'}>
                        {inst.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline" className={
                        inst.subscription_status === 'active' ? 'bg-info/10 text-info border-info/30' :
                        inst.subscription_status === 'trial' ? 'bg-warning/10 text-warning border-warning/30' :
                        'bg-destructive/10 text-destructive border-destructive/30'
                      }>
                        {inst.subscription_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Dashboard" onClick={() => openDashboard(inst)}><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(inst)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className={`h-8 w-8 ${inst.is_active ? 'text-warning hover:text-warning' : 'text-success hover:text-success'}`} onClick={() => setToggleTarget(inst)}>
                          <Power className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(inst)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? 'Edit Institution' : 'Add Institution'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label>Institution Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" className="px-3" />
              </div>
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label>Code * {editItem && <span className="text-xs text-muted-foreground">(read-only)</span>}</Label>
                <Input value={form.code} readOnly={!!editItem} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. MQI" className={`px-3 ${editItem ? 'bg-muted' : ''}`} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label>Contact Email</Label>
                <Input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} className="px-3" />
              </div>
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label>Phone</Label>
                <Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} className="px-3" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="px-3" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Region</Label>
                <Input value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} className="px-3" />
              </div>
              <div className="space-y-1.5">
                <Label>Subscription Plan</Label>
                <Select value={form.subscription_status} onValueChange={v => setForm(f => ({ ...f, subscription_status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editItem ? 'Save Changes' : 'Create Institution'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Institution Dashboard Dialog */}
      <Dialog open={!!dashInst} onOpenChange={v => { if (!v) { setDashInst(null); setDashData(null); } }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-4xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <DialogTitle className="text-balance">{dashInst?.name}</DialogTitle>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <Badge variant="outline" className="font-mono text-xs">{dashInst?.code}</Badge>
                    <Badge variant="outline" className={dashInst?.is_active ? 'bg-success/10 text-success border-success/30 text-xs' : 'text-xs'}>
                      {dashInst?.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline" className={
                      dashInst?.subscription_status === 'active' ? 'bg-info/10 text-info border-info/30 text-xs' :
                      dashInst?.subscription_status === 'trial' ? 'bg-warning/10 text-warning border-warning/30 text-xs' :
                      'bg-destructive/10 text-destructive border-destructive/30 text-xs'
                    }>{dashInst?.subscription_status}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => { setDashInst(null); openEdit(dashInst!); }}>
                  <Edit className="h-3.5 w-3.5 mr-1.5" />Edit
                </Button>
                <Button variant="ghost" size="icon" onClick={() => { setDashInst(null); setDashData(null); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {loadingDash ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : dashData ? (
            <div className="space-y-5 pt-2">
              {/* Stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: GraduationCap, label: 'Students', value: dashData.students, color: 'text-primary' },
                  { icon: Users, label: 'Teachers', value: dashData.teachers, color: 'text-success' },
                  { icon: School, label: 'Classes', value: dashData.classes, color: 'text-info' },
                  { icon: BookOpen, label: 'Assessments', value: dashData.assessments, color: 'text-warning' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <Card key={label}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`h-4 w-4 ${color}`} />
                        <span className="text-xs text-muted-foreground">{label}</span>
                      </div>
                      <p className="text-2xl font-bold">{value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Attendance chart + institution info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />Attendance — Last 7 Days
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashData.attendanceChart.every(d => d.present === 0 && d.absent === 0) ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No attendance data for the past 7 days</p>
                    ) : (
                      <div className="w-full min-w-0 overflow-hidden">
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={dashData.attendanceChart}>
                            <XAxis dataKey="day" tick={chartAxisTick} />
                            <YAxis tick={chartAxisTick} allowDecimals={false} />
                            <Tooltip contentStyle={chartTooltipStyle} />
                            <Legend layout="horizontal" wrapperStyle={{ paddingTop: 8 }} />
                            <Bar dataKey="present" fill="hsl(var(--primary))" name="Present" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="absent" fill="hsl(var(--muted-foreground))" name="Absent" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />Institution Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {[
                      ['Email', dashInst?.contact_email || '—'],
                      ['Phone', dashInst?.contact_phone || '—'],
                      ['Region', dashInst?.region || '—'],
                      ['Address', dashInst?.address || '—'],
                      ['Created', new Date(dashInst!.created_at).toLocaleDateString()],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2 border-b border-border pb-1.5 last:border-0">
                        <span className="text-muted-foreground shrink-0">{k}</span>
                        <span className="font-medium text-right truncate" title={v}>{v}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Recent students + announcements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-primary" />Recently Enrolled Students
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashData.recentStudents.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No students yet</p>
                    ) : (
                      <div className="space-y-2">
                        {dashData.recentStudents.map(s => (
                          <div key={s.id} className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-primary font-semibold text-xs">{(s.full_name?.[0] || s.email[0]).toUpperCase()}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{s.full_name || '—'}</p>
                              <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">{new Date(s.created_at).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bell className="h-4 w-4 text-primary" />Recent Announcements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashData.announcements.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No announcements yet</p>
                    ) : (
                      <div className="space-y-2">
                        {dashData.announcements.map(a => (
                          <div key={a.id} className="border-b border-border pb-2 last:border-0">
                            <p className="text-sm font-medium truncate">{a.title}</p>
                            <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1 border-t border-border">
                <Button variant="outline" size="sm" className={dashInst?.is_active ? 'text-warning border-warning/30 hover:bg-warning/10' : 'text-success border-success/30 hover:bg-success/10'} onClick={() => setToggleTarget(dashInst!)}>
                  <Power className="h-3.5 w-3.5 mr-1.5" />{dashInst?.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10 ml-auto" onClick={() => setDeleteTarget(dashInst!)}>
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete Institution
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Toggle Active/Inactive */}
      <AlertDialog open={!!toggleTarget} onOpenChange={v => { if (!v) setToggleTarget(null); }}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{toggleTarget?.is_active ? 'Deactivate' : 'Activate'} Institution?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {toggleTarget?.is_active ? 'deactivate' : 'activate'} <strong>{toggleTarget?.name}</strong>?
              {toggleTarget?.is_active && ' Users in this institution will lose access.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggle} disabled={toggling} className={toggleTarget?.is_active ? 'bg-warning text-warning-foreground hover:bg-warning/90' : 'bg-success text-white hover:bg-success/90'}>
              {toggling && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {toggleTarget?.is_active ? 'Deactivate' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Institution?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone and all associated data will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete Institution
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

