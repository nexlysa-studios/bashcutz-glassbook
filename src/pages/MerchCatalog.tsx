import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { GlassNavbar } from '@/components/layout/GlassNavbar';
import { merchItems } from '@/lib/merch';
import { useSEO } from '@/hooks/useSEO';

const MerchCatalog = () => {
  useSEO({
    title: 'Merch Collection | BASHCUTZ WorldWide',
    description: 'Browse the full BASHCUTZ merch collection, including featured pieces and additional t-shirt drops.',
    path: '/merch',
  });

  return (
    <div className="min-h-screen bg-white text-foreground dark:bg-black dark:text-white">
      <GlassNavbar />

      <main className="relative overflow-hidden px-2 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 md:pt-40">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-white dark:from-black dark:via-neutral-950/60 dark:to-black" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <Link
            to="/#merch"
            className="mb-8 inline-flex items-center gap-2 text-sm text-foreground/60 transition-colors hover:text-gold dark:text-white/60"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home Merch</span>
          </Link>

          <div className="mb-8 text-center sm:mb-14">
            <h1 className="text-[clamp(2.25rem,7vw,3.5rem)] font-rammetto uppercase tracking-[0.08em] text-foreground dark:text-white">
              Merch Collection
            </h1>
            <p className="mx-auto mt-5 hidden max-w-2xl text-sm leading-7 text-foreground/65 dark:text-white/60 sm:block md:hidden">
              Explore the full lineup of BASHCUTZ tees, including the two featured items from the homepage plus nine extra concept products using dummy catalogue data.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {merchItems.map((item) => (
              <Link
                key={item.id}
                to={`/merch/${item.id}`}
                className="group flex flex-col overflow-hidden border border-neutral-100 bg-white transition-transform duration-300 hover:-translate-y-1 dark:border-border dark:bg-card/70 sm:rounded-2xl sm:border-border/70 sm:bg-card sm:shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:sm:shadow-none"
              >
                <div className="relative aspect-[1/1.32] overflow-hidden bg-neutral-50 dark:bg-muted/20 sm:aspect-square sm:bg-muted/30">
                  <img
                    src={item.src}
                    alt={item.name}
                    className="block h-full w-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:opacity-0 sm:object-contain"
                    style={item.imagePosition ? { objectPosition: item.imagePosition } : undefined}
                  />
                  {item.backSrc ? (
                    <img
                      src={item.backSrc}
                      alt={`${item.name} back`}
                      className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100 sm:object-contain"
                      aria-hidden="true"
                    />
                  ) : null}
                  {item.badge ? (
                    <span className="absolute right-2 top-2 rounded-full bg-orange-500 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white sm:left-3 sm:right-auto sm:top-3 sm:px-3 sm:text-xs sm:tracking-[0.2em]">
                      {item.badge}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col bg-white px-1 py-2 text-center dark:bg-card/95 sm:bg-card sm:px-4 sm:py-4 sm:text-left">
                  <h2 className="mb-1 min-h-[2.45rem] text-[0.58rem] font-bold uppercase leading-[1.25] tracking-[0.04em] text-foreground sm:mb-2 sm:min-h-0 sm:text-lg sm:font-semibold sm:normal-case sm:leading-snug sm:tracking-normal">{item.name}</h2>
                  <p className="hidden text-xs text-foreground/60 dark:text-white/60 sm:mb-4 sm:block sm:text-sm">
                    {item.description}
                  </p>

                  <div className="mt-auto flex items-center justify-center gap-3 sm:justify-between">
                    <span className="text-[0.62rem] font-bold text-foreground sm:text-xl sm:font-bold sm:text-gold">R{item.price}</span>
                    <span className="hidden text-sm text-foreground/60 transition-colors duration-300 group-hover:text-gold dark:text-white/60 sm:inline">
                      View Details
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 px-6 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <h3 className="mb-3 text-6xl font-bold leading-none text-foreground dark:text-white md:text-8xl lg:text-[9rem]">
            <span className="text-orange-500">BASHCUTZ</span> WorldWide
          </h3>
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-foreground/70 dark:text-white/60 md:text-base">
            Now Thats a Bash Cut
          </p>
          <p className="mb-6 text-sm text-foreground/60 dark:text-white/40">
            Precision <span className="text-gold">·</span> Style <span className="text-gold">·</span> Confidence
          </p>
          <div className="mb-6 flex justify-center gap-6">
            <a href="/#services" className="text-sm text-foreground/60 transition-colors hover:text-gold dark:text-white/40">Services</a>
            <a href="/#gallery" className="text-sm text-foreground/60 transition-colors hover:text-gold dark:text-white/40">Gallery</a>
            <a href="/#merch" className="text-sm text-foreground/60 transition-colors hover:text-gold dark:text-white/40">Merch</a>
          </div>
          <div className="mb-6 flex justify-center gap-4">
            <a
              href="https://instagram.com/bash.cutz"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-foreground/20 px-4 py-2 text-sm text-foreground/70 transition-colors hover:border-gold/60 hover:text-gold dark:border-white/20 dark:text-white/60"
            >
              Instagram
            </a>
            <a
              href="https://tiktok.com/@bashcutz"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-foreground/20 px-4 py-2 text-sm text-foreground/70 transition-colors hover:border-gold/60 hover:text-gold dark:border-white/20 dark:text-white/60"
            >
              TikTok
            </a>
          </div>
          <p className="text-xs text-foreground/50 dark:text-white/30">
            © {new Date().getFullYear()} BASHCUTZ WorldWide. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MerchCatalog;
