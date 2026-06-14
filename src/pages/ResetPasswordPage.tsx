import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, KeyRound, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  // Supabase sends the access_token in the URL hash on redirect.
  // We need to let the client pick it up so updateUser works.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });

    // Also listen for the PASSWORD_RECOVERY event Supabase fires
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasSession(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { toast.error('Please enter a new password'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Failed to update password');
      return;
    }
    setDone(true);
    toast.success('Password updated successfully!');
    // Sign out so the user logs in fresh with new password
    await supabase.auth.signOut();
  };

  if (!hasSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md max-w-[calc(100%-2rem)]">
          <CardHeader>
            <CardTitle className="text-lg text-balance">Invalid or expired link</CardTitle>
            <CardDescription className="text-pretty">
              This password reset link is invalid or has expired. Please request a new one.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/forgot-password">Request new reset link</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="https://miaoda-conversation-file.s3cdn.medo.dev/user-c9di7v8v0yyo/app-c9divjmf78xt/20260611/logo.png"
              alt="EduArabic"
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground text-balance">EduArabic</h1>
        </div>

        <Card className="max-w-[calc(100%-2rem)] md:max-w-lg mx-auto">
          {!done ? (
            <>
              <CardHeader>
                <CardTitle className="text-lg text-balance">Set a new password</CardTitle>
                <CardDescription className="text-pretty">
                  Choose a strong password of at least 8 characters.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="rp-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="rp-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 8 characters"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="px-3 pr-10"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rp-confirm">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="rp-confirm"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Repeat new password"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        className="px-3 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {/* Password strength hints */}
                  {password && (
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li className={password.length >= 8 ? 'text-success' : ''}>
                        {password.length >= 8 ? '✓' : '○'} At least 8 characters
                      </li>
                      <li className={/[A-Z]/.test(password) ? 'text-success' : ''}>
                        {/[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter
                      </li>
                      <li className={/[0-9]/.test(password) ? 'text-success' : ''}>
                        {/[0-9]/.test(password) ? '✓' : '○'} One number
                      </li>
                    </ul>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
                    Update Password
                  </Button>
                </CardFooter>
              </form>
            </>
          ) : (
            <>
              <CardHeader>
                <div className="flex justify-center mb-3">
                  <div className="w-14 h-14 rounded-full bg-success/100/10 flex items-center justify-center">
                    <CheckCircle className="h-7 w-7 text-success" />
                  </div>
                </div>
                <CardTitle className="text-lg text-center text-balance">Password updated!</CardTitle>
                <CardDescription className="text-center text-pretty">
                  Your password has been changed successfully. Please sign in with your new password.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button className="w-full" onClick={() => navigate('/login', { replace: true })}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go to Sign In
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
