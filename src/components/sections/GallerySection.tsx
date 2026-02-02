import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Gallery images - using placeholder patterns, replace with real client photos
const galleryImages = [
  { id: 1, alt: 'Fresh fade haircut', gradient: 'from-gold/20 to-black' },
  { id: 2, alt: 'Clean beard trim', gradient: 'from-amber-600/20 to-black' },
  { id: 3, alt: 'Precision line-up', gradient: 'from-yellow-500/20 to-black' },
  { id: 4, alt: 'Classic cut', gradient: 'from-gold/20 to-black' },
  { id: 5, alt: 'Modern style', gradient: 'from-amber-600/20 to-black' },
  { id: 6, alt: 'Sharp edges', gradient: 'from-yellow-500/20 to-black' },
];

export function GallerySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
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

      const images = gridRef.current?.children;
      if (images) {
        gsap.fromTo(
          images,
          { opacity: 0, scale: 0.9 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="gallery"
      className="relative py-24 md:py-32 px-6"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-950/50 to-black" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-gold text-sm font-medium tracking-widest uppercase mb-4 block">
            Our Work
          </span>
          <h2
            ref={titleRef}
            className="text-3xl md:text-4xl font-bold tracking-tight opacity-0"
          >
            Client Gallery
          </h2>
        </div>

        <div
          ref={gridRef}
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          {galleryImages.map((image) => (
            <div
              key={image.id}
              className="aspect-square glass-card-hover overflow-hidden group cursor-pointer"
            >
              {/* Placeholder with gradient - replace with actual images */}
              <div
                className={`w-full h-full bg-gradient-to-br ${image.gradient} flex items-center justify-center relative`}
              >
                {/* Scissors icon as placeholder */}
                <svg
                  className="w-12 h-12 text-gold/30 group-hover:text-gold/50 transition-colors duration-300"
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
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gold/0 group-hover:bg-gold/10 transition-colors duration-300" />
                
                {/* Gold border accent on hover */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-gold/30 transition-colors duration-300 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-white/40 text-sm mt-8">
          Tag <span className="text-gold">@BASHCUTZ</span> on Instagram to be featured
        </p>
      </div>
    </section>
  );
}
