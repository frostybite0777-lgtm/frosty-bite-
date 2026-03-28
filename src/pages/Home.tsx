import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Star, ArrowRight, Sparkles, Moon, Snowflake, Sun, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { getFirebaseDb } from '../firebase';
import { Dessert } from '../types';
import { DessertSkeleton } from '../components/Skeleton';
import OptimizedImage from '../components/OptimizedImage';
import { useTheme } from '../context/ThemeContext';

export default function Home() {
  const { campaign, activeTheme } = useTheme();
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  
  const [desserts, setDesserts] = useState<Dessert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'desserts'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedDesserts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Dessert[];
      setDesserts(updatedDesserts);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'desserts');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const featured = desserts.filter(d => d.category === 'featured');
  const trending = desserts.filter(d => d.category === 'trending');
  const chefSpecial = desserts.find(d => d.category === 'chef');
  const festival = desserts.filter(d => d.category === 'festival');

  return (
    <div className="relative">
      {/* Decorative Theme Elements */}
      <AnimatePresence>
        {activeTheme === 'christmas' && <Snowflakes />}
        {activeTheme === 'ramadan' && <CrescentMoons />}
        {activeTheme === 'valentine' && <FloatingHearts />}
      </AnimatePresence>

      {/* Promotional Banner */}
      <AnimatePresence>
        {campaign && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-luxury-gold text-luxury-black py-2 overflow-hidden sticky top-20 z-40"
          >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-4">
              <Sparkles size={16} className="animate-pulse" />
              <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold text-center">
                {campaign.promoText}
              </p>
              <Sparkles size={16} className="animate-pulse" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Banner */}
      <section className="relative h-screen overflow-hidden">
        <motion.div style={{ y: y1 }} className="absolute inset-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-[120%] object-cover opacity-60"
          >
            <source src="https://www.pexels.com/download/video/30335428/" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-luxury-black/40 via-transparent to-luxury-black" />
        </motion.div>

        <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-luxury-gold text-xs uppercase tracking-[0.5em] mb-6"
          >
            Est. 2026 • Cuttack
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.7 }}
            className="text-5xl md:text-9xl font-serif text-luxury-cream mb-10 leading-tight"
          >
            The Art of <br /> <span className="italic text-luxury-gold">Pure Indulgence</span>
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-none justify-center px-6"
          >
            <Link to="/collections" className="gold-button w-full sm:w-auto text-center">
              Explore Collection
            </Link>
          </motion.div>
        </div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 text-luxury-gold/30"
        >
          <div className="w-px h-12 bg-gradient-to-b from-luxury-gold to-transparent" />
        </motion.div>
      </section>

      {/* Featured Desserts */}
      <section className="py-20 md:py-32 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-4">
          <div>
            <span className="text-luxury-gold text-[10px] uppercase tracking-[0.3em] mb-4 block">Signature Selection</span>
            <h2 className="text-4xl md:text-5xl font-serif">Featured Masterpieces</h2>
          </div>
          <Link to="/collections" className="text-luxury-gold text-xs uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all font-bold">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {loading ? (
            [...Array(2)].map((_, i) => <DessertSkeleton key={i} />)
          ) : (
            featured.map((dessert, idx) => (
              <DessertCard key={dessert.id} dessert={dessert} large={idx === 0} />
            ))
          )}
        </div>
      </section>

      {/* Trending Cakes Carousel */}
      <section className="py-20 md:py-32 bg-white/5">
        <div className="max-w-7xl mx-auto px-6 mb-12 md:mb-16">
          <span className="text-luxury-gold text-[10px] uppercase tracking-[0.3em] mb-4 block">Most Desired</span>
          <h2 className="text-4xl md:text-5xl font-serif">Trending This Season</h2>
        </div>
        <div className="flex gap-6 md:gap-8 overflow-x-auto pb-12 px-6 scrollbar-hide">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="min-w-[300px] md:min-w-[400px]">
                <DessertSkeleton />
              </div>
            ))
          ) : (
            trending.map(dessert => (
              <div key={dessert.id} className="min-w-[300px] md:min-w-[400px]">
                <DessertCard dessert={dessert} />
              </div>
            ))
          )}
        </div>
      </section>

      {/* Chef's Special */}
      {chefSpecial && (
        <section className="py-20 md:py-32 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-square md:aspect-[4/5] overflow-hidden rounded-[2.5rem]"
            >
              <OptimizedImage 
                src={chefSpecial.image} 
                alt={chefSpecial.name} 
                className="w-full h-full"
              />
              <div className="absolute inset-0 bg-luxury-gold/10 mix-blend-overlay" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6 md:space-y-8"
            >
              <span className="text-luxury-gold text-[10px] uppercase tracking-[0.3em]">Chef's Masterpiece</span>
              <h2 className="text-4xl md:text-6xl font-serif leading-tight">{chefSpecial.name}</h2>
              {chefSpecial.chefNote && (
                <p className="text-luxury-cream/80 text-base md:text-lg leading-relaxed italic border-l-2 border-luxury-gold pl-6">
                  "{chefSpecial.chefNote}"
                </p>
              )}
              <p className="text-luxury-cream/60 leading-relaxed text-sm md:text-base">
                {chefSpecial.description}
              </p>
              <div className="pt-4 md:pt-8">
                <Link to={`/dessert/${chefSpecial.id}`} className="gold-button inline-block text-center w-full sm:w-auto">
                  Discover Secret
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Festival Specials */}
      <section className="py-32 px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center mb-20">
          <span className="text-luxury-gold text-[10px] uppercase tracking-[0.3em] mb-4 block">Limited Edition</span>
          <h2 className="text-4xl md:text-5xl font-serif">Festival Collections</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loading ? (
            [...Array(3)].map((_, i) => <DessertSkeleton key={i} />)
          ) : (
            festival.map(dessert => (
              <DessertCard key={dessert.id} dessert={dessert} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Snowflakes() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -20, x: Math.random() * 100 + 'vw', opacity: 0 }}
          animate={{ 
            y: '110vh', 
            x: (Math.random() * 100 - 10) + 'vw',
            opacity: [0, 1, 1, 0],
            rotate: 360
          }}
          transition={{ 
            duration: Math.random() * 10 + 10, 
            repeat: Infinity, 
            ease: "linear",
            delay: Math.random() * 10
          }}
          className="absolute text-white/20"
        >
          <Snowflake size={Math.random() * 20 + 10} />
        </motion.div>
      ))}
    </div>
  );
}

