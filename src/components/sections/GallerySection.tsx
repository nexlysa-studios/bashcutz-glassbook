import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RevealOnScroll } from '../effects/RevealOnScroll';

gsap.registerPlugin(ScrollTrigger);

// Gallery images - using placeholder patterns, replace with real client photos
const galleryImages = [
  { id: 1, alt: 'Fresh fade haircut', gradient: 'from-gold/30 via-amber-600/20 to-black' },
  { id: 2, alt: 'Clean beard trim', gradient: 'from-amber-500/25 via-yellow-600/15 to-black' },
  { id: 3, alt: 'Precision line-up', gradient: 'from-yellow-500/30 via-gold/20 to-black' },
  { id: 4, alt: 'Classic cut', gradient: 'from-gold/25 via-amber-700/15 to-black' },
  { id: 5, alt: 'Modern style', gradient: 'from-amber-600/30 via-yellow-500/20 to-black' },
  { id: 6, alt: 'Sharp edges', gradient: 'from-yellow-600/25 via-gold/15 to-black' },
];

export function GallerySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Marquee animation
      gsap.to(marqueeRef.current, {
        xPercent: -50,
        duration: 20,
        repeat: -1,
        ease: 'none',
      });

      // Grid items with staggered 3D reveal
      const items = gridRef.current?.children;
      if (items) {
        Array.from(items).forEach((item, i) => {
          gsap.fromTo(
            item,
            { 
              opacity: 0, 
              scale: 0.8,
              rotateY: -15,
              z: -100,
            },
            {
              opacity: 1,
              scale: 1,
              rotateY: 0,
              z: 0,
              duration: 1,
              delay: i * 0.1,
              ease: 'power4.out',
              scrollTrigger: {
                trigger: gridRef.current,
                start: 'top 80%',
              },
            }
          );

          // Hover parallax
          const el = item as HTMLElement;
          el.addEventListener('mouseenter', () => {
            gsap.to(el, {
              scale: 1.05,
              zIndex: 10,
              duration: 0.4,
              ease: 'power2.out',
            });
            gsap.to(el.querySelector('.gallery-overlay'), {
              opacity: 1,
              duration: 0.3,
            });
          });

          el.addEventListener('mouseleave', () => {
            gsap.to(el, {
              scale: 1,
              zIndex: 1,
              duration: 0.4,
              ease: 'power2.out',
            });
            gsap.to(el.querySelector('.gallery-overlay'), {
              opacity: 0,
              duration: 0.3,
            });
          });
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="gallery"
      className="relative py-32 md:py-40 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-950/50 to-black" />

      {/* Marquee text */}
      <div className="absolute top-0 left-0 right-0 py-4 overflow-hidden border-y border-white/5">
        <div ref={marqueeRef} className="flex whitespace-nowrap">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="text-8xl font-black text-white/[0.02] tracking-tight mx-8">
              BASHCUTZ • PRECISION • STYLE • CONFIDENCE •
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <RevealOnScroll animation="fade-up" className="text-center mb-20">
          <span className="text-gold text-sm font-semibold tracking-[0.3em] uppercase mb-6 block">
            Our Work
          </span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight">
            Client Gallery
          </h2>
        </RevealOnScroll>

        <div
          ref={gridRef}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
          style={{ perspective: '1000px' }}
        >
          {galleryImages.map((image, index) => (
            <div
              key={image.id}
              className={`relative aspect-square glass-card overflow-hidden group cursor-pointer ${
                index === 0 ? 'md:col-span-2 md:row-span-2' : ''
              }`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Gradient background - replace with actual images */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${image.gradient}`}
              />

              {/* Animated pattern */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFD700' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />

              {/* Scissors icon placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className={`${index === 0 ? 'w-20 h-20' : 'w-12 h-12'} text-gold/20 group-hover:text-gold/40 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"
                  />
                </svg>
              </div>

              {/* Hover overlay */}
              <div className="gallery-overlay absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 flex items-end p-6">
                <div>
                  <p className="text-lg font-semibold">{image.alt}</p>
                  <p className="text-white/50 text-sm">@BASHCUTZ</p>
                </div>
              </div>

              {/* Glowing border */}
              <div className="absolute inset-0 rounded-3xl border border-white/0 group-hover:border-gold/30 transition-colors duration-500" />
            </div>
          ))}
        </div>

        <RevealOnScroll animation="fade-up" delay={0.5} className="mt-12">
          <p className="text-center text-white/40 text-sm">
            Tag <span className="text-gold font-semibold">@BASHCUTZ</span> on Instagram to be featured
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}
