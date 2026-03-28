import { motion } from 'framer-motion';
import { Home, Cake, ShoppingCart, Package, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/collections', label: 'Collections', icon: Cake },
    { path: '/cart', label: 'Cart', icon: ShoppingCart },
    { path: '/orders', label: 'Orders', icon: Package },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#0F0F0F] border-t border-white/10 rounded-t-[2rem] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] px-4 pb-6 pt-4">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center gap-1 min-w-[64px]"
            >
              <motion.div
                animate={isActive ? { scale: 1.2, y: -4 } : { scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`p-2 rounded-xl transition-colors ${isActive ? 'text-luxury-gold' : 'text-luxury-cream/40'}`}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>
              <span className={`text-[9px] uppercase tracking-widest font-bold transition-colors ${isActive ? 'text-luxury-gold' : 'text-luxury-cream/40'}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-2 w-1 h-1 bg-luxury-gold rounded-full"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
