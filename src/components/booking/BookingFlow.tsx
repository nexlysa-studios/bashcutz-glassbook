import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { X, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Service } from '../sections/ServicesSection';
import { GlassCalendar } from './GlassCalendar';
import { TimeSlotSelector } from './TimeSlotSelector';
import { CustomerForm } from './CustomerForm';
import { ConfirmationModal } from './ConfirmationModal';
import { useBooking } from '../../context/BookingContext';
import { to12HourTime } from '@/lib/time';
import { subscribeToNewsletter } from '@/lib/newsletter';

type BookingStep = 'date' | 'time' | 'details' | 'confirm';

interface BookingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service;
}

export function BookingFlow({ isOpen, onClose, service }: BookingFlowProps) {
  const [step, setStep] = useState<BookingStep>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<{ name: string; phone: string; paymentMethod: 'cash' | 'card'; firstTimeCutter: boolean; newsletterConsent: boolean; newsletterEmail?: string } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { addBooking } = useBooking();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      );
      gsap.fromTo(
        panelRef.current,
        { x: '100%' },
        { x: '0%', duration: 0.5, ease: 'power3.out' }
      );
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    gsap.to(panelRef.current, {
      x: '100%',
      duration: 0.4,
      ease: 'power3.in',
      onComplete: () => {
        onClose();
        // Reset state
        setStep('date');
        setSelectedDate(null);
        setSelectedTime(null); 
        setCustomerData(null);
        setShowConfirmation(false);
      },
    });
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.3 });
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setStep('time');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('details');
  };

  const handleAfterHoursSelect = () => {
    setSelectedTime('After Hours');
    setStep('details');
  };

  const handleCustomerSubmit = (data: { name: string; phone: string; paymentMethod: 'cash' | 'card'; firstTimeCutter: boolean; newsletterConsent: boolean; newsletterEmail?: string }) => {
    setCustomerData(data);
    setShowConfirmation(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime || !customerData) return;

    let createdBooking;
    try {
      createdBooking = await addBooking({
        service,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        customerName: customerData.name,
        customerPhone: customerData.phone,
        paymentMethod: customerData.paymentMethod,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create booking.';
      alert(message);
      return;
    }

    sessionStorage.setItem(
      `bashcutz_booking_${createdBooking.id}`,
      JSON.stringify({
        firstTimeCutter: customerData.firstTimeCutter,
      }),
    );

    // Newsletter consent is independent of booking creation. A newsletter
    // failure must never roll back or block a successful booking.
    if (customerData.newsletterConsent && customerData.newsletterEmail) {
      try {
        await Promise.race([
          subscribeToNewsletter(customerData.newsletterEmail),
          new Promise((resolve) => window.setTimeout(resolve, 2500)),
        ]);
      } catch {
        // Booking remains successful; the customer can use the homepage form.
      }
    }

    // Cash / card flow — send WhatsApp message immediately
    const message = encodeURIComponent(
      `*BASHCUTZ Booking Confirmation*\n\n` +
      `Name: ${customerData.name}\n` +
      `Phone: ${customerData.phone}\n` +
      `First Time Cutter: ${customerData.firstTimeCutter ? 'YES - send location' : 'NO'}\n` +
      `Payment: ${customerData.paymentMethod.toUpperCase()}\n` +
      `Service: ${service.name}\n` +
      `Date: ${format(selectedDate, 'EEEE, MMMM d, yyyy')}\n` +
      `Time: ${to12HourTime(selectedTime)}\n` +
      `Price: R${service.price}`
    );

    const whatsappWebUrl = `https://wa.me/27607329632?text=${message}`;
    const whatsappAppUrl = `whatsapp://send?phone=27607329632&text=${message}`;
    const isMobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Force direct deep-link on mobile so Confirm immediately routes to WhatsApp.
    if (isMobile) {
      window.location.replace(whatsappAppUrl);
    } else {
      window.open(whatsappWebUrl, '_blank', 'noopener,noreferrer');
    }

    handleClose();
  };

  const goBack = () => {
    if (step === 'time') {
      setStep('date');
      setSelectedTime(null);
    } else if (step === 'details') {
      setStep('time');
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'date': return 'Select Date';
      case 'time': return 'Select Time';
      case 'details': return 'Your Details';
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-40 glass-overlay"
        onClick={handleClose}
      />

      <div
        ref={panelRef}
        className="fixed right-0 top-0 bottom-0 z-50 w-full md:w-[480px] bg-black/95 backdrop-blur-xl border-l border-white/10 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            {step !== 'date' && (
              <button
                onClick={goBack}
                className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors tap-feedback"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold">{getStepTitle()}</h2>
              <p className="text-sm text-white/50">{service.name} - R{service.price}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors tap-feedback"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress indicators */}
        <div className="flex gap-2 px-6 py-4">
          {['date', 'time', 'details'].map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                ['date', 'time', 'details'].indexOf(step) >= i
                  ? 'bg-white/80'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {step === 'date' && (
            <GlassCalendar
              selectedDate={selectedDate}
              onSelectDate={handleDateSelect}
            />
          )}

          {step === 'time' && selectedDate && (
            <TimeSlotSelector
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onSelectTime={handleTimeSelect}
              onSelectAfterHours={handleAfterHoursSelect}
            />
          )}

          {step === 'details' && (
            <CustomerForm
              onSubmit={handleCustomerSubmit}
              onBack={goBack}
            />
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && selectedDate && selectedTime && customerData && (
        <ConfirmationModal
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={() => void handleConfirmBooking()}
          service={service}
          date={selectedDate}
          time={selectedTime}
          customerName={customerData.name}
          paymentMethod={customerData.paymentMethod}
          firstTimeCutter={customerData.firstTimeCutter}
        />
      )}
    </>
  );
}
