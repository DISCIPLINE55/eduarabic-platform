import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/ui/badge';
import { BookOpenCheck, CheckCircle, Clock, TrendingUp } from 'lucide-react';

const typeColors: Record<string, string> = {
  quiz:       'bg-info/10 text-info border-info/30',
  exam:       'bg-destructive/10 text-destructive border-destructive/30',
  practice:   'bg-success/10 text-success border-success/30',
  assignment: 'bg-secondary text-secondary-foreground border-border',
};

export default function ParentAssessmentsPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    supabase.from('assessment_submissions')
      .select('*, assessments(title, type, duration_minutes)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setSubmissions(data || []); setLoading(false); });
  }, [orgId]);

  const graded = submissions.filter(s => s.score != null);
  const avg = graded.length > 0 ? graded.reduce((a, s) => a + s.score, 0) / graded.length : 0;
  const best = graded.length > 0 ? Math.max(...graded.map(s => s.score)) : 0;

  return (
    <div>
      <PageHeader title="Assessments" description="Your child's quiz and exam results" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Submitted" value={loading ? '...' : submissions.length} icon={<BookOpenCheck className="h-5 w-5" />} />
        <StatCard title="Average Score" value={loading ? '...' : (avg > 0 ? `${avg.toFixed(1)}%` : '—')} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard title="Best Score" value={loading ? '...' : (best > 0 ? `${best.toFixed(1)}%` : '—')} icon={<CheckCircle className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpenCheck className="h-4 w-4 text-primary" /> Assessment Results
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Assessment</TableHead>
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap">Submitted</TableHead>
                  <TableHead className="whitespace-nowrap">Score</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : submissions.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No assessments submitted yet</TableCell></TableRow>
                ) : submissions.map(sub => (
                  <TableRow key={sub.id}>
                    <TableCell className="whitespace-nowrap">
                      <p className="text-sm font-medium">{sub.assessments?.title || 'Assessment'}</p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className={`text-xs px-2 py-0.5 rounded border capitalize ${typeColors[sub.assessments?.type] || 'bg-muted text-muted-foreground'}`}>
                        {sub.assessments?.type || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {sub.score != null ? (
                        <span className={`text-sm font-bold ${sub.score >= 80 ? 'text-success' : sub.score >= 60 ? 'text-warning' : 'text-destructive'}`}>
                          {sub.score.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <StatusBadge status={sub.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
