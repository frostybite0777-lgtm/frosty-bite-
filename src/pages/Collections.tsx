import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Star, ArrowRight, ChevronRight } from 'lucide-react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { getFirebaseDb } from '../firebase';
import { Dessert } from '../types';
import { DessertSkeleton } from '../components/Skeleton';
import { Link } from 'react-router-dom';
import OptimizedImage from '../components/OptimizedImage';

export default function Collections() {
  const [desserts, setDesserts] = useState<Dessert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) return;

    const q = query(collection(db, 'desserts'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Dessert[];
      setDesserts(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'desserts');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const categories = ['All', ...Array.from(new Set(desserts.map(d => d.category)))];

  const filteredDesserts = desserts.filter(dessert => {
    const matchesSearch = dessert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dessert.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || dessert.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-luxury-black pt-24 md:pt-32 pb-20 px-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12 md:mb-16 space-y-4 md:space-y-6">
          <div className="flex items-center gap-2 text-luxury-gold text-[10px] uppercase tracking-[0.3em] font-bold">
            <Link to="/" className="hover:text-luxury-cream transition-colors">Home</Link>
            <ChevronRight size={10} />
            <span>Collections</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-serif">Cake Collections</h1>
          <p className="text-luxury-cream/60 max-w-2xl text-sm md:text-base leading-relaxed">
            Explore our curated selection of artisanal masterpieces, crafted with the finest ingredients and a passion for perfection.
          </p>
        </header>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-10 md:mb-12 items-start md:items-center justify-between">
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide w-full md:w-auto -mx-6 px-6 md:mx-0 md:px-0">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-full text-[10px] uppercase tracking-widest transition-all whitespace-nowrap border font-bold ${
                  selectedCategory === category 
                    ? 'bg-luxury-gold text-luxury-black border-luxury-gold' 
                    : 'bg-white/5 text-luxury-cream/80 border-white/10 hover:border-luxury-gold/30'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-luxury-cream/40" size={18} />
            <input
              type="text"
              placeholder="SEARCH COLLECTIONS"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-14 pr-6 text-[10px] uppercase tracking-widest focus:outline-none focus:border-luxury-gold/30 text-luxury-cream font-medium"
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => <DessertSkeleton key={i} />)}
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredDesserts.map((dessert) => (
                <motion.div
                  key={dessert.id}
                  variants={itemVariants}
                  layout
                  className="group relative glass-card rounded-3xl overflow-hidden border-white/5 hover:border-luxury-gold/30 transition-all duration-500 focus-within:ring-2 focus-within:ring-luxury-gold focus-within:ring-offset-4 focus-within:ring-offset-luxury-black outline-none"
                >
                  <Link to={`/dessert/${dessert.id}`} className="block">
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <OptimizedImage
                        src={dessert.image}
                        alt={dessert.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-luxury-black via-transparent to-transparent opacity-60" />
                      
                      <div className="absolute top-4 left-4 flex gap-2">
                        <div className="px-3 py-1 bg-luxury-gold/20 backdrop-blur-md border border-luxury-gold/30 text-luxury-gold text-[8px] uppercase tracking-widest font-bold rounded-full">
                          {dessert.category}
                        </div>
                        {dessert.createdAt && (Date.now() - (dessert.createdAt.seconds * 1000) < 24 * 60 * 60 * 1000) && (
                          <div className="px-3 py-1 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-[8px] uppercase tracking-widest font-bold rounded-full animate-pulse">
                            New
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-8 space-y-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-2xl font-serif text-luxury-cream group-hover:text-luxury-gold transition-colors">{dessert.name}</h3>
                        <span className="text-xl font-serif text-luxury-gold">₹{dessert.price}</span>
                      </div>
                      <p className="text-xs text-luxury-cream/50 line-clamp-2 leading-relaxed">
                        {dessert.description}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-1 text-luxury-gold">
                          <Star size={12} fill="currentColor" />
                          <span className="text-[10px] font-bold">{dessert.rating}</span>
                        </div>
                        <div className="text-luxury-gold text-[10px] uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                          View Details <ArrowRight size={12} />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!loading && filteredDesserts.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-luxury-cream/40 uppercase tracking-widest text-sm">No masterpieces found matching your search</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
