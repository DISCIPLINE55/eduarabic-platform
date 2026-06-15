import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import { GraduationCap, BookOpenCheck, ClipboardList, BookMarked, TrendingUp } from 'lucide-react';

export default function ParentProgressPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [child, setChild] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [hifz, setHifz] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId || !profile) return;
    Promise.all([
      supabase.from('students').select('*').eq('organization_id', orgId).eq('guardian_email', profile.email ?? '').maybeSingle(),
      supabase.from('assessment_submissions').select('*, assessments(title, type)').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(10),
      supabase.from('attendance').select('*').eq('organization_id', orgId).order('date', { ascending: false }).limit(30),
      supabase.from('hifz_progress').select('*').eq('organization_id', orgId).order('updated_at', { ascending: false }),
    ]).then(([{ data: c }, { data: subs }, { data: att }, { data: hf }]) => {
      setChild(c);
      setSubmissions(subs || []);
      setAttendance(att || []);
      setHifz(hf || []);
      setLoading(false);
    });
  }, [orgId]);

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;
  const memorized = hifz.filter(h => h.status === 'memorized').length;
  const avgScore = submissions.filter(s => s.score != null).reduce((acc, s, _, arr) => acc + s.score / arr.length, 0);

  const scoreChart = submissions.filter(s => s.score != null).slice(0, 8).reverse().map((s, i) => ({
    label: `#${i + 1}`,
    score: Math.round(s.score),
    title: s.assessments?.title || 'Assessment',
  }));

  const hifzStatus = [
    { name: 'Memorized', value: memorized },
    { name: 'In Progress', value: hifz.filter(h => h.status === 'in_progress').length },
    { name: 'Needs Revision', value: hifz.filter(h => h.status === 'needs_revision').length },
  ];

  return (
    <div>
      <PageHeader title="Child's Progress" description="Overview of academic and spiritual development" />

      {child && (
        <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg flex flex-col md:flex-row md:items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{child.full_name}</p>
            <p className="text-xs text-muted-foreground">Student ID: {child.student_id_code}</p>
          </div>
          <Badge variant="outline" className={child.status === 'active' ? 'bg-success/10 text-success border-success/30' : 'bg-muted'}>
            {child.status}
          </Badge>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Attendance Rate" value={loading ? '...' : `${attendanceRate}%`} icon={<ClipboardList className="h-5 w-5" />} description={`${presentCount}/${attendance.length} days`} />
        <StatCard title="Average Score" value={loading ? '...' : (avgScore > 0 ? `${avgScore.toFixed(1)}%` : '—')} icon={<BookOpenCheck className="h-5 w-5" />} description="Across all assessments" />
        <StatCard title="Surahs Memorized" value={loading ? '...' : memorized} icon={<BookMarked className="h-5 w-5" />} description="Out of 114" />
        <StatCard title="Assessments Taken" value={loading ? '...' : submissions.length} icon={<GraduationCap className="h-5 w-5" />} description="Submitted" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Assessment Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scoreChart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No graded assessments yet</p>
            ) : (
              <div className="w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={scoreChart}>
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => [`${v}%`, 'Score']} />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookMarked className="h-4 w-4 text-primary" /> Hifz Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Overall Completion</span>
                <span className="font-semibold text-foreground">{memorized}/114 Surahs</span>
              </div>
              <Progress value={(memorized / 114) * 100} className="h-2.5" />
            </div>
            <div className="w-full min-w-0 overflow-hidden">
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={hifzStatus} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpenCheck className="h-4 w-4 text-primary" /> Recent Assessment Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No submissions yet</p>
          ) : (
            <div className="space-y-2">
              {submissions.slice(0, 6).map(sub => (
                <div key={sub.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-balance truncate">{sub.assessments?.title || 'Assessment'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{sub.assessments?.type} • {new Date(sub.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="shrink-0 ml-3 text-right">
                    {sub.score != null ? (
                      <span className={`text-sm font-bold ${sub.score >= 80 ? 'text-success' : sub.score >= 60 ? 'text-warning' : 'text-destructive'}`}>
                        {sub.score.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
