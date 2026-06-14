import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Plus, Search, Loader2, Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';
import Papa from 'papaparse';
import type { Student } from '@/types/types';

const emptyForm = { full_name: '', gender: '', date_of_birth: '', guardian_name: '', guardian_phone: '', guardian_email: '', address: '', region: '', status: 'active' };

// CSV column aliases → our fields
const CSV_FIELD_MAP: Record<string, string> = {
  name: 'full_name', full_name: 'full_name', student_name: 'full_name',
  gender: 'gender', sex: 'gender',
  dob: 'date_of_birth', date_of_birth: 'date_of_birth', birthday: 'date_of_birth',
  guardian: 'guardian_name', guardian_name: 'guardian_name', parent: 'guardian_name',
  phone: 'guardian_phone', guardian_phone: 'guardian_phone', mobile: 'guardian_phone',
  email: 'guardian_email', guardian_email: 'guardian_email',
  address: 'address', region: 'region', area: 'region',
};

interface CsvRow { full_name: string; gender?: string; date_of_birth?: string; guardian_name?: string; guardian_phone?: string; guardian_email?: string; address?: string; region?: string; }

export default function StudentsPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  // CSV import state
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importDone, setImportDone] = useState(false);

  const fetchStudents = async () => {
    if (!orgId) return;
    const { data } = await supabase.from('students').select('*').eq('organization_id', orgId).is('deleted_at', null).order('full_name');
    setStudents(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, [orgId]);

  const filtered = students.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id_code.toLowerCase().includes(search.toLowerCase())
  );

  const genStudentId = async (code: string, existingCount: number) => {
    const year = new Date().getFullYear();
    const seq = String(existingCount + 1).padStart(4, '0');
    return `${code}-${year}-${seq}`;
  };

  const handleSave = async () => {
    if (!form.full_name || !orgId) { toast.error('Full name is required'); return; }
    setSaving(true);
    const year = new Date().getFullYear();
    const { data: inst } = await supabase.from('institutions').select('code').eq('id', orgId).maybeSingle();
    const code = inst?.code || 'SCH';
    const { data: existing } = await supabase.from('students').select('student_id_code').eq('organization_id', orgId).like('student_id_code', `${code}-${year}-%`);
    const studentIdCode = await genStudentId(code, existing?.length || 0);
    const { error } = await supabase.from('students').insert({
      organization_id: orgId, student_id_code: studentIdCode, full_name: form.full_name,
      gender: form.gender || null, date_of_birth: form.date_of_birth || null,
      guardian_name: form.guardian_name || null, guardian_phone: form.guardian_phone || null,
      guardian_email: form.guardian_email || null, address: form.address || null,
      region: form.region || null, status: form.status as 'active', created_by: profile?.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Student registered: ${studentIdCode}`);
    setShowDialog(false);
    setForm({ ...emptyForm });
    fetchStudents();
  };

  // ── CSV Import ────────────────────────────────────────────────────────────
  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvRows([]); setCsvErrors([]); setImportDone(false); setImportProgress(0);
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      transformHeader: (h: string) => {
        const key = h.trim().toLowerCase().replace(/\s+/g, '_');
        return CSV_FIELD_MAP[key] || key;
      },
      complete: (result) => {
        const rows: CsvRow[] = [];
        const errors: string[] = [];
        (result.data as Record<string, string>[]).forEach((row, i) => {
          const name = (row.full_name || '').trim();
          if (!name) { errors.push(`Row ${i + 2}: missing full name`); return; }
          rows.push({
            full_name: name,
            gender: row.gender?.trim() || undefined,
            date_of_birth: row.date_of_birth?.trim() || undefined,
            guardian_name: row.guardian_name?.trim() || undefined,
            guardian_phone: row.guardian_phone?.trim() || undefined,
            guardian_email: row.guardian_email?.trim() || undefined,
            address: row.address?.trim() || undefined,
            region: row.region?.trim() || undefined,
          });
        });
        setCsvRows(rows);
        setCsvErrors(errors);
        if (rows.length === 0) toast.error('No valid rows found in CSV');
        else toast.success(`${rows.length} student(s) ready to import${errors.length ? `, ${errors.length} skipped` : ''}`);
      },
      error: () => toast.error('Failed to parse CSV file'),
    });
  };

  const handleBatchImport = async () => {
    if (!orgId || csvRows.length === 0) return;
    setImporting(true); setImportProgress(0);
    const { data: inst } = await supabase.from('institutions').select('code').eq('id', orgId).maybeSingle();
    const code = inst?.code || 'SCH';
    const year = new Date().getFullYear();
    const { data: existing } = await supabase.from('students').select('student_id_code').eq('organization_id', orgId).like('student_id_code', `${code}-${year}-%`);
    let base = existing?.length || 0;
    let success = 0;
    let failed = 0;
    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      const studentIdCode = await genStudentId(code, base + i);
      const { error } = await supabase.from('students').insert({
        organization_id: orgId, student_id_code: studentIdCode, full_name: row.full_name,
        gender: row.gender || null, date_of_birth: row.date_of_birth || null,
        guardian_name: row.guardian_name || null, guardian_phone: row.guardian_phone || null,
        guardian_email: row.guardian_email || null, address: row.address || null,
        region: row.region || null, status: 'active', created_by: profile?.id,
      });
      if (error) failed++; else success++;
      setImportProgress(Math.round(((i + 1) / csvRows.length) * 100));
    }
    setImporting(false); setImportDone(true);
    toast.success(`Imported ${success} student(s)${failed ? ` — ${failed} failed` : ''}`);
    fetchStudents();
  };

  const downloadTemplate = () => {
    const csv = 'full_name,gender,date_of_birth,guardian_name,guardian_phone,guardian_email,address,region\nAhmad Al-Hassan,male,2010-03-15,Hassan Al-Hassan,+233501234567,hassan@email.com,"123 Main St",Greater Accra\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'students_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Students" description="Manage student records and profiles">
        <Button variant="outline" onClick={() => { setShowImportDialog(true); setCsvRows([]); setCsvErrors([]); setImportDone(false); setImportProgress(0); }}>
          <Upload className="h-4 w-4 mr-2" />CSV Import
        </Button>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />Register Student
        </Button>
      </PageHeader>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or ID..." className="pl-9 px-9 max-w-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Student</TableHead>
                  <TableHead className="whitespace-nowrap">Student ID</TableHead>
                  <TableHead className="whitespace-nowrap">Gender</TableHead>
                  <TableHead className="whitespace-nowrap">Guardian</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No students found.</TableCell></TableRow>
                ) : filtered.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary font-semibold text-sm">{s.full_name[0]}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{s.full_name}</p>
                          <p className="text-xs text-muted-foreground">{s.region || '—'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-sm">{s.student_id_code}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm capitalize">{s.gender || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{s.guardian_name || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap"><StatusBadge status={s.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Manual register dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>Register New Student</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1.5"><Label>Full Name *</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="px-3" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Gender</Label>
                <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} className="px-3" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Guardian Name</Label><Input value={form.guardian_name} onChange={e => setForm(f => ({ ...f, guardian_name: e.target.value }))} className="px-3" /></div>
              <div className="space-y-1.5"><Label>Guardian Phone</Label><Input value={form.guardian_phone} onChange={e => setForm(f => ({ ...f, guardian_phone: e.target.value }))} className="px-3" /></div>
            </div>
            <div className="space-y-1.5"><Label>Guardian Email</Label><Input type="email" value={form.guardian_email} onChange={e => setForm(f => ({ ...f, guardian_email: e.target.value }))} className="px-3" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="px-3" /></div>
              <div className="space-y-1.5"><Label>Region</Label><Input value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} className="px-3" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Register</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import dialog */}
      <Dialog open={showImportDialog} onOpenChange={v => { setShowImportDialog(v); if (!v && csvInputRef.current) csvInputRef.current.value = ''; }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />Bulk Student CSV Import
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Template download */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
              <div className="min-w-0">
                <p className="text-sm font-medium">Need a template?</p>
                <p className="text-xs text-muted-foreground">Download our CSV template with the correct column headers.</p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="shrink-0 gap-1.5">
                <Download className="h-3.5 w-3.5" />Template
              </Button>
            </div>

            {/* File picker */}
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => csvInputRef.current?.click()}
            >
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">Click to upload CSV file</p>
              <p className="text-xs text-muted-foreground mt-1">Columns: full_name, gender, date_of_birth, guardian_name, guardian_phone, guardian_email, address, region</p>
              <input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvFile} />
            </div>

            {/* Validation errors */}
            {csvErrors.length > 0 && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 space-y-1">
                <p className="text-xs font-medium text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />{csvErrors.length} row(s) will be skipped:
                </p>
                {csvErrors.slice(0, 5).map((e, i) => <p key={i} className="text-xs text-destructive ml-5">{e}</p>)}
                {csvErrors.length > 5 && <p className="text-xs text-destructive ml-5">+{csvErrors.length - 5} more…</p>}
              </div>
            )}

            {/* Preview table */}
            {csvRows.length > 0 && !importDone && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-success" />
                    {csvRows.length} student(s) ready to import
                  </p>
                  <Badge variant="outline" className="text-xs">Preview (first 5)</Badge>
                </div>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap text-xs">Name</TableHead>
                        <TableHead className="whitespace-nowrap text-xs">Gender</TableHead>
                        <TableHead className="whitespace-nowrap text-xs">Guardian</TableHead>
                        <TableHead className="whitespace-nowrap text-xs">Region</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvRows.slice(0, 5).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="whitespace-nowrap text-xs font-medium">{row.full_name}</TableCell>
                          <TableCell className="whitespace-nowrap text-xs capitalize">{row.gender || '—'}</TableCell>
                          <TableCell className="whitespace-nowrap text-xs">{row.guardian_name || '—'}</TableCell>
                          <TableCell className="whitespace-nowrap text-xs">{row.region || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {csvRows.length > 5 && <p className="text-xs text-muted-foreground mt-1 text-right">+{csvRows.length - 5} more rows not shown</p>}
              </div>
            )}

            {/* Import progress */}
            {importing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Importing…</span>
                  <span className="font-medium">{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
            )}

            {/* Done state */}
            {importDone && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm">
                <CheckCircle className="h-4 w-4 shrink-0" />
                Import complete! Students have been added to the roster.
              </div>
            )}
          </div>

          <DialogFooter>
            {!importDone && csvRows.length > 0 && (
              <Button onClick={handleBatchImport} disabled={importing} className="gap-2">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Import {csvRows.length} Student{csvRows.length !== 1 ? 's' : ''}
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              {importDone ? 'Done' : 'Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
