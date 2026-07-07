import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus, Loader2, Eye, EyeOff, Building2, ShieldCheck, AlertCircle } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  teacher: 'Teacher',
  secretary: 'Secretary',
  parent: 'Parent',
  student: 'Student',
  admin: 'Admin',
};

const DASH_MAP: Record<string, string> = {
  teacher: '/teacher', secretary: '/secretary', parent: '/parent',
  student: '/student', admin: '/admin',
};

interface InviteLinkRow {
  id: string;
  token: string;
  organization_id: string;
  role: string;
  expires_at: string;
  max_uses: number | null;
  uses_count: number;
  is_active: boolean;
  institutions: { name: string; code: string } | null;
}

export default function InviteSignupPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = params.get('token') || '';

  const [invite, setInvite] = useState<InviteLinkRow | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validate invite token from DB
  useEffect(() => {
    if (!token) { setTokenValid(false); setTokenError('No invitation token provided.'); return; }

    supabase
      .from('invite_links')
      .select('*, institutions(name, code)')
      .eq('token', token)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setTokenValid(false);
          setTokenError('This invitation link is invalid or does not exist.');
          return;
        }
        if (!data.is_active) {
          setTokenValid(false);
          setTokenError('This invitation link has been deactivated by an administrator.');
          return;
        }
        if (new Date(data.expires_at) < new Date()) {
          setTokenValid(false);
          setTokenError('This invitation link has expired. Please ask your administrator for a new one.');
          return;
        }
        if (data.max_uses != null && data.uses_count >= data.max_uses) {
          setTokenValid(false);
          setTokenError('This invitation link has reached its maximum number of uses.');
          return;
        }
        setInvite(data as InviteLinkRow);
        setTokenValid(true);
      });
  }, [token]);

  const handleSignup = async () => {
    if (!invite) return;
    if (!fullName.trim()) { toast.error('Please enter your full name'); return; }
    if (!email.trim()) { toast.error('Please enter your email address'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }

    setLoading(true);

    // Create auth account
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: invite.role, organization_id: invite.organization_id } },
    });

    if (error) { toast.error(error.message); setLoading(false); return; }
    if (!data.user) { toast.error('Sign-up failed — please try again'); setLoading(false); return; }

    // Ensure profile has correct role + org (trigger may default to 'student')
    await supabase
      .from('profiles')
      .update({
        role: invite.role,
        organization_id: invite.organization_id,
        full_name: fullName,
        is_profile_complete: true,
      })
      .eq('id', data.user.id);

    // Increment uses_count on the invite link
    await supabase
      .from('invite_links')
      .update({ uses_count: invite.uses_count + 1 })
      .eq('token', token);

    toast.success(`Welcome to ${invite.institutions?.name || 'the platform'}! Your account has been created.`);
    setLoading(false);
    navigate(DASH_MAP[invite.role] ?? '/', { replace: true });
  };

  // Loading state while validating token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Invalid / expired / deactivated token
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-[calc(100%-2rem)] md:max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <ShieldCheck className="h-7 w-7 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-balance">Invalid Invitation Link</h2>
            <p className="text-sm text-muted-foreground text-pretty flex items-start gap-2 text-left">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
              {tokenError || 'This invitation link is invalid or has expired.'}
            </p>
            <Button variant="outline" onClick={() => navigate('/login')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <UserPlus className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground text-balance">You've been invited!</h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Create your account to join{' '}
            <span className="font-medium text-foreground">{invite?.institutions?.name || 'your institution'}</span>
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">Create Account</CardTitle>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                {ROLE_LABELS[invite?.role ?? ''] ?? invite?.role}
              </Badge>
              <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-xs flex items-center gap-1">
                <Building2 className="h-3 w-3" />{invite?.institutions?.name}
              </Badge>
            </div>
            <CardDescription>Your role and institution are pre-filled by the invitation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} className="px-3" />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="px-3" />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="px-3 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="px-3"
              />
              {confirm && confirm !== password && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>
            <Button onClick={handleSignup} disabled={loading} className="w-full">
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating account…</>
                : <><UserPlus className="h-4 w-4 mr-2" />Create My Account</>
              }
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-primary underline">Sign in</button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
