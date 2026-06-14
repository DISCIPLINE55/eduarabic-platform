import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  Plus, Search, Loader2, FileText, Sparkles, Trash2, Edit2,
  CheckSquare, ToggleLeft, AlignLeft, List,
} from 'lucide-react';
import type { QuestionType } from '@/types/types';

const typeConfig: Record<QuestionType, { label: string; icon: React.ElementType; color: string }> = {
  mcq:          { label: 'MCQ',          icon: List,        color: 'bg-info/10 text-info border-info/30' },
  true_false:   { label: 'True/False',   icon: ToggleLeft,  color: 'bg-success/10 text-success border-success/30' },
  fill_blank:   { label: 'Fill Blank',   icon: AlignLeft,   color: 'bg-secondary text-secondary-foreground border-border' },
  matching:     { label: 'Matching',     icon: CheckSquare, color: 'bg-orange-50 text-orange-700 border-orange-200' },
  short_answer: { label: 'Short Answer', icon: FileText,    color: 'bg-muted text-muted-foreground border-border' },
};

const emptyForm = {
  question_text: '',
  type: 'mcq' as QuestionType,
  options: ['', '', '', ''],
  correct_answer: '',
  explanation: '',
  points: '1',
  subject_id: '',
  difficulty: 'medium',
};

