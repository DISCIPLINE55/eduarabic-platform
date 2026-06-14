import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/common/StatCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardList, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  present:  { label: 'Present',  color: 'bg-success/10 text-success border-success/30',  icon: CheckCircle  },
  absent:   { label: 'Absent',   color: 'bg-destructive/10 text-destructive border-destructive/30',        icon: XCircle      },
  late:     { label: 'Late',     color: 'bg-warning/10 text-warning border-warning/30',  icon: Clock        },
  excused:  { label: 'Excused',  color: 'bg-info/10 text-info border-info/30',     icon: AlertCircle  },
};

export default function ParentAttendancePage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    supabase.from('attendance').select('*, classes(name)')
      .eq('organization_id', orgId)
      .order('date', { ascending: false })
      .limit(60)
      .then(({ data }) => { setAttendance(data || []); setLoading(false); });
  }, [orgId]);

  const total   = attendance.length;
  const present = attendance.filter(a => a.status === 'present').length;
  const absent  = attendance.filter(a => a.status === 'absent').length;
  const late    = attendance.filter(a => a.status === 'late').length;
  const rate    = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div>
      <PageHeader title="Attendance History" description="Your child's class attendance record" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Attendance Rate" value={`${rate}%`} icon={<ClipboardList className="h-5 w-5" />} description="Overall" />
        <StatCard title="Present" value={present} icon={<CheckCircle className="h-5 w-5" />} description="Days present" />
        <StatCard title="Absent" value={absent} icon={<XCircle className="h-5 w-5" />} description="Days absent" />
        <StatCard title="Late" value={late} icon={<Clock className="h-5 w-5" />} description="Days late" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" /> Attendance Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Class</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : attendance.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No attendance records found</TableCell></TableRow>
                ) : attendance.map(rec => {
                  const cfg = statusConfig[rec.status] || statusConfig.absent;
                  const Icon = cfg.icon;
                  return (
                    <TableRow key={rec.id}>
                      <TableCell className="whitespace-nowrap text-sm font-medium">
                        {new Date(rec.date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {rec.classes?.name || '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className={`text-xs flex items-center gap-1 w-fit ${cfg.color}`}>
                          <Icon className="h-3 w-3" />{cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {rec.notes || '—'}
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
