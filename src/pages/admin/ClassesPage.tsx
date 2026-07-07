import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Search, Loader2 } from 'lucide-react';

export default function ClassesPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '', academic_level: '', teacher_id: '', is_weekend_class: 'false' });

  const fetchData = async () => {
    if (!orgId) return;
    const [{ data: cls }, { data: tchrs }] = await Promise.all([
      supabase.from('classes').select('*, profiles(full_name)').eq('organization_id', orgId).is('deleted_at', null).order('name'),
      supabase.from('profiles').select('id, full_name').eq('organization_id', orgId).eq('role', 'teacher').order('full_name'),
    ]);
    setClasses(cls || []);
    setTeachers(tchrs || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [orgId]);

  const filtered = classes.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = async () => {
    if (!form.name || !orgId) { toast.error('Class name is required'); return; }
    setSaving(true);
    const { error } = await supabase.from('classes').insert({
      organization_id: orgId,
      name: form.name,
      description: form.description || null,
      academic_level: form.academic_level || null,
      teacher_id: form.teacher_id || null,
      is_weekend_class: form.is_weekend_class === 'true',
      created_by: profile?.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Class created');
    setShowDialog(false);
    setForm({ name: '', description: '', academic_level: '', teacher_id: '', is_weekend_class: 'false' });
    fetchData();
  };

  return (
    <div>
      <PageHeader title="Classes" description="Manage classes and teacher assignments">
        <Button onClick={() => setShowDialog(true)}><Plus className="h-4 w-4 mr-2" />New Class</Button>
      </PageHeader>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search classes..." className="pl-9 px-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Class Name</TableHead>
                  <TableHead className="whitespace-nowrap">Level</TableHead>
                  <TableHead className="whitespace-nowrap">Teacher</TableHead>
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No classes found</TableCell></TableRow>
                ) : filtered.map(cls => (
                  <TableRow key={cls.id}>
                    <TableCell className="whitespace-nowrap font-medium text-sm">{cls.name}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{cls.academic_level || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{cls.profiles?.full_name || 'Unassigned'}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {cls.is_weekend_class && <Badge variant="outline" className="bg-secondary text-secondary-foreground border-border">Weekend</Badge>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline" className={cls.is_active ? 'bg-success/10 text-success border-success/30' : 'bg-muted text-muted-foreground'}>
                        {cls.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>Create New Class</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Class Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Quran Beginners A" className="px-3" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Academic Level</Label>
                <Input value={form.academic_level} onChange={e => setForm(f => ({ ...f, academic_level: e.target.value }))} placeholder="e.g. Level 1" className="px-3" />
              </div>
              <div className="space-y-1.5">
                <Label>Class Type</Label>
                <Select value={form.is_weekend_class} onValueChange={v => setForm(f => ({ ...f, is_weekend_class: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Regular</SelectItem>
                    <SelectItem value="true">Weekend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Assign Teacher</Label>
              <Select value={form.teacher_id} onValueChange={v => setForm(f => ({ ...f, teacher_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>
                  {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="px-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
