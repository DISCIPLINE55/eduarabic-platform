import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/common/StatCard';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, BookMarked, Award, ClipboardList, Bell, Sparkles, RefreshCw, BookOpen, ChevronRight, Star, Link2, Search, Loader2, CheckCircle, CalendarCheck, BookText, ArrowRight } from 'lucide-react';
import { streamLLM } from '@/lib/llm';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Recommendation {
  surah: string;
  reason: string;
  priority: 'high' | 'medium' | 'review';
}

function parseRecommendations(text: string): Recommendation[] {
  const recs: Recommendation[] = [];
  const jsonMatch = text.match(/\[[\s\S]*?\]/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) return parsed.slice(0, 4);
    } catch { /* fall through */ }
  }
  const lines = text.split('\n').filter(l => /^\d+\./.test(l.trim()));
  for (const line of lines.slice(0, 4)) {
    const clean = line.replace(/^\d+\.\s*/, '').trim();
    const parts = clean.split(/[–\-:]/);
    recs.push({
      surah: parts[0]?.trim() || clean,
      reason: parts.slice(1).join(' – ').trim() || 'Continue memorization',
      priority: recs.length === 0 ? 'high' : recs.length < 2 ? 'medium' : 'review',
    });
  }
  return recs;
}

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/30',
  medium: 'bg-primary/10 text-primary border-primary/30',
  review: 'bg-success/10 text-success border-success/30',
};
const PRIORITY_LABEL: Record<string, string> = { high: 'Start Next', medium: 'Continue', review: 'Revise' };

