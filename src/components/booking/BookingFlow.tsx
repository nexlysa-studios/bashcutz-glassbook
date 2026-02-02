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
  const [customerData, setCustomerData] = useState<{ name: string; phone: string } | null>(null);
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

  const handleCustomerSubmit = (data: { name: string; phone: string }) => {
    setCustomerData(data);
    setShowConfirmation(true);
  };

  const handleConfirmBooking = () => {
    if (!selectedDate || !selectedTime || !customerData) return;

    const booking = addBooking({
      service,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedTime,
      customerName: customerData.name,
      customerPhone: customerData.phone,
    });

    // Create WhatsApp message
    const message = encodeURIComponent(
      `🪒 *BASHCUTZ Booking Confirmation*\n\n` +
      `👤 Name: ${customerData.name}\n` +
      `📞 Phone: ${customerData.phone}\n` +
      `✂️ Service: ${service.name}\n` +
      `📅 Date: ${format(selectedDate, 'EEEE, MMMM d, yyyy')}\n` +
      `🕐 Time: ${selectedTime}\n` +
      `💰 Price: R${service.price}\n\n` +
      `Booking ID: ${booking.id}`
    );

    // Open WhatsApp (replace with actual number)
    const whatsappUrl = `https://wa.me/27000000000?text=${message}`;
    window.open(whatsappUrl, '_blank');

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
              <p className="text-sm text-white/50">{service.name} — R{service.price}</p>
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
          onConfirm={handleConfirmBooking}
          service={service}
          date={selectedDate}
          time={selectedTime}
          customerName={customerData.name}
        />
      )}
    </>
  );
}
