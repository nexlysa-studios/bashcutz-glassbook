import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export function FloatingElements() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const elements = container.querySelectorAll('.floating-element');

    elements.forEach((el, i) => {
      gsap.to(el, {
        y: gsap.utils.random(-30, 30),
        x: gsap.utils.random(-20, 20),
        rotation: gsap.utils.random(-10, 10),
        duration: gsap.utils.random(3, 5),
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: i * 0.2,
      });
    });
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gold orbs */}
      <div 
        className="floating-element absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, hsl(var(--gold)) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div 
        className="floating-element absolute top-1/3 right-1/4 w-96 h-96 rounded-full opacity-5"
        style={{
          background: 'radial-gradient(circle, hsl(var(--gold)) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div 
        className="floating-element absolute bottom-1/4 left-1/3 w-48 h-48 rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, #fff 0%, transparent 70%)',
          filter: 'blur(30px)',
        }}
      />

      {/* Subtle particles */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="floating-element absolute w-1 h-1 rounded-full bg-gold/30"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  );
}