function CrescentMoons() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 0.2, 0],
            scale: [0.5, 1, 0.5],
            y: [0, -20, 0]
          }}
          transition={{ 
            duration: Math.random() * 5 + 5, 
            repeat: Infinity,
            delay: Math.random() * 5
          }}
          style={{ 
            top: Math.random() * 100 + '%', 
            left: Math.random() * 100 + '%' 
          }}
          className="absolute text-luxury-gold"
        >
          <Moon size={Math.random() * 30 + 20} />
        </motion.div>
      ))}
    </div>
  );
}

function FloatingHearts() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: '110vh', x: Math.random() * 100 + 'vw', opacity: 0 }}
          animate={{ 
            y: -100, 
            x: (Math.random() * 100 - 5) + 'vw',
            opacity: [0, 0.3, 0],
            scale: [0.5, 1.2, 0.8]
          }}
          transition={{ 
            duration: Math.random() * 8 + 8, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: Math.random() * 8
          }}
          className="absolute text-luxury-pink"
        >
          <Heart size={Math.random() * 24 + 12} fill="currentColor" />
        </motion.div>
      ))}
    </div>
  );
}

function DessertCard({ dessert, large = false }: { dessert: Dessert, large?: boolean }) {
  const isNew = dessert.createdAt && (Date.now() - (dessert.createdAt.seconds * 1000) < 24 * 60 * 60 * 1000);

  return (
    <motion.div
      whileHover={{ y: -10 }}
      className={`group relative glass-card rounded-2xl overflow-hidden transition-all duration-500 hover:border-luxury-gold/30 ${large ? 'md:col-span-2 aspect-[16/9]' : 'aspect-square'}`}
    >
      <Link to={`/dessert/${dessert.id}`}>
        <div className="absolute inset-0 overflow-hidden">
          <OptimizedImage
            src={dessert.image}
            alt={dessert.name}
            className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-luxury-black via-transparent to-transparent opacity-60" />
          
          <div className="absolute top-4 left-4 flex gap-2">
            <div className="px-3 py-1 bg-luxury-gold/20 backdrop-blur-md border border-luxury-gold/30 text-luxury-gold text-[8px] uppercase tracking-widest font-bold rounded-full">
              {dessert.category}
            </div>
            {isNew && (
              <div className="px-3 py-1 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-[8px] uppercase tracking-widest font-bold rounded-full animate-pulse">
                New
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 space-y-2">
          <div className="flex justify-between items-end">
            <div>
              <div className="flex items-center gap-1 text-luxury-gold mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={10} fill={i < Math.floor(dessert.rating) ? "currentColor" : "none"} />
                ))}
                <span className="text-[10px] ml-1 text-luxury-cream/50">{dessert.rating}</span>
              </div>
              <h3 className="text-2xl font-serif text-luxury-cream group-hover:text-luxury-gold transition-colors">{dessert.name}</h3>
              <p className="text-xs text-luxury-cream/50 line-clamp-1 max-w-[80%]">{dessert.description}</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-serif text-luxury-gold">₹{dessert.price}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
