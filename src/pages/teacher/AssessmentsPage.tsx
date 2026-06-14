import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter as DFoot } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { toast } from 'sonner';
import { Plus, Loader2, Sparkles, BookOpenCheck, Send, Users, CheckCircle, Clock, Eye } from 'lucide-react';
import { callLLM } from '@/lib/llm';
import type { AssessmentType } from '@/types/types';

export default function AssessmentsPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [assessments, setAssessments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<any[]>([]);
  const [aiForm, setAiForm] = useState({ subject: '', topic: '', level: 'beginner', count: '5' });
  const [form, setForm] = useState({ title: '', type: 'quiz' as AssessmentType, subject_id: '', duration_minutes: '30', access_code: '', instructions: '' });

  // Review state
  const [reviewAssessment, setReviewAssessment] = useState<any>(null);
  const [reviewSubs, setReviewSubs] = useState<any[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [manualScore, setManualScore] = useState<Record<string, string>>({});
  const [manualFeedback, setManualFeedback] = useState<Record<string, string>>({});

  const fetchData = async () => {
    if (!orgId || !profile) return;
    const [{ data: assmts }, { data: subs }] = await Promise.all([
      supabase.from('assessments').select('*').eq('organization_id', orgId).is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('subjects').select('*').eq('organization_id', orgId).order('name'),
    ]);
    setAssessments(assmts || []);
    setSubjects(subs || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [orgId, profile]);

  const createAssessment = async () => {
    if (!form.title || !orgId) { toast.error('Title is required'); return; }
    setSaving(true);
    const { error } = await supabase.from('assessments').insert({
      organization_id: orgId, title: form.title, type: form.type,
      subject_id: form.subject_id || null, duration_minutes: parseInt(form.duration_minutes) || null,
      access_code: form.access_code || null, instructions: form.instructions || null,
      status: 'draft', created_by: profile?.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Assessment created in draft');
    setShowDialog(false);
    setForm({ title: '', type: 'quiz', subject_id: '', duration_minutes: '30', access_code: '', instructions: '' });
    fetchData();
  };

  const publishAssessment = async (id: string) => {
    const { error } = await supabase.from('assessments').update({ status: 'published' }).eq('id', id);
    if (error) { toast.error('Failed to publish'); return; }
    toast.success('Assessment published — students can now access it');
    fetchData();
  };

  const openReview = async (assessment: any) => {
    setReviewAssessment(assessment);
    setReviewLoading(true);
    const { data } = await supabase
      .from('assessment_submissions')
      .select('*, students(full_name, student_id_code)')
      .eq('assessment_id', assessment.id)
      .order('submitted_at', { ascending: false });
    setReviewSubs(data || []);
    setReviewLoading(false);
    // pre-fill scores
    const scores: Record<string, string> = {};
    const feedbacks: Record<string, string> = {};
    (data || []).forEach((s: any) => {
      if (s.score != null) scores[s.id] = String(s.score);
      if (s.teacher_text_feedback) feedbacks[s.id] = s.teacher_text_feedback;
    });
    setManualScore(scores);
    setManualFeedback(feedbacks);
  };

  const saveGrade = async (subId: string, maxScore = 100) => {
    const score = parseFloat(manualScore[subId] || '0');
    if (isNaN(score) || score < 0 || score > maxScore) {
      toast.error(`Score must be between 0 and ${maxScore}`); return;
    }
    setGradingId(subId);
    const { error } = await supabase.from('assessment_submissions').update({
      score,
      max_score: maxScore,
      teacher_text_feedback: manualFeedback[subId] || null,
      status: 'graded',
      updated_at: new Date().toISOString(),
    }).eq('id', subId);
    setGradingId(null);
    if (error) { toast.error('Failed to save grade'); return; }
    toast.success('Grade saved');
    openReview(reviewAssessment);
  };

  const publishResults = async () => {
    const ungradedCount = reviewSubs.filter(s => s.status === 'submitted').length;
    if (ungradedCount > 0) {
      toast.warning(`${ungradedCount} submissions still ungraded — results partially published`);
    }
    const { error } = await supabase.from('assessment_submissions')
      .update({ status: 'published', updated_at: new Date().toISOString() })
      .eq('assessment_id', reviewAssessment.id)
      .eq('status', 'graded');
    if (error) { toast.error('Failed to publish results'); return; }
    await supabase.from('assessments').update({ status: 'results_published' }).eq('id', reviewAssessment.id);
    toast.success('Results published to all students');
    setReviewAssessment(null);
    fetchData();
  };

  const generateAIQuestions = async () => {
    if (!aiForm.subject || !aiForm.topic) { toast.error('Please provide subject and topic'); return; }
    setAiLoading(true);
    try {
      const count = parseInt(aiForm.count) || 5;
      const systemInstruction = 'You are an Islamic education curriculum expert. Generate assessment questions in strict JSON format only, no markdown, no explanation.';
      const prompt = `Generate ${count} multiple-choice questions for an Islamic education assessment.
Subject: ${aiForm.subject}
Topic: ${aiForm.topic}
Level: ${aiForm.level}

Return a JSON array only (no markdown, no explanation) where each object has:
- question_text: string
- options: array of 4 strings (A, B, C, D)
- correct_answer: one of the option strings
- explanation: brief explanation of the correct answer

Example format:
[{"question_text":"...","options":["A","B","C","D"],"correct_answer":"A","explanation":"..."}]`;

      const raw = await callLLM(
        [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction
      );

      // Extract JSON from response (model may wrap in markdown code block)
      const jsonMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);

      const generated = Array.isArray(parsed) ? parsed.map((q: any, i: number) => ({
        id: `ai-${i}`,
        question_text: q.question_text || `Question ${i + 1}`,
        type: 'mcq',
        options: Array.isArray(q.options) ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_answer: q.correct_answer || (q.options?.[0]),
        explanation: q.explanation || '',
        points: 1,
        is_ai_generated: true,
      })) : [];

      setAiQuestions(generated);
      toast.success(`${generated.length} questions generated by AI`);
    } catch (err) {
      console.error('AI generation error:', err);
      toast.error('AI generation failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const typeColors: Record<string, string> = {
    quiz: 'bg-info/10 text-info border-info/30',
    exam: 'bg-destructive/10 text-destructive border-destructive/30',
    practice: 'bg-success/10 text-success border-success/30',
    assignment: 'bg-secondary text-secondary-foreground border-border',
    makeup: 'bg-orange-50 text-orange-700 border-orange-200',
  };

  const draftCount = assessments.filter(a => a.status === 'draft').length;
  const publishedCount = assessments.filter(a => a.status === 'published').length;

  return (
    <div>
      <PageHeader title="Assessments" description="Create, manage, and grade assessments">
        <Button variant="outline" onClick={() => setShowAIDialog(true)}>
          <Sparkles className="h-4 w-4 mr-2" />AI Generate
        </Button>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />New Assessment
        </Button>
      </PageHeader>

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All ({assessments.length})</TabsTrigger>
          <TabsTrigger value="draft">Drafts ({draftCount})</TabsTrigger>
          <TabsTrigger value="published">Published ({publishedCount})</TabsTrigger>
          <TabsTrigger value="review">Needs Review ({assessments.filter(a => a.status === 'reviewed' || a.status === 'published').length})</TabsTrigger>
        </TabsList>

        {(['all', 'draft', 'published', 'review'] as const).map(tab => {
          const filtered = assessments.filter(a => {
            if (tab === 'all') return true;
            if (tab === 'draft') return a.status === 'draft';
            if (tab === 'published') return a.status === 'published' || a.status === 'results_published';
            if (tab === 'review') return a.status === 'published' || a.status === 'reviewed';
            return true;
          });
          return (
            <TabsContent key={tab} value={tab}>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : filtered.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">
                  {tab === 'all' ? 'No assessments yet. Create your first assessment.' : `No ${tab} assessments.`}
                </CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map(a => (
                    <Card key={a.id} className="h-full flex flex-col">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm font-semibold text-balance line-clamp-2 flex-1">{a.title}</CardTitle>
                          <StatusBadge status={a.status} className="shrink-0 text-xs" />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded border capitalize ${typeColors[a.type] || 'bg-muted text-muted-foreground'}`}>{a.type}</span>
                          {a.duration_minutes && <span className="text-xs text-muted-foreground">{a.duration_minutes} min</span>}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 flex-1">
                        <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</p>
                      </CardContent>
                      <CardFooter className="pt-2 gap-2">
                        <Button size="sm" variant="outline" className="flex-1 h-8" onClick={() => openReview(a)}>
                          <Eye className="h-3.5 w-3.5 mr-1.5" />Review
                        </Button>
                        {a.status === 'draft' && (
                          <Button size="sm" className="flex-1 h-8" onClick={() => publishAssessment(a.id)}>
                            <Send className="h-3.5 w-3.5 mr-1.5" />Publish
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>New Assessment</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Assessment title" className="px-3" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as AssessmentType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiz">Quiz</SelectItem><SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="practice">Practice</SelectItem><SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="makeup">Make-Up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Duration (min)</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} className="px-3" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Subject</Label>
                <Select value={form.subject_id} onValueChange={v => setForm(f => ({ ...f, subject_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Access Code</Label><Input value={form.access_code} onChange={e => setForm(f => ({ ...f, access_code: e.target.value }))} placeholder="Optional" className="px-3" /></div>
            </div>
            <div className="space-y-1.5"><Label>Instructions</Label><Textarea value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} rows={3} className="px-3" /></div>
          </div>
          <DFoot>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={createAssessment} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create Draft</Button>
          </DFoot>
        </DialogContent>
      </Dialog>

      {/* AI Dialog */}
      <Dialog open={showAIDialog} onOpenChange={v => { setShowAIDialog(v); if (!v) setAiQuestions([]); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />AI Question Generation</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Subject *</Label><Input value={aiForm.subject} onChange={e => setAiForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Arabic Grammar" className="px-3" /></div>
              <div className="space-y-1.5"><Label>Topic *</Label><Input value={aiForm.topic} onChange={e => setAiForm(f => ({ ...f, topic: e.target.value }))} placeholder="e.g. Nouns" className="px-3" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Level</Label>
                <Select value={aiForm.level} onValueChange={v => setAiForm(f => ({ ...f, level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="beginner">Beginner</SelectItem><SelectItem value="intermediate">Intermediate</SelectItem><SelectItem value="advanced">Advanced</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Count</Label><Input type="number" min="1" max="20" value={aiForm.count} onChange={e => setAiForm(f => ({ ...f, count: e.target.value }))} className="px-3" /></div>
            </div>
            <Button onClick={generateAIQuestions} disabled={aiLoading} className="w-full">
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {aiLoading ? 'Generating...' : 'Generate Questions'}
            </Button>
            {aiQuestions.length > 0 && (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {aiQuestions.map(q => (
                  <div key={q.id} className="p-3 rounded-md bg-muted border border-border text-sm">
                    <p className="font-medium text-pretty">{q.question_text}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {q.options.map((o: string, j: number) => (
                        <span key={j} className={`text-xs px-2 py-0.5 rounded ${j === 0 ? 'bg-success/10 text-success' : 'bg-muted-foreground/10 text-muted-foreground'}`}>{o}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DFoot>
            <Button variant="outline" onClick={() => { setShowAIDialog(false); setAiQuestions([]); }}>Close</Button>
          </DFoot>
        </DialogContent>
      </Dialog>

      {/* Review / Grade Dialog */}
      <Dialog open={!!reviewAssessment} onOpenChange={open => { if (!open) setReviewAssessment(null); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-3xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-balance">
              <Users className="h-4 w-4 text-primary shrink-0" />
              Submissions — {reviewAssessment?.title}
            </DialogTitle>
          </DialogHeader>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 text-sm">
            {[
              { label: 'Total', value: reviewSubs.length, icon: Users },
              { label: 'Graded', value: reviewSubs.filter(s => s.status === 'graded' || s.status === 'published').length, icon: CheckCircle },
              { label: 'Pending', value: reviewSubs.filter(s => s.status === 'submitted').length, icon: Clock },
            ].map(m => (
              <div key={m.label} className="rounded-lg bg-muted p-2 text-center">
                <p className="font-bold text-lg leading-none">{m.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>

          {reviewLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : reviewSubs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No submissions yet for this assessment.</p>
          ) : (
            <div className="space-y-3">
              {reviewSubs.map(sub => (
                <Card key={sub.id} className="border border-border">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                      <div>
                        <p className="font-medium text-sm">{sub.students?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground font-mono">{sub.students?.student_id_code}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Submitted: {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : '—'}
                        </p>
                      </div>
                      <StatusBadge status={sub.status} />
                    </div>

                    {/* Answers preview */}
                    {sub.answers && Object.keys(sub.answers).length > 0 && (
                      <details className="mb-3">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          View answers ({Object.keys(sub.answers).length} responses)
                        </summary>
                        <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                          {Object.entries(sub.answers as Record<string, string>).map(([qid, ans]) => (
                            <div key={qid} className="text-xs bg-muted rounded px-2 py-1 flex justify-between gap-2">
                              <span className="text-muted-foreground truncate">Q {qid.slice(-6)}</span>
                              <span className="font-medium truncate max-w-[60%] text-right">{String(ans)}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* Grading controls */}
                    {(sub.status === 'submitted' || sub.status === 'graded') && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-border">
                        <div className="space-y-1">
                          <Label className="text-xs">Score (0–100)</Label>
                          <Input
                            type="number" min="0" max="100"
                            value={manualScore[sub.id] ?? (sub.score != null ? String(sub.score) : '')}
                            onChange={e => setManualScore(p => ({ ...p, [sub.id]: e.target.value }))}
                            className="px-2 h-8 text-sm"
                            placeholder="e.g. 85"
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <Label className="text-xs">Feedback (optional)</Label>
                          <div className="flex gap-2">
                            <Input
                              value={manualFeedback[sub.id] ?? (sub.teacher_text_feedback || '')}
                              onChange={e => setManualFeedback(p => ({ ...p, [sub.id]: e.target.value }))}
                              placeholder="Teacher feedback..."
                              className="px-2 h-8 text-sm flex-1"
                            />
                            <Button size="sm" className="h-8 shrink-0"
                              onClick={() => saveGrade(sub.id)}
                              disabled={gradingId === sub.id}>
                              {gradingId === sub.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <CheckCircle className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Already graded summary */}
                    {(sub.status === 'graded' || sub.status === 'published') && sub.score != null && (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <Badge variant="outline" className={`text-xs ${sub.score >= 80 ? 'bg-success/10 text-success border-success/30' : sub.score >= 60 ? 'bg-warning/10 text-warning border-warning/30' : 'bg-destructive/10 text-destructive border-destructive/30'}`}>
                          Score: {sub.score}/100
                        </Badge>
                        {sub.teacher_text_feedback && <span className="text-xs text-muted-foreground truncate">{sub.teacher_text_feedback}</span>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <DFoot>
            {reviewSubs.some(s => s.status === 'graded') && (
              <Button onClick={publishResults} className="gap-2">
                <Send className="h-4 w-4" />Publish Results to Students
              </Button>
            )}
            <Button variant="outline" onClick={() => setReviewAssessment(null)}>Close</Button>
          </DFoot>
        </DialogContent>
      </Dialog>
    </div>
  );
}

