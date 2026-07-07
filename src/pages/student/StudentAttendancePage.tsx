import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

export default function StudentAttendancePage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  useEffect(() => {
    if (!orgId || !profile) return;
    supabase.from('students').select('id').eq('organization_id', orgId).eq('profile_id', profile.id).maybeSingle()
      .then(({ data: student }) => {
        if (!student) { setLoading(false); return; }
        supabase.from('attendance').select('*').eq('organization_id', orgId).eq('student_id', student.id)
          .order('date', { ascending: false })
          .then(({ data }) => { setRecords(data || []); setLoading(false); });
      });
  }, [orgId, profile]);

  // Derived stats
  const presentCount = records.filter(r => r.status === 'present').length;
  const absentCount  = records.filter(r => r.status === 'absent').length;
  const lateCount    = records.filter(r => r.status === 'late').length;
  const excusedCount = records.filter(r => r.status === 'excused').length;
  const rate = records.length ? Math.round((presentCount / records.length) * 100) : 0;

  // Month options from data
  const monthSet = new Set(records.map(r => r.date?.slice(0, 7)));
  const months = Array.from(monthSet).sort().reverse();

  const filtered = monthFilter === 'all' ? records : records.filter(r => r.date?.startsWith(monthFilter));
  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  return (
    <div>
      <PageHeader title="Attendance" description="View your attendance history" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Attendance Rate</p>
          <p className="text-2xl font-bold text-foreground mt-1">{rate}%</p>
          <Progress value={rate} className="h-2 mt-2" />
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Present</p>
          <p className="text-2xl font-bold text-success">{presentCount}</p>
          <p className="text-xs text-muted-foreground mt-1">{records.length} total classes</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Absent</p>
          <p className="text-2xl font-bold text-destructive">{absentCount}</p>
          {lateCount > 0 && <p className="text-xs text-muted-foreground mt-1">{lateCount} late</p>}
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Excused</p>
          <p className="text-2xl font-bold text-warning">{excusedCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Approved absences</p>
        </CardContent></Card>
      </div>

      {/* Month filter */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground">
          {monthFilter === 'all' ? `${filtered.length} records` : `${filtered.length} records in ${monthFilter}`}
        </p>
        <Select value={monthFilter} onValueChange={v => { setMonthFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All months" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {months.map(m => (
              <SelectItem key={m} value={m}>
                {new Date(m + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                {loading
                  ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                  : paginated.length === 0
                    ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No attendance records found</TableCell></TableRow>
                    : paginated.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {new Date(r.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="whitespace-nowrap"><StatusBadge status={r.status} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.notes || '—'}</TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
          {hasMore && (
            <div className="p-4 flex justify-center border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} className="gap-1.5">
                <ChevronDown className="h-4 w-4" />Load More
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

