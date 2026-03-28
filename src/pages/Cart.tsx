import { motion, AnimatePresence, useSpring, useTransform, animate } from 'framer-motion';
import { Trash2, Minus, Plus, ArrowRight, Ticket, ShoppingBag, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const controls = animate(displayValue, value, {
      duration: 0.5,
      onUpdate: (latest) => setDisplayValue(Math.floor(latest))
    });
    return () => controls.stop();
  }, [value]);

  return <span>₹{displayValue}</span>;
}

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string, code: string, discount: number, type: 'percent' | 'fixed' } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponLoading(true);
    setCouponError(null);
    
    try {
      const db = getFirebaseDb();
      if (!db) throw new Error('Database not initialized');

      const q = query(collection(db, 'coupons'), where('code', '==', couponCode.toUpperCase()), where('active', '==', true));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setCouponError('Invalid or inactive coupon');
        setAppliedCoupon(null);
      } else {
        const couponDoc = querySnapshot.docs[0];
        const couponData = couponDoc.data();
        
        // Check min purchase
        if (couponData.minPurchase && total < couponData.minPurchase) {
          setCouponError(`Minimum purchase of ₹${couponData.minPurchase} required`);
          return;
        }

        // Check expiry
        if (couponData.expiryDate) {
          const expiry = new Date(couponData.expiryDate);
          const now = new Date();
          if (now > expiry) {
            setCouponError('This coupon has expired');
            return;
          }
        }

        // Check usage limit
        if (couponData.maxUses && (couponData.usageCount || 0) >= couponData.maxUses) {
          setCouponError('This coupon has reached its usage limit');
          return;
        }

        // Check per user limit
        if (couponData.perUserLimit && user) {
          const redemptionsQuery = query(
            collection(db, 'redemptions'), 
            where('couponId', '==', couponDoc.id), 
            where('userId', '==', user.uid)
          );
          const redemptionSnapshot = await getCountFromServer(redemptionsQuery);
          if (redemptionSnapshot.data().count >= couponData.perUserLimit) {
            setCouponError(`You have already used this coupon ${couponData.perUserLimit} time(s)`);
            return;
          }
        }

        setAppliedCoupon({
          id: couponDoc.id,
          code: couponData.code,
          discount: couponData.discount,
          type: couponData.type || 'percent'
        });
        setCouponCode('');
      }
    } catch (error) {
      console.error(error);
      setCouponError('Error validating coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percent') {
      return (total * appliedCoupon.discount) / 100;
    }
    return appliedCoupon.discount;
  };

  const discountAmount = calculateDiscount();
  const finalTotal = Math.max(0, total - discountAmount + 150);

  if (cart.length === 0) {
    return (
      <div className="pt-40 pb-32 px-6 flex flex-col items-center justify-center text-center space-y-8">
        <div className="w-24 h-24 glass-card rounded-full flex items-center justify-center text-luxury-gold/20">
          <ShoppingBag size={48} />
        </div>
        <h1 className="text-4xl font-serif">Your Collection is Empty</h1>
        <p className="text-luxury-cream/50 max-w-md">The boutique awaits your selection of the world's finest desserts.</p>
        <Link to="/" className="gold-button">Return to Boutique</Link>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-20">
        {/* Cart Items */}
        <div className="flex-grow space-y-12">
          <div className="flex justify-between items-end border-b border-white/5 pb-8">
            <h1 className="text-5xl font-serif">Your Collection</h1>
            <span className="text-sm text-luxury-cream/50 uppercase tracking-widest">{cart.length} Masterpieces</span>
          </div>

          <div className="space-y-8">
            <AnimatePresence mode="popLayout">
              {cart.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex gap-8 group"
                >
                  <div className="w-32 h-32 rounded-2xl overflow-hidden glass-card shrink-0 border border-white/5 group-hover:border-luxury-gold/30 transition-colors">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" />
                  </div>
                  <div className="flex-grow flex flex-col justify-between py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-serif text-luxury-cream group-hover:text-luxury-gold transition-colors duration-300">{item.name}</h3>
                        <p className="text-[10px] text-luxury-cream/40 uppercase tracking-[0.2em] mt-1">Signature Series • Handcrafted</p>
                      </div>
                      <motion.span 
                        key={item.quantity}
                        initial={{ scale: 1.2, color: '#D4AF37' }}
                        animate={{ scale: 1, color: '#F8F5F0' }}
                        className="text-xl font-serif"
                      >
                        <AnimatedNumber value={item.price * item.quantity} />
                      </motion.span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-6 glass-card px-4 py-2 rounded-full border border-white/5 hover:border-luxury-gold/20 transition-colors">
                        <motion.button 
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                          className="text-luxury-gold/60 hover:text-luxury-gold transition-colors"
                        >
                          <Minus size={14} />
                        </motion.button>
                        <AnimatePresence mode="wait">
                          <motion.span 
                            key={item.quantity}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            className="text-sm font-serif min-w-[2ch] text-center"
                          >
                            {item.quantity}
                          </motion.span>
                        </AnimatePresence>
                        <motion.button 
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                          className="text-luxury-gold/60 hover:text-luxury-gold transition-colors"
                        >
                          <Plus size={14} />
                        </motion.button>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.1, color: '#ef4444' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeFromCart(item.id)} 
                        className="text-luxury-cream/20 transition-colors"
                      >
                        <Trash2 size={18} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:w-[400px] shrink-0">
          <div className="glass-card p-10 rounded-3xl space-y-10 sticky top-32">
            <h2 className="text-2xl font-serif">Order Summary</h2>
            
            <div className="space-y-6">
              <div className="flex justify-between text-sm uppercase tracking-widest text-luxury-cream/50">
                <span>Subtotal</span>
                <span className="text-luxury-cream">
                  <AnimatedNumber value={total} />
                </span>
              </div>
              <div className="flex justify-between text-sm uppercase tracking-widest text-luxury-cream/50">
                <span>Luxury Packaging</span>
                <span className="text-emerald-500">Complimentary</span>
              </div>
              <div className="flex justify-between text-sm uppercase tracking-widest text-luxury-cream/50">
                <span>Shipping</span>
                <span className="text-luxury-cream">₹150</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-sm uppercase tracking-widest text-emerald-500">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-<AnimatedNumber value={discountAmount} /></span>
                </div>
              )}
              <div className="pt-6 border-t border-white/5 flex justify-between items-end">
                <span className="text-xs uppercase tracking-[0.3em] text-luxury-gold">Total Amount</span>
                <span className="text-4xl font-serif text-luxury-cream">
                  <AnimatedNumber value={finalTotal} />
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative group">
                <Ticket className="absolute left-5 top-1/2 -translate-y-1/2 text-luxury-gold/50 group-focus-within:text-luxury-gold transition-colors" size={18} />
                <input 
                  type="text" 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="LUXURY COUPON" 
                  className="w-full bg-white/5 border border-white/10 rounded-full py-5 pl-14 pr-28 text-[10px] uppercase tracking-[0.2em] focus:outline-none focus:border-luxury-gold/50 transition-all placeholder:text-luxury-cream/20" 
                />
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-luxury-gold/10 hover:bg-luxury-gold text-luxury-gold hover:text-luxury-black px-6 py-2 rounded-full text-[10px] uppercase tracking-widest transition-all disabled:opacity-30 border border-luxury-gold/20"
                >
                  {couponLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                </motion.button>
              </div>
              
              <AnimatePresence>
                {couponError && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-[10px] text-red-400 uppercase tracking-widest flex items-center gap-2 ml-4"
                  >
                    <XCircle size={12} /> {couponError}
                  </motion.p>
                )}
                
                {appliedCoupon && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-[10px] text-emerald-500 uppercase tracking-widest flex items-center gap-2 ml-4"
                  >
                    <CheckCircle2 size={12} /> Coupon Applied Successfully
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button 
                whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(212,175,55,0.3)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/payment', { state: { appliedCoupon, discountAmount, finalTotal } })}
                className="w-full gold-button py-6 flex items-center justify-center gap-4 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-4 font-bold tracking-[0.2em]">
                  Proceed to Checkout
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-500" />
                </span>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%]"
                  animate={{ x: ['-200%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
              </motion.button>
            </div>

            <div className="flex items-center justify-center gap-4 text-[10px] text-luxury-cream/30 uppercase tracking-widest">
              <span className="flex items-center gap-1"><div className="w-1 h-1 bg-luxury-gold rounded-full" /> Secure Payment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
