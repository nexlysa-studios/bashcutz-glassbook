import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface SplitTextProps {
  children: string;
  className?: string;
  delay?: number;
  stagger?: number;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

export function SplitText({ 
  children, 
  className = '', 
  delay = 0,
  stagger = 0.03,
  as: Component = 'span'
}: SplitTextProps) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chars = container.querySelectorAll('.char');

    gsap.fromTo(
      chars,
      { 
        opacity: 0, 
        y: 100,
        rotateX: -90,
      },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 1,
        stagger: stagger,
        delay: delay,
        ease: 'power4.out',
      }
    );
  }, [delay, stagger]);

  const letters = children.split('');

  return (
    <Component 
      ref={containerRef as any} 
      className={`inline-block overflow-hidden ${className}`}
      style={{ perspective: '1000px' }}
    >
      {letters.map((char, i) => (
        <span
          key={i}
          className="char inline-block origin-bottom"
          style={{ 
            display: char === ' ' ? 'inline' : 'inline-block',
            transformStyle: 'preserve-3d',
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </Component>
  );
}
