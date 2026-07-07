import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Loader2, Camera, User, Bell, Sun, Moon, Monitor } from 'lucide-react';
import type { NotificationPreferences } from '@/types/types';

const DEFAULT_NOTIF: NotificationPreferences = {
  email_announcements: true,
  email_assessment_results: true,
  email_attendance_updates: true,
  email_fee_reminders: true,
  email_hifz_feedback: true,
  push_announcements: true,
  push_assessment_results: true,
  push_attendance_updates: false,
  push_fee_reminders: true,
  push_hifz_feedback: true,
};

const NOTIF_LABELS: { key: keyof NotificationPreferences; label: string; group: 'email' | 'push' }[] = [
  { key: 'email_announcements', label: 'Announcements', group: 'email' },
  { key: 'email_assessment_results', label: 'Assessment Results', group: 'email' },
  { key: 'email_attendance_updates', label: 'Attendance Updates', group: 'email' },
  { key: 'email_fee_reminders', label: 'Fee Reminders', group: 'email' },
  { key: 'email_hifz_feedback', label: 'Hifz Feedback', group: 'email' },
  { key: 'push_announcements', label: 'Announcements', group: 'push' },
  { key: 'push_assessment_results', label: 'Assessment Results', group: 'push' },
  { key: 'push_attendance_updates', label: 'Attendance Updates', group: 'push' },
  { key: 'push_fee_reminders', label: 'Fee Reminders', group: 'push' },
  { key: 'push_hifz_feedback', label: 'Hifz Feedback', group: 'push' },
];

async function compressImage(file: File, maxBytes = 1048576): Promise<File> {
  if (file.size <= maxBytes) return file;
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      const maxDim = 1080;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      let quality = 0.8;
      const tryCompress = () => {
        canvas.toBlob(blob => {
          if (!blob) { reject(new Error('Compression failed')); return; }
          if (blob.size <= maxBytes || quality <= 0.3) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
          } else {
            quality -= 0.1;
            tryCompress();
          }
        }, 'image/webp', quality);
      };
      tryCompress();
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url;
  });
}

