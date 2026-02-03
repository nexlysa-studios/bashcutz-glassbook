import { Menu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';

export function GlassNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Entrance animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        navRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, delay: 0.5, ease: 'power4.out' }
      );

      if (linksRef.current) {
        gsap.fromTo(
          linksRef.current.children,
          { y: -20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, delay: 0.8, ease: 'power3.out' }
        );
      }
    }, navRef);

    return () => ctx.revert();
  }, []);

  const isAdminPage = location.pathname === '/admin';

  const navLinks = [
    { href: '/#services', label: 'Services' },
    { href: '/#gallery', label: 'Gallery' },
    { href: '/#merch', label: 'Merch' },
  ];

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'py-3 bg-black/80 backdrop-blur-xl border-b border-white/5' 
          : 'py-5 bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link
          ref={logoRef}
          to="/"
          className="magnetic text-xl font-black tracking-tight tap-feedback group"
        >
          <span className="text-gold group-hover:text-gold-light transition-colors duration-300">BASH</span>
          <span className="group-hover:text-white/80 transition-colors duration-300">CUTZ</span>
        </Link>

        {/* Desktop Navigation */}
        <div ref={linksRef} className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="magnetic relative text-sm font-medium text-white/60 hover:text-gold transition-colors duration-300 group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300" />
            </a>
          ))}
          <Link
            to="/admin"
            className={`magnetic relative text-sm font-medium transition-colors duration-300 group ${
              isAdminPage ? 'text-gold' : 'text-white/60 hover:text-gold'
            }`}
          >
            Admin
            <span className={`absolute -bottom-1 left-0 h-0.5 bg-gold transition-all duration-300 ${
              isAdminPage ? 'w-full' : 'w-0 group-hover:w-full'
            }`} />
          </Link>
          <a
            href="/#services"
            className="magnetic px-6 py-2.5 bg-gradient-to-r from-gold to-yellow-500 text-black font-semibold text-sm rounded-full hover:shadow-lg hover:shadow-gold/25 transition-all duration-300 hover:scale-105"
          >
            Book Now
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden tap-feedback p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors duration-300"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/10 transition-all duration-500 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 py-8 flex flex-col gap-6">
          {navLinks.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-medium text-white/60 hover:text-gold transition-colors duration-300"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/admin"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-lg font-medium text-white/60 hover:text-gold transition-colors duration-300"
          >
            Admin
          </Link>
          <a
            href="/#services"
            onClick={() => setIsMobileMenuOpen(false)}
            className="mt-4 py-4 text-center bg-gradient-to-r from-gold to-yellow-500 text-black font-bold rounded-full"
          >
            Book Now
          </a>
        </div>
      </div>
    </nav>
  );
}
