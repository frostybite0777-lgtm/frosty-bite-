import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, User, Menu, X, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Logo from './Logo';
import BottomNav from './BottomNav';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cart } = useCart();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleWhatsApp = () => {
    const message = encodeURIComponent("Hello Frosty Bite! I'd like to inquire about your luxury desserts.");
    window.open(`https://wa.me/917735800239?text=${message}`, '_blank');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Boutique';
    if (path === '/collections') return 'Collections';
    if (path === '/chef') return 'The Chef';
    if (path === '/orders') return 'My Orders';
    if (path === '/profile') return 'My Profile';
    if (path === '/cart') return 'My Cart';
    if (path.startsWith('/dessert/')) return 'Dessert Details';
    return '';
  };

  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-luxury-black">
      {/* Navbar - Hidden on mobile, visible on desktop */}
      {!isAdminPage && (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 hidden md:block ${isScrolled ? 'bg-luxury-black/80 backdrop-blur-md py-4 border-b border-white/5' : 'bg-transparent py-8'}`}>
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-3 items-center">
            {/* Left: Logo & Brand Name */}
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-6 group">
                <Logo />
                <span className="hidden sm:block text-xl font-serif text-luxury-gold tracking-[0.3em] uppercase gold-text-glow transition-all group-hover:tracking-[0.4em] ml-2">
                  Frosty Bite
                </span>
              </Link>
            </div>

            {/* Center: Page Title */}
            <div className="flex justify-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={location.pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-[10px] uppercase tracking-[0.5em] text-luxury-cream/40 font-medium"
                >
                  {getPageTitle()}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Right: Icons */}
            <div className="flex items-center justify-end gap-6">
              <div className="hidden lg:flex items-center gap-8 text-[10px] uppercase tracking-[0.2em] font-medium mr-8">
                <Link to="/collections" className="text-luxury-cream/70 hover:text-luxury-gold transition-colors">Collections</Link>
              </div>

              <Link to="/profile" className="text-luxury-cream/70 hover:text-luxury-gold transition-colors relative">
                <User size={20} />
              </Link>
              <Link to="/cart" className="text-luxury-cream/70 hover:text-luxury-gold transition-colors relative">
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-luxury-gold text-luxury-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </Link>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-luxury-cream/70 hover:text-luxury-gold transition-colors">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Mobile Top Header */}
      {!isAdminPage && (
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-luxury-black/80 backdrop-blur-md py-4 px-6 border-b border-white/5 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <Logo />
            <span className="text-sm font-serif text-luxury-gold tracking-widest uppercase">Frosty Bite</span>
          </Link>
          <button onClick={handleWhatsApp} className="text-luxury-gold">
            <MessageCircle size={20} />
          </button>
        </div>
      )}

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[60] bg-luxury-black pt-32 px-8 flex flex-col gap-8 text-2xl font-serif"
          >
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-luxury-gold">Boutique</Link>
            <Link to="/collections" onClick={() => setIsMenuOpen(false)}>Collections</Link>
            <Link to="/chef" onClick={() => setIsMenuOpen(false)}>Our Story</Link>
            <Link to="/orders" onClick={() => setIsMenuOpen(false)}>My Orders</Link>
            <Link to="/profile" onClick={() => setIsMenuOpen(false)}>My Profile</Link>
          </motion.div>
        )}
      </AnimatePresence>

      <main className={`flex-grow ${isAdminPage ? 'pb-0 pt-0' : 'pb-24 md:pb-0 pt-16 md:pt-0'}`}>
        {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      {!isAdminPage && <BottomNav />}

      {/* Footer - Hidden on mobile to keep it clean, visible on desktop */}
      {!isAdminPage && (
        <footer className="bg-luxury-black border-t border-white/5 py-20 px-6 hidden md:block">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="space-y-6">
              <h3 className="text-2xl font-serif text-luxury-gold uppercase tracking-widest">Frosty Bite</h3>
              <p className="text-luxury-cream/50 text-sm leading-relaxed">
                Crafting the world's most exquisite desserts using rare ingredients and artisanal techniques.
              </p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest text-luxury-gold mb-6">Boutique</h4>
              <ul className="space-y-4 text-sm text-luxury-cream/50">
                <li><Link to="/" className="hover:text-luxury-gold transition-colors">All Desserts</Link></li>
                <li><Link to="/" className="hover:text-luxury-gold transition-colors">Signature Cakes</Link></li>
                <li><Link to="/" className="hover:text-luxury-gold transition-colors">Gift Boxes</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest text-luxury-gold mb-6">Experience</h4>
              <ul className="space-y-4 text-sm text-luxury-cream/50">
                <li><Link to="/chef" className="hover:text-luxury-gold transition-colors">Our Story</Link></li>
                <li><Link to="/profile" className="hover:text-luxury-gold transition-colors">VIP Club</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest text-luxury-gold mb-6">Contact</h4>
              <ul className="space-y-4 text-sm text-luxury-cream/50">
                <li>123 Luxury Lane, Cuttack</li>
                <li>concierge@frostybite.com</li>
                <li>+91 77358 00239</li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] uppercase tracking-widest text-luxury-cream/30">
            <p>© 2026 Frosty Bite. All Rights Reserved.</p>
            <div className="flex gap-8">
              <Link to="/" className="hover:text-luxury-gold transition-colors">Privacy Policy</Link>
              <Link to="/" className="hover:text-luxury-gold transition-colors">Terms of Service</Link>
            </div>
          </div>
        </footer>
      )}

      {/* WhatsApp Button */}
      {!isAdminPage && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleWhatsApp}
          className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-luxury-gold text-luxury-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)]"
        >
          <MessageCircle size={24} />
        </motion.button>
      )}
    </div>
  );
}
