import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { GraduationCap, Users, ClipboardList, BookOpen, TrendingUp, BookMarked, DollarSign } from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted-foreground))'];

export default function ReportsPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [stats, setStats] = useState({
    students: 0, teachers: 0, attendance: 0, assessments: 0, hifzRecords: 0, revenue: 0,
  });
  const [attendanceSummary, setAttendanceSummary] = useState<{ day: string; present: number; absent: number }[]>([]);
  const [submissionScores, setSubmissionScores] = useState<{ range: string; count: number }[]>([]);
  const [hifzBreakdown, setHifzBreakdown] = useState<{ name: string; value: number }[]>([]);
  const [topStudents, setTopStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    const fetchAll = async () => {
      const [
        { count: s }, { count: t }, { count: a }, { count: asmt },
        { count: hifz }, { data: payments },
        { data: attData }, { data: submissions }, { data: hifzData },
        { data: studentScores },
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).is('deleted_at', null),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('role', 'teacher'),
        supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('assessments').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('hifz_progress').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('student_payments').select('amount').eq('organization_id', orgId),
        supabase.from('attendance').select('date, status').eq('organization_id', orgId).order('date', { ascending: false }).limit(100),
        supabase.from('assessment_submissions').select('score').eq('organization_id', orgId).not('score', 'is', null),
        supabase.from('hifz_progress').select('status').eq('organization_id', orgId),
        supabase.from('assessment_submissions').select('score, student_id').eq('organization_id', orgId).not('score', 'is', null).order('score', { ascending: false }).limit(5),
      ]);

      const revenue = (payments || []).reduce((acc, p) => acc + (p.amount || 0), 0);
      setStats({ students: s || 0, teachers: t || 0, attendance: a || 0, assessments: asmt || 0, hifzRecords: hifz || 0, revenue });

      // Build attendance by day-of-week
      const dayMap: Record<string, { present: number; absent: number }> = { Mon: { present: 0, absent: 0 }, Tue: { present: 0, absent: 0 }, Wed: { present: 0, absent: 0 }, Thu: { present: 0, absent: 0 }, Fri: { present: 0, absent: 0 } };
      (attData || []).forEach(r => {
        const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(r.date).getDay()];
        if (dayMap[day]) {
          if (r.status === 'present') dayMap[day].present++;
          else if (r.status === 'absent') dayMap[day].absent++;
        }
      });
      setAttendanceSummary(Object.entries(dayMap).map(([day, v]) => ({ day, ...v })));

      // Score distribution
      const ranges = [
        { range: '90–100%', min: 90, max: 100 },
        { range: '75–89%', min: 75, max: 89 },
        { range: '60–74%', min: 60, max: 74 },
        { range: '< 60%', min: 0, max: 59 },
      ];
      setSubmissionScores(ranges.map(r => ({
        range: r.range,
        count: (submissions || []).filter(s => s.score >= r.min && s.score <= r.max).length,
      })));

      // Hifz status breakdown
      const hm: Record<string, number> = {};
      (hifzData || []).forEach(h => { hm[h.status] = (hm[h.status] || 0) + 1; });
      setHifzBreakdown(Object.entries(hm).map(([name, value]) => ({ name, value })));

      // Top students by avg score
      const scoresByStudent: Record<string, number[]> = {};
      (studentScores || []).forEach(s => {
        if (!scoresByStudent[s.student_id]) scoresByStudent[s.student_id] = [];
        scoresByStudent[s.student_id].push(s.score);
      });
      const top = Object.entries(scoresByStudent).map(([id, scores]) => ({
        student_id: id,
        avg: scores.reduce((a, b) => a + b, 0) / scores.length,
        count: scores.length,
      })).sort((a, b) => b.avg - a.avg).slice(0, 5);
      setTopStudents(top);

      setLoading(false);
    };
    fetchAll();
  }, [orgId]);

  return (
    <div>
      <PageHeader title="Reports & Analytics" description="Institution performance and data-driven insights" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Students" value={loading ? '...' : stats.students} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard title="Teachers" value={loading ? '...' : stats.teachers} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Attendance Records" value={loading ? '...' : stats.attendance} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard title="Revenue (GHS)" value={loading ? '...' : stats.revenue.toFixed(2)} icon={<DollarSign className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" /> Attendance by Day of Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full min-w-0 overflow-hidden">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={attendanceSummary}>
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend layout="horizontal" wrapperStyle={{ paddingTop: 8 }} />
                  <Bar dataKey="present" fill="hsl(var(--primary))" name="Present" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" fill="hsl(var(--muted-foreground))" name="Absent" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> Score Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full min-w-0 overflow-hidden">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={submissionScores} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="range" type="category" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookMarked className="h-4 w-4 text-primary" /> Hifz Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hifzBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No Hifz records yet</p>
            ) : (
              <div className="w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={hifzBreakdown} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {hifzBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend layout="horizontal" wrapperStyle={{ paddingTop: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Institution Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Total Students', value: stats.students },
              { label: 'Total Teachers', value: stats.teachers },
              { label: 'Assessments Created', value: stats.assessments },
              { label: 'Hifz Progress Records', value: stats.hifzRecords },
              { label: 'Total Revenue (GHS)', value: stats.revenue.toFixed(2) },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-semibold text-foreground">{loading ? '...' : item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
