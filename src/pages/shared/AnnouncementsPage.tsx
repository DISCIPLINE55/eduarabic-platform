import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Loader2, Bell, Send } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function AnnouncementsPage({ role }: { role?: string }) {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', is_published: true });
  const canCreate = profile?.role === 'admin' || profile?.role === 'teacher' || profile?.role === 'super_admin';

  const fetchData = async () => {
    if (!orgId) return;
    const { data } = await supabase.from('announcements').select('*, profiles(full_name)').eq('organization_id', orgId).eq('is_published', true).order('created_at', { ascending: false });
    setAnnouncements(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [orgId]);

  const handleSave = async () => {
    if (!form.title || !form.content || !orgId) { toast.error('Title and content are required'); return; }
    setSaving(true);
    const { error } = await supabase.from('announcements').insert({ organization_id: orgId, title: form.title, content: form.content, is_published: form.is_published, created_by: profile?.id });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Announcement posted');
    setShowDialog(false);
    setForm({ title: '', content: '', is_published: true });
    fetchData();
  };

  return (
    <div>
      <PageHeader title="Announcements" description="Institution and class announcements">
        {canCreate && <Button onClick={() => setShowDialog(true)}><Plus className="h-4 w-4 mr-2" />Post Announcement</Button>}
      </PageHeader>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : announcements.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No announcements yet</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {announcements.map(ann => (
            <Card key={ann.id}>
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Bell className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="font-semibold text-sm text-balance">{ann.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground text-pretty leading-relaxed">{ann.content}</p>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="text-xs text-muted-foreground">By {ann.profiles?.full_name || 'Admin'}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{new Date(ann.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>Post Announcement</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title" className="px-3" /></div>
            <div className="space-y-1.5"><Label>Content *</Label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={5} placeholder="Write your announcement..." className="px-3" /></div>
            <div className="flex items-center gap-3 min-h-12">
              <Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} />
              <Label>Publish immediately</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}<Send className="h-4 w-4 mr-2" />Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
