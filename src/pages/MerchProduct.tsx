import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { GlassNavbar } from '@/components/layout/GlassNavbar';
import { getMerchItemById } from '@/lib/merch';
import { useSEO } from '@/hooks/useSEO';
import { MerchCheckoutModal } from '@/components/merch/MerchCheckoutModal';
import NotFound from './NotFound';

const MerchProduct = () => {
  const { productId } = useParams<{ productId: string }>();
  const item = productId ? getMerchItemById(productId) : undefined;
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('XL');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

  const gallery = useMemo(() => item?.thumbnails ?? [], [item]);
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setSelectedImage(0);
  }, [productId]);

  const goToPreviousImage = () => {
    setSelectedImage((current) => (current - 1 + gallery.length) % gallery.length);
  };

  const goToNextImage = () => {
    setSelectedImage((current) => (current + 1) % gallery.length);
  };

  useSEO({
    title: item ? `${item.name} | BASHCUTZ Merch` : 'BASHCUTZ Merch',
    description: item?.longDescription || 'Official BASHCUTZ merch product details.',
    path: item ? `/merch/${item.id}` : '/merch',
    image: item?.src,
    structuredData: item
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: item.name,
          description: item.longDescription,
          image: gallery.map((image) => new URL(image, siteUrl).toString()),
          brand: {
            '@type': 'Brand',
            name: 'BASHCUTZ WorldWide',
          },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'ZAR',
            price: item.price,
            availability: 'https://schema.org/InStock',
            url: new URL(`/merch/${item.id}`, siteUrl).toString(),
          },
        }
      : undefined,
  });

  if (!item) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-white text-foreground dark:bg-black dark:text-white">
      <GlassNavbar />

      <main className="px-1 pb-14 pt-24 sm:px-6 sm:pb-20 sm:pt-32 md:pt-40">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/merch"
            className="mb-4 ml-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-foreground/60 transition-colors hover:text-gold dark:text-white/60 sm:mb-8 sm:ml-0 sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Merch</span>
          </Link>

          <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div className="relative min-w-0 bg-white dark:bg-black">
              <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden bg-white sm:min-h-[520px] dark:bg-black">
                <img
                  src={gallery[selectedImage] || item.src}
                  alt={item.name}
                  className="block aspect-square w-full max-w-[520px] object-contain"
                  style={item.imagePosition ? { objectPosition: item.imagePosition } : undefined}
                />
                {gallery.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={goToPreviousImage}
                      className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-foreground/80 transition-colors hover:text-gold sm:left-4"
                      aria-label="Previous product image"
                    >
                      <ChevronLeft className="h-7 w-7" />
                    </button>
                    <button
                      type="button"
                      onClick={goToNextImage}
                      className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-foreground/80 transition-colors hover:text-gold sm:right-4"
                      aria-label="Next product image"
                    >
                      <ChevronRight className="h-7 w-7" />
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            <div className="self-start px-3 font-mono text-black dark:text-white sm:px-0 lg:sticky lg:top-28">
              <div className="mb-12 sm:mb-10">
                <h1 className="mb-2 text-sm uppercase leading-6 tracking-[0.06em] sm:text-base">{item.name}</h1>
                <p className="text-sm tracking-[0.04em]">R{item.price}.00</p>
              </div>

              <div className="mb-6">
                <p className="mb-3 text-xs uppercase tracking-[0.14em]">Size</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => {
                    const isSelected = selectedSize === size;

                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`relative flex h-10 min-w-10 items-center justify-center border px-3 text-xs uppercase transition-colors ${
                          isSelected
                            ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                            : 'border-black/40 bg-white text-black hover:border-black dark:border-white/60 dark:bg-black dark:text-white dark:hover:border-white'
                        }`}
                      >
                        <span>{size}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCheckoutOpen(true)}
                className="mb-6 inline-flex h-11 min-w-[150px] items-center justify-center border border-black bg-white px-5 text-xs uppercase tracking-[0.16em] text-black transition-colors hover:bg-black hover:text-white dark:border-white dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black"
              >
                Order
              </button>

              <ul className="mb-10 list-disc space-y-1 pl-4 text-xs leading-5 tracking-[0.02em] sm:text-sm">
                {item.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <details className="border-t border-black/20 py-4 text-xs dark:border-white/20">
                <summary className="cursor-pointer uppercase tracking-[0.08em]">
                  South Africa (ZAR R)
                </summary>
                <p className="mt-3 leading-5 text-black/65 dark:text-white/65">
                  Final availability, sizing, and delivery details are confirmed on WhatsApp.
                </p>
              </details>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 px-4 py-10 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-4xl text-center">
          <h3 className="mb-3 text-4xl font-bold leading-none text-foreground dark:text-white sm:text-5xl md:text-7xl lg:text-[9rem]">
            <span className="text-orange-500">BASHCUTZ</span> WorldWide
          </h3>
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-foreground/70 dark:text-white/60 sm:text-sm md:text-base">
            Now Thats a Bash Cut
          </p>
          <p className="mb-6 text-sm text-foreground/60 dark:text-white/40">
            Precision <span className="text-gold">·</span> Style <span className="text-gold">·</span> Confidence
          </p>
          <div className="mb-6 flex flex-wrap justify-center gap-x-6 gap-y-3">
            <a href="/#services" className="text-sm text-foreground/60 transition-colors hover:text-gold dark:text-white/40">Services</a>
            <a href="/#gallery" className="text-sm text-foreground/60 transition-colors hover:text-gold dark:text-white/40">Gallery</a>
            <a href="/#merch" className="text-sm text-foreground/60 transition-colors hover:text-gold dark:text-white/40">Merch</a>
          </div>
          <div className="mb-6 flex flex-wrap justify-center gap-3 sm:gap-4">
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

      <MerchCheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        item={item}
        size={selectedSize}
      />
    </div>
  );
};

export default MerchProduct;
