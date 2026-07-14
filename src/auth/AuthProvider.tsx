import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured, type UserProfile } from '../lib/supabase';
import { fetchLessonProgress, saveLessonComplete } from '../storage/cloudProgressStore';
import { useAppStore } from '../store/useAppStore';
import type { NoteName } from '../theory/notes';
import { CHROMATIC_NOTES } from '../theory/notes';

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  user: User | null;
  profile: UserProfile | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  completeOnboarding: (displayName: string, preferredKey: NoteName) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(userId: string): Promise<UserProfile | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, preferred_key, onboarding_complete')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const { data: created, error: insertError } = await supabase
      .from('profiles')
      .insert({ id: userId })
      .select('id, display_name, preferred_key, onboarding_complete')
      .single();
    if (insertError) throw insertError;
    return created as UserProfile;
  }
  return data as UserProfile;
}

async function syncLessonProgress(userId: string) {
  const ids = await fetchLessonProgress(userId);
  useAppStore.setState({ completedLessons: ids });
}

function applyPreferredKey(key: string) {
  if (CHROMATIC_NOTES.includes(key as NoteName)) {
    useAppStore.getState().setSelectedRoot(key as NoteName);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await loadProfile(user.id);
    setProfile(p);
    if (p?.onboarding_complete && p.preferred_key) {
      applyPreferredKey(p.preferred_key);
      await syncLessonProgress(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const supabase = getSupabase()!;

    const init = async (session: Session | null) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        try {
          const p = await loadProfile(session.user.id);
          setProfile(p);
          if (p?.onboarding_complete) {
            if (p.preferred_key) applyPreferredKey(p.preferred_key);
            await syncLessonProgress(session.user.id);
          }
        } catch (err) {
          console.warn('Failed to load profile:', err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => init(data.session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      init(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const redirectTo = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw error;
  }, []);

  const signInWithEmail = useCallback(async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Auth not configured' };

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) return { error: error.message };
    return {};
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    useAppStore.setState({ completedLessons: [] });
  }, []);

  const completeOnboarding = useCallback(async (displayName: string, preferredKey: NoteName) => {
    if (!user) return;
    const supabase = getSupabase();
    if (!supabase) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        preferred_key: preferredKey,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) throw error;

    applyPreferredKey(preferredKey);

    const localLessons = useAppStore.getState().completedLessons;
    for (const lessonId of localLessons) {
      await saveLessonComplete(user.id, lessonId);
    }

    const p = await loadProfile(user.id);
    setProfile(p);
  }, [user]);

  const value = useMemo<AuthContextValue>(() => ({
    configured: isSupabaseConfigured,
    loading,
    user,
    profile,
    signInWithGoogle,
    signInWithEmail,
    signOut,
    completeOnboarding,
    refreshProfile,
  }), [loading, user, profile, signInWithGoogle, signInWithEmail, signOut, completeOnboarding, refreshProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
