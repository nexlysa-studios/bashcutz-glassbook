import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const AD_NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1);
const AUTO_ROTATE_MS = 5000;

const ADS = AD_NUMBERS.map((number) => ({
  id: `ad-${number}`,
  src: `/Ad${number}.jpeg`,
  alt: `BASHCUTZ Official Merch Ad ${number}`,
}));

export function MerchSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const currentAd = ADS[currentIndex];

  const handleShopNow = () => {
    navigate('/merch');
    // Scroll to top after navigation
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  };

  useEffect(() => {
    ADS.forEach((ad) => {
      const image = new Image();
      image.src = ad.src;
    });
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + ADS.length) % ADS.length);
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % ADS.length);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Auto-rotate carousel. Manual navigation resets this timer via currentIndex.
  useEffect(() => {
    const timeout = window.setTimeout(goToNext, AUTO_ROTATE_MS);

    return () => window.clearTimeout(timeout);
  }, [currentIndex, goToNext]);

  // Title animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current,
          { opacity: 0, x: -200 },
          {
            opacity: 1,
            x: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: titleRef.current,
              start: 'top 80%',
              scrub: true,
            },
          }
        );
      }

      if (carouselRef.current) {
        gsap.fromTo(
          carouselRef.current,
          { opacity: 0, y: 40, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: carouselRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="merch"
      className="relative px-6 py-24 md:py-32"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-white dark:from-black dark:via-neutral-950/50 dark:to-black" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <span className="mb-4 block text-sm font-medium uppercase tracking-widest text-gold">
            Exclusive
          </span>
          <h2
            ref={titleRef}
            className="text-[clamp(2.25rem,7vw,3.25rem)] sm:text-5xl md:text-8xl lg:text-9xl font-rammetto tracking-[0.06em] sm:tracking-[0.12em] md:tracking-[0.2em] uppercase w-full leading-snug opacity-0"
          >
            <span className="text-foreground dark:text-white block sm:inline">Official</span>{' '}
            <span className="text-orange-500 block sm:inline">Merch</span>
          </h2>
        </div>

        {/* Ad Carousel */}
        <div ref={carouselRef} className="relative group">
          <div className="relative w-full overflow-hidden rounded-3xl bg-muted/30 dark:bg-muted/20 aspect-video sm:aspect-video min-h-[500px] sm:min-h-[600px] md:min-h-[700px]">
            {/* Main Image */}
            <img
              key={currentAd.id}
              src={currentAd.src}
              alt={currentAd.alt}
              className="h-full w-full object-cover animate-fade-in"
              draggable={false}
            />

            {/* Shop Now Button Overlay */}
            <div className="absolute inset-0 flex items-end justify-center pb-8 bg-gradient-to-t from-black/60 to-transparent">
              <button
                onClick={handleShopNow}
                className="glass-button inline-flex items-center justify-center px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] hover:opacity-90 transition-opacity"
              >
                Shop Now
              </button>
            </div>

            {/* Previous Button */}
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors duration-300 opacity-0 group-hover:opacity-100"
              aria-label="Previous ad"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next Button */}
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors duration-300 opacity-0 group-hover:opacity-100"
              aria-label="Next ad"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Dot Indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {ADS.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-orange-500 w-8'
                    : 'bg-foreground/30 dark:bg-white/30 w-2 hover:bg-foreground/50 dark:hover:bg-white/50'
                }`}
                aria-label={`Go to ad ${index + 1}`}
              />
            ))}
          </div>

          {/* Ad Counter */}
          <div className="text-center mt-4 text-sm text-foreground/60 dark:text-white/60">
            {currentIndex + 1} / {ADS.length}
          </div>
        </div>

        {/* Bulk Order CTA */}
        <div className="mt-12 glass-card p-8 text-center">
          <p className="mb-4 text-foreground/60 dark:text-white/60">
            Looking for bulk orders or custom merch?
          </p>
          <button
            onClick={() => {
              const message = encodeURIComponent(
                `BASHCUTZ custom or bulk order inquiry.%0A%0AI would like to discuss a custom or bulk merch order.`
              );
              window.open(`https://wa.me/27607329632?text=${message}`, '_blank');
            }}
            className="inline-flex items-center gap-2 text-gold transition-colors duration-300 hover:text-gold-light"
          >
            <span>Contact us on WhatsApp</span>
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
