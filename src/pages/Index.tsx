import { useState } from 'react';
import { GlassNavbar } from '../components/layout/GlassNavbar';
import { HeroSection } from '../components/sections/HeroSection';
import { ServicesSection, Service } from '../components/sections/ServicesSection';
import { GallerySection } from '../components/sections/GallerySection';
import { MerchSection } from '../components/sections/MerchSection';
import { BookingFlow } from '../components/booking/BookingFlow';

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
      
      <GallerySection />
      
      <MerchSection />

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-xl font-bold mb-2">
            <span className="text-gold">BASHCUTZ</span> WorldWide
          </h3>
          <p className="text-white/40 text-sm mb-6">
            Precision <span className="text-gold">·</span> Style <span className="text-gold">·</span> Confidence
          </p>
          <div className="flex justify-center gap-6 mb-6">
            <a href="#services" className="text-white/40 hover:text-gold transition-colors text-sm">Services</a>
            <a href="#gallery" className="text-white/40 hover:text-gold transition-colors text-sm">Gallery</a>
            <a href="#merch" className="text-white/40 hover:text-gold transition-colors text-sm">Merch</a>
          </div>
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
