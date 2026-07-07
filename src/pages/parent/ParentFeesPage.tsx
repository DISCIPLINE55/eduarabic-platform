import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingDown, Download, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  paid:     { label: 'Paid',     color: 'bg-success/10 text-success border-success/30',         icon: CheckCircle  },
  pending:  { label: 'Pending',  color: 'bg-warning/10 text-warning border-warning/30',         icon: Clock        },
  overdue:  { label: 'Overdue',  color: 'bg-destructive/10 text-destructive border-destructive/30', icon: AlertTriangle },
};

function generateReceiptText(p: any, studentName: string): string {
  return [
    '═══════════════════════════════════════',
    '           EDUARABIC PLATFORM          ',
    '         PAYMENT RECEIPT               ',
    '═══════════════════════════════════════',
    `Student:       ${studentName}`,
    `Description:   ${p.fee_structures?.name || 'Fee Payment'}`,
    `Amount:        GHS ${parseFloat(p.amount).toFixed(2)}`,
    `Payment Date:  ${p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-GB') : '—'}`,
    `Due Date:      ${p.due_date ? new Date(p.due_date).toLocaleDateString('en-GB') : '—'}`,
    `Method:        ${p.payment_method || '—'}`,
    `Reference:     ${p.reference_number || '—'}`,
    `Status:        ${(p.status || 'paid').toUpperCase()}`,
    '───────────────────────────────────────',
    `Receipt ID:    ${p.id.slice(0, 8).toUpperCase()}`,
    `Generated:     ${new Date().toLocaleString('en-GB')}`,
    '═══════════════════════════════════════',
    'Thank you for your payment!',
  ].join('\n');
}

export default function ParentFeesPage() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (!profile?.id) return;
    setLoading(true);
    // Find child
    supabase.from('students')
      .select('id, full_name, student_id_code')
      .eq('guardian_profile_id', profile.id)
      .maybeSingle()
      .then(async ({ data: s }) => {
        let child = s;
        if (!child) {
          const { data: byEmail } = await supabase
            .from('students').select('id, full_name, student_id_code')
            .eq('guardian_email', profile.email ?? '').maybeSingle();
          child = byEmail;
        }
        setStudent(child);
        if (!child) { setLoading(false); return; }
        const { data: pays } = await supabase
          .from('student_payments')
          .select('*, fee_structures(name, amount, frequency)')
          .eq('student_id', child.id)
          .order('created_at', { ascending: false });
        setPayments(pays || []);
        setLoading(false);
      });
  }, [profile?.id]);

  const filtered = useMemo(() => {
    return payments.filter(p => {
      const d = p.payment_date || p.created_at?.slice(0, 10);
      if (dateFrom && d && d < dateFrom) return false;
      if (dateTo && d && d > dateTo) return false;
      return true;
    });
  }, [payments, dateFrom, dateTo]);

  const totalPaid      = filtered.filter(p => p.status === 'paid').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const totalPending   = filtered.filter(p => p.status !== 'paid').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const overdueCount   = filtered.filter(p => p.status === 'overdue').length;

  const handleDownloadReceipt = (p: any) => {
    if (p.status !== 'paid') {
      toast.error('Receipt not available for unpaid fees');
      return;
    }
    const text = generateReceiptText(p, student?.full_name || 'Student');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${p.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Receipt downloaded');
  };

  return (
    <div>
      <PageHeader title="Fee Payment History" description="Your child's fee records and outstanding balance" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Paid" value={`GHS ${totalPaid.toFixed(2)}`} icon={<DollarSign className="h-5 w-5" />} description="Confirmed payments" />
        <StatCard title="Outstanding Balance" value={`GHS ${totalPending.toFixed(2)}`} icon={<TrendingDown className="h-5 w-5" />} description="Pending + overdue" />
        <StatCard title="Overdue Payments" value={overdueCount} icon={<AlertTriangle className="h-5 w-5" />} description="Require attention" />
      </div>

      {/* Date Filter */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 min-w-0 space-y-1">
              <Label className="text-sm font-normal">From Date</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <Label className="text-sm font-normal">To Date</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" /> Payment Records
            <span className="ml-auto text-xs font-normal text-muted-foreground">{filtered.length} records</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Description</TableHead>
                  <TableHead className="whitespace-nowrap">Amount (GHS)</TableHead>
                  <TableHead className="whitespace-nowrap">Due Date</TableHead>
                  <TableHead className="whitespace-nowrap">Payment Date</TableHead>
                  <TableHead className="whitespace-nowrap">Method</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Loading fee records...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No fee records found for selected period</TableCell></TableRow>
                ) : filtered.map(p => {
                  const cfg = statusConfig[p.status] || statusConfig.pending;
                  const Icon = cfg.icon;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap text-sm font-medium">{p.fee_structures?.name || 'Fee Payment'}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm font-mono font-semibold">GHS {parseFloat(p.amount).toFixed(2)}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {p.due_date ? new Date(p.due_date).toLocaleDateString('en-GB') : '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-GB') : '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm capitalize text-muted-foreground">{p.payment_method || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className={`text-xs flex items-center gap-1 w-fit ${cfg.color}`}>
                          <Icon className="h-3 w-3" />{cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => handleDownloadReceipt(p)}
                          disabled={p.status !== 'paid'}
                        >
                          <Download className="h-3.5 w-3.5" />Receipt
                        </Button>
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
