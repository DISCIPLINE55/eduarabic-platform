import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/db/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/types';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) { console.error('Error fetching profile:', error); return null; }
  return data;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  profileLoaded: boolean;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) { setProfile(null); setProfileLoaded(true); return; }
    const profileData = await getProfile(user.id);
    setProfile(profileData);
    setProfileLoaded(true);
  };

  useEffect(() => {
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const profileData = await getProfile(session.user.id);
          setProfile(profileData);
        }
        setProfileLoaded(true);
      })
      .finally(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const profileData = await getProfile(session.user.id);
        setProfile(profileData);
        setProfileLoaded(true);
      } else {
        setProfile(null);
        setProfileLoaded(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { error: null };
    } catch (error) { return { error: error as Error }; }
  };

  const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      if (data.user && fullName) {
        await supabase.from('profiles').update({ full_name: fullName }).eq('id', data.user.id);
      }
      return { error: null };
    } catch (error) { return { error: error as Error }; }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      return { error: null };
    } catch (error) { return { error: error as Error }; }
  };

  return (
    <AuthContext.Provider value={{ user, profile, profileLoaded, loading, signInWithEmail, signUpWithEmail, signOut, refreshProfile, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
