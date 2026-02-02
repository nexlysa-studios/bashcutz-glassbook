import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export function GlassNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAdminPage = location.pathname === '/admin';

  return (
    <nav
      className={`glass-navbar transition-all duration-500 ${
        isScrolled ? 'py-3' : 'py-5'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="text-lg font-bold tracking-tight tap-feedback"
        >
          <span className="text-gold">BASH</span>CUTZ
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="/#services"
            className="text-sm text-white/60 hover:text-gold transition-colors duration-300"
          >
            Services
          </a>
          <a
            href="/#gallery"
            className="text-sm text-white/60 hover:text-gold transition-colors duration-300"
          >
            Gallery
          </a>
          <a
            href="/#merch"
            className="text-sm text-white/60 hover:text-gold transition-colors duration-300"
          >
            Merch
          </a>
          <Link
            to="/admin"
            className={`text-sm transition-colors duration-300 ${
              isAdminPage ? 'text-gold' : 'text-white/60 hover:text-gold'
            }`}
          >
            Admin
          </Link>
          <a
            href="/#services"
            className="glass-button text-sm border-gold/30 hover:border-gold/50"
          >
            Book Now
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden tap-feedback p-2"
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
        className={`md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/10 transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 py-6 flex flex-col gap-4">
          <a
            href="/#services"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-white/60 hover:text-gold transition-colors duration-300"
          >
            Services
          </a>
          <a
            href="/#gallery"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-white/60 hover:text-gold transition-colors duration-300"
          >
            Gallery
          </a>
          <a
            href="/#merch"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-white/60 hover:text-gold transition-colors duration-300"
          >
            Merch
          </a>
          <Link
            to="/admin"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-white/60 hover:text-gold transition-colors duration-300"
          >
            Admin
          </Link>
          <a
            href="/#services"
            onClick={() => setIsMobileMenuOpen(false)}
            className="glass-button text-center mt-2 border-gold/30"
          >
            Book Now
          </a>
        </div>
      </div>
    </nav>
  );
}
