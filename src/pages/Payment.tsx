import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, MapPin, Truck, CheckCircle2, Loader2, Navigation, Search, Smartphone, ShieldCheck, ArrowLeft, Banknote, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';
import confetti from 'canvas-confetti';

export default function Payment() {
  const { cart, total, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { finalTotal, appliedCoupon } = location.state || { finalTotal: total + 150, appliedCoupon: null };
  
  const [step, setStep] = useState<'address' | 'method' | 'processing' | 'success'>('address');
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [fullName, setFullName] = useState(profile?.fullName || user?.displayName || '');
  const [email, setEmail] = useState(profile?.email || user?.email || '');
  const [phone, setPhone] = useState(profile?.phoneNumber || '');
  const [address, setAddress] = useState(profile?.defaultAddress || '');
  const [city, setCity] = useState(profile?.city || '');
  const [state, setState] = useState(profile?.state || '');
  const [pincode, setPincode] = useState(profile?.pincode || '');
  const [landmark, setLandmark] = useState(profile?.landmark || '');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [saveAddress, setSaveAddress] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Success Confetti Effect
  useEffect(() => {
    if (step === 'success') {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999, colors: ['#D4AF37', '#F8F5F0', '#F7D6E0'] };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // Origin y should be around 0.5 to 0.7 for side cannons to look good
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0.4, 0.6) } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0.4, 0.6) } });
      }, 250);

      // Initial big burst with a tiny delay to ensure screen transition
      setTimeout(() => {
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.6 },
          zIndex: 9999,
          colors: ['#D4AF37', '#F8F5F0', '#F7D6E0']
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [step]);

  // Load saved data when profile changes
  useEffect(() => {
    if (profile) {
      if (!fullName) setFullName(profile.fullName || user?.displayName || '');
      if (!email) setEmail(profile.email || user?.email || '');
      if (!phone) setPhone(profile.phoneNumber || '');
      if (!address) setAddress(profile.defaultAddress || '');
      if (!city) setCity(profile.city || '');
      if (!state) setState(profile.state || '');
      if (!pincode) setPincode(profile.pincode || '');
      if (!landmark) setLandmark(profile.landmark || '');
    }
  }, [profile, user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }
    
    if (!address.trim()) newErrors.address = 'Delivery address is required';
    if (!city.trim()) newErrors.city = 'City is required';
    if (!state.trim()) newErrors.state = 'State is required';
    
    if (!pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d+$/.test(pincode)) {
      newErrors.pincode = 'Pincode must be numeric';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      setStep('method');
    }
  };

  const methods = [
    { id: 'upi', name: 'UPI / Google Pay', icon: <Smartphone size={24} /> },
    { id: 'card', name: 'Credit / Debit Card', icon: <CreditCard size={24} /> },
    { id: 'cod', name: 'Cash on Delivery', icon: <Banknote size={24} /> },
    { id: 'razorpay', name: 'Razorpay', icon: <ShieldCheck size={24} /> },
    { id: 'stripe', name: 'Stripe', icon: <ShieldCheck size={24} /> }
  ];

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    
    // Mock suggestions for demo
    if (value.length > 3) {
      setSuggestions([
        `${value} Luxury Ave, Beverly Hills, CA`,
        `${value} Gourmet St, New York, NY`,
        `${value} Dessert Blvd, Cuttack, India`
      ]);
    } else {
      setSuggestions([]);
    }
  };

  const handleUseLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setAddress(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)} (Current Location)`);
        setIsLocating(false);
      }, (error) => {
        console.error(error);
        setIsLocating(false);
      });
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) return;
    setStep('processing');
    const db = getFirebaseDb();
    if (!db || !user) {
      // Fallback for demo if no DB
      setTimeout(() => {
        setStep('success');
        clearCart();
      }, 2000);
      return;
    }

    try {
      // Create order in Firestore
      const orderData = {
        userId: user.uid,
        customerName: fullName,
        customerEmail: email,
        customerPhone: phone,
        deliveryDetails: {
          address,
          city,
          state,
          pincode,
          landmark,
          specialInstructions
        },
        items: cart,
        total: finalTotal,
        address: `${address}, ${city}, ${state} - ${pincode}${landmark ? ` (Landmark: ${landmark})` : ''}`,
        paymentMethod: selectedMethod,
        status: 'Order Received',
        statusMessage: 'We have received your order and it will be processed shortly.',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      const newOrderId = docRef.id;
      setOrderId(newOrderId);

      // Save address if requested
      if (saveAddress) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            fullName,
            phoneNumber: phone,
            defaultAddress: address,
            city,
            state,
            pincode,
            landmark,
            updatedAt: serverTimestamp()
          });
        } catch (saveErr) {
          console.error("Error saving address to profile:", saveErr);
        }
      }

      // Increment coupon usage if applied
      if (appliedCoupon?.id) {
        try {
          await updateDoc(doc(db, 'coupons', appliedCoupon.id), {
            usageCount: increment(1)
          });
          
          // Record redemption for per-user limit tracking
          await addDoc(collection(db, 'redemptions'), {
            couponId: appliedCoupon.id,
            userId: user.uid,
            orderId: newOrderId,
            createdAt: serverTimestamp()
          });
        } catch (couponErr) {
          console.error("Error updating coupon usage:", couponErr);
        }
      }
      
      // Send WhatsApp Notification
      const orderItems = cart.map(item => `${item.name} (x${item.quantity})`).join(', ');
      const whatsappMessage = encodeURIComponent(
        `✨ *New Order Confirmed!* ✨\n\n` +
        `🆔 *Order ID:* #${newOrderId.toUpperCase()}\n` +
        `👤 *Customer:* ${fullName}\n` +
        `📞 *Phone:* ${phone}\n` +
        `🍰 *Items:* ${orderItems}\n` +
        `💰 *Total:* ₹${finalTotal}\n` +
        `📍 *Address:* ${address}, ${city}, ${state} - ${pincode}\n\n` +
        `Please process my order. Thank you! 🙏`
      );
      
      // Open WhatsApp in a new tab
      window.open(`https://wa.me/917735800239?text=${whatsappMessage}`, '_blank');
      
      setStep('success');
      clearCart();
    } catch (error) {
      console.error("Error placing order:", error);
      setStep('method');
    }
  };

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-[60] bg-luxury-black flex flex-col items-center justify-center text-center p-6 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0], 
                scale: [0, 1, 0],
                x: [Math.random() * 1000 - 500, Math.random() * 1000 - 500],
                y: [Math.random() * 1000 - 500, Math.random() * 1000 - 500]
              }}
              transition={{ 
                duration: Math.random() * 3 + 2, 
                repeat: Infinity,
                delay: Math.random() * 2 
              }}
              className="absolute w-1 h-1 bg-luxury-gold rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 100 }}
          className="relative mb-12"
        >
          <div className="w-40 h-40 bg-luxury-gold rounded-full flex items-center justify-center text-luxury-black shadow-[0_0_80px_rgba(212,175,55,0.6)] relative z-10">
            <CheckCircle2 size={80} />
          </div>
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-luxury-gold rounded-full -z-0"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute -top-4 -right-4 text-luxury-gold"
          >
            <Sparkles size={32} className="animate-pulse" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6 relative z-10"
        >
          <h1 className="text-6xl font-serif tracking-tight">
            Order <motion.span 
              animate={{ color: ['#FFFFFF', '#D4AF37', '#FFFFFF'] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-luxury-gold"
            >Confirmed</motion.span>
          </h1>
          <div className="w-24 h-1 bg-luxury-gold mx-auto rounded-full" />
          <p className="text-luxury-cream/60 text-xl mb-12 max-w-md mx-auto font-light leading-relaxed">
            Your exquisite selection has been secured. Our master pâtissiers are now beginning the delicate process of crafting your masterpieces.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-6 mt-12 relative z-10"
        >
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(212,175,55,0.3)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile')} 
            className="gold-button px-12 py-5"
          >
            Track Masterpiece
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')} 
            className="border border-white/10 rounded-full px-12 py-5 text-xs uppercase tracking-[0.3em] transition-all"
          >
            Back to Boutique
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-12 text-[10px] uppercase tracking-[0.5em] text-luxury-gold/30"
        >
          Boutique Order Ref: #{orderId?.toUpperCase() || '...'}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 px-6 max-w-3xl mx-auto">
      <div className="space-y-12">
        <div className="flex items-center gap-6">
          <button onClick={() => step === 'address' ? navigate('/cart') : setStep('address')} className="text-luxury-gold hover:scale-110 transition-transform">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-5xl font-serif">Checkout</h1>
        </div>

        <AnimatePresence mode="wait">
          {step === 'address' && (
            <motion.div 
              key="address"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-6 md:p-10 rounded-3xl space-y-10"
            >
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs uppercase tracking-[0.3em] text-luxury-gold">Delivery Details</h2>
                  <div className="w-12 h-[1px] bg-luxury-gold/30" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 ml-4 block">Full Name</label>
                    <input 
                      type="text"
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); if(errors.fullName) setErrors({...errors, fullName: ''}); }}
                      placeholder="John Doe"
                      className={`w-full bg-white/5 border ${errors.fullName ? 'border-red-500/50' : 'border-white/10'} rounded-full py-4 px-6 text-sm focus:outline-none focus:border-luxury-gold/50 transition-all`}
                    />
                    {errors.fullName && <p className="text-[10px] text-red-500 ml-4">{errors.fullName}</p>}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 ml-4 block">Phone Number</label>
                    <input 
                      type="tel"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); if(errors.phone) setErrors({...errors, phone: ''}); }}
                      placeholder="9876543210"
                      className={`w-full bg-white/5 border ${errors.phone ? 'border-red-500/50' : 'border-white/10'} rounded-full py-4 px-6 text-sm focus:outline-none focus:border-luxury-gold/50 transition-all`}
                    />
                    {errors.phone && <p className="text-[10px] text-red-500 ml-4">{errors.phone}</p>}
                  </div>

                  {/* Email Address */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 ml-4 block">Email Address</label>
                    <input 
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if(errors.email) setErrors({...errors, email: ''}); }}
                      placeholder="john@example.com"
                      className={`w-full bg-white/5 border ${errors.email ? 'border-red-500/50' : 'border-white/10'} rounded-full py-4 px-6 text-sm focus:outline-none focus:border-luxury-gold/50 transition-all`}
                    />
                    {errors.email && <p className="text-[10px] text-red-500 ml-4">{errors.email}</p>}
                  </div>

                  {/* Delivery Address */}
                  <div className="space-y-2 md:col-span-2 relative">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 ml-4 block">Delivery Address</label>
                    <div className="relative">
                      <input 
                        type="text"
                        value={address}
                        onChange={(e) => { handleAddressChange(e); if(errors.address) setErrors({...errors, address: ''}); }}
                        placeholder="Street, Building, Apartment"
                        className={`w-full bg-white/5 border ${errors.address ? 'border-red-500/50' : 'border-white/10'} rounded-full py-4 pl-6 pr-24 text-sm focus:outline-none focus:border-luxury-gold/50 transition-all`}
                      />
                      <button 
                        onClick={handleUseLocation}
                        disabled={isLocating}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-luxury-gold hover:text-luxury-cream transition-colors flex items-center gap-2 text-[10px] uppercase tracking-widest"
                      >
                        {isLocating ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                        Locate
                      </button>
                    </div>
                    {errors.address && <p className="text-[10px] text-red-500 ml-4">{errors.address}</p>}
                    
                    <AnimatePresence>
                      {suggestions.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 w-full mt-2 glass-card rounded-2xl overflow-hidden border-white/10"
                        >
                          {suggestions.map((s, i) => (
                            <button 
                              key={i}
                              onClick={() => { setAddress(s); setSuggestions([]); }}
                              className="w-full text-left px-8 py-4 text-sm hover:bg-luxury-gold hover:text-luxury-black transition-all border-b border-white/5 last:border-0"
                            >
                              {s}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* City */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 ml-4 block">City</label>
                    <input 
                      type="text"
                      value={city}
                      onChange={(e) => { setCity(e.target.value); if(errors.city) setErrors({...errors, city: ''}); }}
                      placeholder="Mumbai"
                      className={`w-full bg-white/5 border ${errors.city ? 'border-red-500/50' : 'border-white/10'} rounded-full py-4 px-6 text-sm focus:outline-none focus:border-luxury-gold/50 transition-all`}
                    />
                    {errors.city && <p className="text-[10px] text-red-500 ml-4">{errors.city}</p>}
                  </div>

                  {/* State */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 ml-4 block">State</label>
                    <input 
                      type="text"
                      value={state}
                      onChange={(e) => { setState(e.target.value); if(errors.state) setErrors({...errors, state: ''}); }}
                      placeholder="Maharashtra"
                      className={`w-full bg-white/5 border ${errors.state ? 'border-red-500/50' : 'border-white/10'} rounded-full py-4 px-6 text-sm focus:outline-none focus:border-luxury-gold/50 transition-all`}
                    />
                    {errors.state && <p className="text-[10px] text-red-500 ml-4">{errors.state}</p>}
                  </div>

                  {/* Pincode */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 ml-4 block">Pincode</label>
                    <input 
                      type="text"
                      value={pincode}
                      onChange={(e) => { setPincode(e.target.value); if(errors.pincode) setErrors({...errors, pincode: ''}); }}
                      placeholder="400001"
                      className={`w-full bg-white/5 border ${errors.pincode ? 'border-red-500/50' : 'border-white/10'} rounded-full py-4 px-6 text-sm focus:outline-none focus:border-luxury-gold/50 transition-all`}
                    />
                    {errors.pincode && <p className="text-[10px] text-red-500 ml-4">{errors.pincode}</p>}
                  </div>

                  {/* Landmark */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 ml-4 block">Landmark (Optional)</label>
                    <input 
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Near Luxury Mall"
                      className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-6 text-sm focus:outline-none focus:border-luxury-gold/50 transition-all"
                    />
                  </div>

                  {/* Special Instructions */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 ml-4 block">Special Instructions (Optional)</label>
                    <textarea 
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="Any specific delivery instructions..."
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 px-6 text-sm focus:outline-none focus:border-luxury-gold/50 transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Save Address Checkbox */}
                <div className="flex items-center gap-3 ml-4">
                  <button 
                    onClick={() => setSaveAddress(!saveAddress)}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${saveAddress ? 'bg-luxury-gold border-luxury-gold' : 'border-white/20'}`}
                  >
                    {saveAddress && <CheckCircle2 size={12} className="text-luxury-black" />}
                  </button>
                  <span className="text-[10px] uppercase tracking-widest text-luxury-cream/60">Save this address for future orders</span>
                </div>
              </div>

              <button 
                onClick={handleContinue} 
                className="w-full gold-button py-5"
              >
                Continue to Payment
              </button>
            </motion.div>
          )}

          {(step === 'method' || step === 'processing') && (
            <motion.div 
              key="method"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-10 rounded-3xl space-y-10"
            >
              <div className="space-y-6">
                <h2 className="text-xs uppercase tracking-[0.3em] text-luxury-gold">Select Payment Method</h2>
                <div className="grid grid-cols-1 gap-4">
                  {methods.map(method => (
                    <motion.button
                      key={method.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`flex items-center justify-between p-6 rounded-2xl border transition-all duration-300 ${selectedMethod === method.id ? 'bg-luxury-gold/10 border-luxury-gold text-luxury-gold' : 'bg-white/5 border-white/10 text-luxury-cream/60 hover:border-white/30'}`}
                    >
                      <div className="flex items-center gap-6">
                        <div className={selectedMethod === method.id ? 'text-luxury-gold' : 'text-luxury-cream/30'}>
                          {method.icon}
                        </div>
                        <span className="font-medium tracking-wide">{method.name}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMethod === method.id ? 'border-luxury-gold' : 'border-white/10'}`}>
                        {selectedMethod === method.id && <motion.div layoutId="payment-dot" className="w-2.5 h-2.5 bg-luxury-gold rounded-full" />}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-white/5 space-y-8">
                <div className="flex justify-between items-end">
                  <span className="text-xs uppercase tracking-[0.3em] text-luxury-gold">Total to Pay</span>
                  <span className="text-4xl font-serif text-luxury-cream">₹{finalTotal}</span>
                </div>

                <motion.button
                  whileHover={selectedMethod && step !== 'processing' ? { scale: 1.02, boxShadow: '0 0 30px rgba(212,175,55,0.4)' } : {}}
                  whileTap={selectedMethod && step !== 'processing' ? { scale: 0.98 } : {}}
                  onClick={handlePayment}
                  disabled={!selectedMethod || step === 'processing'}
                  className={`w-full py-5 rounded-full font-bold uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 relative overflow-hidden ${step === 'processing' ? 'bg-white/10 text-luxury-cream/30' : 'bg-luxury-gold text-luxury-black'}`}
                >
                  <span className="relative z-10 flex items-center gap-3">
                    {step === 'processing' ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-6 h-6 border-2 border-luxury-gold border-t-transparent rounded-full"
                      />
                    ) : (
                      'Complete Purchase'
                    )}
                  </span>
                  {step !== 'processing' && selectedMethod && (
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%]"
                      animate={{ x: ['-200%', '200%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-center gap-8 text-[10px] text-luxury-cream/30 uppercase tracking-widest">
          <span className="flex items-center gap-2"><ShieldCheck size={14} /> 256-bit Encryption</span>
          <span className="flex items-center gap-2"><CheckCircle2 size={14} /> PCI DSS Compliant</span>
        </div>
      </div>
    </div>
  );
}
