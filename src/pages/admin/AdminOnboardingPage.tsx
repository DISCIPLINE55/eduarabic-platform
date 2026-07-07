import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { DisciNetLogo } from '@/components/common/DisciNetLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Building2, User, CheckCircle, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

type Step = 1 | 2 | 3;

interface ExistingInstitution { id: string; name: string; code: string; }

export default function AdminOnboardingPage() {
  const { profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // Step 1 — mode
  const [mode, setMode] = useState<'create' | 'link'>('create');

  // Step 2a — create new institution
  const [instName, setInstName] = useState('');
  const [instCode, setInstCode] = useState('');
  const [instType, setInstType] = useState('');
  const [instAddress, setInstAddress] = useState('');
  const [instCapacity, setInstCapacity] = useState('');
  const [instPhone, setInstPhone] = useState('');

  // Step 2b — link existing
  const [existing, setExisting] = useState<ExistingInstitution[]>([]);
  const [selectedExisting, setSelectedExisting] = useState('');

  // Step 3 — confirm
  const [createdOrgId, setCreatedOrgId] = useState('');

  useEffect(() => {
    if (mode === 'link') {
      supabase.from('institutions').select('id,name,code').eq('is_active', true).order('name')
        .then(({ data }) => setExisting(data || []));
    }
  }, [mode]);

  // Auto-fill code from name
  useEffect(() => {
    if (mode === 'create' && instName && !instCode) {
      const code = instName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
      setInstCode(code);
    }
  }, [instName, mode, instCode]);

  const handleNext = async () => {
    if (step === 1) { setStep(2); return; }

    if (step === 2) {
      if (mode === 'create') {
        if (!instName.trim()) { toast.error('Institution name is required'); return; }
        if (!instCode.trim()) { toast.error('Institution code is required'); return; }
        if (!instType) { toast.error('Please select institution type'); return; }
        setLoading(true);
        const { data, error } = await supabase.from('institutions').insert({
          name: instName.trim(),
          code: instCode.trim().toUpperCase(),
          type: instType,
          address: instAddress.trim() || null,
          phone: instPhone.trim() || null,
          capacity: instCapacity ? Number(instCapacity) : null,
          is_active: true,
        }).select('id').single();
        setLoading(false);
        if (error) { toast.error(error.message || 'Failed to create institution'); return; }
        setCreatedOrgId(data.id);
        setStep(3);
      } else {
        if (!selectedExisting) { toast.error('Please select an institution'); return; }
        setCreatedOrgId(selectedExisting);
        setStep(3);
      }
      return;
    }

    if (step === 3) {
      setLoading(true);
      const { error } = await updateProfile({ organization_id: createdOrgId });
      setLoading(false);
      if (error) { toast.error('Failed to link institution'); return; }
      toast.success('Institution set up! Welcome to your admin dashboard.');
      navigate('/admin', { replace: true });
    }
  };

  const stepLabel = ['Choose Setup Mode', 'Institution Details', 'Confirm & Activate'];
  const stepIcon = [Sparkles, Building2, CheckCircle];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <DisciNetLogo size={48} variant="icon" theme="light" />
          </div>
          <h1 className="text-2xl font-bold text-balance">Admin Onboarding</h1>
          <p className="text-muted-foreground text-sm mt-1 text-pretty">
            Set up your institution to unlock the full admin dashboard
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {([1, 2, 3] as Step[]).map((s, i) => {
            const Icon = stepIcon[i];
            const done = step > s;
            const active = step === s;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors
                  ${done ? 'bg-success text-white' : active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {done ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={`text-xs hidden md:block ${active ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {stepLabel[i]}
                </span>
                {s < 3 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
            );
          })}
        </div>

        <Card className="max-w-[calc(100%-2rem)] md:max-w-lg mx-auto">
          {/* ── Step 1: Mode ── */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="text-lg text-balance">How do you want to get started?</CardTitle>
                <CardDescription className="text-pretty">
                  Create a new institution or link to an existing one your super admin already registered.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  type="button"
                  onClick={() => setMode('create')}
                  className={`w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-colors text-left
                    ${mode === 'create' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Create New Institution</p>
                    <p className="text-xs text-muted-foreground mt-0.5 text-pretty">
                      Register a brand new institution with all its details. You'll be the primary admin.
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('link')}
                  className={`w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-colors text-left
                    ${mode === 'link' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Link to Existing Institution</p>
                    <p className="text-xs text-muted-foreground mt-0.5 text-pretty">
                      Your institution was already created by a super admin. Just select and connect.
                    </p>
                  </div>
                </button>
              </CardContent>
              <CardFooter>
                <Button className="w-full gap-2" onClick={handleNext}>
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </>
          )}

          {/* ── Step 2: Details ── */}
          {step === 2 && mode === 'create' && (
            <>
              <CardHeader>
                <CardTitle className="text-lg text-balance">Institution Details</CardTitle>
                <CardDescription className="text-pretty">
                  Fill in your institution's information. You can edit this later from Settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="inst-name">Institution Name *</Label>
                    <Input id="inst-name" placeholder="e.g. Al-Noor Islamic Academy"
                      value={instName} onChange={e => setInstName(e.target.value)} className="px-3" autoFocus />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="inst-code">Short Code *</Label>
                    <Input id="inst-code" placeholder="e.g. ALNOOR"
                      value={instCode} onChange={e => setInstCode(e.target.value.toUpperCase())} className="px-3 font-mono" maxLength={10} />
                    <p className="text-[10px] text-muted-foreground">6–10 uppercase letters/numbers</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="inst-type">Type *</Label>
                    <Select value={instType} onValueChange={setInstType}>
                      <SelectTrigger id="inst-type" className="px-3"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="madrasa">Madrasa</SelectItem>
                        <SelectItem value="islamic_school">Islamic School</SelectItem>
                        <SelectItem value="university">University / College</SelectItem>
                        <SelectItem value="hifz_center">Hifz Center</SelectItem>
                        <SelectItem value="community_center">Community Center</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="inst-phone">Phone</Label>
                    <Input id="inst-phone" type="tel" placeholder="+233 xx xxx xxxx"
                      value={instPhone} onChange={e => setInstPhone(e.target.value)} className="px-3" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="inst-cap">Student Capacity</Label>
                    <Input id="inst-cap" type="number" placeholder="e.g. 500"
                      value={instCapacity} onChange={e => setInstCapacity(e.target.value)} className="px-3" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="inst-addr">Address</Label>
                    <Input id="inst-addr" placeholder="City / Region / Country"
                      value={instAddress} onChange={e => setInstAddress(e.target.value)} className="px-3" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5">
                  <ChevronLeft className="h-4 w-4" />Back
                </Button>
                <Button className="flex-1 gap-2" onClick={handleNext} disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Institution <ChevronRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </>
          )}

          {step === 2 && mode === 'link' && (
            <>
              <CardHeader>
                <CardTitle className="text-lg text-balance">Select Your Institution</CardTitle>
                <CardDescription className="text-pretty">
                  Choose the institution you administer from the list below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  <Label htmlFor="link-inst">Institution *</Label>
                  <Select value={selectedExisting} onValueChange={setSelectedExisting}>
                    <SelectTrigger id="link-inst" className="px-3">
                      <SelectValue placeholder={existing.length === 0 ? 'Loading institutions…' : 'Select institution'} />
                    </SelectTrigger>
                    <SelectContent>
                      {existing.map(inst => (
                        <SelectItem key={inst.id} value={inst.id}>
                          {inst.name} <span className="text-muted-foreground ml-1">({inst.code})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {existing.length === 0 && (
                    <p className="text-xs text-muted-foreground">No institutions found. Ask your super admin to create one first.</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5">
                  <ChevronLeft className="h-4 w-4" />Back
                </Button>
                <Button className="flex-1 gap-2" onClick={handleNext} disabled={!selectedExisting}>
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </>
          )}

          {/* ── Step 3: Confirm ── */}
          {step === 3 && (
            <>
              <CardHeader>
                <div className="flex justify-center mb-2">
                  <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle className="h-7 w-7 text-success" />
                  </div>
                </div>
                <CardTitle className="text-lg text-center text-balance">Almost there!</CardTitle>
                <CardDescription className="text-center text-pretty">
                  Your institution is ready. Confirm to activate your admin dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted/50 border border-border p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Admin account</span>
                    <span className="font-medium truncate max-w-[60%] text-right">{profile?.full_name || profile?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Setup mode</span>
                    <Badge variant="outline" className="text-xs">{mode === 'create' ? 'New Institution' : 'Linked Institution'}</Badge>
                  </div>
                  {mode === 'create' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name</span>
                        <span className="font-medium">{instName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Code</span>
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{instCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type</span>
                        <span className="font-medium capitalize">{instType.replace('_', ' ')}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="gap-1.5">
                  <ChevronLeft className="h-4 w-4" />Back
                </Button>
                <Button className="flex-1 gap-2" onClick={handleNext} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Activate Dashboard
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
