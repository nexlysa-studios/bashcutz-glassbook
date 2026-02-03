import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Scissors, Sparkles } from 'lucide-react';
import { RevealOnScroll } from '../effects/RevealOnScroll';

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
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animated line
      gsap.fromTo(
        lineRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.5,
          ease: 'power3.inOut',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
          },
        }
      );

      // Title character animation
      const title = titleRef.current;
      if (title) {
        const text = title.textContent || '';
        title.innerHTML = text.split('').map(char => 
          `<span class="inline-block" style="opacity: 0; transform: translateY(40px);">${char === ' ' ? '&nbsp;' : char}</span>`
        ).join('');

        gsap.to(title.querySelectorAll('span'), {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.03,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: title,
            start: 'top 80%',
          },
        });
      }

      // Cards 3D tilt effect
      const cards = cardsRef.current?.children;
      if (cards) {
        Array.from(cards).forEach((card, i) => {
          // Entrance animation
          gsap.fromTo(
            card,
            { 
              opacity: 0, 
              y: 100,
              rotateX: 15,
            },
            {
              opacity: 1,
              y: 0,
              rotateX: 0,
              duration: 1,
              delay: i * 0.2,
              ease: 'power4.out',
              scrollTrigger: {
                trigger: cardsRef.current,
                start: 'top 75%',
              },
            }
          );

          // 3D tilt on hover
          const cardEl = card as HTMLElement;
          cardEl.style.transformStyle = 'preserve-3d';
          cardEl.style.perspective = '1000px';

          cardEl.addEventListener('mousemove', (e: MouseEvent) => {
            const rect = cardEl.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;

            gsap.to(cardEl, {
              rotateX: rotateX,
              rotateY: rotateY,
              scale: 1.02,
              boxShadow: '0 25px 50px -12px rgba(255, 215, 0, 0.15)',
              duration: 0.3,
            });
          });

          cardEl.addEventListener('mouseleave', () => {
            gsap.to(cardEl, {
              rotateX: 0,
              rotateY: 0,
              scale: 1,
              boxShadow: 'none',
              duration: 0.5,
              ease: 'power3.out',
            });
          });
        });
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
      className="relative py-32 md:py-40 px-6 overflow-hidden"
    >
      {/* Section Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-950/50 to-black" />

      {/* Animated accent lines */}
      <div 
        ref={lineRef}
        className="absolute top-20 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent origin-left"
      />

      <div className="relative z-10 max-w-5xl mx-auto">
        <RevealOnScroll animation="fade-up" className="text-center mb-20">
          <span className="text-gold text-sm font-semibold tracking-[0.3em] uppercase mb-6 block">
            What We Offer
          </span>
          <h2
            ref={titleRef}
            className="text-4xl md:text-6xl font-black tracking-tight"
          >
            Our Services
          </h2>
        </RevealOnScroll>

        <div
          ref={cardsRef}
          className="grid gap-8 md:grid-cols-2"
        >
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => onSelectService(service)}
              className="magnetic glass-card-hover p-10 text-left group tap-feedback relative overflow-hidden"
            >
              {/* Glowing border effect */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, transparent 50%, rgba(255,215,0,0.1) 100%)',
                }}
              />

              {/* Icon with pulse */}
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                <IconComponent type={service.icon} />
                <div className="absolute inset-0 rounded-2xl bg-gold/20 animate-ping opacity-0 group-hover:opacity-75" />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold mb-3 group-hover:text-gold transition-colors duration-300">
                {service.name}
              </h3>
              <p className="text-white/50 text-base mb-6">{service.description}</p>

              {/* Price & Duration */}
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-gold">R{service.price}</span>
                <span className="text-sm text-white/40 bg-white/5 px-4 py-2 rounded-full">
                  {service.duration}
                </span>
              </div>

              {/* Hover indicator */}
              <div className="mt-8 flex items-center gap-3 text-sm text-white/40 group-hover:text-gold transition-all duration-300">
                <span className="font-medium">Select service</span>
                <svg
                  className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
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
