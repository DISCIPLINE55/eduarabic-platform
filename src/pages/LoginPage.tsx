import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, BookOpen, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signInWithEmail, signUpWithEmail, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const getRedirectPath = useCallback((role: string) => {
    switch (role) {
      case 'super_admin': return '/super-admin';
      case 'admin': return '/admin';
      case 'secretary': return '/secretary';
      case 'teacher': return '/teacher';
      case 'parent': return '/parent';
      default: return '/student';
    }
  }, []);

  // Redirect when profile loads after sign-in
  useEffect(() => {
    if (!profile) return;
    if (!profile.is_profile_complete) {
      navigate('/profile-completion', { replace: true });
    } else {
      navigate(getRedirectPath(profile.role), { replace: true });
    }
  }, [profile, navigate, getRedirectPath]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) { toast.error('Please enter email and password'); return; }
    setLoading(true);
    const { error } = await signInWithEmail(loginEmail, loginPassword);
    setLoading(false);
    if (error) { toast.error(error.message || 'Login failed'); return; }
    toast.success('Welcome back!');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) { toast.error('Please fill all required fields'); return; }
    if (regPassword !== regConfirm) { toast.error('Passwords do not match'); return; }
    if (regPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (!agreed) { toast.error('Please agree to the User Agreement and Privacy Policy'); return; }
    setLoading(true);
    const { error } = await signUpWithEmail(regEmail, regPassword, regName);
    setLoading(false);
    if (error) { toast.error(error.message || 'Registration failed'); return; }
    toast.success('Account created! You can now sign in.');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="https://miaoda-conversation-file.s3cdn.medo.dev/user-c9di7v8v0yyo/app-c9divjmf78xt/20260611/logo.png"
              alt="EduArabic"
              className="w-20 h-20 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground text-balance">EduArabic</h1>
          <p className="text-muted-foreground text-sm mt-1 text-pretty">AI-Powered Islamic Education Platform</p>
        </div>

        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          {/* Login */}
          <TabsContent value="login">
            <Card className="max-w-[calc(100%-0rem)]">
              <CardHeader>
                <CardTitle className="text-lg">Welcome Back</CardTitle>
                <CardDescription>Sign in to your EduArabic account</CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email">Email Address</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="px-3"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <Link
                        to="/forgot-password"
                        className="text-xs text-primary hover:underline"
                        tabIndex={-1}
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        className="px-3 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Sign In
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Register */}
          <TabsContent value="register">
            <Card className="max-w-[calc(100%-0rem)]">
              <CardHeader>
                <CardTitle className="text-lg">Create Account</CardTitle>
                <CardDescription>Join EduArabic as a new user. Contact your institution admin to assign your role.</CardDescription>
              </CardHeader>
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-name">Full Name</Label>
                    <Input id="reg-name" placeholder="Your full name" value={regName} onChange={e => setRegName(e.target.value)} className="px-3" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email">Email Address</Label>
                    <Input id="reg-email" type="email" placeholder="your@email.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="px-3" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="reg-password"
                        type={showRegPassword ? 'text' : 'password'}
                        placeholder="Min 8 characters"
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        className="px-3 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-confirm">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="reg-confirm"
                        type={showRegConfirm ? 'text' : 'password'}
                        placeholder="Repeat password"
                        value={regConfirm}
                        onChange={e => setRegConfirm(e.target.value)}
                        className="px-3 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirm(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showRegConfirm ? 'Hide password' : 'Show password'}
                      >
                        {showRegConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 min-h-12">
                    <Checkbox id="agree" checked={agreed} onCheckedChange={v => setAgreed(v === true)} className="mt-0.5" />
                    <label htmlFor="agree" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                      I agree to the{' '}
                      <span className="text-primary underline cursor-pointer">User Agreement</span>
                      {' '}and{' '}
                      <span className="text-primary underline cursor-pointer">Privacy Policy</span>
                    </label>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Account
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center gap-2 justify-center mt-6 text-xs text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Empowering Islamic Education Worldwide</span>
        </div>
      </div>
    </div>
  );
}
