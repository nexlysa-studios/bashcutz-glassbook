import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { GlassNavbar } from '@/components/layout/GlassNavbar';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useSEO } from '@/hooks/useSEO';

export default function AdminLogin() {
  const { isAuthed, isConfigured, login } = useAdminAuth();
  useSEO({
    title: 'Admin Login | BASHCUTZ WorldWide',
    description: 'Private admin login for BASHCUTZ WorldWide booking management.',
    path: '/admin-login',
    robots: 'noindex, nofollow',
  });

  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | null;
    return state?.from?.pathname || '/admin';
  }, [location.state]);

  useEffect(() => {
    if (isAuthed) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthed, navigate, redirectTo]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(email.trim(), password.trim());
    if (result.ok) {
      navigate(redirectTo, { replace: true });
      return;
    }

    if (result.reason === 'not-configured') {
      setError('Supabase is not configured.');
    } else {
      setError('Invalid email or password.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black text-white">
      <GlassNavbar />
      <main className="pt-28 px-6 pb-16">
        <div className="max-w-md mx-auto glass-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
              <Lock className="w-6 h-6 text-gold" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/50">Owner Access</p>
              <h1 className="text-2xl font-semibold">Admin Login</h1>
            </div>
          </div>

          <p className="text-sm text-white/60 mb-6">
            This area is private. Only the owner should log in.
          </p>

          {!isConfigured && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              Supabase is not set. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2" htmlFor="admin-email">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-gold/40"
                placeholder="Enter admin email"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2" htmlFor="admin-password">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-gold/40"
                placeholder="Enter admin password"
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting || !email || !password}
              className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold py-3 transition-all hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Checking...' : 'Sign In'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
