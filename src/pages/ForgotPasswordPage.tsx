import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Please enter your email address'); return; }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Failed to send reset email');
      return;
    }
    setSent(true);
  };

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
          {!sent ? (
            <>
              <CardHeader>
                <CardTitle className="text-lg text-balance">Reset your password</CardTitle>
                <CardDescription className="text-pretty">
                  Enter your account email address and we'll send you a link to reset your password.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fp-email">Email Address</Label>
                    <Input
                      id="fp-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="px-3"
                      autoFocus
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                    Send Reset Link
                  </Button>
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Sign In
                  </Link>
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
                <CardTitle className="text-lg text-center text-balance">Check your inbox</CardTitle>
                <CardDescription className="text-center text-pretty">
                  A password reset link has been sent to{' '}
                  <span className="font-medium text-foreground">{email}</span>.
                  Check your spam folder if you don't see it within a few minutes.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { setSent(false); setEmail(''); }}
                >
                  Try a different email
                </Button>
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Sign In
                </Link>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
