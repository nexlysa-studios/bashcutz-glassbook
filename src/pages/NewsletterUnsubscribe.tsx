import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, MailX } from 'lucide-react';
import { GlassNavbar } from '@/components/layout/GlassNavbar';
import { unsubscribeFromNewsletter } from '@/lib/newsletter';
import { useSEO } from '@/hooks/useSEO';

export default function NewsletterUnsubscribe() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Updating your newsletter preference…');

  useSEO({
    title: 'Newsletter Preferences | BASHCUTZ',
    description: 'Manage your BashCutz newsletter subscription.',
    path: '/newsletter/unsubscribe',
    robots: 'noindex, nofollow',
  });

  useEffect(() => {
    let active = true;
    if (!/^[0-9a-f]{64}$/i.test(token)) {
      setState('error');
      setMessage('This unsubscribe link is invalid or has expired.');
      return;
    }
    void unsubscribeFromNewsletter(token)
      .then((result) => {
        if (!active) return;
        setState('success');
        setMessage(result.message);
      })
      .catch((error) => {
        if (!active) return;
        setState('error');
        setMessage(error instanceof Error ? error.message : "We couldn't update your preference right now.");
      });
    return () => { active = false; };
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black">
      <GlassNavbar />
      <main className="flex min-h-screen items-center justify-center px-6 pb-16 pt-32">
        <div className="glass-card w-full max-w-xl p-8 text-center md:p-12">
          <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${state === 'success' ? 'bg-emerald-500/15 text-emerald-300' : state === 'error' ? 'bg-red-500/15 text-red-300' : 'bg-orange-500/15 text-orange-300'}`}>
            {state === 'loading' ? <Loader2 className="h-8 w-8 animate-spin" /> : state === 'success' ? <CheckCircle2 className="h-8 w-8" /> : <MailX className="h-8 w-8" />}
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-400">BashCutz Updates</p>
          <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
            {state === 'loading' ? 'One moment' : state === 'success' ? 'You’re unsubscribed' : 'Link problem'}
          </h1>
          <p className="mx-auto mt-4 max-w-md leading-7 text-white/60">{message}</p>
          <Link to="/" className="glass-button-primary mt-8 inline-flex items-center justify-center">
            Back to BashCutz
          </Link>
        </div>
      </main>
    </div>
  );
}

