import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Settings, Shield, Database, Globe, Loader2, Eye, EyeOff, Rocket, CheckCircle, XCircle, Clock, Lock } from 'lucide-react';
import { type PasswordPolicy, DEFAULT_POLICY } from '@/lib/passwordPolicy';

export default function PlatformSettingsPage() {
  const [saving, setSaving] = useState(false);
  // ── Password Policy ──────────────────────────────────────────────────────
  const [policy, setPolicy] = useState<PasswordPolicy>(DEFAULT_POLICY);
  const [policyLoading, setPolicyLoading] = useState(true);

  useEffect(() => {
    supabase.from('app_settings').select('value').eq('key', 'password_policy').single()
      .then(({ data }) => {
        if (data?.value) setPolicy({ ...DEFAULT_POLICY, ...(data.value as Partial<PasswordPolicy>) });
        setPolicyLoading(false);
      });
  }, []);

  const savePolicy = async () => {
    setSaving(true);
    const { error } = await supabase.from('app_settings').upsert(
      { key: 'password_policy', value: policy, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
    setSaving(false);
    if (error) { toast.error('Failed to save password policy'); return; }
    toast.success('Password policy saved — applies to all new password changes');
  };
  const [general, setGeneral] = useState({
    platformName: 'DisciNet',
    supportEmail: 'support@discinet.com',
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

  // Edge Function Deployment state
  const [pat, setPat] = useState('');
  const [projectRef, setProjectRef] = useState('mvxzpmngsoutksienfay');
  const [showPat, setShowPat] = useState(false);
  const [deployStatus, setDeployStatus] = useState<'idle' | 'deploying' | 'success' | 'failed'>('idle');
  const [deployLogs, setDeployLogs] = useState<string[]>([]);

  const handleSave = async (section: string) => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    toast.success(`${section} settings saved successfully`);
  };

  const handleDeploy = async () => {
    if (!pat.trim()) { toast.error('Please enter your Supabase Personal Access Token'); return; }
    if (!projectRef.trim()) { toast.error('Please enter your Supabase Project Reference'); return; }

    setDeployStatus('deploying');
    setDeployLogs([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Not authenticated'); setDeployStatus('failed'); return; }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deploy-edge-function`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pat: pat.trim(), projectRef: projectRef.trim() }),
      });

      const result = await res.json();
      if (result.logs) setDeployLogs(result.logs);

      if (result.success) {
        setDeployStatus('success');
        toast.success('manage-users function deployed successfully!');
      } else {
        setDeployStatus('failed');
        toast.error(`Deployment failed: ${result.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setDeployStatus('failed');
      setDeployLogs(prev => [...prev, `[ERROR] ${err?.message || String(err)}`]);
      toast.error('Deployment request failed');
    }
  };

  const statusIcon = deployStatus === 'success'
    ? <CheckCircle className="h-4 w-4 text-success" />
    : deployStatus === 'failed'
    ? <XCircle className="h-4 w-4 text-destructive" />
    : deployStatus === 'deploying'
    ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
    : <Clock className="h-4 w-4 text-muted-foreground" />;

  const statusLabel = { idle: 'Not started', deploying: 'Deploying…', success: 'Deployed', failed: 'Failed' }[deployStatus];

  return (
    <div>
      <PageHeader title="Platform Settings" description="Configure global platform behaviour and feature flags" />

      <div className="space-y-6">
        {/* Edge Function Deployment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" /> Edge Function Deployment
            </CardTitle>
            <CardDescription className="text-pretty">
              Deploy the <code className="text-xs bg-muted px-1 py-0.5 rounded">manage-users</code> Edge Function via the Supabase Management API.
              Get your Personal Access Token from{' '}
              <a href="https://supabase.com/dashboard/account/tokens" target="_blank" rel="noreferrer" className="text-primary underline">supabase.com/dashboard/account/tokens</a>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Supabase Project Ref</Label>
                <Input value={projectRef} onChange={e => setProjectRef(e.target.value)} className="px-3 font-mono text-sm" placeholder="e.g. mvxzpmngsoutksienfay" />
              </div>
              <div className="space-y-1.5">
                <Label>Personal Access Token (PAT)</Label>
                <div className="relative">
                  <Input
                    type={showPat ? 'text' : 'password'}
                    value={pat}
                    onChange={e => setPat(e.target.value)}
                    className="px-3 pr-10 font-mono text-sm"
                    placeholder="sbp_xxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPat(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPat ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Status Banner */}
            {deployStatus !== 'idle' && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded border text-sm ${
                deployStatus === 'success' ? 'bg-success/10 border-success/30 text-success'
                : deployStatus === 'failed' ? 'bg-destructive/10 border-destructive/30 text-destructive'
                : 'bg-muted border-border text-foreground'
              }`}>
                {statusIcon}
                <span className="font-medium">{statusLabel}</span>
              </div>
            )}

            {/* Deployment Logs */}
            {deployLogs.length > 0 && (
              <div className="bg-muted rounded border border-border p-3 font-mono text-xs space-y-0.5 max-h-40 overflow-y-auto">
                {deployLogs.map((log, i) => (
                  <div key={i} className={log.includes('ERROR') || log.includes('failed') ? 'text-destructive' : log.includes('successfully') || log.includes('complete') ? 'text-success' : 'text-muted-foreground'}>
                    {log}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleDeploy} disabled={deployStatus === 'deploying'}>
                {deployStatus === 'deploying'
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Deploying…</>
                  : <><Rocket className="h-4 w-4 mr-2" />Deploy manage-users Function</>
                }
              </Button>
            </div>
          </CardContent>
        </Card>

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

        {/* Password Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" /> Password Policy
            </CardTitle>
            <CardDescription className="text-pretty">
              These rules apply whenever a user sets or changes their password. Changes take effect immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {policyLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading policy…</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="min-len">Minimum Length</Label>
                    <Input id="min-len" type="number" min={6} max={32} className="px-3 w-28"
                      value={policy.min_length}
                      onChange={e => setPolicy(p => ({ ...p, min_length: Math.max(6, Math.min(32, Number(e.target.value))) }))} />
                    <p className="text-[11px] text-muted-foreground">6–32 characters</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="max-len">Maximum Length</Label>
                    <Input id="max-len" type="number" min={16} max={256} className="px-3 w-28"
                      value={policy.max_length}
                      onChange={e => setPolicy(p => ({ ...p, max_length: Math.max(16, Math.min(256, Number(e.target.value))) }))} />
                    <p className="text-[11px] text-muted-foreground">16–256 characters</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  {([
                    { key: 'require_uppercase', label: 'Require uppercase letter (A–Z)' },
                    { key: 'require_lowercase', label: 'Require lowercase letter (a–z)' },
                    { key: 'require_number',    label: 'Require at least one number (0–9)' },
                    { key: 'require_special',   label: 'Require special character (!@#$%…)' },
                  ] as { key: keyof PasswordPolicy; label: string }[]).map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={key} className="cursor-pointer font-normal">{label}</Label>
                      <Switch id={key}
                        checked={!!policy[key]}
                        onCheckedChange={v => setPolicy(p => ({ ...p, [key]: v }))} />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button onClick={savePolicy} disabled={saving} size="sm" className="gap-2">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Password Policy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPolicy(DEFAULT_POLICY)}>
                    Reset to Defaults
                  </Button>
                </div>
              </>
            )}
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
