import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { BookOpenCheck, Clock, Lock, Send, CheckCircle, Loader2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

const typeColors: Record<string, string> = {
  quiz: 'bg-info/10 text-info border-info/30',
  exam: 'bg-destructive/10 text-destructive border-destructive/30',
  practice: 'bg-success/10 text-success border-success/30',
  assignment: 'bg-secondary text-secondary-foreground border-border',
};

function useCountdown(minutes: number, started: boolean, onExpire: () => void) {
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!started || minutes <= 0) return;
    setSecondsLeft(minutes * 60);
    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(intervalRef.current!); onExpire(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [started, minutes]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function StudentAssessmentsPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [assessments, setAssessments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [accessCode, setAccessCode] = useState('');
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [warnedTime, setWarnedTime] = useState(false);

  // Persist answers to sessionStorage so a page refresh doesn't lose progress
  const storageKey = selectedAssessment ? `edu_answers_${selectedAssessment.id}` : null;

  useEffect(() => {
    if (!storageKey || !started) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify(answers)); } catch { /* quota */ }
  }, [answers, storageKey, started]);

  const handleAutoSubmit = useCallback(() => {
    toast.warning('Time is up! Auto-submitting your assessment.');
    handleFinalSubmit(true);
  }, [answers, selectedAssessment, orgId, profile]);

  const timer = useCountdown(selectedAssessment?.duration_minutes || 0, started, handleAutoSubmit);

  // Show 5-min warning once
  useEffect(() => {
    if (started && timer === '05:00' && !warnedTime) {
      toast.warning('5 minutes remaining!', { duration: 5000 });
      setWarnedTime(true);
    }
  }, [timer, started, warnedTime]);

  const fetchData = async () => {
    if (!orgId || !profile) return;
    // Get the student record for this user so we can filter their own submissions
    const { data: studentRec } = await supabase.from('students').select('id').eq('organization_id', orgId).eq('profile_id', profile.id).maybeSingle();
    const resolvedStudentId = studentRec?.id ?? null;
    setStudentId(resolvedStudentId);
    const [{ data: assmts }, { data: subs }] = await Promise.all([
      supabase.from('assessments').select('*, subjects(name)').eq('organization_id', orgId).eq('status', 'published').order('created_at', { ascending: false }),
      resolvedStudentId
        ? supabase.from('assessment_submissions').select('assessment_id, status, score').eq('organization_id', orgId).eq('student_id', resolvedStudentId)
        : Promise.resolve({ data: [] }),
    ]);
    setAssessments(assmts || []);
    setSubmissions((subs as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [orgId]);

  const submissionFor = (id: string) => submissions.find(s => s.assessment_id === id);

  const handleStart = async () => {
    if (selectedAssessment?.access_code && selectedAssessment.access_code !== accessCode) {
      toast.error('Incorrect access code'); return;
    }
    setLoadingQuestions(true);
    const { data: qs } = await supabase.from('questions')
      .select('*').eq('assessment_id', selectedAssessment.id).order('created_at');
    setQuestions(qs || []);

    // Restore saved answers from sessionStorage if available
    const savedKey = `edu_answers_${selectedAssessment.id}`;
    try {
      const saved = sessionStorage.getItem(savedKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, string>;
        setAnswers(parsed);
        toast.info('Restored your previous answers.');
      } else {
        setAnswers({});
      }
    } catch {
      setAnswers({});
    }

    setCurrentIndex(0);
    setWarnedTime(false);
    setLoadingQuestions(false);
    setStarted(true);
  };

  async function handleFinalSubmit(isAuto = false) {
    if (!selectedAssessment || !orgId) return;
    setSubmitting(true);
    const totalQuestions = questions.length;
    let correct = 0;
    questions.forEach(q => {
      const given = answers[q.id];
      if (given && q.correct_answer && given.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()) {
        correct++;
      }
    });
    const score = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : null;
    const { error } = await supabase.from('assessment_submissions').insert({
      organization_id: orgId,
      assessment_id: selectedAssessment.id,
      student_id: studentId ?? profile?.id,
      answers: answers,
      score: score,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      created_by: profile?.id,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    if (!isAuto) toast.success(`Assessment submitted! ${score !== null ? `Score: ${score}%` : 'Awaiting grading.'}`);
    // Clear persisted answers on successful submit
    if (storageKey) { try { sessionStorage.removeItem(storageKey); } catch { /* ok */ } }
    setSelectedAssessment(null);
    setStarted(false);
    setAccessCode('');
    setQuestions([]);
    setAnswers({});
    fetchData();
  }

  const current = questions[currentIndex];
  const answered = Object.keys(answers).length;

  return (
    <div>
      <PageHeader title="Assessments" description="View and take your assessments" />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Assessment</TableHead>
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap">Duration</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Score</TableHead>
                  <TableHead className="whitespace-nowrap">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  : assessments.length === 0
                    ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No assessments available</TableCell></TableRow>
                    : assessments.map(a => {
                      const sub = submissionFor(a.id);
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="whitespace-nowrap">
                            <p className="font-medium text-sm">{a.title}</p>
                            <p className="text-xs text-muted-foreground">{a.subjects?.name || 'General'}</p>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <span className={`text-xs px-2 py-0.5 rounded border capitalize ${typeColors[a.type] || 'bg-muted text-muted-foreground'}`}>{a.type}</span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm">
                            {a.duration_minutes
                              ? <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{a.duration_minutes} min</span>
                              : '—'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {sub ? <StatusBadge status={sub.status} /> : <StatusBadge status="published" />}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm">
                            {sub?.score != null
                              ? <span className={`font-bold ${sub.score >= 80 ? 'text-success' : sub.score >= 60 ? 'text-warning' : 'text-destructive'}`}>{sub.score}%</span>
                              : sub ? <span className="text-muted-foreground text-xs">Awaiting</span> : '—'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {!sub ? (
                              <Button size="sm" variant="outline" className="h-8"
                                onClick={() => { setSelectedAssessment(a); setStarted(false); setAccessCode(''); }}>
                                Start
                              </Button>
                            ) : (
                              <span className="flex items-center gap-1 text-success text-xs font-medium">
                                <CheckCircle className="h-3.5 w-3.5" />Done
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Dialog */}
      <Dialog open={!!selectedAssessment} onOpenChange={v => { if (!v && !started) { setSelectedAssessment(null); setStarted(false); } }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-balance">{selectedAssessment?.title}</DialogTitle>
          </DialogHeader>

          {/* Info screen */}
          {!started && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted p-4 space-y-1.5 text-sm">
                <p><span className="font-medium">Type:</span> <span className="capitalize">{selectedAssessment?.type}</span></p>
                {selectedAssessment?.duration_minutes && (
                  <p><span className="font-medium">Duration:</span> {selectedAssessment.duration_minutes} minutes</p>
                )}
                {selectedAssessment?.subjects?.name && (
                  <p><span className="font-medium">Subject:</span> {selectedAssessment.subjects.name}</p>
                )}
                {selectedAssessment?.instructions && (
                  <p className="text-muted-foreground text-pretty mt-2">{selectedAssessment.instructions}</p>
                )}
              </div>
              {selectedAssessment?.access_code && (
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" />Access Code Required</Label>
                  <Input value={accessCode} onChange={e => setAccessCode(e.target.value)}
                    placeholder="Enter code from your teacher" className="px-3" />
                </div>
              )}
              <div className="flex items-center gap-2 p-3 rounded-md bg-warning/10 border border-warning/30 text-xs text-warning">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Once started, the timer begins. Submit before time runs out.
              </div>
              <Button onClick={handleStart} disabled={loadingQuestions} className="w-full">
                {loadingQuestions && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Begin Assessment
              </Button>
            </div>
          )}

          {/* Active assessment */}
          {started && questions.length === 0 && (
            <div className="py-8 text-center space-y-3">
              <BookOpenCheck className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">This assessment has no questions yet.</p>
              <Button variant="outline" onClick={() => handleFinalSubmit(false)}>Submit Anyway</Button>
            </div>
          )}

          {started && questions.length > 0 && current && (
            <div className="space-y-4 py-2">
              {/* Header bar */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {currentIndex + 1} / {questions.length}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{answered} answered</span>
                </div>
                {selectedAssessment?.duration_minutes > 0 && (() => {
                  const [mm, ss] = timer.split(':').map(Number);
                  const totalSecs = (selectedAssessment.duration_minutes || 1) * 60;
                  const remainSecs = mm * 60 + ss;
                  const pct = (remainSecs / totalSecs) * 100;
                  const isCritical = remainSecs <= 300; // ≤ 5 min
                  return (
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`flex items-center gap-1 text-sm font-mono font-semibold ${isCritical ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
                        <Clock className="h-3.5 w-3.5" />{timer}
                      </div>
                      <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${isCritical ? 'bg-destructive' : pct > 50 ? 'bg-success' : 'bg-warning'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

              <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-1.5" />

              {/* Question */}
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                <p className="text-sm font-medium text-foreground text-pretty leading-relaxed">
                  {currentIndex + 1}. {current.question_text}
                  {current.points > 1 && <span className="ml-2 text-xs text-muted-foreground">({current.points} pts)</span>}
                </p>
              </div>

              {/* MCQ Options */}
              {current.type === 'mcq' && current.options && (
                <div className="space-y-2">
                  {current.options.map((opt: string, i: number) => (
                    <button key={i} onClick={() => setAnswers(a => ({ ...a, [current.id]: opt }))}
                      className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${answers[current.id] === opt
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}>
                      <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                    </button>
                  ))}
                </div>
              )}

              {/* True/False */}
              {current.type === 'true_false' && (
                <div className="flex gap-3">
                  {['True', 'False'].map(v => (
                    <button key={v} onClick={() => setAnswers(a => ({ ...a, [current.id]: v }))}
                      className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-colors ${answers[current.id] === v
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              )}

              {/* Fill blank / Short answer */}
              {['fill_blank', 'short_answer', 'matching'].includes(current.type) && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Your Answer</Label>
                  {current.type === 'short_answer' ? (
                    <Textarea value={answers[current.id] || ''}
                      onChange={e => setAnswers(a => ({ ...a, [current.id]: e.target.value }))}
                      rows={3} placeholder="Write your answer here..." className="px-3 text-sm" />
                  ) : (
                    <Input value={answers[current.id] || ''}
                      onChange={e => setAnswers(a => ({ ...a, [current.id]: e.target.value }))}
                      placeholder="Type your answer..." className="px-3" />
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}>
                  <ChevronLeft className="h-4 w-4 mr-1" />Previous
                </Button>

                {currentIndex < questions.length - 1 ? (
                  <Button size="sm" onClick={() => setCurrentIndex(i => i + 1)}>
                    Next<ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => handleFinalSubmit(false)} disabled={submitting}
                    className="bg-success hover:bg-success/90 text-white">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Submit
                  </Button>
                )}
              </div>

              {/* Question navigator dots */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {questions.map((q, i) => (
                  <button key={q.id} onClick={() => setCurrentIndex(i)}
                    className={`w-7 h-7 rounded text-xs font-medium transition-colors ${i === currentIndex
                      ? 'bg-primary text-primary-foreground'
                      : answers[q.id] ? 'bg-success/10 text-success border border-success/30'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
