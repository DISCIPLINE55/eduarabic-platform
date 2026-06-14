import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/common/StatCard';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, School, BookOpen, TrendingUp, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AttendanceChartRow { day: string; present: number; absent: number }

export default function AdminDashboard() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0, assessments: 0 });
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceChartRow[]>([]);

  useEffect(() => {
    if (!orgId) return;
    const fetchData = async () => {
      // Last 5 calendar days
      const days: string[] = [];
      for (let i = 4; i >= 0; i--) {
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
        { data: attRows },
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).is('deleted_at', null),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('role', 'teacher'),
        supabase.from('classes').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).is('deleted_at', null),
        supabase.from('assessments').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('announcements').select('id, title, created_at').eq('organization_id', orgId).eq('is_published', true).order('created_at', { ascending: false }).limit(5),
        supabase.from('attendance').select('date, status').eq('organization_id', orgId).gte('date', days[0]).lte('date', days[4]),
      ]);

      setStats({ students: students || 0, teachers: teachers || 0, classes: classes || 0, assessments: assessments || 0 });
      setAnnouncements(ann || []);

      // Aggregate real attendance by date
      const grouped: Record<string, { present: number; absent: number }> = {};
      days.forEach(d => { grouped[d] = { present: 0, absent: 0 }; });
      (attRows || []).forEach((r: any) => {
        if (!grouped[r.date]) return;
        if (r.status === 'present' || r.status === 'late') grouped[r.date].present++;
        else grouped[r.date].absent++;
      });
      setAttendanceData(
        days.map(d => ({
          day: new Date(d + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' }),
          present: grouped[d].present,
          absent: grouped[d].absent,
        }))
      );

      setLoading(false);
    };
    fetchData();
  }, [orgId]);

  return (
    <div>
      <PageHeader title="Admin Dashboard" description={`Welcome back, ${profile?.full_name || 'Admin'}`} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Students" value={loading ? '...' : stats.students} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard title="Teachers" value={loading ? '...' : stats.teachers} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Classes" value={loading ? '...' : stats.classes} icon={<School className="h-5 w-5" />} />
        <StatCard title="Assessments" value={loading ? '...' : stats.assessments} icon={<BookOpen className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Attendance (Last 5 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full min-w-0 overflow-hidden">
              {!loading && attendanceData.every(d => d.present === 0 && d.absent === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-8">No attendance records for the past 5 days</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={attendanceData}>
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend layout="horizontal" wrapperStyle={{ paddingTop: 8 }} />
                    <Bar dataKey="present" fill="hsl(var(--primary))" name="Present" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="absent" fill="hsl(var(--muted-foreground))" name="Absent" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" /> Recent Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No announcements yet</p>
            ) : (
              <div className="space-y-3">
                {announcements.map(ann => (
                  <div key={ann.id} className="border-b border-border pb-2 last:border-0">
                    <p className="text-sm font-medium truncate">{ann.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(ann.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
