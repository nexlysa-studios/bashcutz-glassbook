import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { format } from 'date-fns';
import { X, Check } from 'lucide-react';
import { Service } from '../sections/ServicesSection';
import { to12HourTime } from '@/lib/time';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  service: Service;
  date: Date;
  time: string;
  customerName: string;
  paymentMethod: 'cash' | 'card';
  firstTimeCutter: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  service,
  date,
  time,
  customerName,
  paymentMethod,
  firstTimeCutter,
}: ConfirmationModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.9, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power3.out' }
      );
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 md:items-center md:p-6 glass-overlay"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative glass-card w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto p-6 md:max-h-[calc(100vh-3rem)] md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors tap-feedback"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
          <Check className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-center mb-2">
          Confirm Booking
        </h2>
        <p className="text-white/50 text-center mb-8">
          Please review your booking details
        </p>

        {/* Booking details */}
        <div className="space-y-4 mb-8">
          <div className="flex justify-between py-3 border-b border-white/10">
            <span className="text-white/50">Name</span>
            <span className="font-medium">{customerName}</span>
          </div>
          <div className="flex justify-between py-3 border-b border-white/10">
            <span className="text-white/50">Service</span>
            <span className="font-medium">{service.name}</span>
          </div>
          <div className="flex justify-between py-3 border-b border-white/10">
            <span className="text-white/50">Date</span>
            <span className="font-medium">{format(date, 'EEE, MMM d, yyyy')}</span>
          </div>
          <div className="flex justify-between py-3 border-b border-white/10">
            <span className="text-white/50">Time</span>
            <span className="font-medium">{to12HourTime(time)}</span>
          </div>
          <div className="flex justify-between py-3 border-b border-white/10">
            <span className="text-white/50">Payment</span>
            <span className="font-medium">{paymentMethod.toUpperCase()}</span>
          </div>
          <div className="flex justify-between py-3 border-b border-white/10">
            <span className="text-white/50">First Time Cutter</span>
            <span className="font-medium">{firstTimeCutter ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-white/50">Price</span>
            <span className="text-xl font-bold">R{service.price}</span>
          </div>
        </div>

        <p className="mb-6 rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
          By confirming this booking, you agree to pay a R80 cancellation fee if you cancel.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 glass-button tap-feedback"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 glass-button-primary tap-feedback"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
