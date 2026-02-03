import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

export function MagneticCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    const cursorDot = cursorDotRef.current;
    if (!cursor || !cursorDot) return;

    // Check if device has touch (hide cursor on mobile)
    const isTouchDevice = 'ontouchstart' in window;
    if (isTouchDevice) {
      cursor.style.display = 'none';
      cursorDot.style.display = 'none';
      return;
    }

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);

    // Magnetic effect for interactive elements
    const magneticElements = document.querySelectorAll('.magnetic, button, a, .glass-card-hover');
    
    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    magneticElements.forEach((el) => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    // Smooth cursor animation
    const animate = () => {
      const speed = 0.15;
      cursorX += (mouseX - cursorX) * speed;
      cursorY += (mouseY - cursorY) * speed;

      gsap.set(cursor, {
        x: cursorX - 20,
        y: cursorY - 20,
      });

      gsap.set(cursorDot, {
        x: mouseX - 4,
        y: mouseY - 4,
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      magneticElements.forEach((el) => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, []);

  return (
    <>
      {/* Outer ring */}
      <div
        ref={cursorRef}
        className={`fixed top-0 left-0 w-10 h-10 pointer-events-none z-[9999] mix-blend-difference transition-transform duration-300 hidden md:block ${
          isHovering ? 'scale-150' : 'scale-100'
        } ${isClicking ? 'scale-75' : ''}`}
      >
        <div 
          className={`w-full h-full rounded-full border transition-all duration-300 ${
            isHovering ? 'border-gold bg-gold/10' : 'border-white/50'
          }`} 
        />
      </div>

      {/* Inner dot */}
      <div
        ref={cursorDotRef}
        className={`fixed top-0 left-0 w-2 h-2 pointer-events-none z-[9999] hidden md:block transition-transform duration-150 ${
          isClicking ? 'scale-50' : 'scale-100'
        }`}
      >
        <div className={`w-full h-full rounded-full transition-colors duration-300 ${
          isHovering ? 'bg-gold' : 'bg-white'
        }`} />
      </div>
    </>
  );
}
