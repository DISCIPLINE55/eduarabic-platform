import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/common/StatCard';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, ClipboardList, BookMarked, DollarSign, TrendingUp, Bell } from 'lucide-react';

export default function ParentDashboard() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [childData, setChildData] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [hifzRecords, setHifzRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId || !profile) return;
    Promise.all([
      // Parent sees child linked to them: first try guardian_email match, then org fallback
      supabase.from('students').select('*').eq('organization_id', orgId).eq('guardian_email', profile.email ?? '').maybeSingle(),
      supabase.from('announcements').select('*, profiles(full_name)').eq('organization_id', orgId).eq('is_published', true).order('created_at', { ascending: false }).limit(4),
      supabase.from('hifz_progress').select('*').eq('organization_id', orgId).order('updated_at', { ascending: false }).limit(5),
    ]).then(([{ data: child }, { data: ann }, { data: hifz }]) => {
      setChildData(child);
      setAnnouncements(ann || []);
      setHifzRecords(hifz || []);
      setLoading(false);
    });
  }, [orgId]);

  const memorized = hifzRecords.filter(r => r.status === 'memorized').length;

  return (
    <div>
      <PageHeader title="Parent Dashboard" description={`Welcome, ${profile?.full_name || 'Parent'}`} />

      {childData && (
        <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm font-medium text-foreground">Monitoring: <span className="text-primary">{childData.full_name}</span></p>
          <p className="text-xs text-muted-foreground">Student ID: {childData.student_id_code}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Child's Status" value={childData?.status || '—'} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard title="Surahs Memorized" value={memorized} icon={<BookMarked className="h-5 w-5" />} />
        <StatCard title="Attendance" value="—" icon={<ClipboardList className="h-5 w-5" />} description="View details below" />
        <StatCard title="Outstanding Fees" value="GHS 0" icon={<DollarSign className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><BookMarked className="h-4 w-4 text-primary" />Hifz Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{memorized}/114 Surahs</span>
              </div>
              <Progress value={(memorized / 114) * 100} className="h-2" />
            </div>
            {hifzRecords.slice(0, 4).map(rec => (
              <div key={rec.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0 text-sm">
                <span className="text-foreground">Surah {rec.surah_number}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${rec.status === 'memorized' ? 'bg-success/10 text-success' : rec.status === 'in_progress' ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'}`}>
                  {rec.completion_percentage}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4 text-primary" />School Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No announcements</p>
            ) : announcements.map(ann => (
              <div key={ann.id} className="py-2 border-b border-border last:border-0">
                <p className="text-sm font-medium text-balance">{ann.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{ann.profiles?.full_name} • {new Date(ann.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
