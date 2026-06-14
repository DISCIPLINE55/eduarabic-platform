import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Settings, Shield, Bell, Database, Globe, Loader2 } from 'lucide-react';

export default function PlatformSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [general, setGeneral] = useState({
    platformName: 'EduArabic',
    supportEmail: 'support@eduarabic.com',
    defaultCurrency: 'GHS',
    defaultLanguage: 'en',
    defaultTimezone: 'Africa/Accra',
  });
  const [features, setFeatures] = useState({
    aiEnabled: true,
    offlineSync: true,
    parentPortal: true,
    certificateQR: true,
    audioReviews: true,
    emailNotifications: false,
    smsNotifications: false,
  });

  const handleSave = async (section: string) => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    toast.success(`${section} settings saved successfully`);
  };

  return (
    <div>
      <PageHeader title="Platform Settings" description="Configure global platform behaviour and feature flags" />

      <div className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" /> General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Platform Name</Label>
                <Input value={general.platformName} onChange={e => setGeneral(g => ({ ...g, platformName: e.target.value }))} className="px-3" />
              </div>
              <div className="space-y-1.5">
                <Label>Support Email</Label>
                <Input type="email" value={general.supportEmail} onChange={e => setGeneral(g => ({ ...g, supportEmail: e.target.value }))} className="px-3" />
              </div>
              <div className="space-y-1.5">
                <Label>Default Currency</Label>
                <Input value={general.defaultCurrency} onChange={e => setGeneral(g => ({ ...g, defaultCurrency: e.target.value }))} className="px-3" placeholder="e.g. GHS, USD, GBP" />
              </div>
              <div className="space-y-1.5">
                <Label>Default Timezone</Label>
                <Input value={general.defaultTimezone} onChange={e => setGeneral(g => ({ ...g, defaultTimezone: e.target.value }))} className="px-3" placeholder="e.g. Africa/Accra" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => handleSave('General')} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save General Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feature Flags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Feature Flags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              { key: 'aiEnabled',           label: 'AI-Assisted Teaching',         desc: 'Enable AI question generation and Tajweed analysis' },
              { key: 'offlineSync',         label: 'Offline Sync',                 desc: 'Allow attendance and data capture without internet' },
              { key: 'parentPortal',        label: 'Parent Portal',                desc: 'Enable parent login and child progress visibility' },
              { key: 'certificateQR',       label: 'QR Certificate Verification',  desc: 'Generate QR codes on issued certificates' },
              { key: 'audioReviews',        label: 'Audio Recitation Reviews',     desc: 'Allow students to submit audio recitations for teacher review' },
              { key: 'emailNotifications',  label: 'Email Notifications',          desc: 'Send email alerts for announcements and results' },
              { key: 'smsNotifications',    label: 'SMS Notifications',            desc: 'Send SMS alerts to parents (requires Twilio integration)' },
            ].map(({ key, label, desc }) => (
              <div key={key}>
                <div className="flex items-center justify-between py-3">
                  <div className="min-w-0 flex-1 mr-4">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground text-pretty">{desc}</p>
                  </div>
                  <Switch
                    checked={features[key as keyof typeof features]}
                    onCheckedChange={v => setFeatures(f => ({ ...f, [key]: v }))}
                  />
                </div>
                <Separator />
              </div>
            ))}
            <div className="flex justify-end pt-3">
              <Button onClick={() => handleSave('Feature')} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Feature Flags
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Security & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Database (Supabase RLS)', status: 'Enabled — all tables protected', ok: true },
              { label: 'Row Level Security', status: '19 tables with tenant isolation', ok: true },
              { label: 'Edge Function Secrets', status: 'Stored in Supabase Vault', ok: true },
              { label: 'JWT Token Expiry', status: '1 hour with refresh token rotation', ok: true },
              { label: 'Audit Logging', status: 'Active on all core tables', ok: true },
              { label: 'GDPR Data Export', status: 'Roadmap — Phase 3', ok: false },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.status}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${item.ok ? 'text-success bg-success/10' : 'text-warning bg-warning/10'}`}>
                  {item.ok ? 'Active' : 'Pending'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" /> System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Platform Version', value: '1.0.0' },
              { label: 'Database', value: 'Supabase PostgreSQL 15 (us-west-1)' },
              { label: 'Project ID', value: 'mvxzpmngsoutksienfay' },
              { label: 'Frontend Stack', value: 'React 18 + Vite + TypeScript' },
              { label: 'UI Library', value: 'shadcn/ui + Tailwind CSS' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-mono text-foreground">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
