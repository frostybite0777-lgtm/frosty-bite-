import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { Star, Minus, Plus, ShoppingBag, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { getFirebaseDb } from '../firebase';
import { useCart } from '../context/CartContext';
import { Dessert } from '../types';
import OptimizedImage from '../components/OptimizedImage';

export default function DessertDetail() {
  const { id } = useParams();
  const [dessert, setDessert] = useState<Dessert | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    const db = getFirebaseDb();
    if (!db) return;

    const unsubscribe = onSnapshot(doc(db, 'desserts', id), (doc) => {
      if (doc.exists()) {
        setDessert({ id: doc.id, ...doc.data() } as Dessert);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `desserts/${id}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen bg-luxury-black flex items-center justify-center">
        <Loader2 className="animate-spin text-luxury-gold" size={48} />
      </div>
    );
  }

  if (!dessert) return <div className="pt-32 text-center">Dessert not found.</div>;

  const handleAddToCart = () => {
    addToCart(dessert, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative h-[50vh] md:h-[70vh] overflow-hidden">
        <OptimizedImage
          src={dessert.image}
          alt={dessert.name}
          className="w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-luxury-black/20 to-luxury-black" />
        <Link to="/collections" className="absolute top-8 left-8 w-12 h-12 glass-card rounded-full flex items-center justify-center text-luxury-gold hover:scale-110 transition-transform z-20">
          <ArrowLeft size={20} />
        </Link>
      </section>

      <div className="max-w-7xl mx-auto px-6 -mt-20 md:-mt-32 relative z-10 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 md:space-y-12"
          >
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <span className="px-4 py-2 bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold text-[10px] uppercase tracking-widest font-bold rounded-full">
                  {dessert.category}
                </span>
                <div className="flex items-center gap-2 text-luxury-gold">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < Math.floor(dessert.rating) ? "currentColor" : "none"} />
                  ))}
                  <span className="text-sm text-luxury-cream/60 ml-2 font-bold">{dessert.rating} / 5.0</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-7xl font-serif text-luxury-cream leading-tight">{dessert.name}</h1>
              <p className="text-3xl md:text-4xl font-serif text-luxury-gold">₹{dessert.price}</p>
            </div>

            <div className="space-y-4 md:space-y-6">
              <h3 className="text-xs uppercase tracking-[0.3em] text-luxury-gold font-bold">The Experience</h3>
              <p className="text-luxury-cream/80 text-base md:text-lg leading-relaxed font-light">
                {dessert.description}
              </p>
            </div>

            {dessert.chefNote && (
              <div className="p-8 glass-card rounded-2xl border-l-4 border-l-luxury-gold italic text-luxury-cream/80 leading-relaxed">
                <span className="block text-xs uppercase tracking-widest text-luxury-gold mb-4 not-italic">Chef's Note</span>
                "{dessert.chefNote}"
              </div>
            )}

            <div className="space-y-4 md:space-y-6">
              <h3 className="text-xs uppercase tracking-[0.3em] text-luxury-gold font-bold">Ingredients</h3>
              <div className="flex flex-wrap gap-3">
                {dessert.ingredients.map(ing => (
                  <span key={ing} className="px-4 py-3 glass-card rounded-full text-xs text-luxury-cream/80 font-medium">
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Action Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:sticky lg:top-32 h-fit"
          >
            <div className="glass-card p-8 md:p-10 rounded-[2.5rem] space-y-8 md:space-y-10">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-widest text-luxury-cream/60 font-bold">Quantity</span>
                <div className="flex items-center gap-8 glass-card px-6 py-3 rounded-full border-white/10">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-luxury-gold hover:scale-125 transition-transform p-1">
                    <Minus size={18} />
                  </button>
                  <span className="text-2xl font-serif min-w-[2ch] text-center text-luxury-cream">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="text-luxury-gold hover:scale-125 transition-transform p-1">
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-xs uppercase tracking-widest text-luxury-cream/60 font-bold">
                  <span>Subtotal</span>
                  <span className="text-luxury-gold text-lg">₹{dessert.price * quantity}</span>
                </div>
                <div className="flex justify-between text-xs uppercase tracking-widest text-luxury-cream/60 font-bold">
                  <span>Estimated Delivery</span>
                  <span className="text-luxury-cream">45 - 60 Mins</span>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={added}
                className={`w-full py-6 rounded-full font-bold uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 text-sm ${added ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-luxury-gold text-luxury-black hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]'}`}
              >
                {added ? (
                  <>
                    <CheckCircle2 size={20} />
                    Added to Collection
                  </>
                ) : (
                  <>
                    <ShoppingBag size={20} />
                    Add to Collection
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-luxury-cream/40 uppercase tracking-[0.2em] font-medium">
                Complimentary luxury packaging included
              </p>
            </div>

            {/* Reviews Preview */}
            <div className="mt-12 space-y-8">
              <h3 className="text-xs uppercase tracking-[0.3em] text-luxury-gold">Customer Reviews</h3>
              {dessert.reviews.length > 0 ? (
                dessert.reviews.map(review => (
                  <div key={review.id} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-serif text-luxury-cream">{review.user}</span>
                      <div className="flex text-luxury-gold">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-luxury-cream/50 leading-relaxed italic">"{review.comment}"</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-luxury-cream/30 italic">No reviews yet. Be the first to experience this masterpiece.</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
