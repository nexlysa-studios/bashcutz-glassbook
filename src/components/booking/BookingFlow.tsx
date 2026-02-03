import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { X, ArrowLeft, Check, Calendar, Clock, User } from 'lucide-react';
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
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      const tl = gsap.timeline();
      
      tl.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: 'power2.out' }
      )
      .fromTo(
        panelRef.current,
        { x: '100%', opacity: 0 },
        { x: '0%', opacity: 1, duration: 0.6, ease: 'power4.out' },
        '-=0.2'
      );
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Animate content when step changes
  useEffect(() => {
    if (contentRef.current && isOpen) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 20, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power3.out' }
      );
    }
  }, [step, isOpen]);

  const handleClose = () => {
    const tl = gsap.timeline({
      onComplete: () => {
        onClose();
        setStep('date');
        setSelectedDate(null);
        setSelectedTime(null);
        setCustomerData(null);
        setShowConfirmation(false);
      },
    });
    
    tl.to(panelRef.current, {
      x: '100%',
      opacity: 0,
      duration: 0.4,
      ease: 'power3.in',
    })
    .to(overlayRef.current, { opacity: 0, duration: 0.3 }, '-=0.2');
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

  const steps = [
    { id: 'date', label: 'Date', icon: Calendar },
    { id: 'time', label: 'Time', icon: Clock },
    { id: 'details', label: 'Details', icon: User },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 bottom-0 z-50 w-full md:w-[520px] bg-gradient-to-b from-neutral-950 to-black border-l border-white/10 flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/50 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            {step !== 'date' && (
              <button
                onClick={goBack}
                className="p-2.5 -ml-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 tap-feedback group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold">Book Appointment</h2>
              <p className="text-sm text-gold">{service.name} — R{service.price}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 tap-feedback group"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-5 border-b border-white/5">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === currentStepIndex;
              const isComplete = i < currentStepIndex;
              
              return (
                <div key={s.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                        isComplete
                          ? 'bg-gold text-black'
                          : isActive
                          ? 'bg-gold/20 text-gold border-2 border-gold'
                          : 'bg-white/5 text-white/30'
                      }`}
                    >
                      {isComplete ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-xs mt-2 font-medium transition-colors duration-300 ${
                      isActive ? 'text-gold' : isComplete ? 'text-white/60' : 'text-white/30'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  
                  {i < steps.length - 1 && (
                    <div className={`w-16 md:w-24 h-0.5 mx-2 mb-6 rounded-full transition-colors duration-500 ${
                      i < currentStepIndex ? 'bg-gold' : 'bg-white/10'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-6 scrollbar-hide">
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

        {/* Footer accent */}
        <div className="h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
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
