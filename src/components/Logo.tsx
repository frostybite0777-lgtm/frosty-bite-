import { motion } from 'framer-motion';

export default function Logo() {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="relative flex items-center justify-center"
    >
      {/* Outer Glow */}
      <div className="absolute -inset-2 rounded-full bg-luxury-gold/20 blur-xl opacity-50" />
      
      {/* Logo Image Container */}
      <div className="relative w-14 h-14 rounded-full border border-luxury-gold/30 flex items-center justify-center bg-luxury-black/40 backdrop-blur-sm overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.2)]">
        <img 
          src="https://pub-1407f82391df4ab1951418d04be76914.r2.dev/uploads/0a744038-e29b-4db8-a8bf-4067fb31bb55.png" 
          alt="Frosty Bite Logo" 
          className="w-full h-full object-contain p-1"
          referrerPolicy="no-referrer"
        />
      </div>
      
      {/* Subtle Inner Shadow for Depth */}
      <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] pointer-events-none" />
    </motion.div>
  );
}
