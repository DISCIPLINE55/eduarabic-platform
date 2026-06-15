import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/common/StatCard';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, BookMarked, Award, ClipboardList, Bell, Sparkles, RefreshCw, BookOpen, ChevronRight, Star } from 'lucide-react';
import { streamLLM } from '@/lib/llm';

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
  const [hifzProgress, setHifzProgress] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // AI panel state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecs, setAiRecs] = useState<Recommendation[]>([]);
  const [aiError, setAiError] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const aiInitialized = useRef(false);

  useEffect(() => {
    if (!profile || !orgId) return;
    Promise.all([
      // Fetch the student record linked to this auth user (profile_id), fall back to first in org
      supabase.from('students').select('*').eq('organization_id', orgId).eq('profile_id', profile.id).maybeSingle(),
      supabase.from('assessments').select('*').eq('organization_id', orgId).eq('status', 'published').limit(3),
      supabase.from('hifz_progress').select('*').eq('organization_id', orgId).order('updated_at', { ascending: false }).limit(10),
      supabase.from('announcements').select('*, profiles(full_name)').eq('organization_id', orgId).eq('is_published', true).order('created_at', { ascending: false }).limit(3),
    ]).then(([{ data: student }, { data: assmts }, { data: hifz }, { data: ann }]) => {
      setStudentData(student);
      setAssessments(assmts || []);
      setHifzProgress(hifz || []);
      setAnnouncements(ann || []);
      setLoading(false);
    });
  }, [profile, orgId]);

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Student ID" value={studentData?.student_id_code || '—'} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard title="Hifz Progress" value={`${hifzProgress.length} records`} icon={<BookMarked className="h-5 w-5" />} />
        <StatCard title="Assessments" value={assessments.length} icon={<ClipboardList className="h-5 w-5" />} description="Available" />
        <StatCard title="Certificates" value="0" icon={<Award className="h-5 w-5" />} />
      </div>

      {/* AI Study Recommendations Panel */}
      <Card className="mb-4 border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Study Recommendations
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/10 ml-1">
                Powered by AI
              </Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => generateRecommendations()}
              disabled={aiLoading}
              className="h-7 text-xs text-primary hover:bg-primary/10"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${aiLoading ? 'animate-spin' : ''}`} />
              {aiLoading ? 'Analysing…' : 'Refresh'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Personalised Surah suggestions based on your current Hifz progress
          </p>
        </CardHeader>
        <CardContent>
          {aiError ? (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3 flex items-start gap-2">
              <Star className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                {aiError} —{' '}
                <button onClick={() => generateRecommendations()} className="underline font-medium">
                  Try again
                </button>
              </span>
            </div>
          ) : aiLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-2">
                  <Skeleton className="h-4 w-2/3 bg-muted" />
                  <Skeleton className="h-3 w-full bg-muted" />
                  <Skeleton className="h-3 w-1/2 bg-muted" />
                </div>
              ))}
            </div>
          ) : aiRecs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiRecs.map((rec, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-card p-3 flex items-start gap-3 hover:border-primary/40 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-foreground">{rec.surah}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${PRIORITY_STYLES[rec.priority] ?? PRIORITY_STYLES.medium}`}
                      >
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
            <p className="text-sm text-muted-foreground text-center py-4">
              Click <strong>Refresh</strong> to generate your personalised study plan.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />Available Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assessments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No assessments available</p>
            ) : assessments.map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {a.type}{a.duration_minutes ? ` • ${a.duration_minutes} min` : ''}
                  </p>
                </div>
                <Badge variant="outline" className="bg-info/10 text-info border-info/30 text-xs shrink-0 ml-2">Open</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No announcements</p>
            ) : announcements.map(ann => (
              <div key={ann.id} className="py-2 border-b border-border last:border-0">
                <p className="text-sm font-medium text-balance">{ann.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ann.profiles?.full_name} • {new Date(ann.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
