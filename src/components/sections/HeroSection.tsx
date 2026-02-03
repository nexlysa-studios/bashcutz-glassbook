import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { FloatingElements } from '../effects/FloatingElements';

interface HeroSectionProps {
  onBookNow: () => void;
}

export function HeroSection({ onBookNow }: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial setup - hide elements
      gsap.set([headlineRef.current, subheadlineRef.current, ctaRef.current, scrollIndicatorRef.current], {
        opacity: 0,
      });

      // Animated background glow
      gsap.to(glowRef.current, {
        scale: 1.2,
        opacity: 0.4,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Split headline into characters for staggered animation
      const headline = headlineRef.current;
      if (headline) {
        const text = headline.innerHTML;
        const mainText = 'BASHCUTZ';
        const chars = mainText.split('').map((char, i) => 
          `<span class="char inline-block" style="opacity: 0; transform: translateY(100px) rotateX(-90deg);">${char}</span>`
        ).join('');
        
        // Keep the WorldWide span
        headline.innerHTML = `<span class="main-text">${chars}</span><span class="world-wide block text-3xl md:text-4xl lg:text-5xl font-light mt-2 tracking-widest" style="opacity: 0; transform: translateY(50px);">WorldWide</span>`;

        const charElements = headline.querySelectorAll('.char');
        const worldWide = headline.querySelector('.world-wide');

        // Master timeline
        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

        // Staggered character reveal
        tl.to(charElements, {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 1.2,
          stagger: 0.08,
        })
        .to(worldWide, {
          opacity: 1,
          y: 0,
          duration: 0.8,
        }, '-=0.6')
        .fromTo(
          subheadlineRef.current,
          { opacity: 0, y: 30, filter: 'blur(10px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8 },
          '-=0.4'
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 20, scale: 0.9 },
          { 
            opacity: 1, 
            y: 0, 
            scale: 1, 
            duration: 0.6,
            ease: 'elastic.out(1, 0.8)',
          },
          '-=0.3'
        )
        .fromTo(
          scrollIndicatorRef.current,
          { opacity: 0, y: -20 },
          { opacity: 0.4, y: 0, duration: 0.6 },
          '-=0.2'
        );

        // Continuous scroll indicator animation
        gsap.to(scrollIndicatorRef.current?.querySelector('.scroll-line'), {
          scaleY: 0,
          transformOrigin: 'top',
          duration: 1.5,
          repeat: -1,
          ease: 'power2.inOut',
        });
      }

      // CTA hover animation
      const cta = ctaRef.current;
      if (cta) {
        cta.addEventListener('mouseenter', () => {
          gsap.to(cta, {
            scale: 1.05,
            boxShadow: '0 0 40px rgba(255, 215, 0, 0.4)',
            duration: 0.3,
            ease: 'power2.out',
          });
        });
        
        cta.addEventListener('mouseleave', () => {
          gsap.to(cta, {
            scale: 1,
            boxShadow: '0 0 0px rgba(255, 215, 0, 0)',
            duration: 0.3,
            ease: 'power2.out',
          });
        });
      }

    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Mouse move parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 20;
      const y = (clientY / window.innerHeight - 0.5) * 20;

      gsap.to(headlineRef.current, {
        x: x * 0.5,
        y: y * 0.5,
        duration: 1,
        ease: 'power2.out',
      });

      gsap.to(glowRef.current, {
        x: x * 2,
        y: y * 2,
        duration: 1.5,
        ease: 'power2.out',
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-950 to-black" />
      
      {/* Animated glow */}
      <div 
        ref={glowRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, hsl(var(--gold)) 0%, transparent 50%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Floating elements */}
      <FloatingElements />

      {/* Grain overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        <h1
          ref={headlineRef}
          className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-8"
          style={{
            background: 'linear-gradient(180deg, #FFD700 0%, #FFA500 40%, #ffffff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            perspective: '1000px',
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
          className="text-lg md:text-2xl text-white/60 font-light tracking-[0.4em] uppercase mb-14"
        >
          Precision <span className="text-gold">·</span> Style <span className="text-gold">·</span> Confidence
        </p>

        <button
          ref={ctaRef}
          onClick={onBookNow}
          className="magnetic relative px-12 py-5 bg-gradient-to-r from-gold via-yellow-500 to-gold text-black font-bold text-lg tracking-wider rounded-full overflow-hidden group tap-feedback"
        >
          <span className="relative z-10">Book Now</span>
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </button>
      </div>

      {/* Scroll indicator */}
      <div 
        ref={scrollIndicatorRef}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <span className="text-xs tracking-[0.3em] uppercase text-white/40">Scroll</span>
        <div className="scroll-line w-px h-12 bg-gradient-to-b from-gold/60 to-transparent" />
      </div>

      {/* Side decorations */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i}
            className="w-1 h-8 rounded-full bg-white/10 animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i}
            className="w-1 h-8 rounded-full bg-white/10 animate-pulse"
            style={{ animationDelay: `${i * 0.2 + 0.5}s` }}
          />
        ))}
      </div>
    </section>
  );
}
