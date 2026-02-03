import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ShoppingBag, ExternalLink } from 'lucide-react';
import { RevealOnScroll } from '../effects/RevealOnScroll';

gsap.registerPlugin(ScrollTrigger);

interface MerchItem {
  id: string;
  name: string;
  price: number;
  description: string;
  badge?: string;
  gradient: string;
}

const merchItems: MerchItem[] = [
  {
    id: 'cap',
    name: 'BASHCUTZ Snapback',
    price: 350,
    description: 'Premium black snapback with gold embroidered logo',
    badge: 'Best Seller',
    gradient: 'from-neutral-800 via-neutral-900 to-black',
  },
  {
    id: 'tee',
    name: 'Classic Logo Tee',
    price: 280,
    description: 'Heavyweight cotton tee with front & back print',
    gradient: 'from-gold/20 via-amber-900/30 to-black',
  },
  {
    id: 'hoodie',
    name: 'WorldWide Hoodie',
    price: 650,
    description: 'Premium fleece hoodie with gold detailing',
    badge: 'New',
    gradient: 'from-neutral-700 via-neutral-900 to-black',
  },
  {
    id: 'durag',
    name: 'Silk Durag',
    price: 180,
    description: 'Premium silk durag with BASHCUTZ branding',
    gradient: 'from-amber-900/30 via-neutral-900 to-black',
  },
];

export function MerchSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = cardsRef.current?.children;
      if (cards) {
        Array.from(cards).forEach((card, i) => {
          // Entrance animation
          gsap.fromTo(
            card,
            { 
              opacity: 0, 
              y: 80,
              rotateX: 10,
            },
            {
              opacity: 1,
              y: 0,
              rotateX: 0,
              duration: 0.8,
              delay: i * 0.12,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: cardsRef.current,
                start: 'top 80%',
              },
            }
          );

          // 3D card effect
          const cardEl = card as HTMLElement;
          cardEl.style.transformStyle = 'preserve-3d';
          
          cardEl.addEventListener('mousemove', (e: MouseEvent) => {
            const rect = cardEl.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            gsap.to(cardEl, {
              rotateX: rotateX,
              rotateY: rotateY,
              scale: 1.02,
              duration: 0.4,
              ease: 'power2.out',
            });

            // Move shine effect
            const shine = cardEl.querySelector('.card-shine') as HTMLElement;
            if (shine) {
              gsap.to(shine, {
                x: x - centerX,
                y: y - centerY,
                opacity: 0.2,
                duration: 0.3,
              });
            }
          });

          cardEl.addEventListener('mouseleave', () => {
            gsap.to(cardEl, {
              rotateX: 0,
              rotateY: 0,
              scale: 1,
              duration: 0.6,
              ease: 'power3.out',
            });

            const shine = cardEl.querySelector('.card-shine') as HTMLElement;
            if (shine) {
              gsap.to(shine, { opacity: 0, duration: 0.3 });
            }
          });
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleBuyNow = (item: MerchItem) => {
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
      className="relative py-32 md:py-40 px-6 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-950/50 to-black" />

      {/* Background accent */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, hsl(var(--gold)) 0%, transparent 60%)',
          filter: 'blur(100px)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        <RevealOnScroll animation="fade-up" className="text-center mb-20">
          <span className="text-gold text-sm font-semibold tracking-[0.3em] uppercase mb-6 block">
            Exclusive
          </span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            Official Merch
          </h2>
          <p className="text-white/50 text-lg max-w-md mx-auto">
            Rep the brand. Premium quality, limited drops.
          </p>
        </RevealOnScroll>

        <div
          ref={cardsRef}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          style={{ perspective: '1000px' }}
        >
          {merchItems.map((item) => (
            <div
              key={item.id}
              className="relative group"
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="glass-card p-6 flex flex-col relative overflow-hidden h-full">
                {/* Shine effect */}
                <div 
                  className="card-shine absolute w-32 h-32 rounded-full pointer-events-none opacity-0"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)',
                    filter: 'blur(15px)',
                  }}
                />

                {/* Badge */}
                {item.badge && (
                  <span className="absolute top-4 right-4 px-3 py-1 text-xs font-bold rounded-full bg-gold text-black z-10">
                    {item.badge}
                  </span>
                )}

                {/* Product Image Placeholder */}
                <div className={`aspect-square rounded-2xl bg-gradient-to-br ${item.gradient} mb-6 flex items-center justify-center relative overflow-hidden`}>
                  <ShoppingBag 
                    className={`w-14 h-14 transition-all duration-500 ${
                      hoveredId === item.id ? 'text-gold/60 scale-110' : 'text-gold/30'
                    }`}
                  />
                  
                  {/* Animated pattern */}
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FFD700' fill-opacity='0.15'%3E%3Cpath d='M20 20h20v20H20zM0 0h20v20H0z'/%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                  />
                  
                  {/* Glowing border */}
                  <div className="absolute inset-0 rounded-2xl border border-white/0 group-hover:border-gold/30 transition-colors duration-500" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold mb-2 group-hover:text-gold transition-colors duration-300">
                  {item.name}
                </h3>
                <p className="text-white/50 text-sm mb-4 flex-1">{item.description}</p>

                {/* Price & CTA */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                  <span className="text-2xl font-black text-gold">R{item.price}</span>
                  <button
                    onClick={() => handleBuyNow(item)}
                    className="flex items-center gap-2 text-sm font-medium text-white/60 hover:text-gold transition-all duration-300 tap-feedback group/btn"
                  >
                    <span>Buy Now</span>
                    <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact for bulk orders */}
        <RevealOnScroll animation="fade-up" delay={0.3} className="mt-16">
          <div className="glass-card p-10 text-center relative overflow-hidden">
            {/* Glowing accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
            
            <p className="text-white/60 mb-6 text-lg">
              Looking for bulk orders or custom merch?
            </p>
            <button
              onClick={() => {
                const message = encodeURIComponent(
                  `🛍️ *BASHCUTZ Custom/Bulk Order Inquiry*\n\nI'd like to discuss custom or bulk merch orders.`
                );
                window.open(`https://wa.me/27000000000?text=${message}`, '_blank');
              }}
              className="inline-flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-gold hover:text-black rounded-full font-semibold transition-all duration-300 group"
            >
              <span>Contact us on WhatsApp</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
            </button>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
