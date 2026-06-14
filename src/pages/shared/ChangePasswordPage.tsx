import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { KeyRound, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function ChangePasswordPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = (() => {
    if (!newPassword) return 0;
    let s = 0;
    if (newPassword.length >= 8) s++;
    if (/[A-Z]/.test(newPassword)) s++;
    if (/[0-9]/.test(newPassword)) s++;
    if (/[^A-Za-z0-9]/.test(newPassword)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', 'bg-destructive', 'bg-warning', 'bg-info', 'bg-success'][strength];

  const handleSubmit = async () => {
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (newPassword !== confirm) { toast.error('Passwords do not match'); return; }
    if (strength < 2) { toast.error('Please choose a stronger password'); return; }

    setSaving(true);
    const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
    if (pwError) { toast.error(pwError.message); setSaving(false); return; }

    // Clear the must_change_password flag
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ must_change_password: false })
      .eq('id', profile?.id);

    setSaving(false);
    if (profileError) { toast.error('Password updated but could not clear flag: ' + profileError.message); return; }

    toast.success('Password changed successfully! Welcome to EduArabic.');

    // Redirect to role dashboard
    const dashMap: Record<string, string> = {
      super_admin: '/super-admin',
      admin: '/admin',
      teacher: '/teacher',
      student: '/student',
      parent: '/parent',
      secretary: '/secretary',
    };
    navigate(dashMap[profile?.role ?? ''] ?? '/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo / Brand */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <KeyRound className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground text-balance">Set Your New Password</h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Your account requires a password change before you can continue.
            Choose a strong, unique password.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Create New Password
            </CardTitle>
            <CardDescription>
              Logged in as <span className="font-medium text-foreground">{profile?.email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* New password */}
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="px-3 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Strength meter */}
              {newPassword && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength ? strengthColor : 'bg-muted'}`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${['', 'text-destructive', 'text-warning', 'text-info', 'text-success'][strength]}`}>
                    {strengthLabel}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div className="space-y-1.5">
              <Label>Confirm Password</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="px-3 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirm && confirm !== newPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>

            {/* Tips */}
            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Password requirements:</p>
              <ul className="space-y-0.5">
                <li className={newPassword.length >= 8 ? 'text-success' : ''}>• At least 8 characters</li>
                <li className={/[A-Z]/.test(newPassword) ? 'text-success' : ''}>• One uppercase letter</li>
                <li className={/[0-9]/.test(newPassword) ? 'text-success' : ''}>• One number</li>
                <li className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-success' : ''}>• One special character (@, !, #…)</li>
              </ul>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={saving || !newPassword || !confirm}
              className="w-full"
            >
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Updating…</>
                : <><KeyRound className="h-4 w-4 mr-2" />Set New Password</>
              }
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
