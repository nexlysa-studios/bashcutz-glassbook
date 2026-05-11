import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function GlassNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleScroll = () => setIsScrolled(window.scrollY > 20);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed inset-x-4 top-4 z-50 transition-all duration-500 ${isScrolled ? 'py-2' : 'py-3'}`}>
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="relative rounded-2xl backdrop-blur-md bg-white/40 dark:bg-white/8 border border-white/30 dark:border-white/10 shadow-xl dark:shadow-2xl px-4 md:px-6 py-3 md:py-4 flex items-center transition-colors duration-300">
          <Link
            to="/"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 md:gap-4 tap-feedback"
          >
            <img
              src="/Bashcutz-logo-removebg-preview.png"
              alt="BASHCUTZ logo"
              className="h-10 md:h-14 lg:h-16 scale-150 origin-center"
            />
            <span className="sr-only">BASHCUTZ</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 flex-1">
            <a href="/#services" className="text-base font-semibold text-foreground/70 dark:text-white/70 hover:text-amber-600 dark:hover:text-yellow-400 transition-colors duration-300">
              Services
            </a>
            <a href="/#gallery" className="text-base font-semibold text-foreground/70 dark:text-white/70 hover:text-amber-600 dark:hover:text-yellow-400 transition-colors duration-300">
              Gallery
            </a>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="text-base font-semibold text-foreground/70 dark:text-white/70 hover:text-amber-600 dark:hover:text-yellow-400 transition-colors duration-300">
                Merch
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link to="/merch" className="cursor-pointer">
                    Shop Now
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <a href="/#services" className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 dark:from-yellow-500 dark:to-yellow-600 text-white dark:text-black font-semibold text-base hover:shadow-lg transition-all duration-300 hover:scale-105 ml-auto">
              Book Now
            </a>
          </div>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden tap-feedback p-2.5 hover:bg-white/10 dark:hover:bg-white/5 rounded-lg transition-colors duration-200 text-foreground dark:text-white">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div className={`md:hidden absolute top-full left-4 right-4 mt-3 rounded-2xl backdrop-blur-md bg-white/50 dark:bg-white/8 border border-white/30 dark:border-white/10 shadow-xl dark:shadow-2xl transition-all duration-300 overflow-hidden ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        <div className="px-6 py-5 flex flex-col gap-3">
          <a href="/#services" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-foreground/70 dark:text-white/70 hover:text-amber-600 dark:hover:text-yellow-400 transition-colors duration-300">
            Services
          </a>
          <a href="/#gallery" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-foreground/70 dark:text-white/70 hover:text-amber-600 dark:hover:text-yellow-400 transition-colors duration-300">
            Gallery
          </a>
          <div className="flex flex-col gap-2">
            <a href="/#merch" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-foreground/70 dark:text-white/70 hover:text-amber-600 dark:hover:text-yellow-400 transition-colors duration-300">
              Merch
            </a>
            <Link to="/merch" onClick={() => { setIsMobileMenuOpen(false); window.scrollTo(0, 0); }} className="text-sm font-medium text-foreground/60 dark:text-white/60 hover:text-amber-600 dark:hover:text-yellow-400 transition-colors duration-300 pl-4 border-l border-amber-500/30">
              Shop Now
            </Link>
          </div>

          <a href="/#services" onClick={() => setIsMobileMenuOpen(false)} className="px-5 py-3.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 dark:from-yellow-500 dark:to-yellow-600 text-white dark:text-black font-semibold text-base text-center hover:shadow-lg transition-all duration-300 mt-2">
            Book Now
          </a>
        </div>
      </div>
    </nav>
  );
}
