import { useEffect, useRef, useState } from 'react';
import { GlassNavbar } from '../components/layout/GlassNavbar';
import { HeroSection } from '../components/sections/HeroSection';
import { ServicesSection, Service } from '../components/sections/ServicesSection';
import { GallerySection } from '../components/sections/GallerySection';
import { MerchSection } from '../components/sections/MerchSection';
import { NewsletterSection } from '../components/sections/NewsletterSection';
import { BookingFlow } from '../components/booking/BookingFlow';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSEO } from '@/hooks/useSEO';

gsap.registerPlugin(ScrollTrigger);

const Index = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const footerTitleRef = useRef<HTMLHeadingElement | null>(null);
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

  useSEO({
    title: 'BASHCUTZ WorldWide | Premium Barbershop',
    description:
      'BASHCUTZ WorldWide delivers precision fades, beard grooming, and premium barber services. Book your next cut today.',
    keywords:
      'barber, barbershop, premium barber, fade haircut, beard trim, grooming, haircut near me, BASHCUTZ',
    path: '/',
    image: '/Bashcutz-logo-removebg-preview.png',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'BarberShop',
      name: 'BASHCUTZ WorldWide',
      description:
        'Premium barber services including fades, beard grooming, and modern styling.',
      url: siteUrl,
      image: new URL('/Bashcutz-logo-removebg-preview.png', siteUrl).toString(),
      sameAs: ['https://instagram.com/bash.cutz', 'https://tiktok.com/@bashcutz'],
      slogan: 'Precision. Style. Confidence.',
    },
  });

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

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!footerTitleRef.current) return;

      gsap.fromTo(
        footerTitleRef.current,
        { y: 40, opacity: 0, scale: 0.92 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: footerTitleRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen">
      <GlassNavbar />
      
      <HeroSection onBookNow={handleBookNow} />
      
      <ServicesSection onSelectService={handleSelectService} />
      
      <GallerySection />
      
      <MerchSection />

      <NewsletterSection />

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <h3
            ref={footerTitleRef}
            className="text-6xl md:text-8xl lg:text-[9rem] font-bold mb-3 leading-none text-foreground dark:text-white"
          >
            <span className="text-orange-500">BASHCUTZ</span> WorldWide
          </h3>
          <p className="text-foreground/70 dark:text-white/60 text-sm md:text-base mb-4 tracking-[0.2em] uppercase">
            Now Thats a Bash Cut
          </p>
          <p className="text-foreground/60 dark:text-white/40 text-sm mb-6">
            Precision <span className="text-gold">·</span> Style <span className="text-gold">·</span> Confidence
          </p>
          <div className="flex justify-center gap-6 mb-6">
            <a href="#services" className="text-foreground/60 dark:text-white/40 hover:text-gold transition-colors text-sm">Services</a>
            <a href="#gallery" className="text-foreground/60 dark:text-white/40 hover:text-gold transition-colors text-sm">Gallery</a>
            <a href="#merch" className="text-foreground/60 dark:text-white/40 hover:text-gold transition-colors text-sm">Merch</a>
            <a href="#newsletter" className="text-foreground/60 dark:text-white/40 hover:text-gold transition-colors text-sm">Updates</a>
          </div>
          <div className="flex justify-center gap-4 mb-6">
            <a
              href="https://instagram.com/bash.cutz"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-full border border-foreground/20 dark:border-white/20 text-foreground/70 dark:text-white/60 hover:text-gold hover:border-gold/60 transition-colors text-sm"
            >
              Instagram
            </a>
            <a
              href="https://tiktok.com/@bashcutz"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-full border border-foreground/20 dark:border-white/20 text-foreground/70 dark:text-white/60 hover:text-gold hover:border-gold/60 transition-colors text-sm"
            >
              TikTok
            </a>
          </div>
          <p className="text-foreground/50 dark:text-white/30 text-xs">
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
