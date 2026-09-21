import { useState } from 'react';
import { z } from 'zod';

const customerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  phone: z.string().trim().regex(/^\d{10}$/, 'Phone number must be 10 digits'),
  paymentMethod: z.enum(['cash', 'card'], { required_error: 'Select a payment method' }),
  firstTimeCutter: z.enum(['yes', 'no'], { required_error: 'Select yes or no' }),
  newsletterConsent: z.boolean(),
  newsletterEmail: z.string(),
}).superRefine((data, context) => {
  if (data.newsletterConsent && !z.string().trim().email().safeParse(data.newsletterEmail).success) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['newsletterEmail'],
      message: 'Enter a valid email to receive BashCutz updates',
    });
  }
});

interface CustomerFormProps {
  onSubmit: (data: { name: string; phone: string; paymentMethod: 'cash' | 'card'; firstTimeCutter: boolean; newsletterConsent: boolean; newsletterEmail?: string }) => void;
  onBack: () => void;
}

export function CustomerForm({ onSubmit, onBack }: CustomerFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | ''>('');
  const [firstTimeCutter, setFirstTimeCutter] = useState<'yes' | 'no' | ''>('');
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string; paymentMethod?: string; firstTimeCutter?: string; newsletterEmail?: string }>({});

  const handlePhoneChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = customerSchema.safeParse({ name, phone, paymentMethod, firstTimeCutter, newsletterConsent, newsletterEmail });
    
    if (!result.success) {
      const fieldErrors: { name?: string; phone?: string; paymentMethod?: string; firstTimeCutter?: string; newsletterEmail?: string } = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as 'name' | 'phone' | 'paymentMethod' | 'firstTimeCutter' | 'newsletterEmail';
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onSubmit({
      name: result.data.name,
      phone: result.data.phone,
      paymentMethod: result.data.paymentMethod,
      firstTimeCutter: result.data.firstTimeCutter === 'yes',
      newsletterConsent: result.data.newsletterConsent,
      newsletterEmail: result.data.newsletterConsent ? result.data.newsletterEmail.trim().toLowerCase() : undefined,
    });
  };

  const selectPaymentMethod = (method: 'cash' | 'card') => {
    setPaymentMethod(method);
  };

  const selectFirstTimeCutter = (value: 'yes' | 'no') => {
    setFirstTimeCutter(value);
  };

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-6">Your Details</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-white/60 mb-2">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="glass-input"
            maxLength={100}
          />
          {errors.name && (
            <p className="text-red-400 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-2">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="Enter your phone number"
            className="glass-input"
            maxLength={10}
            inputMode="numeric"
            pattern="[0-9]{10}"
          />
          {errors.phone && (
            <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-2">Payment Method</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onTouchStart={() => selectPaymentMethod('cash')}
              onMouseDown={() => selectPaymentMethod('cash')}
              onPointerDown={() => selectPaymentMethod('cash')}
              onClick={() => selectPaymentMethod('cash')}
              className={`glass-button tap-feedback ${paymentMethod === 'cash' ? '!bg-amber-500/20 !border-amber-300/60 !text-white !shadow-[0_0_12px_rgba(255,193,7,0.35)]' : 'text-white/70'}`}
            >
              Cash
            </button>
            <button
              type="button"
              onTouchStart={() => selectPaymentMethod('card')}
              onMouseDown={() => selectPaymentMethod('card')}
              onPointerDown={() => selectPaymentMethod('card')}
              onClick={() => selectPaymentMethod('card')}
              className={`glass-button tap-feedback ${paymentMethod === 'card' ? '!bg-amber-500/20 !border-amber-300/60 !text-white !shadow-[0_0_12px_rgba(255,193,7,0.35)]' : 'text-white/70'}`}
            >
              Card
            </button>
          </div>
          <p className="text-xs text-white/50 mt-2">
            Please choose how you&apos;d like to pay on the day.
          </p>
          {errors.paymentMethod && (
            <p className="text-red-400 text-sm mt-2">{errors.paymentMethod}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-2">First Time At BashCutz?</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onTouchStart={() => selectFirstTimeCutter('yes')}
              onMouseDown={() => selectFirstTimeCutter('yes')}
              onPointerDown={() => selectFirstTimeCutter('yes')}
              onClick={() => selectFirstTimeCutter('yes')}
              className={`glass-button tap-feedback ${firstTimeCutter === 'yes' ? '!bg-amber-500/20 !border-amber-300/60 !text-white !shadow-[0_0_12px_rgba(255,193,7,0.35)]' : 'text-white/70'}`}
            >
              Yes
            </button>
            <button
              type="button"
              onTouchStart={() => selectFirstTimeCutter('no')}
              onMouseDown={() => selectFirstTimeCutter('no')}
              onPointerDown={() => selectFirstTimeCutter('no')}
              onClick={() => selectFirstTimeCutter('no')}
              className={`glass-button tap-feedback ${firstTimeCutter === 'no' ? '!bg-amber-500/20 !border-amber-300/60 !text-white !shadow-[0_0_12px_rgba(255,193,7,0.35)]' : 'text-white/70'}`}
            >
              No
            </button>
          </div>
          {errors.firstTimeCutter && (
            <p className="text-red-400 text-sm mt-2">{errors.firstTimeCutter}</p>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={newsletterConsent}
              onChange={(event) => setNewsletterConsent(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 accent-amber-500"
            />
            <span>
              <span className="block text-sm font-medium text-white/80">Send me specials, price updates and BashCutz news.</span>
              <span className="mt-1 block text-xs leading-5 text-white/40">Optional and unchecked by default. You can unsubscribe anytime.</span>
            </span>
          </label>
          {newsletterConsent && (
            <div className="mt-3">
              <label htmlFor="booking-newsletter-email" className="mb-2 block text-xs text-white/55">Email address</label>
              <input
                id="booking-newsletter-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                placeholder="you@example.com"
                className="glass-input"
              />
              {errors.newsletterEmail && <p className="mt-1 text-sm text-red-400">{errors.newsletterEmail}</p>}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 glass-button tap-feedback"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 glass-button-primary tap-feedback"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}

