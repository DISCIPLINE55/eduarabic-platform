import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/common/StatCard';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ClipboardList, BookMarked, Mic, School, TrendingUp } from 'lucide-react';

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [stats, setStats] = useState({ classes: 0, assessments: 0, audioQueue: 0, hifzStudents: 0 });
  const [loading, setLoading] = useState(true);
  const [recentAssessments, setRecentAssessments] = useState<any[]>([]);

  useEffect(() => {
    if (!orgId || !profile) return;
    Promise.all([
      supabase.from('classes').select('*', { count: 'exact', head: true }).eq('teacher_id', profile.id).eq('organization_id', orgId),
      supabase.from('assessments').select('*', { count: 'exact', head: true }).eq('created_by', profile.id).eq('organization_id', orgId),
      supabase.from('audio_submissions').select('*', { count: 'exact', head: true }).eq('teacher_id', profile.id).eq('status', 'pending'),
      supabase.from('assessments').select('id, title, type, status, created_at').eq('created_by', profile.id).eq('organization_id', orgId).order('created_at', { ascending: false }).limit(5),
    ]).then(([{ count: classes }, { count: assessments }, { count: audio }, { data: recent }]) => {
      setStats({ classes: classes || 0, assessments: assessments || 0, audioQueue: audio || 0, hifzStudents: 0 });
      setRecentAssessments(recent || []);
      setLoading(false);
    });
  }, [orgId, profile]);

  return (
    <div>
      <PageHeader title="Teacher Dashboard" description={`Welcome, ${profile?.full_name || 'Teacher'}`} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="My Classes" value={loading ? '...' : stats.classes} icon={<School className="h-5 w-5" />} />
        <StatCard title="Assessments" value={loading ? '...' : stats.assessments} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard title="Audio Queue" value={loading ? '...' : stats.audioQueue} icon={<Mic className="h-5 w-5" />} description="Pending reviews" />
        <StatCard title="Hifz Students" value={loading ? '...' : stats.hifzStudents} icon={<BookMarked className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Recent Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAssessments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No assessments created yet</p>
          ) : (
            <div className="space-y-2">
              {recentAssessments.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{a.type}</p>
                  </div>
                  <Badge variant="outline" className={
                    a.status === 'published' ? 'bg-info/10 text-info border-info/30' :
                    a.status === 'results_published' ? 'bg-success/10 text-success border-success/30' :
                    'bg-muted text-muted-foreground'
                  }>{a.status.replace('_', ' ')}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
