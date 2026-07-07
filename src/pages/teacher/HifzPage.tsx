import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { BookMarked, Loader2, Plus, Edit } from 'lucide-react';
import type { HifzStatus } from '@/types/types';
import { SURAH_LIST } from '@/types/types';

export default function HifzPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [hifzRecords, setHifzRecords] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ student_id: '', surah_number: '1', ayah_from: '1', ayah_to: '7', completion_percentage: '100', status: 'memorized' as HifzStatus, teacher_notes: '' });

  const fetchData = async () => {
    if (!orgId || !profile) return;
    const [{ data: hifz }, { data: studs }] = await Promise.all([
      supabase.from('hifz_progress').select('*, students(full_name, student_id_code)').eq('organization_id', orgId).eq('teacher_id', profile.id).order('updated_at', { ascending: false }),
      supabase.from('students').select('id, full_name, student_id_code').eq('organization_id', orgId).eq('status', 'active').order('full_name'),
    ]);
    setHifzRecords(hifz || []);
    setStudents(studs || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [orgId, profile]);

  const handleSave = async () => {
    if (!form.student_id || !orgId) { toast.error('Please select a student'); return; }
    setSaving(true);
    const record = {
      organization_id: orgId, student_id: form.student_id, teacher_id: profile?.id,
      surah_number: parseInt(form.surah_number), ayah_from: parseInt(form.ayah_from),
      ayah_to: parseInt(form.ayah_to), completion_percentage: parseFloat(form.completion_percentage),
      status: form.status, teacher_notes: form.teacher_notes || null, created_by: profile?.id,
    };
    if (editItem) {
      const { error } = await supabase.from('hifz_progress').update({ ...record, updated_at: new Date().toISOString() }).eq('id', editItem.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Hifz record updated');
    } else {
      const { error } = await supabase.from('hifz_progress').insert(record);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Hifz progress recorded');
    }
    setSaving(false);
    setShowDialog(false);
    setEditItem(null);
    setForm({ student_id: '', surah_number: '1', ayah_from: '1', ayah_to: '7', completion_percentage: '100', status: 'memorized', teacher_notes: '' });
    fetchData();
  };

  const openEdit = (rec: any) => {
    setEditItem(rec);
    setForm({ student_id: rec.student_id, surah_number: String(rec.surah_number), ayah_from: String(rec.ayah_from), ayah_to: String(rec.ayah_to), completion_percentage: String(rec.completion_percentage), status: rec.status, teacher_notes: rec.teacher_notes || '' });
    setShowDialog(true);
  };

  const surahName = (num: number) => SURAH_LIST.find(s => s.number === num)?.name || `Surah ${num}`;

  return (
    <div>
      <PageHeader title="Hifz Tracker" description="Track Quran memorization progress">
        <Button onClick={() => { setEditItem(null); setShowDialog(true); }}><Plus className="h-4 w-4 mr-2" />Record Progress</Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Student</TableHead>
                  <TableHead className="whitespace-nowrap">Surah</TableHead>
                  <TableHead className="whitespace-nowrap">Ayahs</TableHead>
                  <TableHead className="whitespace-nowrap">Progress</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                : hifzRecords.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No Hifz records yet. Start tracking progress.</TableCell></TableRow>
                : hifzRecords.map(rec => (
                  <TableRow key={rec.id}>
                    <TableCell className="whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium">{rec.students?.full_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{rec.students?.student_id_code}</p>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      <div>
                        <p className="font-medium">{surahName(rec.surah_number)}</p>
                        <p className="text-xs text-muted-foreground">#{rec.surah_number}</p>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{rec.ayah_from}–{rec.ayah_to}</TableCell>
                    <TableCell className="whitespace-nowrap min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <Progress value={rec.completion_percentage} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground shrink-0">{rec.completion_percentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap"><StatusBadge status={rec.status} /></TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(rec)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit Hifz record</TooltipContent>
                      </Tooltip>
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
          <DialogHeader><DialogTitle>{editItem ? 'Update Hifz Progress' : 'Record Hifz Progress'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Student *</Label>
              <Select value={form.student_id} onValueChange={v => setForm(f => ({ ...f, student_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.student_id_code})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Surah</Label>
              <Select value={form.surah_number} onValueChange={v => setForm(f => ({ ...f, surah_number: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-48">
                  {SURAH_LIST.map(s => <SelectItem key={s.number} value={String(s.number)}>{s.number}. {s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Ayah From</Label><Input type="number" min="1" value={form.ayah_from} onChange={e => setForm(f => ({ ...f, ayah_from: e.target.value }))} className="px-3" /></div>
              <div className="space-y-1.5"><Label>Ayah To</Label><Input type="number" min="1" value={form.ayah_to} onChange={e => setForm(f => ({ ...f, ayah_to: e.target.value }))} className="px-3" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Completion %</Label><Input type="number" min="0" max="100" value={form.completion_percentage} onChange={e => setForm(f => ({ ...f, completion_percentage: e.target.value }))} className="px-3" /></div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as HifzStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="memorized">Memorized</SelectItem><SelectItem value="needs_revision">Needs Revision</SelectItem><SelectItem value="not_started">Not Started</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Teacher Notes</Label><Input value={form.teacher_notes} onChange={e => setForm(f => ({ ...f, teacher_notes: e.target.value }))} placeholder="Optional notes" className="px-3" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
