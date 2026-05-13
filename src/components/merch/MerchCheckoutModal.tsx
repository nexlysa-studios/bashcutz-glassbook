import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { X, ArrowLeft, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import type { MerchItem } from '@/lib/merch';

interface MerchCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MerchItem;
  size: string;
}

const customerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().trim().regex(/^\d{10}$/, 'Phone number must be 10 digits'),
});

type Step = 'details' | 'confirm' | 'submitting';

export function MerchCheckoutModal({ isOpen, onClose, item, size }: MerchCheckoutModalProps) {
  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    gsap.fromTo(panelRef.current, { x: '100%' }, { x: '0%', duration: 0.5, ease: 'power3.out' });
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const close = () => {
    gsap.to(panelRef.current, {
      x: '100%',
      duration: 0.4,
      ease: 'power3.in',
      onComplete: () => {
        onClose();
        setStep('details');
        setSubmitError(null);
      },
    });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.3 });
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = customerSchema.safeParse({ name, phone, address });
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        const f = err.path[0] as keyof typeof errors;
        fieldErrors[f] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (!isSupabaseConfigured) {
      setSubmitError('Online checkout is not configured.');
      return;
    }
    setSubmitError(null);
    setStep('submitting');

    try {
      const supabase = getSupabaseClient();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      // 1. Insert merch order
      const { data: order, error: insertErr } = await supabase
        .from('merch_orders')
        .insert({
          product_id: item.id,
          product_name: item.name,
          size,
          quantity: 1,
          unit_price_cents: Math.round(item.price * 100),
          customer_name: name,
          customer_phone: phone,
          customer_address: address,
        })
        .select('id')
        .single();

      if (insertErr || !order) {
        throw new Error(insertErr?.message || 'Could not create order.');
      }

      // 2. Persist details for the success page WhatsApp message
      sessionStorage.setItem(
        `bashcutz_merch_${order.id}`,
        JSON.stringify({ address }),
      );

      // 3. Create Yoco checkout
      const res = await fetch(`${supabaseUrl}/functions/v1/yoco-create-merch-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.redirectUrl) {
        throw new Error(data?.error || 'Could not start online payment.');
      }
      window.location.href = data.redirectUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start checkout.';
      setSubmitError(message);
      setStep('confirm');
    }
  };

  const handlePhoneChange = (v: string) => setPhone(v.replace(/\D/g, '').slice(0, 10));

  if (!isOpen) return null;

  return (
    <>
      <div ref={overlayRef} className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={close} />
      <div
        ref={panelRef}
        className="fixed right-0 top-0 bottom-0 z-50 w-full md:w-[480px] bg-black/95 backdrop-blur-xl border-l border-white/10 flex flex-col text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            {step === 'confirm' && (
              <button onClick={() => setStep('details')} className="p-2 -ml-2 rounded-lg hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold">
                {step === 'details' && 'Your Details'}
                {step === 'confirm' && 'Confirm Order'}
                {step === 'submitting' && 'Starting Payment…'}
              </h2>
              <p className="text-sm text-white/50">{item.name} — Size {size} — R{item.price}</p>
            </div>
          </div>
          <button onClick={close} className="p-2 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {step === 'details' && (
            <form onSubmit={handleDetailsSubmit} className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-[0.14em] text-white/60 mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold/60"
                  placeholder="Your name"
                  required
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.14em] text-white/60 mb-2">Phone (10 digits)</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold/60"
                  placeholder="0821234567"
                  required
                />
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.14em] text-white/60 mb-2">Delivery Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold/60"
                  placeholder="Street, suburb, city, postal code"
                  required
                />
                {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
              </div>

              <button
                type="submit"
                className="w-full bg-gold hover:bg-gold-light text-black font-semibold uppercase tracking-[0.16em] py-4 rounded-xl transition-colors"
              >
                Continue
              </button>
            </form>
          )}

          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3 text-sm">
                <Row label="Product" value={item.name} />
                <Row label="Size" value={size} />
                <Row label="Quantity" value="1" />
                <Row label="Total" value={`R${item.price}.00`} />
                <hr className="border-white/10" />
                <Row label="Name" value={name} />
                <Row label="Phone" value={phone} />
                <Row label="Address" value={address} multiline />
                <Row label="Payment" value="Online (Yoco)" />
              </div>

              {submitError && <p className="text-red-400 text-sm">{submitError}</p>}

              <button
                onClick={handleConfirm}
                className="w-full bg-gold hover:bg-gold-light text-black font-semibold uppercase tracking-[0.16em] py-4 rounded-xl transition-colors"
              >
                Confirm & Pay
              </button>
              <p className="text-xs text-white/40 text-center">
                You'll be redirected to Yoco to complete your secure payment.
              </p>
            </div>
          )}

          {step === 'submitting' && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-gold mb-4" />
              <p className="text-white/70">Redirecting to Yoco…</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className={multiline ? '' : 'flex justify-between gap-4'}>
      <span className="text-white/50 uppercase text-[10px] tracking-[0.14em]">{label}</span>
      <span className={`text-white ${multiline ? 'block mt-1' : 'text-right'}`}>{value}</span>
    </div>
  );
}
