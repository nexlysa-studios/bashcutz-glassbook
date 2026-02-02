import { useState } from 'react';
import { z } from 'zod';

const customerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  phone: z.string().trim().min(10, 'Enter a valid phone number').max(15, 'Phone number too long'),
});

interface CustomerFormProps {
  onSubmit: (data: { name: string; phone: string }) => void;
  onBack: () => void;
}

export function CustomerForm({ onSubmit, onBack }: CustomerFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = customerSchema.safeParse({ name, phone });
    
    if (!result.success) {
      const fieldErrors: { name?: string; phone?: string } = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as 'name' | 'phone';
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onSubmit({ name: result.data.name, phone: result.data.phone });
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
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            className="glass-input"
            maxLength={15}
          />
          {errors.phone && (
            <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
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
