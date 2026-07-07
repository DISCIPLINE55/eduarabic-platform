import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/common/StatCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardList, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { chartTooltipStyle, chartAxisTick, chartGridStroke } from '@/lib/chartStyles';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  present: { label: 'Present', color: 'bg-success/10 text-success border-success/30', icon: CheckCircle },
  absent:  { label: 'Absent',  color: 'bg-destructive/10 text-destructive border-destructive/30', icon: XCircle },
  late:    { label: 'Late',    color: 'bg-warning/10 text-warning border-warning/30', icon: Clock },
  excused: { label: 'Excused', color: 'bg-info/10 text-info border-info/30', icon: AlertCircle },
};

export default function ParentAttendancePage() {
  const { profile } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (!profile?.id) return;
    setLoading(true);
    // Find child linked via guardian_profile_id
    supabase.from('students')
      .select('id')
      .eq('guardian_profile_id', profile.id)
      .maybeSingle()
      .then(async ({ data: student }) => {
        if (!student) {
          // Fall back to guardian_email match
          const { data: byEmail } = await supabase
            .from('students').select('id').eq('guardian_email', profile.email ?? '').maybeSingle();
          return byEmail?.id;
        }
        return student.id;
      })
      .then(async (studentId) => {
        if (!studentId) { setLoading(false); return; }
        let q = supabase.from('attendance')
          .select('id, date, status, notes, classes(name)')
          .eq('student_id', studentId)
          .order('date', { ascending: false })
          .limit(365);
        const { data } = await q;
        setAttendance(data || []);
        setLoading(false);
      });
  }, [profile?.id]);

  const filtered = useMemo(() => {
    return attendance.filter(a => {
      if (dateFrom && a.date < dateFrom) return false;
      if (dateTo && a.date > dateTo) return false;
      return true;
    });
  }, [attendance, dateFrom, dateTo]);

  const total   = filtered.length;
  const present = filtered.filter(a => a.status === 'present').length;
  const absent  = filtered.filter(a => a.status === 'absent').length;
  const late    = filtered.filter(a => a.status === 'late').length;
  const excused = filtered.filter(a => a.status === 'excused').length;
  const rate    = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  // Monthly summary for chart
  const monthlyData = useMemo(() => {
    const map: Record<string, { month: string; Present: number; Absent: number; Late: number; Excused: number }> = {};
    filtered.forEach(a => {
      const d = new Date(a.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!map[key]) map[key] = { month: label, Present: 0, Absent: 0, Late: 0, Excused: 0 };
      const s = a.status.charAt(0).toUpperCase() + a.status.slice(1) as 'Present' | 'Absent' | 'Late' | 'Excused';
      map[key][s]++;
    });
    return Object.values(map).sort((a, b) => a.month < b.month ? -1 : 1);
  }, [filtered]);

  return (
    <div>
      <PageHeader title="Attendance Tracking" description="Your child's class attendance history and summary" />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Attendance Rate" value={`${rate}%`} icon={<ClipboardList className="h-5 w-5" />} description="Present + Late" />
        <StatCard title="Present" value={present} icon={<CheckCircle className="h-5 w-5" />} description="Days present" />
        <StatCard title="Absent" value={absent} icon={<XCircle className="h-5 w-5" />} description="Days absent" />
        <StatCard title="Late / Excused" value={`${late} / ${excused}`} icon={<Clock className="h-5 w-5" />} description="Days late / excused" />
      </div>

      {/* Date Filter */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 min-w-0 space-y-1">
              <Label className="text-sm font-normal">From Date</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <Label className="text-sm font-normal">To Date</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Chart */}
      {monthlyData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" /> Monthly Attendance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full min-w-0 overflow-hidden" style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                  <XAxis dataKey="month" tick={chartAxisTick} />
                  <YAxis tick={chartAxisTick} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend layout="horizontal" wrapperStyle={{ paddingTop: 8 }} />
                  <Bar dataKey="Present" fill="hsl(var(--success))" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Absent" fill="hsl(var(--destructive))" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Late" fill="hsl(var(--warning))" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Excused" fill="hsl(var(--info))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" /> Attendance Records
            <span className="ml-auto text-xs font-normal text-muted-foreground">{filtered.length} records</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Day</TableHead>
                  <TableHead className="whitespace-nowrap">Class</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading attendance records...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No attendance records found for selected date range</TableCell></TableRow>
                ) : filtered.map(rec => {
                  const cfg = statusConfig[rec.status] || statusConfig.absent;
                  const Icon = cfg.icon;
                  const d = new Date(rec.date);
                  return (
                    <TableRow key={rec.id}>
                      <TableCell className="whitespace-nowrap text-sm font-medium">
                        {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {d.toLocaleDateString('en-US', { weekday: 'long' })}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {rec.classes?.name || '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className={`text-xs flex items-center gap-1 w-fit ${cfg.color}`}>
                          <Icon className="h-3 w-3" />{cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground max-w-[180px] truncate">
                        {rec.notes || '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