export default function StudentDashboard() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [studentData, setStudentData] = useState<any>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [hifzProgress, setHifzProgress] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [quranProgress, setQuranProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Self-link state
  const [selfLinkCode, setSelfLinkCode] = useState('');
  const [selfLinking, setSelfLinking] = useState(false);
  const [selfLinkDone, setSelfLinkDone] = useState(false);

  // AI panel state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecs, setAiRecs] = useState<Recommendation[]>([]);
  const [aiError, setAiError] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const aiInitialized = useRef(false);

  useEffect(() => {
    if (!profile || !orgId) return;
    // First get student record, then fetch everything in parallel
    supabase.from('students').select('*').eq('organization_id', orgId).eq('profile_id', profile.id).maybeSingle()
      .then(({ data: student }) => {
        setStudentData(student);
        const studentId = student?.id;
        Promise.all([
          // assessments
          supabase.from('assessments').select('*, subjects(name)').eq('organization_id', orgId).eq('status', 'published').order('created_at', { ascending: false }).limit(5),
          // student's own submissions
          studentId
            ? supabase.from('assessment_submissions').select('assessment_id,status,score').eq('organization_id', orgId).eq('student_id', studentId)
            : Promise.resolve({ data: [] }),
          // hifz — student-specific
          studentId
            ? supabase.from('hifz_progress').select('*').eq('organization_id', orgId).eq('student_id', studentId).order('updated_at', { ascending: false }).limit(20)
            : supabase.from('hifz_progress').select('*').eq('organization_id', orgId).limit(0),
          // announcements
          supabase.from('announcements').select('*, profiles(full_name)').eq('organization_id', orgId).eq('is_published', true).order('created_at', { ascending: false }).limit(4),
          // certificates
          studentId
            ? supabase.from('certificates').select('id,title,certificate_type,issued_date').eq('organization_id', orgId).eq('student_id', studentId)
            : Promise.resolve({ data: [] }),
          // attendance (last 30)
          studentId
            ? supabase.from('attendance').select('status').eq('organization_id', orgId).eq('student_id', studentId).limit(30)
            : Promise.resolve({ data: [] }),
          // quran reading progress
          supabase.from('quran_reading_progress').select('surah_number,pages_visited').eq('user_id', profile.id),
        ]).then(([
          { data: assmts },
          { data: subs },
          { data: hifz },
          { data: ann },
          { data: certs },
          { data: att },
          { data: qprog },
        ]) => {
          setAssessments(assmts || []);
          setSubmissions((subs as any[]) || []);
          setHifzProgress(hifz || []);
          setAnnouncements(ann || []);
          setCertificates(certs || []);
          setAttendanceRecords(att || []);
          setQuranProgress(qprog || []);
          setLoading(false);
        });
      });
  }, [profile, orgId]);

  const memorizedCount = hifzProgress.filter(h => h.status === 'memorized' || h.completion_percentage >= 100).length;
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const attendanceRate = attendanceRecords.length ? Math.round((presentCount / attendanceRecords.length) * 100) : 0;
  const totalPagesRead = quranProgress.reduce((acc, r) => acc + (r.pages_visited?.length || 0), 0);
  const quranPct = Math.min(100, Math.round((totalPagesRead / 604) * 100));

  // Pending (not-submitted) assessments for this student
  const submittedIds = new Set(submissions.map((s: any) => s.assessment_id));
  const pendingAssessments = assessments.filter(a => !submittedIds.has(a.id));
  const handleSelfLink = async () => {
    if (!selfLinkCode.trim() || !profile || !orgId) return;
    setSelfLinking(true);
    const { data: student, error } = await supabase
      .from('students')
      .select('id, full_name, profile_id')
      .eq('organization_id', orgId)
      .eq('student_id_code', selfLinkCode.trim())
      .is('profile_id', null)
      .maybeSingle();
    if (error || !student) {
      toast.error('No unlinked student record found with that ID. Check the code and try again.');
      setSelfLinking(false);
      return;
    }
    const { error: linkError } = await supabase
      .from('students')
      .update({ profile_id: profile.id })
      .eq('id', student.id);
    setSelfLinking(false);
    if (linkError) { toast.error(linkError.message); return; }
    toast.success(`Linked to student record: ${student.full_name}`);
    setSelfLinkDone(true);
    setStudentData(student);
  };

  const generateRecommendations = useCallback(async (hifzData?: any[]) => {
    const progress = hifzData ?? hifzProgress;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setAiLoading(true);
    setAiRecs([]);
    setAiError('');

    const completed = progress.filter(h => h.status === 'completed' || h.completion_percentage >= 100);
    const inProgress = progress.filter(h => h.status === 'in_progress' || (h.completion_percentage > 0 && h.completion_percentage < 100));
    const notStarted = progress.filter(h => h.status === 'not_started' || h.completion_percentage === 0);

    const progressSummary = progress.length > 0
      ? [
          completed.length ? `Completed: ${completed.map(h => `${h.surah_name} (${h.completion_percentage}%)`).join(', ')}` : '',
          inProgress.length ? `In Progress: ${inProgress.map(h => `${h.surah_name} (${h.completion_percentage}%)`).join(', ')}` : '',
          notStarted.length ? `Not Started yet: ${notStarted.map(h => h.surah_name).slice(0, 5).join(', ')}` : '',
        ].filter(Boolean).join('\n')
      : 'No Hifz records yet (complete beginner — recommend short Surahs from Juz Amma)';

    const prompt = `You are an expert Quran memorization (Hifz) coach for an Islamic school platform.

Student: ${profile?.full_name || 'Student'}
Current Hifz Progress:
${progressSummary}

Based on this progress, provide exactly 4 personalised Surah study recommendations.
Return ONLY a JSON array — no markdown, no code block, no explanation. Each object must have:
- "surah": Surah name and number e.g. "Al-Fatiha (1)"
- "reason": 1 short sentence explaining why recommended
- "priority": one of "high", "medium", or "review"

Example output: [{"surah":"Al-Baqarah (2)","reason":"Continue from verse 50 to maintain momentum","priority":"high"}]`;

    await streamLLM(
      [{ role: 'user', parts: [{ text: prompt }] }],
      {
        onChunk: () => {},
        onComplete: (text: string) => {
          setAiRecs(parseRecommendations(text));
          setAiLoading(false);
        },
        onError: (err) => {
          setAiError(err.message || 'Failed to generate recommendations');
          setAiLoading(false);
        },
        signal: abortRef.current.signal,
      },
      'You are a Quran Hifz coach. Output only valid compact JSON arrays, no markdown code blocks.'
    );
  }, [hifzProgress, profile]);

  // Auto-generate once data loads (once only)
  useEffect(() => {
    if (!loading && !aiInitialized.current) {
      aiInitialized.current = true;
      generateRecommendations(hifzProgress);
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <PageHeader title="My Dashboard" description={`Welcome, ${profile?.full_name || 'Student'}`} />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 space-y-2">
              <Skeleton className="h-3 w-24 bg-muted" />
              <Skeleton className="h-7 w-16 bg-muted" />
            </CardContent></Card>
          ))
        ) : (
          <>
            <StatCard title="Hifz Memorized" value={`${memorizedCount} / 114`} icon={<BookMarked className="h-5 w-5" />}
              description={`${Math.round((memorizedCount / 114) * 100)}% of Quran`} />
            <StatCard title="Assessments Due" value={pendingAssessments.length} icon={<ClipboardList className="h-5 w-5" />}
              description={`${submissions.length} submitted`} />
            <StatCard title="Attendance" value={`${attendanceRate}%`} icon={<CalendarCheck className="h-5 w-5" />}
              description={`${presentCount} / ${attendanceRecords.length} classes`} />
            <StatCard title="Certificates" value={certificates.length} icon={<Award className="h-5 w-5" />}
              description={certificates.length === 0 ? 'Keep learning!' : 'Earned'} />
          </>
        )}
      </div>

      {/* ── Self-link banner ── */}
      {!loading && !studentData && !selfLinkDone && (
        <Card className="mb-4 border-warning/30 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-balance">
              <Link2 className="h-4 w-4 text-warning shrink-0" />Link Your Student Record
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3 text-pretty">
              Your login is not yet linked to a student record. Enter the <strong>Student ID Code</strong> provided by your school administrator.
            </p>
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="e.g. MQI-2024-0001" value={selfLinkCode}
                  onChange={e => setSelfLinkCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSelfLink()}
                  className="pl-9 px-9 font-mono" />
              </div>
              <Button onClick={handleSelfLink} disabled={selfLinking || !selfLinkCode.trim()} className="shrink-0">
                {selfLinking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
                Link Account
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {selfLinkDone && (
        <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>Your account is now linked. Refresh the page to see your full profile.</span>
        </div>
      )}

      {/* ── Progress row: Hifz + Attendance + Quran ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium flex items-center gap-1.5"><BookMarked className="h-4 w-4 text-primary" />Hifz Progress</p>
              <Link to="/student/hifz" className="text-xs text-primary hover:underline flex items-center gap-0.5">View <ArrowRight className="h-3 w-3" /></Link>
            </div>
            {loading ? <Skeleton className="h-3 w-full bg-muted mt-3" /> : (
              <>
                <Progress value={(memorizedCount / 114) * 100} className="h-2 mb-1.5" />
                <p className="text-xs text-muted-foreground">{memorizedCount} surahs memorized</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium flex items-center gap-1.5"><CalendarCheck className="h-4 w-4 text-primary" />Attendance</p>
              <Link to="/student/attendance" className="text-xs text-primary hover:underline flex items-center gap-0.5">View <ArrowRight className="h-3 w-3" /></Link>
            </div>
            {loading ? <Skeleton className="h-3 w-full bg-muted mt-3" /> : (
              <>
                <Progress value={attendanceRate} className="h-2 mb-1.5" />
                <p className="text-xs text-muted-foreground">{attendanceRate}% present rate ({attendanceRecords.length} classes)</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium flex items-center gap-1.5"><BookText className="h-4 w-4 text-primary" />Quran Reading</p>
              <Link to="/student/quran" className="text-xs text-primary hover:underline flex items-center gap-0.5">Read <ArrowRight className="h-3 w-3" /></Link>
            </div>
            {loading ? <Skeleton className="h-3 w-full bg-muted mt-3" /> : (
              <>
                <Progress value={quranPct} className="h-2 mb-1.5" />
                <p className="text-xs text-muted-foreground">{totalPagesRead} / 604 pages read ({quranPct}%)</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── AI Study Recommendations ── */}
      <Card className="mb-4 border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />AI Study Recommendations
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/10 ml-1">Powered by AI</Badge>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => generateRecommendations()} disabled={aiLoading}
              className="h-7 text-xs text-primary hover:bg-primary/10">
              <RefreshCw className={`h-3 w-3 mr-1 ${aiLoading ? 'animate-spin' : ''}`} />
              {aiLoading ? 'Analysing…' : 'Refresh'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Personalised Surah suggestions based on your Hifz progress</p>
        </CardHeader>
        <CardContent>
          {aiError ? (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3 flex items-start gap-2">
              <Star className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{aiError} — <button onClick={() => generateRecommendations()} className="underline font-medium">Try again</button></span>
            </div>
          ) : aiLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-2">
                  <Skeleton className="h-4 w-2/3 bg-muted" /><Skeleton className="h-3 w-full bg-muted" /><Skeleton className="h-3 w-1/2 bg-muted" />
                </div>
              ))}
            </div>
          ) : aiRecs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiRecs.map((rec, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-3 flex items-start gap-3 hover:border-primary/40 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-foreground">{rec.surah}</p>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${PRIORITY_STYLES[rec.priority] ?? PRIORITY_STYLES.medium}`}>
                        {PRIORITY_LABEL[rec.priority] ?? rec.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground text-pretty leading-relaxed">{rec.reason}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Click <strong>Refresh</strong> to generate your personalised study plan.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Bottom row: Assessments + Announcements ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />Pending Assessments
              </CardTitle>
              <Link to="/student/assessments" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-10 w-full bg-muted"/>)}</div>
            ) : pendingAssessments.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">All caught up! No pending assessments.</p>
              </div>
            ) : pendingAssessments.map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{a.type}{a.duration_minutes ? ` · ${a.duration_minutes} min` : ''}</p>
                </div>
                <Link to="/student/assessments">
                  <Badge variant="outline" className="bg-info/10 text-info border-info/30 text-xs shrink-0 ml-2 cursor-pointer hover:bg-info/20">Start</Badge>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />Announcements
              </CardTitle>
              <Link to="/student/announcements" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-10 w-full bg-muted"/>)}</div>
            ) : announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No announcements</p>
            ) : announcements.map(ann => (
              <div key={ann.id} className="py-2 border-b border-border last:border-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <p className="text-sm font-medium text-balance flex-1 min-w-0">{ann.title}</p>
                  {ann.priority && ann.priority !== 'normal' && (
                    <Badge variant="outline" className={`text-[10px] shrink-0 capitalize ${ann.priority === 'urgent' ? 'border-destructive/40 text-destructive bg-destructive/10' : 'border-primary/30 text-primary bg-primary/10'}`}>
                      {ann.priority}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ann.profiles?.full_name} · {new Date(ann.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
