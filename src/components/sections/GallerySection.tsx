import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Gallery images - using placeholder patterns, replace with real client photos
const galleryImages = [
  // Use the JPG client gallery files in public/
  {
    id: 1,
    alt: 'Custom Designs',
    src: '/Cut1.JPG',
    gradient: 'from-gold to-amber-600',
    description: 'Pick between any design of your choice. - BashCutz',
  },
  {
    id: 2,
    alt: 'Classic High Fade',
    src: '/Cut2.JPG',
    gradient: 'from-amber-600 to-yellow-600',
    description: 'All fades available & kept blurry. - BashCutz',
  },
  {
    id: 3,
    alt: 'Drop Fades',
    src: '/Cut3.JPG',
    gradient: 'from-yellow-600 to-gold',
    description: 'Fades dropped to your liking. - BashCutz',
  },
  {
    id: 4,
    alt: 'Beards',
    src: '/Cut4.JPG',
    gradient: 'from-gold to-amber-600',
    description: 'Shape, Style & Fade. - BashCutz',
  },
  {
    id: 5,
    alt: 'Taper Fade',
    src: '/Cut5.JPG',
    gradient: 'from-yellow-600 to-gold',
    description: 'All new & modern Cutz available. - BashCutz',
  },
];

export function GallerySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!listRef.current) return;

      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      const panels = Array.from(listRef.current.children);

      panels.forEach((panel, index) => {
        const heading = panel.querySelector('[data-heading]');
        const media = panel.querySelector('[data-gallery-media]');
        const direction = index % 2 === 0 ? -120 : 120;
        if (!heading || !media) return;

        gsap.fromTo(
          [media, heading],
          {
            opacity: 0,
            x: direction,
            y: 32,
            filter: 'blur(10px)',
          },
          {
            opacity: 1,
            x: 0,
            y: 0,
            filter: 'blur(0px)',
            ease: 'power3.out',
            duration: 1,
            stagger: 0.14,
            scrollTrigger: {
              trigger: panel,
              start: 'top 82%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="gallery"
      className="relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-white dark:from-black dark:via-neutral-950/50 dark:to-black" />

      <div className="relative z-10 px-6 pt-28 md:pt-2">
        <div className="max-w-6xl mx-auto text-center mb-1 md:mb-4">
          <span className="text-orange text-sm font-medium tracking-widest uppercase mb-4 block">
            Our Work
          </span>
          <h2
            ref={titleRef}
            className="text-[clamp(2.25rem,7vw,3.25rem)] sm:text-5xl md:text-8xl lg:text-9xl font-rammetto tracking-[0.06em] sm:tracking-[0.12em] md:tracking-[0.2em] uppercase w-full leading-snug opacity-0"
          >
            <span className="text-foreground dark:text-white">Client</span>{' '}
            <span className="text-orange-500">Gallery</span>
          </h2>
        </div>
      </div>

      <div className="relative z-10 pb-16 md:pb-20">
        <div ref={listRef} className="mx-auto flex max-w-6xl flex-col gap-16 px-6 md:gap-24">
          {galleryImages.map((image, index) => (
            <article
              key={image.id}
              className="flex min-h-[60vh] items-center"
            >
              <div className="grid w-full gap-8 md:gap-12 md:grid-cols-2 items-center">
                <div
                  data-heading
                  className={`order-2 opacity-0 ${index % 2 === 0 ? 'md:order-1' : 'md:order-2'} text-left`}
                >
                  <span className="text-xs tracking-[0.4em] uppercase text-foreground/50 dark:text-white/50 block mb-3">
                    Featured Cut {String(image.id).padStart(2, '0')}
                  </span>
                  <h3 className="text-4xl md:text-6xl font-semibold leading-tight mb-4">
                    {image.alt}
                  </h3>
                  <p className="text-foreground/60 dark:text-white/60 text-sm md:text-base max-w-md">
                    {image.description}
                  </p>
                </div>

                <div
                  data-gallery-media
                  className={`order-1 opacity-0 ${index % 2 === 0 ? 'md:order-2' : 'md:order-1'}`}
                >
                  <div
                    className="relative aspect-[3/4] md:aspect-[4/5]
  max-w-sm md:max-w-md
  max-h-[42vh] md:max-h-[46vh]
  mx-auto
  rounded-3xl overflow-hidden
  border border-white/10 bg-black/20"
                  >
                    {image.src ? (
                      <img
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-full block object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full bg-gradient-to-br ${image.gradient} flex items-center justify-center`}
                      >
                        <svg
                          className="w-16 h-16 text-gold/30"
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
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="relative z-10 px-6 pb-12">
        <p className="text-center text-foreground/50 dark:text-white/40 text-sm">
          Tag <span className="text-gold">@BASHCUTZ</span> on Instagram to be featured
        </p>
      </div>
    </section>
  );
}
