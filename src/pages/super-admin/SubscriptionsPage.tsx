import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CreditCard, Building2, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import type { Institution } from '@/types/types';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active:  { label: 'Active',   color: 'bg-success/10 text-success border-success/30',  icon: CheckCircle  },
  trial:   { label: 'Trial',    color: 'bg-info/10 text-info border-info/30',     icon: Clock        },
  expired: { label: 'Expired',  color: 'bg-destructive/10 text-destructive border-destructive/30',        icon: AlertCircle  },
};

export default function SubscriptionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Institution | null>(null);
  const [form, setForm] = useState({ subscription_status: 'active', subscription_expires_at: '' });
  const [saving, setSaving] = useState(false);

  const fetchInstitutions = async () => {
    const { data } = await supabase.from('institutions').select('*').order('name');
    setInstitutions(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchInstitutions(); }, []);

  const stats = {
    active:  institutions.filter(i => i.subscription_status === 'active').length,
    trial:   institutions.filter(i => i.subscription_status === 'trial').length,
    expired: institutions.filter(i => i.subscription_status === 'expired').length,
  };

  const openEdit = (inst: Institution) => {
    setSelected(inst);
    setForm({
      subscription_status: inst.subscription_status,
      subscription_expires_at: inst.subscription_expires_at?.split('T')[0] || '',
    });
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase.from('institutions').update({
      subscription_status: form.subscription_status,
      subscription_expires_at: form.subscription_expires_at || null,
      updated_at: new Date().toISOString(),
    }).eq('id', selected.id);
    setSaving(false);
    if (error) { toast.error('Failed to update subscription'); return; }
    toast.success('Subscription updated');
    setSelected(null);
    fetchInstitutions();
  };

  return (
    <div>
      <PageHeader title="Subscriptions" description="Manage institution subscription plans and billing" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {(['active', 'trial', 'expired'] as const).map(s => {
          const cfg = statusConfig[s];
          const Icon = cfg.icon;
          return (
            <Card key={s}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats[s]}</p>
                  <p className="text-sm text-muted-foreground">{cfg.label} Institutions</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" /> All Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Institution</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Expires</TableHead>
                  <TableHead className="whitespace-nowrap">Is Active</TableHead>
                  <TableHead className="whitespace-nowrap">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : institutions.map(inst => {
                  const cfg = statusConfig[inst.subscription_status] || statusConfig.expired;
                  return (
                    <TableRow key={inst.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{inst.name}</p>
                            <p className="text-xs text-muted-foreground">{inst.code}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {inst.subscription_expires_at
                          ? new Date(inst.subscription_expires_at).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className={inst.is_active
                          ? 'bg-success/10 text-success border-success/30'
                          : 'bg-muted text-muted-foreground border-border'}>
                          {inst.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openEdit(inst)}>
                          Manage
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

      <Dialog open={!!selected} onOpenChange={v => { if (!v) setSelected(null); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Subscription — {selected?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Subscription Status</Label>
              <Select value={form.subscription_status} onValueChange={v => setForm(f => ({ ...f, subscription_status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={form.subscription_expires_at}
                onChange={e => setForm(f => ({ ...f, subscription_expires_at: e.target.value }))}
                className="px-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
