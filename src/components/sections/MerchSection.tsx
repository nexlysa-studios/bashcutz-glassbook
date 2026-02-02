import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ShoppingBag, ExternalLink } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface MerchItem {
  id: string;
  name: string;
  price: number;
  description: string;
  badge?: string;
}

const merchItems: MerchItem[] = [
  {
    id: 'cap',
    name: 'BASHCUTZ Snapback',
    price: 350,
    description: 'Premium black snapback with gold embroidered logo',
    badge: 'Best Seller',
  },
  {
    id: 'tee',
    name: 'Classic Logo Tee',
    price: 280,
    description: 'Heavyweight cotton tee with front & back print',
  },
  {
    id: 'hoodie',
    name: 'WorldWide Hoodie',
    price: 650,
    description: 'Premium fleece hoodie with gold detailing',
    badge: 'New',
  },
  {
    id: 'durag',
    name: 'Silk Durag',
    price: 180,
    description: 'Premium silk durag with BASHCUTZ branding',
  },
];

export function MerchSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

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

      const cards = cardsRef.current?.children;
      if (cards) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 60, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleBuyNow = (item: MerchItem) => {
    // Create WhatsApp message for merch inquiry
    const message = encodeURIComponent(
      `🛍️ *BASHCUTZ Merch Inquiry*\n\n` +
      `I'm interested in:\n` +
      `📦 ${item.name}\n` +
      `💰 R${item.price}\n\n` +
      `Please let me know about availability and sizing!`
    );
    window.open(`https://wa.me/27000000000?text=${message}`, '_blank');
  };

  return (
    <section
      ref={sectionRef}
      id="merch"
      className="relative py-24 md:py-32 px-6"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-950/50 to-black" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-gold text-sm font-medium tracking-widest uppercase mb-4 block">
            Exclusive
          </span>
          <h2
            ref={titleRef}
            className="text-3xl md:text-4xl font-bold tracking-tight opacity-0"
          >
            Official Merch
          </h2>
        </div>

        <div
          ref={cardsRef}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {merchItems.map((item) => (
            <div
              key={item.id}
              className="glass-card-hover p-6 flex flex-col group"
            >
              {/* Badge */}
              {item.badge && (
                <span className="self-start px-3 py-1 text-xs font-semibold rounded-full bg-gold text-black mb-4">
                  {item.badge}
                </span>
              )}

              {/* Product Image Placeholder */}
              <div className="aspect-square rounded-xl bg-gradient-to-br from-gold/10 to-black mb-6 flex items-center justify-center group-hover:from-gold/20 transition-all duration-300">
                <ShoppingBag className="w-12 h-12 text-gold/40 group-hover:text-gold/60 transition-colors duration-300" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
              <p className="text-white/50 text-sm mb-4 flex-1">{item.description}</p>

              {/* Price & CTA */}
              <div className="flex items-center justify-between mt-auto">
                <span className="text-xl font-bold text-gold">R{item.price}</span>
                <button
                  onClick={() => handleBuyNow(item)}
                  className="flex items-center gap-2 text-sm text-white/60 hover:text-gold transition-colors duration-300 tap-feedback"
                >
                  <span>Buy Now</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Contact for bulk orders */}
        <div className="mt-12 glass-card p-8 text-center">
          <p className="text-white/60 mb-4">
            Looking for bulk orders or custom merch?
          </p>
          <button
            onClick={() => {
              const message = encodeURIComponent(
                `🛍️ *BASHCUTZ Custom/Bulk Order Inquiry*\n\nI'd like to discuss custom or bulk merch orders.`
              );
              window.open(`https://wa.me/27000000000?text=${message}`, '_blank');
            }}
            className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors duration-300"
          >
            <span>Contact us on WhatsApp</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
