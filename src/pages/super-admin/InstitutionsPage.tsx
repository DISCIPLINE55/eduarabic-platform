import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Plus, Search, Building2, Edit, Loader2, Globe } from 'lucide-react';
import type { Institution } from '@/types/types';

export default function InstitutionsPage() {
  const { profile } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState<Institution | null>(null);
  const [form, setForm] = useState({ name: '', code: '', contact_email: '', contact_phone: '', address: '', region: '', subscription_status: 'active' });

  const fetchInstitutions = async () => {
    const { data } = await supabase.from('institutions').select('*').order('name');
    setInstitutions(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchInstitutions(); }, []);

  const filtered = institutions.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.code.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditItem(null); setForm({ name: '', code: '', contact_email: '', contact_phone: '', address: '', region: '', subscription_status: 'active' }); setShowDialog(true); };
  const openEdit = (inst: Institution) => { setEditItem(inst); setForm({ name: inst.name, code: inst.code, contact_email: inst.contact_email || '', contact_phone: inst.contact_phone || '', address: inst.address || '', region: inst.region || '', subscription_status: inst.subscription_status }); setShowDialog(true); };

  const handleSave = async () => {
    if (!form.name || !form.code) { toast.error('Name and code are required'); return; }
    setSaving(true);
    if (editItem) {
      const { error } = await supabase.from('institutions').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editItem.id);
      if (error) { toast.error('Failed to update institution'); } else { toast.success('Institution updated'); }
    } else {
      const { error } = await supabase.from('institutions').insert({ ...form, created_by: profile?.id });
      if (error) { toast.error(error.message); } else { toast.success('Institution created'); }
    }
    setSaving(false);
    setShowDialog(false);
    fetchInstitutions();
  };

  return (
    <div>
      <PageHeader title="Institutions" description="Manage all registered educational institutions">
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Institution</Button>
      </PageHeader>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 flex-row">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search institutions..." className="pl-9 px-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Institution Name</TableHead>
                  <TableHead className="whitespace-nowrap">Code</TableHead>
                  <TableHead className="whitespace-nowrap">Region</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Subscription</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No institutions found</TableCell></TableRow>
                ) : filtered.map(inst => (
                  <TableRow key={inst.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{inst.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{inst.contact_email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap"><Badge variant="outline" className="font-mono">{inst.code}</Badge></TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{inst.region || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline" className={inst.is_active ? 'bg-success/10 text-success border-success/30' : 'bg-muted text-muted-foreground border-border'}>
                        {inst.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline" className={inst.subscription_status === 'active' ? 'bg-info/10 text-info border-info/30' : 'bg-destructive/10 text-destructive border-destructive/30'}>
                        {inst.subscription_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(inst)} className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit institution</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? 'Edit Institution' : 'Add Institution'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label>Institution Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" className="px-3" />
              </div>
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label>Code *</Label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. MQI" className="px-3" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label>Contact Email</Label>
                <Input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} className="px-3" />
              </div>
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label>Phone</Label>
                <Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} className="px-3" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="px-3" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Region</Label>
                <Input value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} className="px-3" />
              </div>
              <div className="space-y-1.5">
                <Label>Subscription</Label>
                <Select value={form.subscription_status} onValueChange={v => setForm(f => ({ ...f, subscription_status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editItem ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
