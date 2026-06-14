import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Loader2, Award, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';

const CERT_TYPES = ['completion', 'attendance', 'hifz', 'academic'] as const;
type CertType = typeof CERT_TYPES[number];

const typeColors: Record<CertType, string> = {
  completion: 'bg-info/10 text-info border-info/30',
  attendance: 'bg-success/10 text-success border-success/30',
  hifz: 'bg-secondary text-secondary-foreground border-border',
  academic: 'bg-warning/10 text-warning border-warning/30',
};

const typeLabel: Record<CertType, string> = {
  completion: 'Certificate of Completion',
  attendance: 'Certificate of Attendance',
  hifz: 'Hifz Achievement Certificate',
  academic: 'Academic Excellence Certificate',
};

export default function CertificatesPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [certificates, setCertificates] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [institution, setInstitution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [form, setForm] = useState({ student_id: '', title: '', certificate_type: 'completion' as CertType, description: '' });

  const fetchData = async () => {
    if (!orgId) return;
    const [{ data: certs }, { data: studs }, { data: inst }] = await Promise.all([
      supabase.from('certificates').select('*, students(full_name, student_id_code)').eq('organization_id', orgId).order('issued_date', { ascending: false }),
      supabase.from('students').select('id, full_name, student_id_code').eq('organization_id', orgId).eq('status', 'active').order('full_name'),
      supabase.from('institutions').select('name, code').eq('id', orgId).maybeSingle(),
    ]);
    setCertificates(certs || []);
    setStudents(studs || []);
    setInstitution(inst);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [orgId]);

  const generateCertId = () => {
    const year = new Date().getFullYear();
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CERT-${year}-${rand}`;
  };

  const handleSave = async () => {
    if (!form.student_id || !form.title || !orgId) { toast.error('Student and title are required'); return; }
    setSaving(true);
    const certId = generateCertId();
    const { error } = await supabase.from('certificates').insert({
      organization_id: orgId, student_id: form.student_id, title: form.title,
      certificate_type: form.certificate_type, certificate_code: certId,
      description: form.description || null, issued_date: new Date().toISOString().split('T')[0],
      issued_by: profile?.id, created_by: profile?.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Certificate issued! ID: ${certId}`);
    setShowDialog(false);
    setForm({ student_id: '', title: '', certificate_type: 'completion', description: '' });
    fetchData();
  };

  const exportPDF = async (cert: any) => {
    setExportingId(cert.id);
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();

      // Outer decorative border
      doc.setDrawColor(140, 100, 40); // brass gold tone
      doc.setLineWidth(3);
      doc.rect(8, 8, W - 16, H - 16);
      doc.setLineWidth(1);
      doc.rect(11, 11, W - 22, H - 22);

      // Header — institution name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(90, 30, 30); // deep crimson
      doc.text((institution?.name || 'EduArabic Institution').toUpperCase(), W / 2, 28, { align: 'center' });

      // Decorative line
      doc.setDrawColor(140, 100, 40);
      doc.setLineWidth(0.8);
      doc.line(30, 32, W - 30, 32);

      // Certificate heading
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(140, 100, 40);
      const certTypeTitle = typeLabel[cert.certificate_type as CertType] || 'Certificate';
      doc.text(certTypeTitle.toUpperCase(), W / 2, 50, { align: 'center' });

      // "This is to certify that"
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      doc.text('This is to certify that', W / 2, 68, { align: 'center' });

      // Student name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(40, 40, 40);
      doc.text(cert.students?.full_name || 'Student Name', W / 2, 84, { align: 'center' });

      // Underline for name
      const nameWidth = doc.getTextWidth(cert.students?.full_name || 'Student Name');
      doc.setDrawColor(140, 100, 40);
      doc.setLineWidth(0.5);
      doc.line((W - nameWidth) / 2, 87, (W + nameWidth) / 2, 87);

      // Certificate body text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      const bodyText = cert.description ||
        `has successfully fulfilled all requirements for the ${certTypeTitle.toLowerCase()} at ${institution?.name || 'EduArabic'}.`;
      const lines = doc.splitTextToSize(bodyText, W - 80);
      doc.text(lines, W / 2, 100, { align: 'center' });

      // Issued date
      const issuedDate = cert.issued_date
        ? new Date(cert.issued_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(`Issued on: ${issuedDate}`, W / 2, H - 42, { align: 'center' });

      // Certificate ID + Student ID
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`Certificate ID: ${cert.certificate_code}`, 20, H - 20);
      doc.text(`Student ID: ${cert.students?.student_id_code || '—'}`, W / 2, H - 20, { align: 'center' });
      doc.text(`Verify at: eduarabic.app/verify/${cert.certificate_code}`, W - 20, H - 20, { align: 'right' });

      // Signature line
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.4);
      doc.line(W / 2 - 40, H - 32, W / 2 + 40, H - 32);
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text('Authorised Signatory', W / 2, H - 27, { align: 'center' });

      doc.save(`${cert.certificate_code}-${(cert.students?.full_name || 'student').replace(/\s+/g, '-')}.pdf`);
      toast.success('Certificate PDF downloaded');
    } catch (err) {
      toast.error('Failed to generate PDF');
      console.error(err);
    }
    setExportingId(null);
  };

  return (
    <div>
      <PageHeader title="Certificates" description="Issue and manage student certificates">
        <Button onClick={() => setShowDialog(true)}><Plus className="h-4 w-4 mr-2" />Issue Certificate</Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Student</TableHead>
                  <TableHead className="whitespace-nowrap">Certificate</TableHead>
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap">Certificate ID</TableHead>
                  <TableHead className="whitespace-nowrap">Issued</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Export</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  : certificates.length === 0
                    ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No certificates issued yet</TableCell></TableRow>
                    : certificates.map(cert => (
                      <TableRow key={cert.id}>
                        <TableCell className="whitespace-nowrap">
                          <p className="text-sm font-medium">{cert.students?.full_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{cert.students?.student_id_code}</p>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm font-medium">{cert.title}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline" className={`text-xs capitalize ${typeColors[cert.certificate_type as CertType] || ''}`}>{cert.certificate_type}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">{cert.certificate_code}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{cert.issued_date ? new Date(cert.issued_date).toLocaleDateString() : '—'}</TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          <Button
                            variant="outline" size="sm" className="h-8 gap-1.5"
                            onClick={() => exportPDF(cert)}
                            disabled={exportingId === cert.id}
                          >
                            {exportingId === cert.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Download className="h-3.5 w-3.5" />}
                            PDF
                          </Button>
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
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Award className="h-4 w-4 text-primary" />Issue Certificate</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Student *</Label>
              <Select value={form.student_id} onValueChange={v => setForm(f => ({ ...f, student_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.student_id_code})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Certificate Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Quran Completion Certificate" className="px-3" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.certificate_type} onValueChange={v => setForm(f => ({ ...f, certificate_type: v as CertType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CERT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
              A unique Certificate ID and verification URL will be automatically generated. Use the PDF export button to download a printable certificate.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Issue Certificate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
