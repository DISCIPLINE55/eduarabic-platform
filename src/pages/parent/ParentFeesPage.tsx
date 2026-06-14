import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ParentFeesPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [payments, setPayments] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    Promise.all([
      supabase.from('students').select('*').eq('organization_id', orgId).maybeSingle(),
      supabase.from('student_payments').select('*, fee_structures(name, amount, frequency)').eq('organization_id', orgId).order('payment_date', { ascending: false }),
    ]).then(([{ data: s }, { data: pays }]) => {
      setStudent(s);
      setPayments(pays || []);
      setLoading(false);
    });
  }, [orgId]);

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div>
      <PageHeader title="Fee Status" description="View payment history and outstanding fees" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <StatCard title="Total Paid" value={`GHS ${totalPaid.toFixed(2)}`} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard title="Outstanding" value="GHS 0.00" icon={<TrendingDown className="h-5 w-5" />} description="No outstanding balance" />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Description</TableHead>
                  <TableHead className="whitespace-nowrap">Amount (GHS)</TableHead>
                  <TableHead className="whitespace-nowrap">Method</TableHead>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                : payments.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No payment records found</TableCell></TableRow>
                : payments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap text-sm">{p.fee_structures?.name || 'Payment'}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm font-mono font-medium">GHS {parseFloat(p.amount).toFixed(2)}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm capitalize">{p.payment_method || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{new Date(p.payment_date).toLocaleDateString()}</TableCell>
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
