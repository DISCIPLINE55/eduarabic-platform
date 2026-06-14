import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, FileText, Headphones, Video, File } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ContentType } from '@/types/types';

const contentIcons: Record<ContentType, React.ElementType> = { text: FileText, pdf: File, audio: Headphones, video: Video };

export default function StudentCoursesPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);

  useEffect(() => {
    if (!orgId) return;
    supabase.from('lessons').select('*, subjects(name)').eq('organization_id', orgId).eq('is_published', true).is('deleted_at', null).order('created_at', { ascending: false })
      .then(({ data }) => { setLessons(data || []); setLoading(false); });
  }, [orgId]);

  return (
    <div>
      <PageHeader title="My Courses" description="Access your learning materials" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-2">
          {loading ? <p className="text-sm text-muted-foreground p-4">Loading...</p>
          : lessons.length === 0 ? <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No lessons available yet</CardContent></Card>
          : lessons.map(lesson => {
            const Icon = contentIcons[lesson.content_type as ContentType] || FileText;
            return (
              <Card key={lesson.id} className={`cursor-pointer transition-colors ${selectedLesson?.id === lesson.id ? 'border-primary' : ''}`}
                onClick={() => setSelectedLesson(lesson)}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium line-clamp-2 text-balance">{lesson.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{lesson.subjects?.name || 'General'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="lg:col-span-2">
          {selectedLesson ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-balance">{selectedLesson.title}</CardTitle>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs capitalize">{selectedLesson.content_type}</Badge>
                  {selectedLesson.subjects?.name && <Badge variant="outline" className="text-xs">{selectedLesson.subjects.name}</Badge>}
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
