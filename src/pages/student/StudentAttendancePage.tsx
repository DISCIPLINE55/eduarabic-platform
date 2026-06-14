import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Progress } from '@/components/ui/progress';

export default function StudentAttendancePage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    supabase.from('attendance').select('*').eq('organization_id', orgId).order('date', { ascending: false }).limit(30)
      .then(({ data }) => { setRecords(data || []); setLoading(false); });
  }, [orgId]);

  const presentCount = records.filter(r => r.status === 'present').length;
  const rate = records.length ? Math.round((presentCount / records.length) * 100) : 0;

  return (
    <div>
      <PageHeader title="Attendance" description="View your attendance history" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Attendance Rate</p>
          <p className="text-2xl font-bold text-foreground mt-1">{rate}%</p>
          <Progress value={rate} className="h-2 mt-2" />
        </CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Classes</p><p className="text-2xl font-bold">{records.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Present</p><p className="text-2xl font-bold text-success">{presentCount}</p></CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                : records.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No attendance records found</TableCell></TableRow>
                : records.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-sm">{new Date(r.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                    <TableCell className="whitespace-nowrap"><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.notes || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
