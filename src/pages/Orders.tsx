import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  ChefHat, 
  MapPin,
  RefreshCw,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { getFirebaseDb } from '../firebase';
import { Link } from 'react-router-dom';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const db = getFirebaseDb();
    if (!db) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(updatedOrders);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const stages = [
    { id: 'Order Received', icon: <Clock size={16} />, label: 'Received' },
    { id: 'Baking', icon: <ChefHat size={16} />, label: 'Baking' },
    { id: 'Preparing for Delivery', icon: <Package size={16} />, label: 'Packing' },
    { id: 'Out for Delivery', icon: <Truck size={16} />, label: 'On Way' },
    { id: 'Delivered', icon: <CheckCircle size={16} />, label: 'Delivered' }
  ];

  const getActiveIndex = (status: string) => {
    return stages.findIndex(s => s.id === status);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="animate-spin text-luxury-gold" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-40 pb-32 px-6 max-w-7xl mx-auto text-center">
        <div className="glass-card p-12 rounded-[2.5rem] max-w-md mx-auto space-y-8 border-white/5">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-luxury-cream/20">
            <Users size={32} />
          </div>
          <h2 className="text-3xl font-serif">Sign in to view orders</h2>
          <p className="text-luxury-cream/40 text-sm uppercase tracking-widest leading-relaxed">
            Please authenticate to access your exclusive order history and real-time tracking.
          </p>
          <Link to="/login" className="gold-button w-full py-4 block">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-40 pb-32 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div>
          <h1 className="text-6xl font-serif mb-4">Your Commissions</h1>
          <p className="text-luxury-cream/40 uppercase tracking-[0.4em] text-xs">Real-time status of your luxury desserts</p>
        </div>
        <div className="flex items-center gap-4 text-xs uppercase tracking-widest text-luxury-cream/30">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Live Tracking Active
        </div>
      </div>

      <div className="space-y-8">
        <AnimatePresence mode="popLayout">
          {orders.map((order, i) => {
            const activeIndex = getActiveIndex(order.status);
            
            return (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-[2.5rem] overflow-hidden border-white/5 group"
              >
                <div className="p-8 md:p-12">
                  <div className="flex flex-col lg:flex-row gap-12">
                    {/* Order Info */}
                    <div className="lg:w-1/3 space-y-8">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-luxury-cream/40 mb-1">Order ID</p>
                          <h3 className="text-xl font-mono text-luxury-gold">#{order.id.slice(-6).toUpperCase()}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-widest text-luxury-cream/40 mb-1">Total Value</p>
                          <p className="text-2xl font-serif">₹{order.total}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-luxury-cream/60">
                          <MapPin size={16} className="text-luxury-gold" />
                          <p className="text-xs uppercase tracking-widest">{order.address}</p>
                        </div>
                        <div className="flex items-center gap-3 text-luxury-cream/60">
                          <Clock size={16} className="text-luxury-gold" />
                          <p className="text-xs uppercase tracking-widest">
                            {order.createdAt?.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4">
                        <div className="bg-luxury-gold/10 border border-luxury-gold/20 rounded-2xl p-4">
                          <p className="text-[10px] uppercase tracking-widest text-luxury-gold mb-1 font-bold">Current Status</p>
                          <p className="text-sm text-luxury-cream leading-relaxed italic">
                            "{order.statusMessage || 'Your order is being processed.'}"
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="lg:w-2/3 flex flex-col justify-center">
                      <div className="relative">
                        {/* Line Background */}
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2" />
                        
                        {/* Active Line */}
                        <motion.div 
                          className="absolute top-1/2 left-0 h-0.5 bg-luxury-gold -translate-y-1/2 origin-left"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: activeIndex / (stages.length - 1) }}
                          transition={{ duration: 1, ease: "circOut" }}
                        />

                        {/* Steps */}
                        <div className="relative flex justify-between">
                          {stages.map((stage, idx) => {
                            const isCompleted = idx < activeIndex;
                            const isActive = idx === activeIndex;
                            
                            return (
                              <div key={stage.id} className="flex flex-col items-center gap-4">
                                <motion.div 
                                  animate={isActive ? { 
                                    scale: [1, 1.2, 1],
                                    boxShadow: ["0 0 0px rgba(212, 175, 55, 0)", "0 0 20px rgba(212, 175, 55, 0.4)", "0 0 0px rgba(212, 175, 55, 0)"]
                                  } : {}}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 z-10 ${
                                    isCompleted || isActive 
                                      ? 'bg-luxury-black border-luxury-gold text-luxury-gold' 
                                      : 'bg-luxury-black border-white/10 text-luxury-cream/20'
                                  }`}
                                >
                                  {isCompleted ? <CheckCircle size={20} /> : stage.icon}
                                </motion.div>
                                <p className={`text-[10px] uppercase tracking-[0.2em] font-medium transition-colors duration-500 ${
                                  isCompleted || isActive ? 'text-luxury-gold' : 'text-luxury-cream/20'
                                }`}>
                                  {stage.label}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items Summary */}
                <div className="bg-white/[0.02] border-t border-white/5 p-8 flex flex-wrap gap-4">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 bg-white/5 rounded-full py-2 px-4 border border-white/5">
                      <img src={item.image} alt={item.name} className="w-6 h-6 rounded-full object-cover" />
                      <span className="text-[10px] uppercase tracking-widest text-luxury-cream/60">
                        {item.quantity}x {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {orders.length === 0 && !loading && (
          <div className="text-center py-32 space-y-8">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto text-luxury-cream/10">
              <Package size={48} />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-serif">No orders yet</h2>
              <p className="text-luxury-cream/40 uppercase tracking-widest text-xs">Your journey into luxury desserts begins with your first order</p>
            </div>
            <Link to="/" className="gold-button inline-block px-12 py-4">Explore Menu</Link>
          </div>
        )}
      </div>
    </div>
  );
}
