import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { BookOpen, FileText, Headphones, Video, File, Search, CheckCircle, Loader2 } from 'lucide-react';
import type { ContentType } from '@/types/types';
import { toast } from 'sonner';

const contentIcons: Record<ContentType, React.ElementType> = { text: FileText, pdf: File, audio: Headphones, video: Video };

export default function StudentCoursesPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [lessons, setLessons] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [markingDone, setMarkingDone] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    Promise.all([
      supabase.from('lessons').select('*, subjects(id, name)').eq('organization_id', orgId).eq('is_published', true).is('deleted_at', null).order('created_at', { ascending: false }),
      // load completed lessons for this user from localStorage (lightweight, no DB table needed)
    ]).then(([{ data }]) => {
      setLessons(data || []);
      // Build unique subjects list
      const seen = new Map<string, string>();
      (data || []).forEach((l: any) => { if (l.subjects?.id) seen.set(l.subjects.id, l.subjects.name); });
      setSubjects(Array.from(seen.entries()).map(([id, name]) => ({ id, name })));
      // Load completed set from localStorage
      try {
        const saved = localStorage.getItem(`edu_completed_${orgId}_${profile?.id}`);
        if (saved) setCompleted(new Set(JSON.parse(saved)));
      } catch { /* ignore */ }
      setLoading(false);
    });
  }, [orgId, profile?.id]);

  const markComplete = async (lessonId: string) => {
    setMarkingDone(true);
    const next = new Set(completed);
    next.has(lessonId) ? next.delete(lessonId) : next.add(lessonId);
    setCompleted(next);
    try { localStorage.setItem(`edu_completed_${orgId}_${profile?.id}`, JSON.stringify([...next])); } catch { /* ignore */ }
    toast.success(next.has(lessonId) ? 'Lesson marked as complete!' : 'Marked as incomplete');
    setMarkingDone(false);
  };

  const filtered = lessons.filter(l => {
    const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase());
    const matchSubject = subjectFilter === 'all' || l.subjects?.id === subjectFilter;
    return matchSearch && matchSubject;
  });

  const completedCount = lessons.filter(l => completed.has(l.id)).length;

  return (
    <div>
      <PageHeader title="My Courses" description={`${lessons.length} lessons available · ${completedCount} completed`} />

      {/* Search + Filter bar */}
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search lessons…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 px-9" />
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="All subjects" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lesson list */}
        <div className="lg:col-span-1 space-y-2">
          {loading ? <p className="text-sm text-muted-foreground p-4">Loading…</p>
          : filtered.length === 0
            ? <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
                {search || subjectFilter !== 'all' ? 'No lessons match your filters' : 'No lessons available yet'}
              </CardContent></Card>
          : filtered.map(lesson => {
            const Icon = contentIcons[lesson.content_type as ContentType] || FileText;
            const isDone = completed.has(lesson.id);
            return (
              <Card key={lesson.id}
                className={`cursor-pointer transition-colors ${selectedLesson?.id === lesson.id ? 'border-primary' : ''} ${isDone ? 'opacity-70' : ''}`}
                onClick={() => setSelectedLesson(lesson)}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${isDone ? 'bg-success/10' : 'bg-primary/10'}`}>
                      {isDone ? <CheckCircle className="h-4 w-4 text-success" /> : <Icon className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium line-clamp-2 text-balance">{lesson.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <p className="text-xs text-muted-foreground">{lesson.subjects?.name || 'General'}</p>
                        <Badge variant="outline" className="text-[10px] h-4 px-1 capitalize">{lesson.content_type}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Lesson viewer */}
        <div className="lg:col-span-2">
          {selectedLesson ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base text-balance">{selectedLesson.title}</CardTitle>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs capitalize">{selectedLesson.content_type}</Badge>
                      {selectedLesson.subjects?.name && <Badge variant="outline" className="text-xs">{selectedLesson.subjects.name}</Badge>}
                    </div>
                  </div>
                  <Button size="sm" variant={completed.has(selectedLesson.id) ? 'secondary' : 'outline'}
                    className="shrink-0 gap-1.5" disabled={markingDone}
                    onClick={() => markComplete(selectedLesson.id)}>
                    {markingDone ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                    {completed.has(selectedLesson.id) ? 'Completed' : 'Mark Complete'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedLesson.description && <p className="text-sm text-muted-foreground mb-4 text-pretty">{selectedLesson.description}</p>}
                {selectedLesson.content_type === 'text' && selectedLesson.content && (
                  <div className="prose prose-sm max-w-none text-foreground leading-relaxed">
                    <p className="text-pretty">{selectedLesson.content}</p>
                  </div>
                )}
                {selectedLesson.content_type === 'audio' && selectedLesson.file_url && (
                  <audio controls src={selectedLesson.file_url} className="w-full" />
                )}
                {selectedLesson.content_type === 'video' && selectedLesson.file_url && (
                  <video controls src={selectedLesson.file_url} className="w-full rounded-lg" />
                )}
                {selectedLesson.content_type === 'pdf' && selectedLesson.file_url && (
                  <div className="rounded-lg overflow-hidden border border-border">
                    <iframe
                      src={`${selectedLesson.file_url}#toolbar=1`}
                      className="w-full"
                      style={{ height: '600px' }}
                      title={selectedLesson.title}
                    />
                  </div>
                )}
                {selectedLesson.content_type === 'pdf' && !selectedLesson.file_url && (
                  <p className="text-sm text-muted-foreground">No PDF file attached to this lesson.</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-20 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-sm text-muted-foreground">Select a lesson to view content</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

