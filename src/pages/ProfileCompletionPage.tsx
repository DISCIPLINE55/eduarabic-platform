import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Loader2, User } from 'lucide-react';
import type { UserRole } from '@/types/types';

interface Institution { id: string; name: string; code: string; }

const ROLE_HOME: Record<UserRole, string> = {
  super_admin: '/super-admin', admin: '/admin', secretary: '/secretary',
  teacher: '/teacher', parent: '/parent', student: '/student',
};

export default function ProfileCompletionPage() {
  const { profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);

  // Form fields
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [role, setRole] = useState<UserRole | ''>(profile?.role && profile.role !== 'student' ? profile.role : '');
  const [institutionId, setInstitutionId] = useState(profile?.organization_id || '');
  const [gender, setGender] = useState<string>(profile?.gender || '');
  const [dob, setDob] = useState(profile?.date_of_birth || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState('');

  useEffect(() => {
    supabase
      .from('institutions')
      .select('id, name, code')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setInstitutions(data || []);
        setLoadingInstitutions(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { toast.error('Full name is required'); return; }
    if (!role) { toast.error('Please select your role'); return; }
    if (!institutionId) { toast.error('Please select your institution'); return; }
    if (!gender) { toast.error('Please select your gender'); return; }

    setLoading(true);
    const { error } = await updateProfile({
      full_name: fullName.trim(),
      role: role as UserRole,
      organization_id: institutionId,
      gender: gender as 'male' | 'female',
      date_of_birth: dob || undefined,
      phone: phone.trim() || undefined,
      is_profile_complete: true,
    });

    // Also update address if provided (store in metadata or a separate field if exists)
    if (!error && address.trim()) {
      await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', profile?.id || '');
    }

    setLoading(false);
    if (error) { toast.error('Failed to save profile. Please try again.'); return; }

    toast.success('Profile completed! Welcome to EduArabic.');
    navigate(ROLE_HOME[role as UserRole] || '/student', { replace: true });
  };

  const step = (n: number, label: string) => (
    <span className="text-xs font-medium text-muted-foreground">Step {n} — {label}</span>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img
              src="https://miaoda-conversation-file.s3cdn.medo.dev/user-c9di7v8v0yyo/app-c9divjmf78xt/20260611/logo.png"
              alt="EduArabic" className="w-14 h-14 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground text-balance">Complete Your Profile</h1>
          <p className="text-muted-foreground text-sm mt-1 text-pretty">
            Tell us about yourself to get started on EduArabic.
          </p>
        </div>

        <Card className="max-w-[calc(100%-2rem)] md:max-w-lg mx-auto">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base text-balance">Account Setup</CardTitle>
                <CardDescription className="text-xs text-pretty">All fields marked * are required</CardDescription>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              {/* Section 1 — Personal Info */}
              <div className="space-y-3">
                {step(1, 'Personal Information')}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="pc-name">Full Name *</Label>
                    <Input
                      id="pc-name"
                      placeholder="e.g. Ahmad Ibn Abdullah"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="px-3"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pc-gender">Gender *</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger id="pc-gender" className="px-3">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pc-dob">Date of Birth</Label>
                    <Input
                      id="pc-dob"
                      type="date"
                      value={dob}
                      onChange={e => setDob(e.target.value)}
                      className="px-3"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pc-phone">Phone Number</Label>
                    <Input
                      id="pc-phone"
                      type="tel"
                      placeholder="+233 xx xxx xxxx"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="px-3"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pc-address">Address</Label>
                    <Input
                      id="pc-address"
                      placeholder="City / Town"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="px-3"
                    />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Section 2 — Role & Institution */}
              <div className="space-y-3">
                {step(2, 'Role & Institution')}
                <div className="space-y-1.5">
                  <Label htmlFor="pc-role">Your Role *</Label>
                  <Select value={role} onValueChange={v => setRole(v as UserRole)}>
                    <SelectTrigger id="pc-role" className="px-3">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="secretary">Secretary</SelectItem>
                      <SelectItem value="admin">Institution Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Your role will be verified by your institution administrator.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pc-institution">Institution *</Label>
                  <Select value={institutionId} onValueChange={setInstitutionId} disabled={loadingInstitutions}>
                    <SelectTrigger id="pc-institution" className="px-3">
                      <SelectValue placeholder={loadingInstitutions ? 'Loading institutions…' : 'Select your institution'} />
                    </SelectTrigger>
                    <SelectContent>
                      {institutions.length === 0 && !loadingInstitutions && (
                        <SelectItem value="none" disabled>No institutions available</SelectItem>
                      )}
                      {institutions.map(inst => (
                        <SelectItem key={inst.id} value={inst.id}>
                          {inst.name} ({inst.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button type="submit" className="w-full" disabled={loading || loadingInstitutions}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Complete Setup &amp; Go to Dashboard
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