export default function UserProfilePage() {
  const { profile, updateProfile, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(
    (profile?.notification_preferences as NotificationPreferences) ?? DEFAULT_NOTIF
  );
  const [savingNotif, setSavingNotif] = useState(false);

  const avatarUrl = profile?.avatar_url;
  const initials = (profile?.full_name ?? 'U').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

  // Save profile info
  const handleSaveProfile = async () => {
    if (!fullName.trim()) { toast.error('Full name cannot be empty'); return; }
    setSavingProfile(true);
    const { error } = await updateProfile({ full_name: fullName.trim() });
    setSavingProfile(false);
    if (error) { toast.error('Failed to save profile'); return; }
    toast.success('Profile updated successfully');
  };

  // Avatar upload
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0];
    if (!raw || !profile?.id) return;

    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
    if (!allowed.includes(raw.type)) {
      toast.error('Unsupported format. Please use JPG, PNG, GIF, WEBP, or AVIF.');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      let file = raw;
      let compressed = false;
      if (raw.size > 1048576) {
        file = await compressImage(raw);
        compressed = true;
        setUploadProgress(40);
      }

      // Sanitize filename
      const ext = file.name.split('.').pop() ?? 'webp';
      const safeName = `${profile.id}-${Date.now()}.${ext}`.replace(/[^a-zA-Z0-9.\-_]/g, '');
      const path = `public/${safeName}`;

      setUploadProgress(60);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;
      setUploadProgress(85);

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);

      const { error: updateError } = await updateProfile({ avatar_url: publicUrl });
      if (updateError) throw updateError;

      await refreshProfile();
      setUploadProgress(100);

      if (compressed) {
        toast.success(`Avatar updated! (Auto-compressed to ${(file.size / 1024).toFixed(0)} KB)`);
      } else {
        toast.success('Avatar updated successfully');
      }
    } catch (err) {
      toast.error('Failed to upload avatar');
      console.error(err);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1500);
      if (fileRef.current) fileRef.current.value = '';
    }
  }, [profile?.id, updateProfile, refreshProfile]);

  // Save notification prefs
  const handleSaveNotif = async () => {
    setSavingNotif(true);
    const { error } = await updateProfile({ notification_preferences: notifPrefs });
    setSavingNotif(false);
    if (error) { toast.error('Failed to save notification preferences'); return; }
    toast.success('Notification preferences saved');
  };

  const toggleNotif = (key: keyof NotificationPreferences) => {
    setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const emailItems = NOTIF_LABELS.filter(n => n.group === 'email');
  const pushItems = NOTIF_LABELS.filter(n => n.group === 'push');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground text-balance">Profile Settings</h1>
        <p className="text-sm text-muted-foreground text-pretty">Manage your personal information and preferences</p>
      </div>

      {/* Avatar + Name */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" />
            Personal Information
          </CardTitle>
          <CardDescription>Update your name and profile picture</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="h-20 w-20 rounded-full bg-sidebar-accent overflow-hidden border-2 border-border">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={profile?.full_name ?? 'Avatar'} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-sidebar-accent-foreground">
                    {initials}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background hover:bg-primary/90 transition-colors"
                aria-label="Change avatar"
              >
                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{profile?.full_name ?? 'Your Name'}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile?.role?.replace('_', ' ')}</p>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="mt-1.5 text-xs text-primary hover:underline disabled:opacity-50"
              >
                {uploading ? 'Uploading…' : 'Change photo'}
              </button>
              <p className="text-[11px] text-muted-foreground mt-0.5">JPG, PNG, GIF, WEBP · Max 1 MB (auto-compressed)</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
              className="sr-only"
              onChange={handleFileChange}
            />
          </div>

          {/* Upload progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <Progress value={uploadProgress} className="h-1.5" />
          )}

          <Separator />

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="full-name">Full Name</Label>
            <div className="flex gap-2">
              <Input
                id="full-name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
                className="px-3 flex-1"
              />
              <Button onClick={handleSaveProfile} disabled={savingProfile} className="shrink-0">
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>

          {/* Read-only fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={profile?.email ?? '—'} readOnly className="px-3 bg-muted/50 cursor-default" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Input value={(profile?.role ?? '').replace('_', ' ')} readOnly className="px-3 bg-muted/50 cursor-default capitalize" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sun className="h-4 w-4 text-primary" />
            Appearance
          </CardTitle>
          <CardDescription>Choose your preferred theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: 'light', icon: Sun, label: 'Light' },
              { value: 'dark', icon: Moon, label: 'Dark' },
              { value: 'system', icon: Monitor, label: 'System' },
            ] as const).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => {
                  setTheme(value);
                  // Persist to DB
                  if (profile?.id) {
                    updateProfile({ theme_preference: value }).catch(() => {});
                  }
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  theme === value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-border/80 hover:bg-muted/50'
                }`}
              >
                <Icon className={`h-5 w-5 ${theme === value ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-xs font-medium ${theme === value ? 'text-primary' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-primary" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Control which notifications you receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Email Notifications</h3>
            <div className="space-y-3">
              {emailItems.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between min-h-[44px]">
                  <Label htmlFor={key} className="text-sm font-normal cursor-pointer">{label}</Label>
                  <Switch
                    id={key}
                    checked={notifPrefs[key]}
                    onCheckedChange={() => toggleNotif(key)}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Push */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Push Notifications</h3>
            <div className="space-y-3">
              {pushItems.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between min-h-[44px]">
                  <Label htmlFor={key} className="text-sm font-normal cursor-pointer">{label}</Label>
                  <Switch
                    id={key}
                    checked={notifPrefs[key]}
                    onCheckedChange={() => toggleNotif(key)}
                  />
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSaveNotif} disabled={savingNotif} className="w-full">
            {savingNotif ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Notification Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
