import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Search, BookOpenCheck, Eye, Trash2, Send, BarChart3,
  ClipboardList, CheckCircle, Clock, FileText, Users
} from 'lucide-react';
import type { AssessmentStatus, AssessmentType } from '@/types/types';

const STATUS_COLORS: Record<AssessmentStatus, string> = {
  draft: 'bg-muted text-muted-foreground border-border',
  published: 'bg-info/10 text-info border-info/30',
  reviewed: 'bg-warning/10 text-warning border-warning/30',
  results_published: 'bg-success/10 text-success border-success/30',
};

const TYPE_ICONS: Record<AssessmentType, React.ElementType> = {
  quiz: ClipboardList, exam: FileText, practice: BookOpenCheck,
  assignment: FileText, makeup: ClipboardList,
};

export default function AdminAssessmentsPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;

  const [assessments, setAssessments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [detailAssessment, setDetailAssessment] = useState<any>(null);
  const [detailSubs, setDetailSubs] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchData = async () => {
    if (!orgId) return;
    setLoading(true);
    const { data: assmts } = await supabase
      .from('assessments')
      .select('*, subjects(name), classes(name), profiles!assessments_created_by_fkey(full_name)')
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    setAssessments(assmts || []);

    // Fetch submission counts per assessment
    if (assmts && assmts.length > 0) {
      const ids = assmts.map((a: any) => a.id);
      const { data: subs } = await supabase
        .from('assessment_submissions')
        .select('assessment_id')
        .in('assessment_id', ids);

      const counts: Record<string, number> = {};
      (subs || []).forEach((s: any) => {
        counts[s.assessment_id] = (counts[s.assessment_id] || 0) + 1;
      });
      setSubmissions(counts);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [orgId]);

  const filtered = assessments.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.subjects?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchType = typeFilter === 'all' || a.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const handlePublish = async (id: string) => {
    const { error } = await supabase.from('assessments').update({ status: 'published', updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Failed to publish'); return; }
    toast.success('Assessment published — students can now access it');
    fetchData();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from('assessments').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    setDeleting(null);
    if (error) { toast.error('Failed to delete assessment'); return; }
    toast.success('Assessment removed');
    fetchData();
  };

  const openDetail = async (assessment: any) => {
    setDetailAssessment(assessment);
    setDetailLoading(true);
    const { data } = await supabase
      .from('assessment_submissions')
      .select('*, students(full_name, student_id_code)')
      .eq('assessment_id', assessment.id)
      .order('submitted_at', { ascending: false });
    setDetailSubs(data || []);
    setDetailLoading(false);
  };

  const publishResults = async (assessmentId: string) => {
    const { error } = await supabase
      .from('assessment_submissions')
      .update({ status: 'published', updated_at: new Date().toISOString() })
      .eq('assessment_id', assessmentId)
      .eq('status', 'graded');
    if (error) { toast.error('Failed to publish results'); return; }
    toast.success('Results published to all students');
    openDetail(detailAssessment);
    fetchData();
  };

  // Summary stats
  const stats = {
    total: assessments.length,
    draft: assessments.filter(a => a.status === 'draft').length,
    published: assessments.filter(a => a.status === 'published').length,
    resultsOut: assessments.filter(a => a.status === 'results_published').length,
  };

  return (
    <div>
      <PageHeader
        title="Assessment Management"
        description="Monitor and manage all assessments across your institution"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, icon: BookOpenCheck, color: 'text-primary' },
          { label: 'Draft', value: stats.draft, icon: FileText, color: 'text-muted-foreground' },
          { label: 'Published', value: stats.published, icon: Send, color: 'text-info' },
          { label: 'Results Out', value: stats.resultsOut, icon: CheckCircle, color: 'text-success' },
        ].map(s => (
          <Card key={s.label} className="h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-foreground leading-none">{loading ? '—' : s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or subject..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 px-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="results_published">Results Out</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-36">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="exam">Exam</SelectItem>
                <SelectItem value="practice">Practice</SelectItem>
                <SelectItem value="assignment">Assignment</SelectItem>
                <SelectItem value="makeup">Make-Up</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Title</TableHead>
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap">Subject</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap text-center">Submissions</TableHead>
                  <TableHead className="whitespace-nowrap">Teacher</TableHead>
                  <TableHead className="whitespace-nowrap">Created</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading assessments...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No assessments found</TableCell></TableRow>
                ) : filtered.map(a => {
                  const TypeIcon = TYPE_ICONS[a.type as AssessmentType] || FileText;
                  const subCount = submissions[a.id] || 0;
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium text-sm max-w-[180px] truncate">{a.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="capitalize text-sm">{a.type}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {a.subjects?.name || '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className={`text-xs ${STATUS_COLORS[a.status as AssessmentStatus] || ''}`}>
                          {a.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-medium">{subCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {a.profiles?.full_name || '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openDetail(a)} title="View submissions">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {a.status === 'draft' && (
                            <Button variant="ghost" size="sm" onClick={() => handlePublish(a.id)} title="Publish">
                              <Send className="h-4 w-4 text-info" />
                            </Button>
                          )}
                          {a.status === 'draft' && (
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => handleDelete(a.id)}
                              disabled={deleting === a.id}
                              title="Delete draft"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* Submissions Detail Dialog */}
      <Dialog open={!!detailAssessment} onOpenChange={open => { if (!open) setDetailAssessment(null); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-3xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-balance flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {detailAssessment?.title} — Submissions
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* Assessment meta */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {[
                { label: 'Type', value: detailAssessment?.type },
                { label: 'Status', value: detailAssessment?.status?.replace('_', ' ') },
                { label: 'Duration', value: detailAssessment?.duration_minutes ? `${detailAssessment.duration_minutes} min` : 'No limit' },
                { label: 'Submissions', value: detailSubs.length },
              ].map(m => (
                <div key={m.label} className="bg-muted rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="font-medium capitalize mt-0.5">{m.value || '—'}</p>
                </div>
              ))}
            </div>

            {/* Submissions table */}
            {detailLoading ? (
              <div className="flex items-center justify-center py-8">
                <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : detailSubs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No submissions yet</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Student</TableHead>
                      <TableHead className="whitespace-nowrap">Submitted</TableHead>
                      <TableHead className="whitespace-nowrap text-center">Score</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailSubs.map(sub => (
                      <TableRow key={sub.id}>
                        <TableCell className="whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium">{sub.students?.full_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{sub.students?.student_id_code}</p>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : '—'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {sub.score != null ? (
                            <span className="font-semibold">
                              {sub.score}/{sub.max_score || '?'}
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <StatusBadge status={sub.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter>
            {detailAssessment?.status === 'reviewed' && (
              <Button onClick={() => publishResults(detailAssessment.id)} className="gap-2">
                <CheckCircle className="h-4 w-4" /> Publish Results to Students
              </Button>
            )}
            <Button variant="outline" onClick={() => setDetailAssessment(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
