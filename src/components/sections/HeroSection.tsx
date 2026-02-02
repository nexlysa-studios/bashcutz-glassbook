import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScissorsScene } from '../three/ScissorsScene';

interface HeroSectionProps {
  onBookNow: () => void;
}

export function HeroSection({ onBookNow }: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Create timeline for entrance animations
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        headlineRef.current,
        { opacity: 0, y: 60, filter: 'blur(10px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2 }
      )
        .fromTo(
          subheadlineRef.current,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.8 },
          '-=0.6'
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 30, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6 },
          '-=0.4'
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-950 to-black" />
      
      {/* Subtle radial gradient overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 70%)'
        }}
      />

      {/* Three.js Scene */}
      <ScissorsScene />

      {/* Glass overlay for content */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <h1
          ref={headlineRef}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 opacity-0"
          style={{
            background: 'linear-gradient(180deg, #FFD700 0%, #FFA500 50%, #ffffff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          BASHCUTZ
          <span 
            className="block text-3xl md:text-4xl lg:text-5xl font-light mt-2 tracking-widest"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #a0a0a0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            WorldWide
          </span>
        </h1>

        <p
          ref={subheadlineRef}
          className="text-lg md:text-xl text-white/60 font-light tracking-[0.3em] uppercase mb-12 opacity-0"
        >
          Precision <span className="text-gold">·</span> Style <span className="text-gold">·</span> Confidence
        </p>

        <button
          ref={ctaRef}
          onClick={onBookNow}
          className="glass-button-primary text-lg tracking-wide tap-feedback opacity-0"
        >
          Book Now
        </button>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-white to-transparent" />
      </div>
    </section>
  );
}
