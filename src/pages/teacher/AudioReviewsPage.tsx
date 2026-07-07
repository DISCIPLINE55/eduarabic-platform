import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/common/StatusBadge';
import { toast } from 'sonner';
import { Mic, PlayCircle, CheckCircle, Loader2, MessageSquare, Sparkles, RefreshCw } from 'lucide-react';
import { callLLM } from '@/lib/llm';

export default function AudioReviewsPage() {
  const { profile } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState('');
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{rule:string;note:string;confidence:number;accepted:boolean|null}>>([]);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const aiAbortRef = useRef<AbortController | null>(null);

  const runAIAnalysis = async (submission: any) => {
    setAiAnalyzing(true);
    setSuggestions([]);
    aiAbortRef.current = new AbortController();
    try {
      const surahNum = submission.surah_number || 1;
      const studentName = submission.students?.full_name || 'the student';
      const notes = submission.student_notes || '';
      const prompt = `You are a Tajweed expert reviewing a Quran recitation submission.
Student: ${studentName}
Surah: ${surahNum}
Student notes: ${notes || 'None'}

Identify 3-5 specific Tajweed rules that should be checked or were applied in this recitation. For each rule provide:
- rule: the Tajweed rule name (e.g., Madd, Ghunnah, Idgham, Ikhfa, Qalqalah, Waqf)
- note: specific observation about how this rule applies to this surah
- confidence: a decimal between 0.70 and 0.99

Return ONLY a JSON array, no markdown, no explanation:
[{"rule":"...","note":"...","confidence":0.XX}]`;

      const raw = await callLLM(
        [{ role: 'user', parts: [{ text: prompt }] }],
        'You are a Tajweed and Quran recitation expert. Return only valid JSON arrays.',
        aiAbortRef.current.signal
      );
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
      if (Array.isArray(parsed)) {
        setSuggestions(parsed.map((s: any) => ({ rule: s.rule || 'Rule', note: s.note || '', confidence: parseFloat(s.confidence) || 0.8, accepted: null })));
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        toast.error('AI analysis failed');
        setSuggestions([]);
      }
    } finally {
      setAiAnalyzing(false);
    }
  };

  const fetchSubmissions = async () => {
    if (!profile) return;
    const { data } = await supabase.from('audio_submissions').select('*, students(full_name, student_id_code)')
      .eq('teacher_id', profile.id).order('created_at', { ascending: false });
    setSubmissions(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchSubmissions(); }, [profile]);

  const handleReview = async () => {
    if (!selectedSubmission || !score) { toast.error('Please provide a score'); return; }
    setSaving(true);
    const { error } = await supabase.from('audio_submissions').update({
      status: 'reviewed', teacher_text_feedback: feedback || null,
      score: parseFloat(score), updated_at: new Date().toISOString(),
      teacher_decisions: suggestions.map(s => ({ rule: s.rule, note: s.note, accepted: s.accepted })),
    }).eq('id', selectedSubmission.id);
    setSaving(false);
    if (error) { toast.error('Failed to save review'); return; }
    toast.success('Review saved and submitted to student');
    setSelectedSubmission(null);
    setFeedback('');
    setScore('');
    setSuggestions([]);
    fetchSubmissions();
  };

  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  return (
    <div>
      <PageHeader title="Audio Reviews" description="Review student Quran recitation submissions">
        {pendingCount > 0 && (
          <span className="bg-destructive/10 text-destructive border border-destructive/30 text-sm font-medium px-3 py-1 rounded-full">
            {pendingCount} pending
          </span>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Submission list */}
        <div className="space-y-3">
          {loading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
          ) : submissions.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No audio submissions yet</CardContent></Card>
          ) : submissions.map(sub => (
            <Card key={sub.id} className={`cursor-pointer transition-colors ${selectedSubmission?.id === sub.id ? 'border-primary' : ''}`}
              onClick={() => { setSelectedSubmission(sub); setFeedback(sub.teacher_text_feedback || ''); setScore(sub.score ? String(sub.score) : ''); if (sub.status === 'pending') runAIAnalysis(sub); }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Mic className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{sub.students?.full_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{sub.students?.student_id_code}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(sub.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <StatusBadge status={sub.status} className="shrink-0" />
                </div>
                {sub.audio_url && (
                  <audio controls src={sub.audio_url} className="w-full mt-3 h-8" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Review panel */}
        {selectedSubmission ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Review: {selectedSubmission.students?.full_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* AI Tajweed Suggestions */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">AI Tajweed Analysis</span>
                  {aiAnalyzing
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    : <button onClick={() => runAIAnalysis(selectedSubmission)} title="Re-analyze" className="text-muted-foreground hover:text-primary transition-colors"><RefreshCw className="h-3.5 w-3.5" /></button>
                  }
                  {!aiAnalyzing && suggestions.length > 0 && <span className="text-xs text-muted-foreground">(Review required)</span>}
                </div>
                <div className="space-y-2">
                  {aiAnalyzing ? (
                    <div className="p-4 rounded-lg bg-muted border border-border flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground">Analyzing Tajweed rules…</p>
                    </div>
                  ) : suggestions.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No analysis yet. Click refresh to analyze.</p>
                  ) : null}
                  {!aiAnalyzing && suggestions.map((sug, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted border border-border">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-primary">{sug.rule}</span>
                          <p className="text-xs text-muted-foreground mt-0.5 text-pretty">{sug.note}</p>
                          <p className="text-xs text-muted-foreground">Confidence: {Math.round(sug.confidence * 100)}%</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Button size="sm" variant={sug.accepted === true ? 'default' : 'outline'} className="h-7 text-xs px-2"
                            onClick={() => setSuggestions(prev => prev.map((s, j) => j === i ? { ...s, accepted: true } : s))}>
                            Accept
                          </Button>
                          <Button size="sm" variant={sug.accepted === false ? 'default' : 'outline'} className="h-7 text-xs px-2"
                            onClick={() => setSuggestions(prev => prev.map((s, j) => j === i ? { ...s, accepted: false } : s))}>
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Score (out of 100)</Label>
                <Input type="number" min="0" max="100" value={score} onChange={e => setScore(e.target.value)} placeholder="Enter score" className="px-3" />
              </div>
              <div className="space-y-1.5">
                <Label>Teacher Feedback</Label>
                <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4} placeholder="Provide detailed feedback on recitation..." className="px-3" />
              </div>
              <div className="rounded-md bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground">
                Teacher decision is final. AI suggestions will only be applied as you choose.
              </div>
              <Button onClick={handleReview} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Submit Review
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Mic className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">Select a submission to review</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
