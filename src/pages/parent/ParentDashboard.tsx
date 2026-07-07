import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/common/StatCard';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GraduationCap, ClipboardList, BookMarked, DollarSign, Bell, Link2, Search, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ParentDashboard() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [childData, setChildData] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [hifzRecords, setHifzRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Parent self-link state
  const [parentLinkCode, setParentLinkCode] = useState('');
  const [parentLinking, setParentLinking] = useState(false);
  const [parentLinkDone, setParentLinkDone] = useState(false);

  const fetchData = () => {
    if (!orgId || !profile) return;
    Promise.all([
      // Match by guardian_profile_id first, then fall back to guardian_email
      supabase
        .from('students')
        .select('*')
        .eq('organization_id', orgId)
        .or(`guardian_profile_id.eq.${profile.id},guardian_email.eq.${profile.email ?? ''}`)
        .maybeSingle(),
      supabase
        .from('announcements')
        .select('*, profiles(full_name)')
        .eq('organization_id', orgId)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(4),
      supabase
        .from('hifz_progress')
        .select('*')
        .eq('organization_id', orgId)
        .order('updated_at', { ascending: false })
        .limit(5),
    ]).then(([{ data: child }, { data: ann }, { data: hifz }]) => {
      setChildData(child);
      setAnnouncements(ann || []);
      setHifzRecords(hifz || []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, [orgId, profile?.id]);

  const handleParentLink = async () => {
    if (!parentLinkCode.trim() || !profile) return;
    setParentLinking(true);

    // Find student by code — must belong to same org AND guardian_email must match
    const { data: student, error } = await supabase
      .from('students')
      .select('id, full_name, guardian_email, guardian_profile_id')
      .eq('organization_id', orgId!)
      .eq('student_id_code', parentLinkCode.trim())
      .maybeSingle();

    if (error || !student) {
      toast.error('Student ID not found in your institution. Please double-check the code.');
      setParentLinking(false);
      return;
    }

    if (student.guardian_profile_id) {
      toast.error('This student record is already linked to a parent account.');
      setParentLinking(false);
      return;
    }

    // Verify guardian email matches (if set) — prevents random parents linking wrong children
    if (student.guardian_email && student.guardian_email.toLowerCase() !== (profile.email ?? '').toLowerCase()) {
      toast.error('Your email does not match the guardian email on record for this student. Please contact your administrator.');
      setParentLinking(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('students')
      .update({ guardian_profile_id: profile.id })
      .eq('id', student.id);

    setParentLinking(false);
    if (updateError) { toast.error(updateError.message); return; }

    toast.success(`Linked successfully! You are now monitoring ${student.full_name}.`);
    setParentLinkDone(true);
    fetchData();
  };

  const memorized = hifzRecords.filter(r => r.status === 'memorized').length;

  return (
    <div>
      <PageHeader title="Parent Dashboard" description={`Welcome, ${profile?.full_name || 'Parent'}`} />

      {/* ── Self-link banner: shown only when no child is linked ── */}
      {!loading && !childData && !parentLinkDone && (
        <Card className="mb-4 border-warning/30 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-balance">
              <Link2 className="h-4 w-4 text-warning shrink-0" />
              Link Your Child's Record
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3 text-pretty">
              Your account is not yet linked to a student record. Enter your child's <strong>Student ID Code</strong> (provided by their school) to start monitoring their progress.
            </p>
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. MQI-2024-0001"
                  value={parentLinkCode}
                  onChange={e => setParentLinkCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleParentLink()}
                  className="pl-9 px-9 font-mono"
                />
              </div>
              <Button
                onClick={handleParentLink}
                disabled={parentLinking || !parentLinkCode.trim()}
                className="shrink-0"
              >
                {parentLinking
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Linking…</>
                  : <><Link2 className="h-4 w-4 mr-2" />Link Child</>
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Success banner after link ── */}
      {parentLinkDone && !childData && (
        <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>Your account is now linked to your child's record. Data will appear below momentarily.</span>
        </div>
      )}

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
            {hifzRecords.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No hifz records yet</p>}
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
