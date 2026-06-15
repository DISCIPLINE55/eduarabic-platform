import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Download, QrCode } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function StudentCertificatesPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId || !profile) return;
    // Resolve student record linked to this auth user first
    supabase.from('students').select('id').eq('organization_id', orgId).eq('profile_id', profile.id).maybeSingle()
      .then(({ data: student }) => {
        if (!student) { setLoading(false); return; }
        supabase.from('certificates').select('*').eq('organization_id', orgId).eq('student_id', student.id)
          .order('issued_date', { ascending: false })
          .then(({ data }) => { setCertificates(data || []); setLoading(false); });
      });
  }, [orgId, profile]);

  const typeColors: Record<string, string> = {
    completion: 'bg-info/10 text-info border-info/30',
    attendance: 'bg-success/10 text-success border-success/30',
    hifz: 'bg-secondary text-secondary-foreground border-border',
    academic: 'bg-warning/10 text-warning border-warning/30',
  };

  return (
    <div>
      <PageHeader title="Certificates" description="View and download your achievement certificates" />

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : certificates.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
            <p className="text-foreground font-medium mb-1">No certificates yet</p>
            <p className="text-sm text-muted-foreground text-pretty">Complete courses and achievements to earn certificates</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map(cert => (
            <Card key={cert.id} className="h-full flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-balance">{cert.title}</p>
                    <Badge variant="outline" className={`text-xs mt-1 capitalize ${typeColors[cert.certificate_type] || 'bg-muted text-muted-foreground'}`}>
                      {cert.certificate_type}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm flex-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Certificate ID</span>
                    <span className="font-mono text-xs text-foreground">{cert.certificate_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Issued</span>
                    <span className="text-foreground">{cert.issued_date ? new Date(cert.issued_date).toLocaleDateString() : '—'}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1 h-8"
                    onClick={() => toast.info('PDF download will be available soon')}>
                    <Download className="h-3.5 w-3.5 mr-1.5" />PDF
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-3"
                    onClick={() => toast.info(cert.qr_data || cert.certificate_code || 'No QR data')}>
                    <QrCode className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
