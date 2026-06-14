import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookMarked, CheckCircle, RotateCcw, BookOpen } from 'lucide-react';
import { SURAH_LIST } from '@/types/types';

const statusConfig: Record<string, { label: string; color: string }> = {
  memorized:      { label: 'Memorized',     color: 'bg-success/10 text-success border-success/30' },
  in_progress:    { label: 'In Progress',   color: 'bg-info/10 text-info border-info/30' },
  needs_revision: { label: 'Needs Revision',color: 'bg-warning/10 text-warning border-warning/30' },
  not_started:    { label: 'Not Started',   color: 'bg-muted text-muted-foreground border-border' },
};

export default function ParentHifzPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [hifz, setHifz] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    supabase.from('hifz_progress').select('*').eq('organization_id', orgId).order('surah_number')
      .then(({ data }) => { setHifz(data || []); setLoading(false); });
  }, [orgId]);

  const surahName = (num: number) => SURAH_LIST.find(s => s.number === num)?.name || `Surah ${num}`;
  const memorized    = hifz.filter(h => h.status === 'memorized').length;
  const inProgress   = hifz.filter(h => h.status === 'in_progress').length;
  const needsRevision= hifz.filter(h => h.status === 'needs_revision').length;

  return (
    <div>
      <PageHeader title="Hifz Progress" description="Your child's Quran memorization journey" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Surahs Memorized" value={loading ? '...' : memorized} icon={<CheckCircle className="h-5 w-5" />} description="Out of 114" />
        <StatCard title="In Progress" value={loading ? '...' : inProgress} icon={<BookOpen className="h-5 w-5" />} description="Currently being memorized" />
        <StatCard title="Needs Revision" value={loading ? '...' : needsRevision} icon={<RotateCcw className="h-5 w-5" />} description="Require review" />
      </div>

      <Card className="mb-4">
        <CardContent className="p-4 md:p-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground font-medium">Overall Hifz Progress</span>
            <span className="font-bold text-foreground">{memorized} / 114 Surahs</span>
          </div>
          <Progress value={(memorized / 114) * 100} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {Math.round((memorized / 114) * 100)}% of the Quran memorized
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-primary" /> Surah Progress Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Surah</TableHead>
                  <TableHead className="whitespace-nowrap">Ayahs</TableHead>
                  <TableHead className="whitespace-nowrap">Completion</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : hifz.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No Hifz records yet</TableCell></TableRow>
                ) : hifz.map(rec => {
                  const cfg = statusConfig[rec.status] || statusConfig.not_started;
                  return (
                    <TableRow key={rec.id}>
                      <TableCell className="whitespace-nowrap">
                        <p className="text-sm font-medium">{rec.surah_number}. {surahName(rec.surah_number)}</p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {rec.ayah_from && rec.ayah_to ? `${rec.ayah_from}–${rec.ayah_to}` : 'Full Surah'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress value={rec.completion_percentage || 0} className="h-1.5 flex-1" />
                          <span className="text-xs font-medium text-foreground shrink-0">{rec.completion_percentage || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(rec.updated_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
