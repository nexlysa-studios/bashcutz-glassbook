import { FormEvent, useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2, Mail } from 'lucide-react';
import {
  isValidNewsletterEmail,
  normalizeNewsletterEmail,
  subscribeToNewsletter,
} from '@/lib/newsletter';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = normalizeNewsletterEmail(email);
    if (!isValidNewsletterEmail(normalized)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');
    try {
      const result = await subscribeToNewsletter(normalized);
      setEmail('');
      setStatus('success');
      setMessage(result.message);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : "We couldn't subscribe you right now. Please try again.");
    }
  };

  return (
    <section id="newsletter" className="relative overflow-hidden px-6 py-24 md:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-950 to-black" />
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/10 blur-[100px] md:h-[32rem] md:w-[32rem]" />

      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] px-6 py-12 shadow-2xl backdrop-blur-xl md:px-14 md:py-16">
        <div className="pointer-events-none absolute -right-20 -top-24 h-60 w-60 rounded-full border border-orange-400/20" />
        <div className="pointer-events-none absolute -right-5 -top-10 h-36 w-36 rounded-full border border-white/10" />
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.08fr] lg:gap-16">
          <div>
            <span className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-orange-400">
              <Mail className="h-4 w-4" /> BashCutz Updates
            </span>
            <h2 className="text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
              Stay in the <span className="text-orange-500">Loop</span>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/60 md:text-lg">
              Subscribe for price updates, specials, new services and important BashCutz announcements.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="relative">
            <label htmlFor="newsletter-email" className="mb-2 block text-sm font-medium text-white/75">
              Email address
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="newsletter-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                disabled={status === 'loading'}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (status !== 'loading') setStatus('idle');
                }}
                placeholder="you@example.com"
                aria-describedby="newsletter-message newsletter-consent"
                aria-invalid={status === 'error'}
                className="glass-input min-h-14 flex-1 bg-black/30 text-white placeholder:text-white/30 focus:border-orange-400/60"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="hero-cta-orange inline-flex min-h-14 items-center justify-center gap-2 rounded-xl px-7 font-semibold text-black transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === 'loading' ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Subscribe <ArrowRight className="h-4 w-4" /></>}
              </button>
            </div>
            <p id="newsletter-consent" className="mt-3 text-xs leading-5 text-white/40">
              By subscribing, you agree to receive occasional updates and promotions from BashCutz. Unsubscribe anytime.
            </p>
            {message && (
              <p
                id="newsletter-message"
                role={status === 'error' ? 'alert' : 'status'}
                className={`mt-4 flex items-start gap-2 text-sm ${status === 'success' ? 'text-emerald-300' : 'text-red-300'}`}
              >
                {status === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

