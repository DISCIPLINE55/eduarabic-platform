import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, BookOpen, Loader2, FileText, Headphones, Video, File } from 'lucide-react';
import type { ContentType } from '@/types/types';

const contentIcons: Record<ContentType, React.ElementType> = { text: FileText, pdf: File, audio: Headphones, video: Video };

export default function LessonsPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [subjects, setSubjects] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: '', description: '' });
  const [lessonForm, setLessonForm] = useState({ title: '', subject_id: '', content_type: 'text' as ContentType, content: '', description: '' });

  const fetchData = async () => {
    if (!orgId || !profile) return;
    const [{ data: subs }, { data: lsns }] = await Promise.all([
      supabase.from('subjects').select('*').eq('organization_id', orgId).order('name'),
      supabase.from('lessons').select('*, subjects(name)').eq('organization_id', orgId).is('deleted_at', null).order('created_at', { ascending: false }),
    ]);
    setSubjects(subs || []);
    setLessons(lsns || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [orgId, profile]);

  const saveSubject = async () => {
    if (!subjectForm.name || !orgId) { toast.error('Subject name is required'); return; }
    setSaving(true);
    const { error } = await supabase.from('subjects').insert({ organization_id: orgId, name: subjectForm.name, description: subjectForm.description || null, teacher_id: profile?.id, created_by: profile?.id });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Subject created');
    setShowSubjectDialog(false);
    setSubjectForm({ name: '', description: '' });
    fetchData();
  };

  const saveLesson = async () => {
    if (!lessonForm.title || !orgId) { toast.error('Title is required'); return; }
    setSaving(true);
    const { error } = await supabase.from('lessons').insert({ organization_id: orgId, subject_id: lessonForm.subject_id || null, title: lessonForm.title, description: lessonForm.description || null, content: lessonForm.content || null, content_type: lessonForm.content_type, is_published: true, created_by: profile?.id });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Lesson created');
    setShowLessonDialog(false);
    setLessonForm({ title: '', subject_id: '', content_type: 'text', content: '', description: '' });
    fetchData();
  };

  return (
    <div>
      <PageHeader title="Learning Center" description="Create and manage lessons and subjects">
        <Button variant="outline" onClick={() => setShowSubjectDialog(true)}><Plus className="h-4 w-4 mr-2" />New Subject</Button>
        <Button onClick={() => setShowLessonDialog(true)}><Plus className="h-4 w-4 mr-2" />New Lesson</Button>
      </PageHeader>

      {/* Subjects */}
      {subjects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Subjects</h2>
          <div className="flex flex-wrap gap-2">
            {subjects.map(s => (
              <Badge key={s.id} variant="outline" className="text-sm px-3 py-1">{s.name}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Lessons grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : lessons.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No lessons yet. Create your first lesson.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map(lesson => {
            const Icon = contentIcons[lesson.content_type as ContentType] || FileText;
            return (
              <Card key={lesson.id} className="h-full flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm font-semibold text-balance line-clamp-2">{lesson.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{lesson.subjects?.name || 'No subject'}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex-1">
                  {lesson.description && <p className="text-xs text-muted-foreground text-pretty line-clamp-2">{lesson.description}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="outline" className="text-xs capitalize">{lesson.content_type}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(lesson.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Subject Dialog */}
      <Dialog open={showSubjectDialog} onOpenChange={setShowSubjectDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>Create Subject</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Subject Name *</Label><Input value={subjectForm.name} onChange={e => setSubjectForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Quran Recitation" className="px-3" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Input value={subjectForm.description} onChange={e => setSubjectForm(f => ({ ...f, description: e.target.value }))} className="px-3" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubjectDialog(false)}>Cancel</Button>
            <Button onClick={saveSubject} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>Create Lesson</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Title *</Label><Input value={lessonForm.title} onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))} placeholder="Lesson title" className="px-3" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Subject</Label>
                <Select value={lessonForm.subject_id} onValueChange={v => setLessonForm(f => ({ ...f, subject_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Content Type</Label>
                <Select value={lessonForm.content_type} onValueChange={v => setLessonForm(f => ({ ...f, content_type: v as ContentType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="text">Text</SelectItem><SelectItem value="pdf">PDF</SelectItem><SelectItem value="audio">Audio</SelectItem><SelectItem value="video">Video</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Input value={lessonForm.description} onChange={e => setLessonForm(f => ({ ...f, description: e.target.value }))} className="px-3" /></div>
            {lessonForm.content_type === 'text' && (
              <div className="space-y-1.5"><Label>Content</Label><Textarea value={lessonForm.content} onChange={e => setLessonForm(f => ({ ...f, content: e.target.value }))} rows={5} placeholder="Write lesson content..." className="px-3" /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLessonDialog(false)}>Cancel</Button>
            <Button onClick={saveLesson} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
