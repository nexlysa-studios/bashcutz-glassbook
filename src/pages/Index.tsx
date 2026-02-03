import { useState } from 'react';
import { GlassNavbar } from '../components/layout/GlassNavbar';
import { HeroSection } from '../components/sections/HeroSection';
import { ServicesSection, Service } from '../components/sections/ServicesSection';
import { GallerySection } from '../components/sections/GallerySection';
import { MerchSection } from '../components/sections/MerchSection';
import { BookingFlow } from '../components/booking/BookingFlow';
import { MagneticCursor } from '../components/effects/MagneticCursor';
import { RevealOnScroll } from '../components/effects/RevealOnScroll';

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
    <div className="min-h-screen bg-black cursor-none md:cursor-none">
      {/* Custom cursor */}
      <MagneticCursor />
      
      <GlassNavbar />
      
      <HeroSection onBookNow={handleBookNow} />
      
      <ServicesSection onSelectService={handleSelectService} />
      
      <GallerySection />
      
      <MerchSection />

      {/* Footer */}
      <footer className="relative py-20 px-6 border-t border-white/5 overflow-hidden">
        {/* Background glow */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, hsl(var(--gold)) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        
        <RevealOnScroll animation="fade-up" className="relative z-10 max-w-4xl mx-auto text-center">
          <h3 className="text-3xl md:text-4xl font-black mb-4">
            <span className="text-gold">BASHCUTZ</span> WorldWide
          </h3>
          <p className="text-white/40 text-sm mb-8 tracking-widest uppercase">
            Precision <span className="text-gold">·</span> Style <span className="text-gold">·</span> Confidence
          </p>
          <div className="flex justify-center gap-8 mb-10">
            {['Services', 'Gallery', 'Merch'].map((item) => (
              <a 
                key={item}
                href={`#${item.toLowerCase()}`} 
                className="magnetic text-white/40 hover:text-gold transition-colors text-sm font-medium"
              >
                {item}
              </a>
            ))}
          </div>
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent mx-auto mb-8" />
          <p className="text-white/20 text-xs">
            © {new Date().getFullYear()} BASHCUTZ WorldWide. All rights reserved.
          </p>
        </RevealOnScroll>
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
