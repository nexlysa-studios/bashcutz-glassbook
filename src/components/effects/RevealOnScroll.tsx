import { useEffect, useRef, ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type AnimationType = 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale' | 'blur' | 'flip';

interface RevealOnScrollProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  stagger?: number;
}

export function RevealOnScroll({ 
  children, 
  animation = 'fade-up',
  delay = 0,
  duration = 1,
  className = '',
  stagger = 0,
}: RevealOnScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const elements = stagger > 0 ? container.children : [container];

    const getFromVars = () => {
      switch (animation) {
        case 'fade-up':
          return { opacity: 0, y: 80 };
        case 'fade-down':
          return { opacity: 0, y: -80 };
        case 'fade-left':
          return { opacity: 0, x: 80 };
        case 'fade-right':
          return { opacity: 0, x: -80 };
        case 'scale':
          return { opacity: 0, scale: 0.8 };
        case 'blur':
          return { opacity: 0, filter: 'blur(20px)' };
        case 'flip':
          return { opacity: 0, rotateY: 90 };
        default:
          return { opacity: 0, y: 80 };
      }
    };

    const getToVars = () => {
      switch (animation) {
        case 'fade-up':
        case 'fade-down':
          return { opacity: 1, y: 0 };
        case 'fade-left':
        case 'fade-right':
          return { opacity: 1, x: 0 };
        case 'scale':
          return { opacity: 1, scale: 1 };
        case 'blur':
          return { opacity: 1, filter: 'blur(0px)' };
        case 'flip':
          return { opacity: 1, rotateY: 0 };
        default:
          return { opacity: 1, y: 0 };
      }
    };

    const ctx = gsap.context(() => {
      gsap.fromTo(
        elements,
        getFromVars(),
        {
          ...getToVars(),
          duration,
          delay,
          stagger: stagger,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, container);

    return () => ctx.revert();
  }, [animation, delay, duration, stagger]);

  return (
    <div ref={containerRef} className={className} style={{ perspective: '1000px' }}>
      {children}
    </div>
  );
}
