import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

type AdminAuthContextType = {
  isAuthed: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; reason?: 'invalid' | 'not-configured' }>;
  logout: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isConfigured = useMemo(() => {
    return isSupabaseConfigured;
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      setIsAuthed(false);
      setIsLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    let isMounted = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      setIsAuthed(Boolean(data.session) && !error);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session));
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const login = async (email: string, password: string) => {
    if (!isConfigured) {
      return { ok: false, reason: 'not-configured' as const };
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { ok: false, reason: 'invalid' as const };
    }

    setIsAuthed(true);
    return { ok: true };
  };

  const logout = async () => {
    if (!isConfigured) {
      setIsAuthed(false);
      return;
    }

    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    setIsAuthed(false);
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthed, isLoading, isConfigured, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
