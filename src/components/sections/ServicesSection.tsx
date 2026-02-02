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
    duration: '30 min',
    icon: 'scissors',
  },
  {
    id: 'haircut-beard',
    name: 'Haircut + Beard Trim',
    price: 180,
    description: 'Complete grooming experience',
    duration: '45 min',
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
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
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
      <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-950/50 to-black" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <h2
          ref={titleRef}
          className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight opacity-0"
        >
          Our Services
        </h2>

        <div
          ref={cardsRef}
          className="grid gap-6 md:grid-cols-2"
        >
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => onSelectService(service)}
              className="glass-card-hover p-8 text-left group tap-feedback"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6 group-hover:bg-white/15 transition-colors duration-300">
                <IconComponent type={service.icon} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
              <p className="text-white/50 text-sm mb-4">{service.description}</p>

              {/* Price & Duration */}
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">R{service.price}</span>
                <span className="text-sm text-white/40">{service.duration}</span>
              </div>

              {/* Hover indicator */}
              <div className="mt-6 flex items-center gap-2 text-sm text-white/40 group-hover:text-white/70 transition-colors duration-300">
                <span>Select service</span>
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
