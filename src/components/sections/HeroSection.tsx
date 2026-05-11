import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface HeroSectionProps {
  onBookNow: () => void;
}

export function HeroSection({ onBookNow }: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const titleLineRef = useRef<HTMLSpanElement>(null);
  const worldWideRef = useRef<HTMLSpanElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Create timeline for entrance animations
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        [titleLineRef.current, worldWideRef.current],
        { opacity: 0, x: -180, y: 20, filter: 'blur(10px)' },
        {
          opacity: 1,
          x: 0,
          y: 0,
          filter: 'blur(0px)',
          duration: 1.1,
          stagger: 0.15,
        }
      )
        .fromTo(
          subheadlineRef.current,
          { opacity: 0, y: 24, letterSpacing: '0.6em' },
          { opacity: 1, y: 0, letterSpacing: '0.3em', duration: 0.9 },
          '-=0.5'
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 18, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6 },
          '-=0.35'
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const keepPlaying = () => {
      if (document.visibilityState === 'visible' && videoEl.paused) {
        void videoEl.play().catch(() => {
          // Ignore autoplay race conditions; browser will retry on next visibility/pause event.
        });
      }
    };

    // Kick playback and force-resume if mobile browser pauses the hero video.
    keepPlaying();
    videoEl.addEventListener('pause', keepPlaying);
    document.addEventListener('visibilitychange', keepPlaying);

    return () => {
      videoEl.removeEventListener('pause', keepPlaying);
      document.removeEventListener('visibilitychange', keepPlaying);
    };
  }, []);

  // Use encodeURIComponent on the raw filename (without leading slash)
  // so characters like `#` and emojis are percent-encoded correctly.
  const rawVideoFile = 'Day in the life 💋💈barber - @bash.cutz 💈#bashcutz #fyp #barber #hair #new #reels #2025 #trendi.mp4';
  const videoSrc = `/video/${encodeURIComponent(rawVideoFile)}`;

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-white dark:from-black dark:via-neutral-950 dark:to-black" />

      {/* Background Video (mobile only) */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none md:hidden"
        src="/Hero-Mobile.mp4"
        autoPlay
        muted
        loop
        playsInline
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload nofullscreen noplaybackrate noremoteplayback"
        preload="auto"
        aria-hidden="true"
      />

      {/* Subtle radial gradient overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 70%)'
        }}
      />

      {/* Glass overlay for content */}
      <div className="absolute inset-0 bg-transparent dark:bg-black/20 backdrop-blur-[2px]" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <h1
          ref={headlineRef}
          className="text-[clamp(3.25rem,11vw,4.75rem)] sm:text-6xl md:text-8xl lg:text-9xl font-rammetto font-bold tracking-[0.01em] sm:tracking-tight mb-6"
        >
          <span ref={titleLineRef} className="block opacity-0">
            <span className="bg-gradient-to-b from-amber-700 via-amber-600 to-neutral-900 dark:from-yellow-300 dark:via-amber-400 dark:to-white bg-clip-text text-transparent">
              BASHCUTZ
            </span>
          </span>
          <span
            ref={worldWideRef}
            className="block text-4xl md:text-5xl lg:text-6xl font-light mt-2 tracking-widest opacity-0"
          >
            <span className="bg-gradient-to-b from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent">
              WorldWide
            </span>
          </span>
        </h1>

        <p
          ref={subheadlineRef}
          className="text-lg md:text-xl text-foreground/60 dark:text-white/60 font-light tracking-[0.3em] uppercase mb-12 opacity-0"
        >
          Precision <span className="text-gold">·</span> Style <span className="text-gold">·</span> Confidence
        </p>

        <button
          ref={ctaRef}
          onClick={onBookNow}
          className="glass-button-primary hero-cta-orange text-lg tracking-wide tap-feedback opacity-0"
        >
          Book Now
        </button>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <span className="text-xs tracking-widest uppercase text-foreground/60 dark:text-white/60">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-foreground/60 dark:from-white to-transparent" />
      </div>
    </section>
  );
}
