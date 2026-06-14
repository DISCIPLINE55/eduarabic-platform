import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/common/StatusBadge';
import { toast } from 'sonner';
import { Plus, Search, Loader2, DollarSign } from 'lucide-react';

export default function FinancesPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFeeDialog, setShowFeeDialog] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'structures' | 'payments'>('structures');
  const [search, setSearch] = useState('');
  const [feeForm, setFeeForm] = useState({ name: '', amount: '', frequency: 'monthly', description: '' });
  const [payForm, setPayForm] = useState({ student_id: '', fee_structure_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'cash', notes: '' });

  const fetchData = async () => {
    if (!orgId) return;
    const [{ data: fees }, { data: pays }, { data: studs }] = await Promise.all([
      supabase.from('fee_structures').select('*').eq('organization_id', orgId).order('name'),
      supabase.from('student_payments').select('*, students(full_name, student_id_code)').eq('organization_id', orgId).order('payment_date', { ascending: false }).limit(50),
      supabase.from('students').select('id, full_name, student_id_code').eq('organization_id', orgId).eq('status', 'active').order('full_name'),
    ]);
    setFeeStructures(fees || []);
    setPayments(pays || []);
    setStudents(studs || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [orgId]);

  const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const filteredPayments = payments.filter(p => p.students?.full_name?.toLowerCase().includes(search.toLowerCase()));

  const saveFeeStructure = async () => {
    if (!feeForm.name || !feeForm.amount || !orgId) { toast.error('Name and amount are required'); return; }
    setSaving(true);
    const { error } = await supabase.from('fee_structures').insert({ organization_id: orgId, name: feeForm.name, amount: parseFloat(feeForm.amount), frequency: feeForm.frequency, description: feeForm.description || null, currency: 'GHS', created_by: profile?.id });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Fee structure created');
    setShowFeeDialog(false);
    setFeeForm({ name: '', amount: '', frequency: 'monthly', description: '' });
    fetchData();
  };

  const savePayment = async () => {
    if (!payForm.student_id || !payForm.amount || !orgId) { toast.error('Student and amount are required'); return; }
    setSaving(true);
    const { error } = await supabase.from('student_payments').insert({ organization_id: orgId, student_id: payForm.student_id, fee_structure_id: payForm.fee_structure_id || null, amount: parseFloat(payForm.amount), payment_date: payForm.payment_date, payment_method: payForm.payment_method, notes: payForm.notes || null, currency: 'GHS', recorded_by: profile?.id, created_by: profile?.id });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Payment recorded');
    setShowPayDialog(false);
    setPayForm({ student_id: '', fee_structure_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'cash', notes: '' });
    fetchData();
  };

  return (
    <div>
      <PageHeader title="Financial Management" description="Fee structures and payment records">
        <Button variant="outline" onClick={() => setShowFeeDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />Fee Structure
        </Button>
        <Button onClick={() => setShowPayDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />Record Payment
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Collected</p><p className="text-2xl font-bold text-foreground">GHS {totalCollected.toFixed(2)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Fee Structures</p><p className="text-2xl font-bold text-foreground">{feeStructures.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Transactions</p><p className="text-2xl font-bold text-foreground">{payments.length}</p></CardContent></Card>
      </div>

      <div className="flex gap-2 mb-4">
        <Button variant={tab === 'structures' ? 'default' : 'outline'} size="sm" onClick={() => setTab('structures')}>Fee Structures</Button>
        <Button variant={tab === 'payments' ? 'default' : 'outline'} size="sm" onClick={() => setTab('payments')}>Payments</Button>
      </div>

      {tab === 'structures' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Name</TableHead>
                    <TableHead className="whitespace-nowrap">Amount (GHS)</TableHead>
                    <TableHead className="whitespace-nowrap">Frequency</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  : feeStructures.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No fee structures created</TableCell></TableRow>
                  : feeStructures.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="whitespace-nowrap font-medium text-sm">{f.name}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm font-mono">GHS {parseFloat(f.amount).toFixed(2)}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm capitalize">{f.frequency}</TableCell>
                      <TableCell className="whitespace-nowrap"><StatusBadge status={f.is_active ? 'active' : 'inactive'} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'payments' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by student..." className="pl-9 px-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Student</TableHead>
                    <TableHead className="whitespace-nowrap">Amount (GHS)</TableHead>
                    <TableHead className="whitespace-nowrap">Method</TableHead>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No payments recorded</TableCell></TableRow>
                  : filteredPayments.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap text-sm">{p.students?.full_name}<br /><span className="text-xs text-muted-foreground font-mono">{p.students?.student_id_code}</span></TableCell>
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
      )}

      {/* Fee Structure Dialog */}
      <Dialog open={showFeeDialog} onOpenChange={setShowFeeDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>Create Fee Structure</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Name *</Label><Input value={feeForm.name} onChange={e => setFeeForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Monthly Tuition" className="px-3" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Amount (GHS) *</Label><Input type="number" value={feeForm.amount} onChange={e => setFeeForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="px-3" /></div>
              <div className="space-y-1.5"><Label>Frequency</Label>
                <Select value={feeForm.frequency} onValueChange={v => setFeeForm(f => ({ ...f, frequency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="termly">Termly</SelectItem><SelectItem value="annual">Annual</SelectItem><SelectItem value="one_time">One-time</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeeDialog(false)}>Cancel</Button>
            <Button onClick={saveFeeStructure} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Student *</Label>
              <Select value={payForm.student_id} onValueChange={v => setPayForm(f => ({ ...f, student_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.student_id_code})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Amount (GHS) *</Label><Input type="number" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="px-3" /></div>
              <div className="space-y-1.5"><Label>Payment Date</Label><input type="date" value={payForm.payment_date} onChange={e => setPayForm(f => ({ ...f, payment_date: e.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" /></div>
            </div>
            <div className="space-y-1.5"><Label>Payment Method</Label>
              <Select value={payForm.payment_method} onValueChange={v => setPayForm(f => ({ ...f, payment_method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="mobile_money">Mobile Money</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>Cancel</Button>
            <Button onClick={savePayment} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
