import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GlassNavbar } from '../components/layout/GlassNavbar';
import { HeroSection } from '../components/sections/HeroSection';
import { ServicesSection, Service } from '../components/sections/ServicesSection';
import { BookingFlow } from '../components/booking/BookingFlow';

gsap.registerPlugin(ScrollTrigger);

const Index = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const handleBookNow = () => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
    setSelectedService(null);
  };

  return (
    <div className="min-h-screen">
      <GlassNavbar />
      
      <HeroSection onBookNow={handleBookNow} />
      
      <ServicesSection onSelectService={handleSelectService} />

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-xl font-bold mb-2">BASHCUTZ WorldWide</h3>
          <p className="text-white/40 text-sm mb-6">Precision · Style · Confidence</p>
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} BASHCUTZ WorldWide. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Booking Flow Panel */}
      {selectedService && (
        <BookingFlow
          isOpen={isBookingOpen}
          onClose={handleCloseBooking}
          service={selectedService}
        />
      )}
    </div>
  );
};

export default Index;