export default function QuestionBankPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showAddToAssessment, setShowAddToAssessment] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [aiForm, setAiForm] = useState({ subject: '', topic: '', level: 'beginner', count: '5', type: 'mcq' });
  const [aiQuestions, setAiQuestions] = useState<any[]>([]);
  const [addToAssessmentId, setAddToAssessmentId] = useState('');

  const fetchData = async () => {
    if (!orgId || !profile) return;
    const [{ data: qs }, { data: subs }, { data: assmts }] = await Promise.all([
      supabase.from('questions').select('*, assessments(title)').eq('organization_id', orgId).order('created_at', { ascending: false }),
      supabase.from('subjects').select('*').eq('organization_id', orgId).order('name'),
      supabase.from('assessments').select('id, title').eq('organization_id', orgId).eq('status', 'draft').order('title'),
    ]);
    setQuestions(qs || []);
    setSubjects(subs || []);
    setAssessments(assmts || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [orgId, profile]);

  const filtered = questions.filter(q => {
    const matchSearch = q.question_text.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || q.type === filterType;
    return matchSearch && matchType;
  });

  const openCreate = () => {
    setEditItem(null);
    setForm({ ...emptyForm });
    setShowDialog(true);
  };

  const openEdit = (q: any) => {
    setEditItem(q);
    setForm({
      question_text: q.question_text,
      type: q.type,
      options: q.options || ['', '', '', ''],
      correct_answer: q.correct_answer || '',
      explanation: q.explanation || '',
      points: String(q.points || 1),
      subject_id: q.subject_id || '',
      difficulty: q.difficulty || 'medium',
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.question_text.trim()) { toast.error('Question text is required'); return; }
    if (form.type === 'mcq' && !form.correct_answer) { toast.error('Correct answer is required for MCQ'); return; }
    setSaving(true);

    const payload = {
      organization_id: orgId,
      question_text: form.question_text.trim(),
      type: form.type,
      options: ['mcq', 'matching'].includes(form.type) ? form.options.filter(o => o.trim()) : null,
      correct_answer: form.correct_answer || null,
      explanation: form.explanation || null,
      points: parseInt(form.points) || 1,
      subject_id: form.subject_id || null,
      difficulty: form.difficulty,
      is_ai_generated: false,
      created_by: profile?.id,
    };

    if (editItem) {
      const { error } = await supabase.from('questions').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editItem.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Question updated');
    } else {
      const { error } = await supabase.from('questions').insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Question added to bank');
    }
    setSaving(false);
    setShowDialog(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Question deleted');
    fetchData();
  };

  const generateAIQuestions = async () => {
    if (!aiForm.subject || !aiForm.topic) { toast.error('Subject and topic are required'); return; }
    setAiLoading(true);
    try {
      const count = parseInt(aiForm.count) || 5;
      const typeLabel = aiForm.type === 'mcq' ? 'multiple-choice (4 options)' : aiForm.type === 'true_false' ? 'true/false' : 'short-answer';
      const optionsLine = aiForm.type === 'mcq' ? '\n- options: array of exactly 4 distinct strings' : '';
      const correctAnswerHint = aiForm.type === 'mcq' ? 'one of the option strings exactly as written' : aiForm.type === 'true_false' ? '"True" or "False"' : 'a concise answer string';
      const prompt = [
        `Generate ${count} ${typeLabel} questions for an Islamic education question bank.`,
        `Subject: ${aiForm.subject}`,
        `Topic: ${aiForm.topic}`,
        `Level: ${aiForm.level}`,
        `Type: ${aiForm.type}`,
        '',
        'Return ONLY a valid JSON array (no markdown, no explanation). Each object must have:',
        `- question_text: string${optionsLine}`,
        `- correct_answer: ${correctAnswerHint}`,
        '- explanation: one sentence explaining why the answer is correct',
        `- difficulty: "${aiForm.level}"`,
      ].join('\n');

      const raw = await callLLM(
        [{ role: 'user', parts: [{ text: prompt }] }],
        'You are an expert Islamic education question writer. Output only valid JSON arrays, no markdown code blocks, no extra text.'
      );

      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);

      if (!Array.isArray(parsed)) throw new Error('Invalid AI response format');

      const generated = parsed.map((q: any, i: number) => ({
        id: `ai-${Date.now()}-${i}`,
        question_text: q.question_text || `Question ${i + 1}`,
        type: aiForm.type as QuestionType,
        options: aiForm.type === 'mcq' ? (Array.isArray(q.options) ? q.options.slice(0, 4) : ['Option A', 'Option B', 'Option C', 'Option D']) : null,
        correct_answer: q.correct_answer || '',
        explanation: q.explanation || '',
        points: 1,
        difficulty: aiForm.level,
        is_ai_generated: true,
      }));

      setAiQuestions(generated);
      toast.success(`${generated.length} questions generated — review and save to bank`);
    } catch (err) {
      console.error('AI question generation error:', err);
      toast.error('AI generation failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const saveAIQuestion = async (q: any) => {
    const { error } = await supabase.from('questions').insert({
      organization_id: orgId,
      question_text: q.question_text,
      type: q.type,
      options: q.options,
      correct_answer: q.correct_answer || null,
      explanation: q.explanation || null,
      points: q.points,
      difficulty: q.difficulty,
      is_ai_generated: true,
      created_by: profile?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Question saved to bank');
    setAiQuestions(prev => prev.filter(x => x.id !== q.id));
    fetchData();
  };

  const saveAllAIQuestions = async () => {
    if (aiQuestions.length === 0) return;
    setSaving(true);
    const rows = aiQuestions.map(q => ({
      organization_id: orgId,
      question_text: q.question_text,
      type: q.type,
      options: q.options,
      correct_answer: q.correct_answer || null,
      explanation: q.explanation || null,
      points: q.points,
      difficulty: q.difficulty,
      is_ai_generated: true,
      created_by: profile?.id,
    }));
    const { error } = await supabase.from('questions').insert(rows);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${rows.length} questions saved to bank`);
    setAiQuestions([]);
    setShowAIDialog(false);
    fetchData();
  };

  const addToAssessment = async () => {
    if (!addToAssessmentId || !showAddToAssessment) { toast.error('Select an assessment'); return; }
    const { error } = await supabase.from('questions').update({ assessment_id: addToAssessmentId }).eq('id', showAddToAssessment.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Question added to assessment');
    setShowAddToAssessment(null);
    setAddToAssessmentId('');
    fetchData();
  };

  const mcqCount = questions.filter(q => q.type === 'mcq').length;
  const aiCount  = questions.filter(q => q.is_ai_generated).length;

  return (
    <div>
      <PageHeader title="Question Bank" description="Create, organise, and reuse questions across assessments">
        <Button variant="outline" onClick={() => { setAiQuestions([]); setShowAIDialog(true); }}>
          <Sparkles className="h-4 w-4 mr-2" />AI Generate
        </Button>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />Add Question
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Questions" value={loading ? '...' : questions.length} icon={<FileText className="h-5 w-5" />} />
        <StatCard title="MCQ" value={loading ? '...' : mcqCount} icon={<List className="h-5 w-5" />} />
        <StatCard title="AI Generated" value={loading ? '...' : aiCount} icon={<Sparkles className="h-5 w-5" />} />
        <StatCard title="Subjects" value={loading ? '...' : subjects.length} icon={<CheckSquare className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search questions..." className="pl-9 px-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {(Object.keys(typeConfig) as QuestionType[]).map(t => (
                  <SelectItem key={t} value={t}>{typeConfig[t].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Question</TableHead>
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap">Points</TableHead>
                  <TableHead className="whitespace-nowrap">Difficulty</TableHead>
                  <TableHead className="whitespace-nowrap">Source</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No questions found</TableCell></TableRow>
                ) : filtered.map(q => {
                  const cfg = typeConfig[q.type as QuestionType] || typeConfig.short_answer;
                  const Icon = cfg.icon;
                  return (
                    <TableRow key={q.id}>
                      <TableCell className="max-w-xs">
                        <p className="text-sm text-pretty line-clamp-2">{q.question_text}</p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className={`text-xs flex items-center gap-1 w-fit ${cfg.color}`}>
                          <Icon className="h-3 w-3" />{cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{q.points}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="text-xs text-muted-foreground capitalize">{q.difficulty || '—'}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {q.is_ai_generated ? (
                          <Badge variant="outline" className="text-xs bg-secondary text-secondary-foreground border-border">
                            <Sparkles className="h-3 w-3 mr-1" />AI
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Manual</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(q)}>
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit question</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(q.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete question</TooltipContent>
                          </Tooltip>
                          {assessments.length > 0 && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs px-2"
                              onClick={() => { setShowAddToAssessment(q); setAddToAssessmentId(''); }}>
                              + Add to
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Question' : 'Add Question'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Question Text *</Label>
              <Textarea value={form.question_text} onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
                rows={3} placeholder="Enter question..." className="px-3" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as QuestionType, correct_answer: '' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(typeConfig) as QuestionType[]).map(t => (
                      <SelectItem key={t} value={t}>{typeConfig[t].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Difficulty</Label>
                <Select value={form.difficulty} onValueChange={v => setForm(f => ({ ...f, difficulty: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* MCQ Options */}
            {form.type === 'mcq' && (
              <div className="space-y-2">
                <Label>Answer Options (mark correct with radio)</Label>
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" name="correct" checked={form.correct_answer === opt && !!opt}
                      onChange={() => opt && setForm(f => ({ ...f, correct_answer: opt }))}
                      className="shrink-0 accent-primary" />
                    <Input value={opt} placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      onChange={e => setForm(f => {
                        const opts = [...f.options]; opts[i] = e.target.value;
                        return { ...f, options: opts };
                      })} className="px-3" />
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">Select the radio button next to the correct answer.</p>
              </div>
            )}

            {/* True/False */}
            {form.type === 'true_false' && (
              <div className="space-y-1.5">
                <Label>Correct Answer</Label>
                <Select value={form.correct_answer} onValueChange={v => setForm(f => ({ ...f, correct_answer: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="True">True</SelectItem>
                    <SelectItem value="False">False</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Fill blank / Short answer */}
            {['fill_blank', 'short_answer', 'matching'].includes(form.type) && (
              <div className="space-y-1.5">
                <Label>Answer / Key</Label>
                <Input value={form.correct_answer} onChange={e => setForm(f => ({ ...f, correct_answer: e.target.value }))}
                  placeholder="Expected answer or key..." className="px-3" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Points</Label>
                <Input type="number" min="1" value={form.points} onChange={e => setForm(f => ({ ...f, points: e.target.value }))} className="px-3" />
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Select value={form.subject_id} onValueChange={v => setForm(f => ({ ...f, subject_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Explanation (optional)</Label>
              <Textarea value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
                rows={2} placeholder="Why is this the correct answer?" className="px-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editItem ? 'Save Changes' : 'Add to Bank'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generation Dialog */}
      <Dialog open={showAIDialog} onOpenChange={v => { setShowAIDialog(v); if (!v) setAiQuestions([]); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> AI Question Generation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Subject *</Label>
                <Input value={aiForm.subject} onChange={e => setAiForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="e.g. Arabic Grammar" className="px-3" />
              </div>
              <div className="space-y-1.5">
                <Label>Topic *</Label>
                <Input value={aiForm.topic} onChange={e => setAiForm(f => ({ ...f, topic: e.target.value }))}
                  placeholder="e.g. Verb Conjugation" className="px-3" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Question Type</Label>
                <Select value={aiForm.type} onValueChange={v => setAiForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(typeConfig) as QuestionType[]).map(t => (
                      <SelectItem key={t} value={t}>{typeConfig[t].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Level</Label>
                <Select value={aiForm.level} onValueChange={v => setAiForm(f => ({ ...f, level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Count</Label>
                <Input type="number" min="1" max="20" value={aiForm.count}
                  onChange={e => setAiForm(f => ({ ...f, count: e.target.value }))} className="px-3" />
              </div>
            </div>
            <div className="rounded-md bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground">
              AI-generated questions require teacher review before saving. You can edit each question or save all at once.
            </div>
            <Button onClick={generateAIQuestions} disabled={aiLoading} className="w-full">
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {aiLoading ? 'Generating...' : 'Generate Questions'}
            </Button>

            {aiQuestions.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{aiQuestions.length} questions generated — review below</p>
                  <Button size="sm" onClick={saveAllAIQuestions} disabled={saving}>
                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                    Save All to Bank
                  </Button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {aiQuestions.map(q => (
                    <div key={q.id} className="p-3 rounded-md border border-border bg-muted/30 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-pretty flex-1">{q.question_text}</p>
                        <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => saveAIQuestion(q)}>
                          Save
                        </Button>
                      </div>
                      {q.options && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {q.options.map((o: string, j: number) => (
                            <span key={j} className={`text-xs px-2 py-0.5 rounded ${o === q.correct_answer ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                              {o}
                            </span>
                          ))}
                        </div>
                      )}
                      {q.correct_answer && !q.options && (
                        <p className="text-xs text-success mt-1">Answer: {q.correct_answer}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAIDialog(false); setAiQuestions([]); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Assessment Dialog */}
      <Dialog open={!!showAddToAssessment} onOpenChange={v => { if (!v) setShowAddToAssessment(null); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <DialogHeader><DialogTitle>Add to Assessment</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground text-pretty">{showAddToAssessment?.question_text}</p>
            <div className="space-y-1.5">
              <Label>Select Draft Assessment</Label>
              <Select value={addToAssessmentId} onValueChange={setAddToAssessmentId}>
                <SelectTrigger><SelectValue placeholder="Choose assessment" /></SelectTrigger>
                <SelectContent>
                  {assessments.map(a => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddToAssessment(null)}>Cancel</Button>
            <Button onClick={addToAssessment}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { callLLM } from '@/lib/llm';
