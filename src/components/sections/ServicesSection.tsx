import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Scissors, Sparkles } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export interface Service {
  id: string;
  name: string;
  price: number;
  description: string;
  duration: string;
  icon: 'scissors' | 'sparkles';
}

export const services: Service[] = [
  {
    id: 'haircut',
    name: 'Haircut',
    price: 150,
    description: 'Precision cut tailored to your style',
    duration: '1 Hour',
    icon: 'scissors',
  },
  {
    id: 'haircut-beard',
    name: 'Haircut + Beard Trim',
    price: 180,
    description: 'Complete grooming experience',
    duration: '1 Hour',
    icon: 'sparkles',
  },
];

interface ServicesSectionProps {
  onSelectService: (service: Service) => void;
}

export function ServicesSection({ onSelectService }: ServicesSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
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

      // Cards stagger animation
      const cards = cardsRef.current?.children;
      if (cards) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 60, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const IconComponent = ({ type }: { type: 'scissors' | 'sparkles' }) => {
    return type === 'scissors' ? (
      <Scissors className="w-6 h-6" />
    ) : (
      <Sparkles className="w-6 h-6" />
    );
  };

  return (
    <section
      ref={sectionRef}
      id="services"
      className="relative py-24 md:py-32 px-6"
    >
      {/* Section Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-white dark:from-black dark:via-neutral-950/50 dark:to-black" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-gold text-sm font-medium tracking-widest uppercase mb-4 block">
            What We Offer
          </span>
          <h2
            ref={titleRef}
            className="text-[clamp(2.25rem,7vw,3.25rem)] sm:text-5xl md:text-8xl lg:text-9xl font-rammetto tracking-[0.06em] sm:tracking-[0.12em] md:tracking-[0.2em] uppercase w-full leading-snug opacity-0"
          >
            <span className="text-foreground dark:text-white block sm:inline">Our</span>{' '}
            <span className="text-orange-500 block sm:inline">Services</span>
          </h2>
        </div>

        <div
          ref={cardsRef}
          className="grid gap-6 md:grid-cols-2"
        >
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => onSelectService(service)}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0 dark:from-white/5 dark:via-white/0 dark:to-black/40 p-8 text-left group tap-feedback"
            >
              {/* Decorative glow */}
              <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gold/20 blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,215,130,0.12),transparent_45%)] opacity-70" />

              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center mb-6 group-hover:bg-gold/25 transition-colors duration-300">
                <IconComponent type={service.icon} />
              </div>

              {/* Content */}
              <h3 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
                {service.name}
              </h3>
              <p className="text-foreground/70 dark:text-white/60 text-sm md:text-base mb-6 max-w-sm">
                {service.description}
              </p>

              {/* Price & Duration */}
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold text-gold">R{service.price}</span>
                <span className="text-xs uppercase tracking-[0.3em] text-foreground/60 dark:text-white/50">
                  {service.duration}
                </span>
              </div>

              {/* Hover indicator */}
              <div className="mt-6 flex items-center gap-2 text-sm text-foreground/60 dark:text-white/50 group-hover:text-foreground/80 dark:group-hover:text-white/80 transition-colors duration-300">
                <span>Book this service</span>
                <svg
                  className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

