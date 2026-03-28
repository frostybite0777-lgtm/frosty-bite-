import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, 
  Box, 
  ShoppingCart, 
  Tag, 
  BarChart3, 
  Users, 
  LogOut, 
  Search, 
  Plus, 
  Loader2,
  TrendingUp,
  Bell,
  Filter,
  Volume2,
  MoreVertical,
  Clock,
  ChefHat,
  Package,
  Truck,
  CheckCircle,
  X,
  Trash2,
  Edit3,
  Image as ImageIcon,
  IndianRupee,
  Star,
  Layers,
  Percent,
  Palette,
  Calendar,
  MapPin,
  Map as MapIcon,
  Navigation,
  Phone
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issue
const customIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #D4AF37; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; display: flex; align-items: center; justify-content: center;"><div style="width: 10px; height: 10px; background-color: white; border-radius: 50%; transform: rotate(45deg);"></div></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30]
});

const deliveredIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #10b981; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; display: flex; align-items: center; justify-content: center;"><div style="width: 10px; height: 10px; background-color: white; border-radius: 50%; transform: rotate(45deg);"></div></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30]
});

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  addDoc, 
  deleteDoc,
  setDoc
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { Dessert } from '../types';
import { DESSERTS } from '../data';
import { DessertSkeleton, OrderSkeleton } from '../components/Skeleton';

type AdminTab = 'dashboard' | 'desserts' | 'orders' | 'coupons' | 'customers' | 'theme' | 'map';

export default function Admin() {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('admin_session') === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [firestoreError, setFirestoreError] = useState<Error | null>(null);

  if (firestoreError) {
    throw firestoreError;
  }
  
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  useEffect(() => {
    if (tab) {
      if (tab === 'products' || tab === 'collections') {
        setActiveTab('desserts');
      } else if (tab === 'coupons') {
        setActiveTab('coupons');
      } else if (tab === 'orders') {
        setActiveTab('orders');
      } else if (tab === 'customers') {
        setActiveTab('customers');
      } else if (tab === 'theme') {
        setActiveTab('theme');
      } else if (tab === 'map') {
        setActiveTab('map');
      } else if (tab === 'dashboard') {
        setActiveTab('dashboard');
      }
    }
  }, [tab]);

  const handleTabChange = (newTab: AdminTab) => {
    let path = `/admin/${newTab}`;
    if (newTab === 'desserts') path = '/admin/products';
    if (newTab === 'map') path = '/admin/map';
    navigate(path);
  };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [orders, setOrders] = useState<any[]>([]);
  const [desserts, setDesserts] = useState<Dessert[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderIds, setNewOrderIds] = useState<string[]>([]);
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Dessert | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<any>(null);
  
  const [campaign, setCampaign] = useState({
    active: false,
    theme: 'default' as any,
    bannerImage: '',
    promoText: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const [newProduct, setNewProduct] = useState<Partial<Dessert>>({
    name: '',
    description: '',
    price: 0,
    category: 'featured',
    image: '',
    ingredients: [],
    rating: 5.0
  });

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount: 0,
    type: 'percentage',
    active: true,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxUses: 100,
    minPurchase: 0,
    perUserLimit: 1
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const productFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }
    
    const db = getFirebaseDb();
    if (!db) return;

    // Real-time Orders
    let isInitialLoad = true;
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const updatedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (!isInitialLoad) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const newId = change.doc.id;
            const orderData = change.doc.data();
            
            setNewOrderIds(prev => [...prev, newId]);
            
            // Play sound
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(e => console.error("Sound play failed", e));
            }

            // Show Toast
            toast.success(`New order from ${orderData.customerName || 'Guest'}!`, {
              duration: 5000,
              icon: '🛍️',
              style: {
                background: '#141414',
                color: '#D4AF37',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }
            });

            setTimeout(() => {
              setNewOrderIds(prev => prev.filter(id => id !== newId));
            }, 10000); // Keep highlight for 10 seconds
          }
        });
      }
      
      setOrders(updatedOrders);
      isInitialLoad = false;
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'orders');
      } catch (e) {
        setFirestoreError(e as Error);
      }
    });

    // Real-time Desserts
    const dessertsQuery = query(collection(db, 'desserts'));
    const unsubscribeDesserts = onSnapshot(dessertsQuery, (snapshot) => {
      if (snapshot.empty) {
        // Seed desserts if empty
        DESSERTS.forEach(async (d) => {
          await setDoc(doc(db, 'desserts', d.id), d);
        });
      } else {
        const updatedDesserts = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id // Use Firestore ID as the source of truth
          };
        }) as Dessert[];
        setDesserts(updatedDesserts);
      }
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'desserts');
      } catch (e) {
        setFirestoreError(e as Error);
      }
    });
// ... (rest of useEffect)

    // Real-time Coupons
    const couponsQuery = query(collection(db, 'coupons'));
    const unsubscribeCoupons = onSnapshot(couponsQuery, (snapshot) => {
      const updatedCoupons = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCoupons(updatedCoupons);
      setLoading(false);
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'coupons');
      } catch (e) {
        setFirestoreError(e as Error);
      }
    });

    // Real-time Theme/Campaign
    const unsubscribeTheme = onSnapshot(doc(db, 'settings', 'theme'), (snapshot) => {
      if (snapshot.exists()) {
        setCampaign(snapshot.data() as any);
      }
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'settings/theme');
      } catch (e) {
        setFirestoreError(e as Error);
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeDesserts();
      unsubscribeCoupons();
      unsubscribeTheme();
    };
  }, [isLoggedIn]);

  const handleSaveTheme = async () => {
    const db = getFirebaseDb();
    if (!db) return;
    
    try {
      await setDoc(doc(db, 'settings', 'theme'), campaign);
      toast.success('Updated Successfully');
    } catch (error) {
      console.error("Error saving theme:", error);
      toast.error('Failed to save settings');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    setTimeout(() => {
      if (username === 'frosty bite' && password === 'zainab123') {
        localStorage.setItem('admin_session', 'true');
        setIsLoggedIn(true);
        setError('');
      } else {
        setError('Invalid credentials. Please try again.');
        setIsLoggingIn(false);
      }
    }, 1500);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    setIsLoggedIn(false);
    navigate('/admin');
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const db = getFirebaseDb();
    if (!db) return;

    const statusMessages: Record<string, string> = {
      'Order Received': 'We have received your order and it will be processed shortly.',
      'Baking': 'Our master chef has started crafting your exquisite dessert.',
      'Preparing for Delivery': 'Your order is being elegantly packed for its journey.',
      'Out for Delivery': 'Your dessert is now out for delivery with our white-glove courier.',
      'Delivered': 'Your luxury dessert has been successfully delivered. Enjoy!'
    };

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        statusMessage: statusMessages[newStatus],
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const db = getFirebaseDb();
    if (!db) return;

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'desserts', editingProduct.id), {
          ...newProduct,
          updatedAt: serverTimestamp()
        });
        toast.success('Updated Successfully');
        setTimeout(() => navigate('/'), 1500);
      } else {
        const id = Math.random().toString(36).substr(2, 9);
        await setDoc(doc(db, 'desserts', id), {
          ...newProduct,
          id: id,
          reviews: [],
          rating: 5.0,
          createdAt: serverTimestamp()
        });
        toast.success('Updated Successfully');
        setTimeout(() => navigate('/'), 1500);
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        category: 'featured',
        image: '',
        ingredients: [],
        rating: 5.0
      });
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error('Failed to save product');
    }
  };

  const handleEditProduct = (dessert: Dessert) => {
    setEditingProduct(dessert);
    setNewProduct({
      name: dessert.name,
      description: dessert.description,
      price: dessert.price,
      category: dessert.category,
      image: dessert.image,
      ingredients: dessert.ingredients,
      rating: dessert.rating
    });
    setIsProductModalOpen(true);
  };

  const handleProductFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteProduct = async (id: string, isCollectionItem: boolean = false) => {
    if (!confirm('Are you sure you want to delete this masterpiece?')) return;
    const db = getFirebaseDb();
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'desserts', id));
      toast.success('Updated Successfully');
      if (isCollectionItem) {
        navigate('/admin/collections');
      } else {
        navigate('/admin/products');
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error('Failed to delete product');
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const db = getFirebaseDb();
    if (!db) return;

    try {
      await addDoc(collection(db, 'coupons'), {
        ...newCoupon,
        usageCount: 0,
        createdAt: serverTimestamp()
      });
      toast.success('Updated Successfully');
      setTimeout(() => navigate('/admin/coupons'), 1500);
      setIsCouponModalOpen(false);
      setNewCoupon({
        code: '',
        discount: 0,
        type: 'percentage',
        active: true,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maxUses: 100,
        minPurchase: 0,
        perUserLimit: 1
      });
    } catch (error) {
      console.error("Error adding coupon:", error);
      toast.error('Failed to activate offer');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    const db = getFirebaseDb();
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'coupons', id));
      toast.success('Updated Successfully');
      navigate('/admin/coupons');
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast.error('Failed to delete coupon');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Order Received': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Baking': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'Preparing for Delivery': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Out for Delivery': return 'bg-luxury-gold/10 text-luxury-gold border-luxury-gold/20';
      case 'Delivered': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-white/5 text-luxury-cream/40 border-white/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Order Received': return <Clock size={14} />;
      case 'Baking': return <ChefHat size={14} />;
      case 'Preparing for Delivery': return <Package size={14} />;
      case 'Out for Delivery': return <Truck size={14} />;
      case 'Delivered': return <CheckCircle size={14} />;
      default: return null;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="relative min-h-screen bg-luxury-black flex flex-col items-center justify-center px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
            <div className="relative w-full h-full scale-[1.5]">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full object-cover pointer-events-none opacity-100"
              >
                <source src="https://www.pexels.com/download/video/30335428/" type="video/mp4" />
              </video>
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-luxury-black/40 via-transparent to-luxury-black/40" />
            {/* Protective Masks */}
            <div className="absolute top-0 left-0 right-0 h-[20%] bg-luxury-black z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-luxury-black z-10" />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 mb-12 flex flex-col items-center"
        >
          <div className="w-20 h-20 border border-luxury-gold/30 rounded-full flex items-center justify-center mb-4 overflow-hidden bg-luxury-black/40 backdrop-blur-sm">
            <img 
              src="https://pub-1407f82391df4ab1951418d04be76914.r2.dev/uploads/0a744038-e29b-4db8-a8bf-4067fb31bb55.png" 
              alt="Frosty Bite Logo" 
              className="w-full h-full object-contain p-2"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-xl font-serif text-luxury-gold uppercase tracking-[0.4em]">Frosty Bite</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 w-full max-w-md glass-card p-12 rounded-[2.5rem] space-y-10 border-white/5"
        >
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-serif text-luxury-cream uppercase tracking-widest">Admin Portal</h1>
            <p className="text-[10px] text-luxury-cream/40 uppercase tracking-[0.3em]">Authorized Access Only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-luxury-cream/50 ml-6">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-8 text-sm focus:outline-none focus:border-luxury-gold/50 transition-all"
                placeholder="Enter username"
                disabled={isLoggingIn}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center px-6">
                <label className="text-[10px] uppercase tracking-widest text-luxury-cream/50">Password</label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-8 text-sm focus:outline-none focus:border-luxury-gold/50 transition-all"
                placeholder="Enter password"
                disabled={isLoggingIn}
              />
            </div>

            {error && <p className="text-red-400 text-[10px] uppercase tracking-widest text-center">{error}</p>}

            <button 
              type="submit" 
              disabled={isLoggingIn} 
              className="w-full gold-button py-5 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? <Loader2 size={18} className="animate-spin" /> : 'Enter Dashboard'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-black flex flex-col md:flex-row">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3" />
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-72 border-r border-white/5 p-8 flex-col gap-12 sticky top-0 h-screen">
        <div className="text-xl font-serif text-luxury-gold uppercase tracking-widest">Frosty Bite</div>
        
        <nav className="flex-grow space-y-2">
          <AdminNavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} />
          <AdminNavItem icon={<Box size={18} />} label="Desserts" active={activeTab === 'desserts'} onClick={() => handleTabChange('desserts')} />
          <AdminNavItem icon={<ShoppingCart size={18} />} label="Orders" active={activeTab === 'orders'} onClick={() => handleTabChange('orders')} />
          <AdminNavItem icon={<Tag size={18} />} label="Coupons" active={activeTab === 'coupons'} onClick={() => handleTabChange('coupons')} />
          <AdminNavItem icon={<Users size={18} />} label="Customers" active={activeTab === 'customers'} onClick={() => handleTabChange('customers')} />
          <AdminNavItem icon={<MapIcon size={18} />} label="Tracking" active={activeTab === 'map'} onClick={() => handleTabChange('map')} />
          <AdminNavItem icon={<Palette size={18} />} label="Theme" active={activeTab === 'theme'} onClick={() => handleTabChange('theme')} />
        </nav>

        <button onClick={handleLogout} className="flex items-center gap-4 text-xs uppercase tracking-widest text-luxury-cream/30 hover:text-red-400 transition-colors">
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-6 border-b border-white/5 bg-luxury-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="text-lg font-serif text-luxury-gold uppercase tracking-widest">Frosty Bite</div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-luxury-cream">
          {isMobileMenuOpen ? <X size={24} /> : <Filter size={24} />}
        </button>
      </header>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed inset-0 z-40 bg-luxury-black p-12 flex flex-col gap-8 md:hidden"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="text-2xl font-serif text-luxury-gold uppercase tracking-widest">Admin</div>
              <button onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
            </div>
            <nav className="space-y-4">
              <AdminNavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { handleTabChange('dashboard'); setIsMobileMenuOpen(false); }} />
              <AdminNavItem icon={<Box size={20} />} label="Desserts" active={activeTab === 'desserts'} onClick={() => { handleTabChange('desserts'); setIsMobileMenuOpen(false); }} />
              <AdminNavItem icon={<ShoppingCart size={20} />} label="Orders" active={activeTab === 'orders'} onClick={() => { handleTabChange('orders'); setIsMobileMenuOpen(false); }} />
              <AdminNavItem icon={<Tag size={20} />} label="Coupons" active={activeTab === 'coupons'} onClick={() => { handleTabChange('coupons'); setIsMobileMenuOpen(false); }} />
              <AdminNavItem icon={<Users size={20} />} label="Customers" active={activeTab === 'customers'} onClick={() => { handleTabChange('customers'); setIsMobileMenuOpen(false); }} />
              <AdminNavItem icon={<MapIcon size={20} />} label="Tracking" active={activeTab === 'map'} onClick={() => { handleTabChange('map'); setIsMobileMenuOpen(false); }} />
              <AdminNavItem icon={<Palette size={20} />} label="Theme" active={activeTab === 'theme'} onClick={() => { handleTabChange('theme'); setIsMobileMenuOpen(false); }} />
            </nav>
            <button onClick={handleLogout} className="mt-auto flex items-center gap-4 text-sm uppercase tracking-widest text-red-400">
              <LogOut size={20} /> Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-grow p-6 md:p-12 space-y-8 md:space-y-12 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
              <div>
                <h1 className="text-3xl md:text-4xl font-serif capitalize">{activeTab} Management</h1>
                <p className="text-[10px] md:text-xs text-luxury-cream/40 uppercase tracking-widest mt-2">Real-time {activeTab} control system</p>
              </div>
              <div className="flex w-full md:w-auto gap-4">
                <div className="relative flex-grow md:flex-grow-0">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-cream/30" size={16} />
                  <input type="text" placeholder="SEARCH RECORDS" className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-6 text-[10px] uppercase tracking-widest focus:outline-none focus:border-luxury-gold/30 md:w-64" />
                </div>
                {activeTab === 'desserts' && (
                  <button onClick={() => setIsProductModalOpen(true)} className="bg-luxury-gold text-luxury-black p-3 rounded-full hover:scale-110 transition-transform shrink-0">
                    <Plus size={20} />
                  </button>
                )}
                {activeTab === 'coupons' && (
                  <button onClick={() => setIsCouponModalOpen(true)} className="bg-luxury-gold text-luxury-black p-3 rounded-full hover:scale-110 transition-transform shrink-0">
                    <Plus size={20} />
                  </button>
                )}
              </div>
            </header>

            {activeTab === 'dashboard' && (
              <>
                <div className="relative h-64 rounded-3xl overflow-hidden mb-8 group">
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700"
                  >
                    <source src="https://www.pexels.com/download/video/30335428/" type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 p-8">
                    <h2 className="text-3xl font-serif font-light text-white mb-2">Welcome Back, Admin</h2>
                    <p className="text-white/60 font-light tracking-widest text-xs uppercase">Monitoring Frosty Bite's Luxury Experience</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {loading ? (
                    [...Array(4)].map((_, i) => <div key={i} className="glass-card p-8 rounded-3xl h-32 animate-pulse bg-white/5" />)
                  ) : (
                    <>
                      <StatCard label="Total Revenue" value={`₹${orders.reduce((acc, o) => acc + (o.total || 0), 0).toLocaleString()}`} change="+12.5%" />
                      <StatCard label="Active Orders" value={orders.filter(o => o.status !== 'Delivered').length.toString()} change="+5" />
                      <StatCard label="VIP Customers" value="1,280" change="+18%" />
                      <StatCard label="Total Desserts" value={desserts.length.toString()} change="0" />
                    </>
                  )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                  {loading ? (
                    <>
                      <div className="glass-card p-8 rounded-[2.5rem] h-[400px] animate-pulse bg-white/5" />
                      <div className="glass-card p-8 rounded-[2.5rem] h-[400px] animate-pulse bg-white/5" />
                    </>
                  ) : (
                    <>
                      <RecentOrders 
                        orders={orders.slice(0, 5)} 
                        newOrderIds={newOrderIds} 
                        updateStatus={updateOrderStatus} 
                        getStatusColor={getStatusColor} 
                        getStatusIcon={getStatusIcon} 
                        onViewDetails={(order: any) => setSelectedOrderForDetails(order)}
                      />
                      <TopProducts desserts={desserts.slice(0, 5)} />
                    </>
                  )}
                </div>
              </>
            )}

            {activeTab === 'orders' && (
              loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => <OrderSkeleton key={i} />)}
                </div>
              ) : (
                <OrdersTable 
                  orders={orders} 
                  newOrderIds={newOrderIds} 
                  updateStatus={updateOrderStatus} 
                  getStatusColor={getStatusColor} 
                  getStatusIcon={getStatusIcon}
                  onViewDetails={(order: any) => setSelectedOrderForDetails(order)}
                />
              )
            )}

            {activeTab === 'desserts' && (
              loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {[...Array(8)].map((_, i) => <DessertSkeleton key={i} />)}
                </div>
              ) : (
                <div className="space-y-12">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-serif uppercase tracking-widest">Exquisite Collection</h2>
                    <button 
                      onClick={() => {
                        setEditingProduct(null);
                        setNewProduct({
                          name: '',
                          description: '',
                          price: 0,
                          category: 'featured',
                          image: '',
                          ingredients: [],
                          rating: 5.0
                        });
                        setIsProductModalOpen(true);
                      }} 
                      className="gold-button flex items-center gap-2"
                    >
                      <Plus size={18} /> Add Masterpiece
                    </button>
                  </div>
                  <DessertsGrid desserts={desserts} onDelete={handleDeleteProduct} onEdit={handleEditProduct} />
                </div>
              )
            )}

            {activeTab === 'coupons' && (
              <CouponsList coupons={coupons} onDelete={handleDeleteCoupon} />
            )}
            {activeTab === 'customers' && <CustomersList orders={orders} />}
            {activeTab === 'map' && <MapTracking orders={orders} />}
            {activeTab === 'theme' && <ThemeManager campaign={campaign} setCampaign={setCampaign} onSave={handleSaveTheme} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Product Modal */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProductModalOpen(false)} className="absolute inset-0 bg-luxury-black/90 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative z-10 w-full max-w-2xl glass-card p-8 md:p-12 rounded-[2.5rem] border-white/10 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-serif">
                  {editingProduct ? 'Refine Masterpiece' : 'Add New Masterpiece'}
                </h2>
                <button onClick={() => setIsProductModalOpen(false)} className="text-luxury-cream/40 hover:text-luxury-gold"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-luxury-cream/50 ml-4">Product Name</label>
                  <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-6 text-sm focus:outline-none focus:border-luxury-gold/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-luxury-cream/50 ml-4">Price (₹)</label>
                  <input required type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-6 text-sm focus:outline-none focus:border-luxury-gold/50" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-luxury-cream/50 ml-4">Description</label>
                  <textarea required value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 px-6 text-sm focus:outline-none focus:border-luxury-gold/50 min-h-[100px]" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-luxury-cream/50 ml-4">Category</label>
                  <select 
                    value={newProduct.category} 
                    onChange={e => setNewProduct({...newProduct, category: e.target.value as any})} 
                    className="w-full bg-luxury-black border border-white/10 rounded-full py-4 px-6 text-sm focus:outline-none focus:border-luxury-gold/50 text-luxury-cream"
                  >
                    <option value="Chocolate Cakes" className="bg-luxury-black">Chocolate Cakes</option>
                    <option value="Birthday Cakes" className="bg-luxury-black">Birthday Cakes</option>
                    <option value="Wedding Cakes" className="bg-luxury-black">Wedding Cakes</option>
                    <option value="Cupcakes" className="bg-luxury-black">Cupcakes</option>
                    <option value="Pastries" className="bg-luxury-black">Pastries</option>
                    <option value="Ice Cream Cakes" className="bg-luxury-black">Ice Cream Cakes</option>
                    <option value="Featured" className="bg-luxury-black">Featured</option>
                    <option value="Trending" className="bg-luxury-black">Trending</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-luxury-gold ml-4">Product Image</label>
                  <div 
                    onClick={() => productFileInputRef.current?.click()}
                    className="relative aspect-video rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-luxury-gold/30 transition-all overflow-hidden group"
                  >
                    {newProduct.image ? (
                      <>
                        <img src={newProduct.image} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <p className="text-xs uppercase tracking-widest text-white">Change Image</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <ImageIcon size={48} className="text-luxury-cream/10 mb-4" />
                        <p className="text-xs uppercase tracking-widest text-luxury-cream/40">Upload Product Photo</p>
                      </>
                    )}
                    <input 
                      type="file" 
                      ref={productFileInputRef} 
                      onChange={handleProductFileChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Or paste Image URL"
                    value={newProduct.image}
                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-6 text-sm focus:outline-none focus:border-luxury-gold/50 mt-4"
                  />
                </div>
                <div className="md:col-span-2 pt-4">
                  <button 
                    type="submit" 
                    className="w-full gold-button py-5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingProduct ? 'Update Masterpiece' : 'Craft Masterpiece'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrderForDetails && (
          <OrderDetailsModal 
            order={selectedOrderForDetails} 
            onClose={() => setSelectedOrderForDetails(null)} 
          />
        )}
      </AnimatePresence>

      {/* Coupon Modal */}
      <AnimatePresence>
        {isCouponModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCouponModalOpen(false)} className="absolute inset-0 bg-luxury-black/90 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative z-10 w-full max-w-md glass-card p-12 rounded-[2.5rem] border-white/10">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-serif">Generate Coupon</h2>
                <button onClick={() => setIsCouponModalOpen(false)} className="text-luxury-cream/40 hover:text-luxury-gold"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddCoupon} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-luxury-cream/50 ml-4">Coupon Code</label>
                  <input required type="text" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-6 text-sm focus:outline-none focus:border-luxury-gold/50" placeholder="E.G. LUXURY20" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-luxury-cream/50 ml-4">Discount Value</label>
                  <div className="relative">
                    <input required type="number" value={newCoupon.discount} onChange={e => setNewCoupon({...newCoupon, discount: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-6 text-sm focus:outline-none focus:border-luxury-gold/50" />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-luxury-gold">{newCoupon.type === 'percentage' ? '%' : '₹'}</span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setNewCoupon({...newCoupon, type: 'percentage'})} className={`flex-grow py-3 rounded-full text-[10px] uppercase tracking-widest border transition-all ${newCoupon.type === 'percentage' ? 'bg-luxury-gold text-luxury-black border-luxury-gold' : 'border-white/10 text-luxury-cream/40'}`}>Percentage</button>
                  <button type="button" onClick={() => setNewCoupon({...newCoupon, type: 'fixed'})} className={`flex-grow py-3 rounded-full text-[10px] uppercase tracking-widest border transition-all ${newCoupon.type === 'fixed' ? 'bg-luxury-gold text-luxury-black border-luxury-gold' : 'border-white/10 text-luxury-cream/40'}`}>Fixed Amount</button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/50 ml-4">Expiry Date</label>
                    <input required type="date" value={newCoupon.expiryDate} onChange={e => setNewCoupon({...newCoupon, expiryDate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-6 text-sm focus:outline-none focus:border-luxury-gold/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/50 ml-4">Max Uses</label>
                    <input required type="number" value={newCoupon.maxUses} onChange={e => setNewCoupon({...newCoupon, maxUses: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-6 text-sm focus:outline-none focus:border-luxury-gold/50" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/50 ml-4">Min Purchase (₹)</label>
                    <input required type="number" value={newCoupon.minPurchase} onChange={e => setNewCoupon({...newCoupon, minPurchase: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-6 text-sm focus:outline-none focus:border-luxury-gold/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/50 ml-4">Per User Limit</label>
                    <input required type="number" value={newCoupon.perUserLimit} onChange={e => setNewCoupon({...newCoupon, perUserLimit: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-6 text-sm focus:outline-none focus:border-luxury-gold/50" />
                  </div>
                </div>

                <button type="submit" className="w-full gold-button py-5">Activate Offer</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminNavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${active ? 'bg-luxury-gold text-luxury-black font-bold shadow-[0_0_20px_rgba(212,175,55,0.2)]' : 'text-luxury-cream/50 hover:bg-white/5 hover:text-luxury-cream'}`}>
      {icon}
      <span className="text-xs uppercase tracking-widest">{label}</span>
    </button>
  );
}

function StatCard({ label, value, change }: { label: string, value: string, change: string }) {
  return (
    <div className="glass-card p-6 md:p-8 rounded-3xl space-y-4 border-white/5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-luxury-cream/40">{label}</p>
      <div className="flex justify-between items-end">
        <h4 className="text-2xl md:text-3xl font-serif">{value}</h4>
        <span className={`text-[10px] font-bold ${change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{change}</span>
      </div>
    </div>
  );
}

function RecentOrders({ orders, newOrderIds, updateStatus, getStatusColor, getStatusIcon, onViewDetails }: any) {
  return (
    <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden">
      <div className="p-8 border-b border-white/5 flex justify-between items-center">
        <h2 className="text-xl font-serif">Recent Orders</h2>
        <TrendingUp size={18} className="text-luxury-gold" />
      </div>
      <div className="divide-y divide-white/5">
        {orders.map((order: any) => (
          <motion.div 
            key={order.id} 
            animate={{ 
              backgroundColor: newOrderIds.includes(order.id) ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
              boxShadow: newOrderIds.includes(order.id) ? 'inset 0 0 20px rgba(212, 175, 55, 0.1)' : 'none',
              borderColor: newOrderIds.includes(order.id) ? 'rgba(212, 175, 55, 0.3)' : 'rgba(255, 255, 255, 0.05)'
            }}
            className="p-6 flex items-center justify-between group hover:bg-white/[0.02] transition-colors border-l-4 border-transparent"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-luxury-gold/10 flex items-center justify-center text-luxury-gold font-serif">
                {order.customerName?.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium">{order.customerName}</p>
                <p className="text-[10px] text-luxury-cream/30 uppercase tracking-widest">#{order.id.slice(-6).toUpperCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`px-3 py-1 rounded-full border text-[8px] uppercase tracking-widest font-medium ${getStatusColor(order.status)}`}>
                {order.status}
              </div>
              <button 
                onClick={() => onViewDetails(order)}
                className="p-2 text-luxury-cream/20 hover:text-luxury-gold transition-colors"
                title="View Details"
              >
                <Search size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TopProducts({ desserts }: { desserts: Dessert[] }) {
  return (
    <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden">
      <div className="p-8 border-b border-white/5 flex justify-between items-center">
        <h2 className="text-xl font-serif">Top Masterpieces</h2>
        <Star size={18} className="text-luxury-gold" />
      </div>
      <div className="divide-y divide-white/5">
        {desserts.map((dessert) => (
          <div key={dessert.id} className="p-6 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-4">
              <img src={dessert.image} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
              <div>
                <p className="text-sm font-medium">{dessert.name}</p>
                <p className="text-[10px] text-luxury-cream/30 uppercase tracking-widest">{dessert.category}</p>
              </div>
            </div>
            <span className="text-sm font-serif text-luxury-gold">₹{dessert.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersTable({ orders, newOrderIds, updateStatus, getStatusColor, getStatusIcon, onViewDetails }: any) {
  return (
    <div className="glass-card rounded-[2.5rem] overflow-hidden border-white/5">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.2em] text-luxury-cream/20 border-b border-white/5">
              <th className="px-8 py-6 font-medium">Order ID</th>
              <th className="px-8 py-6 font-medium">Customer</th>
              <th className="px-8 py-6 font-medium">Total</th>
              <th className="px-8 py-6 font-medium">Status</th>
              <th className="px-8 py-6 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.map((order: any) => (
              <motion.tr 
                key={order.id}
                animate={{ 
                  backgroundColor: newOrderIds.includes(order.id) ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                  boxShadow: newOrderIds.includes(order.id) ? 'inset 0 0 20px rgba(212, 175, 55, 0.1)' : 'none'
                }}
                className={`group hover:bg-white/[0.02] transition-colors ${newOrderIds.includes(order.id) ? 'border-l-4 border-luxury-gold' : ''}`}
              >
                <td className="px-8 py-6">
                  <span className="font-mono text-xs text-luxury-gold">#{order.id.slice(-6).toUpperCase()}</span>
                </td>
                <td className="px-8 py-6">
                  <div>
                    <p className="text-sm font-medium">{order.customerName}</p>
                    <p className="text-[10px] text-luxury-cream/30 uppercase tracking-widest">{order.address?.slice(0, 20)}...</p>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-sm font-serif">₹{order.total}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="relative group/status">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] uppercase tracking-widest font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </div>
                    <div className="absolute left-0 top-full mt-2 hidden group-hover/status:block z-50 glass-card rounded-xl overflow-hidden border-white/10 min-w-[180px] shadow-2xl">
                      {['Order Received', 'Baking', 'Preparing for Delivery', 'Out for Delivery', 'Delivered'].map(s => (
                        <button key={s} onClick={() => updateStatus(order.id, s)} className="w-full text-left px-4 py-3 text-[10px] uppercase tracking-widest hover:bg-luxury-gold hover:text-luxury-black transition-all border-b border-white/5 last:border-0">{s}</button>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => onViewDetails(order)}
                      className="p-2 text-luxury-cream/20 hover:text-luxury-gold transition-colors"
                      title="View Details"
                    >
                      <Search size={18} />
                    </button>
                    <button className="p-2 text-luxury-cream/20 hover:text-luxury-gold transition-colors"><MoreVertical size={18} /></button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DessertsGrid({ desserts, onDelete, onEdit }: { desserts: Dessert[], onDelete: (id: string, isCollection: boolean) => void, onEdit: (dessert: Dessert) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {desserts.map((dessert) => (
        <motion.div layout key={dessert.id} className="glass-card rounded-[2rem] overflow-hidden border-white/5 group">
          <div className="relative h-48">
            <img src={dessert.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={() => onEdit(dessert)} className="p-2 bg-luxury-black/50 backdrop-blur-md rounded-full text-luxury-cream hover:text-luxury-gold transition-colors"><Edit3 size={16} /></button>
              <button 
                onClick={() => onDelete(dessert.id, dessert.category === 'featured')} 
                className="p-3 bg-red-500/20 backdrop-blur-md rounded-full text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-lg border border-red-500/30"
                title="Delete Masterpiece"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <div className="absolute bottom-4 left-4 px-3 py-1 bg-luxury-gold text-luxury-black text-[8px] uppercase tracking-widest font-bold rounded-full">{dessert.category}</div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-serif">{dessert.name}</h3>
              <span className="text-lg font-serif text-luxury-gold">₹{dessert.price}</span>
            </div>
            <p className="text-xs text-luxury-cream/40 line-clamp-2 leading-relaxed">{dessert.description}</p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1 text-luxury-gold"><Star size={12} fill="currentColor" /> <span className="text-[10px] font-bold">{dessert.rating}</span></div>
              <div className="flex items-center gap-1 text-luxury-cream/30"><Layers size={12} /> <span className="text-[10px] uppercase tracking-widest">{dessert.ingredients.length} Ing.</span></div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function OrderDetailsModal({ order, onClose }: { order: any, onClose: () => void }) {
  if (!order) return null;

  const orderLocation: [number, number] = [
    order.latitude || 19.0760, 
    order.longitude || 72.8777
  ];

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${orderLocation[0]},${orderLocation[1]}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-luxury-black/90 backdrop-blur-sm" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.9, y: 20 }} 
        className="relative z-10 w-full max-w-4xl glass-card rounded-[2.5rem] border-white/10 overflow-hidden flex flex-col md:flex-row h-[80vh]"
      >
        {/* Left Side: Order Info */}
        <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto space-y-8 border-r border-white/5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-gold mb-2">Order Details</p>
              <h2 className="text-3xl font-serif">#{order.id.slice(-6).toUpperCase()}</h2>
            </div>
            <button onClick={onClose} className="text-luxury-cream/40 hover:text-luxury-gold"><X size={24} /></button>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-luxury-cream/30">Customer</p>
              <p className="text-lg font-serif text-luxury-cream">{order.customerName}</p>
              <p className="text-xs text-luxury-cream/60 flex items-center gap-2">
                <Phone size={12} /> {order.customerPhone || 'N/A'}
              </p>
              <p className="text-xs text-luxury-cream/60">{order.customerEmail}</p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-luxury-cream/30">Delivery Address</p>
              <p className="text-xs text-luxury-cream/80 leading-relaxed">{order.address}</p>
              {order.deliveryDetails && (
                <div className="mt-2 space-y-1">
                  {order.deliveryDetails.landmark && (
                    <p className="text-[10px] text-luxury-gold/60 uppercase tracking-widest">
                      Landmark: {order.deliveryDetails.landmark}
                    </p>
                  )}
                  {order.deliveryDetails.specialInstructions && (
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 mt-2">
                      <p className="text-[8px] uppercase tracking-widest text-luxury-cream/30 mb-1">Special Instructions</p>
                      <p className="text-[10px] text-luxury-cream/70 italic">"{order.deliveryDetails.specialInstructions}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-widest text-luxury-cream/30">Masterpieces</p>
              <div className="space-y-3">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-luxury-cream/80">{item.quantity}x {item.name}</span>
                    <span className="text-luxury-gold">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                <span className="text-[10px] uppercase tracking-widest text-luxury-gold">Total Amount</span>
                <span className="text-xl font-serif text-luxury-cream">₹{order.total}</span>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <a 
              href={googleMapsUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full gold-button py-4 flex items-center justify-center gap-3 group"
            >
              <Navigation size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              Open in Google Maps
            </a>
          </div>
        </div>

        {/* Right Side: Map */}
        <div className="w-full md:w-1/2 h-full bg-luxury-black relative z-0">
          <MapContainer 
            center={orderLocation} 
            zoom={15} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <Marker position={orderLocation} icon={customIcon}>
              <Popup>
                <div className="p-2 text-luxury-black">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-luxury-gold">{order.customerName}</p>
                  <p className="text-xs font-serif">{order.address}</p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
          
          <div className="absolute top-6 right-6 z-10">
            <div className="glass-card px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-luxury-gold animate-pulse" />
              <span className="text-[8px] uppercase tracking-widest text-luxury-cream/60">Delivery Location</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CouponsList({ coupons, onDelete }: { coupons: any[], onDelete: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {coupons.map((coupon) => (
        <div key={coupon.id} className="glass-card p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-luxury-gold/5 rounded-full blur-2xl group-hover:bg-luxury-gold/10 transition-colors" />
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-luxury-gold/10 rounded-2xl text-luxury-gold"><Percent size={24} /></div>
            <button 
              onClick={() => onDelete(coupon.id)} 
              className="p-3 bg-red-500/10 rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 shadow-sm"
              title="Delete Coupon"
            >
              <Trash2 size={20} />
            </button>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-serif tracking-widest text-luxury-gold">{coupon.code}</h3>
            <p className="text-xs text-luxury-cream/40 uppercase tracking-widest">
              {coupon.type === 'percentage' ? `${coupon.discount}% Discount` : `₹${coupon.discount} Off`}
            </p>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-luxury-cream/30">
              <span>Usage</span>
              <span>{coupon.usageCount || 0} / {coupon.maxUses || '∞'}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-luxury-gold" 
                style={{ width: `${Math.min(((coupon.usageCount || 0) / (coupon.maxUses || 1)) * 100, 100)}%` }} 
              />
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-luxury-cream/30 pt-2">
              <Calendar size={12} className="text-luxury-gold" />
              <span>Expires: {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'Never'}</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-[8px] uppercase tracking-widest bg-white/5 px-2 py-1 rounded text-luxury-cream/40">Min: ₹{coupon.minPurchase || 0}</span>
              <span className="text-[8px] uppercase tracking-widest bg-white/5 px-2 py-1 rounded text-luxury-cream/40">Limit: {coupon.perUserLimit || 1}/User</span>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
            <span className={`text-[8px] uppercase tracking-widest font-bold px-3 py-1 rounded-full ${coupon.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
              {coupon.active ? 'Active' : 'Expired'}
            </span>
            <span className="text-[10px] text-luxury-cream/20 uppercase tracking-widest">Used 0 times</span>
          </div>
        </div>
      ))}
      {coupons.length === 0 && (
        <div className="md:col-span-3 p-20 text-center space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-luxury-cream/20"><Tag size={32} /></div>
          <p className="text-luxury-cream/40 uppercase tracking-widest text-xs">No active coupons found</p>
        </div>
      )}
    </div>
  );
}

function ThemeManager({ campaign, setCampaign, onSave }: { campaign: any, setCampaign: any, onSave: () => void }) {
  const themes = [
    { id: 'default', name: 'Default Luxury', colors: ['#0F0F0F', '#D4AF37'] },
    { id: 'valentine', name: 'Valentine Special', colors: ['#FFF5F7', '#FF4D6D'] },
    { id: 'christmas', name: 'Christmas Joy', colors: ['#0B1D12', '#D4AF37'] },
    { id: 'ramadan', name: 'Ramadan / Eid', colors: ['#062C1E', '#D4AF37'] },
    { id: 'summer', name: 'Summer Vibes', colors: ['#FFF8F0', '#FF9F1C'] }
  ];

  return (
    <div className="space-y-8">
      <div className="glass-card p-8 md:p-12 rounded-[2.5rem] border-white/5">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-luxury-gold/10 p-3 rounded-2xl">
            <Palette className="text-luxury-gold" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-serif">Theme & Campaign Manager</h2>
            <p className="text-xs text-luxury-cream/40 uppercase tracking-widest">Control the visual identity and active promotions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-xs uppercase tracking-widest text-luxury-gold">Select Active Theme</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {themes.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => setCampaign({ ...campaign, theme: theme.id })}
                    className={`p-4 rounded-2xl border transition-all text-left space-y-3 ${campaign.theme === theme.id ? 'border-luxury-gold bg-luxury-gold/5' : 'border-white/5 hover:border-white/20'}`}
                  >
                    <div className="flex gap-1">
                      {theme.colors.map((c, i) => (
                        <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <p className="text-[10px] uppercase tracking-widest font-bold">{theme.name}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex-grow">
                <p className="text-xs uppercase tracking-widest font-bold">Campaign Status</p>
                <p className="text-[10px] text-luxury-cream/40 uppercase tracking-widest">Enable or disable the current campaign</p>
              </div>
              <button
                onClick={() => setCampaign({ ...campaign, active: !campaign.active })}
                className={`w-12 h-6 rounded-full transition-colors relative ${campaign.active ? 'bg-luxury-gold' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${campaign.active ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-luxury-cream/50 ml-4">Promotional Text</label>
              <input
                type="text"
                value={campaign.promoText}
                onChange={e => setCampaign({ ...campaign, promoText: e.target.value })}
                placeholder="e.g. Weekend Special – 20% Off on Chocolate Cakes"
                className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-6 text-sm focus:outline-none focus:border-luxury-gold/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-luxury-cream/50 ml-4">Banner Image URL</label>
              <input
                type="text"
                value={campaign.bannerImage}
                onChange={e => setCampaign({ ...campaign, bannerImage: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-6 text-sm focus:outline-none focus:border-luxury-gold/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-luxury-cream/50 ml-4">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-cream/20" size={16} />
                  <input
                    type="date"
                    value={campaign.startDate}
                    onChange={e => setCampaign({ ...campaign, startDate: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-luxury-gold/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-luxury-cream/50 ml-4">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-cream/20" size={16} />
                  <input
                    type="date"
                    value={campaign.endDate}
                    onChange={e => setCampaign({ ...campaign, endDate: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-luxury-gold/50"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={onSave}
              className="w-full gold-button py-5 mt-4"
            >
              Deploy Theme & Campaign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomersList({ orders }: { orders: any[] }) {
  const customers = Array.from(new Set(orders.map(o => o.customerEmail))).map(email => {
    const customerOrders = orders.filter(o => o.customerEmail === email);
    const totalSpent = customerOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    const lastOrder = customerOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    
    return {
      email,
      name: lastOrder.customerName || 'Anonymous',
      orderCount: customerOrders.length,
      totalSpent,
      lastOrderDate: lastOrder.createdAt
    };
  }).sort((a, b) => b.totalSpent - a.totalSpent);

  return (
    <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="p-6 text-[10px] uppercase tracking-widest text-luxury-gold">Customer</th>
              <th className="p-6 text-[10px] uppercase tracking-widest text-luxury-gold">Orders</th>
              <th className="p-6 text-[10px] uppercase tracking-widest text-luxury-gold">Total Spent</th>
              <th className="p-6 text-[10px] uppercase tracking-widest text-luxury-gold">Last Order</th>
              <th className="p-6 text-[10px] uppercase tracking-widest text-luxury-gold text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-luxury-gold/10 flex items-center justify-center text-luxury-gold font-serif text-lg">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-luxury-cream">{customer.name}</p>
                      <p className="text-[10px] text-luxury-cream/30 lowercase">{customer.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6 text-sm text-luxury-cream/60">{customer.orderCount} Orders</td>
                <td className="p-6 text-sm font-serif text-luxury-gold">₹{customer.totalSpent.toLocaleString()}</td>
                <td className="p-6 text-xs text-luxury-cream/40">
                  {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'N/A'}
                </td>
                <td className="p-6 text-right">
                  <span className={`text-[8px] uppercase tracking-widest font-bold px-3 py-1 rounded-full ${customer.totalSpent > 5000 ? 'bg-luxury-gold/20 text-luxury-gold' : 'bg-white/5 text-luxury-cream/40'}`}>
                    {customer.totalSpent > 5000 ? 'VIP' : 'Regular'}
                  </span>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-20 text-center">
                  <p className="text-luxury-cream/20 uppercase tracking-widest text-xs">No customers found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MapTracking({ orders }: { orders: any[] }) {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [center, setCenter] = useState<[number, number]>([19.0760, 72.8777]); // Default to Mumbai

  // Add mock coordinates for demo if they don't exist
  const ordersWithLocation = orders.map((order) => ({
    ...order,
    latitude: order.latitude || (19.0760 + (Math.random() - 0.5) * 0.1),
    longitude: order.longitude || (72.8777 + (Math.random() - 0.5) * 0.1)
  }));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif uppercase tracking-widest text-luxury-cream">Live Logistics Tracking</h2>
          <p className="text-[10px] text-luxury-cream/40 uppercase tracking-[0.3em] mt-2">Real-time delivery fleet monitoring (Free OpenStreetMap)</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-card px-4 py-2 rounded-full flex items-center gap-2 border-white/5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-luxury-cream/60">{orders.filter(o => o.status !== 'Delivered').length} Active Deliveries</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card rounded-[2.5rem] overflow-hidden border-white/5 h-[600px] relative z-0">
          <MapContainer 
            center={center} 
            zoom={12} 
            style={{ height: '100%', width: '100%', background: '#141414' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <MapRecenter center={center} />
            
            {ordersWithLocation.map((order) => (
              <Marker
                key={order.id}
                position={[order.latitude, order.longitude]}
                icon={order.status === 'Delivered' ? deliveredIcon : customIcon}
                eventHandlers={{
                  click: () => setSelectedOrder(order),
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[200px] text-luxury-black">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-luxury-gold mb-1">Order #{order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-sm font-serif font-bold mb-1">{order.customerName}</p>
                    <p className="text-[10px] text-luxury-gold font-medium mb-2 flex items-center gap-1">
                      <Phone size={10} /> {order.customerPhone || 'No Phone'}
                    </p>
                    <p className="text-[10px] text-gray-600 mb-3">{order.address}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 bg-gray-100 rounded-full">{order.status}</span>
                      <span className="text-xs font-serif font-bold">₹{order.total}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="glass-card rounded-[2.5rem] p-8 border-white/5 space-y-6 overflow-y-auto max-h-[600px]">
          <h3 className="text-sm uppercase tracking-[0.2em] text-luxury-gold mb-6">Active Shipments</h3>
          <div className="space-y-4">
            {ordersWithLocation.filter(o => o.status !== 'Delivered').map(order => (
              <button
                key={order.id}
                onClick={() => {
                  setSelectedOrder(order);
                  setCenter([order.latitude, order.longitude]);
                }}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedOrder?.id === order.id ? 'bg-luxury-gold/10 border-luxury-gold/30' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs font-serif text-luxury-cream">{order.customerName}</p>
                  <span className="text-[8px] uppercase tracking-widest text-luxury-gold">#{order.id.slice(-6).toUpperCase()}</span>
                </div>
                <p className="text-[9px] text-luxury-gold/80 mb-2 flex items-center gap-1">
                  <Phone size={8} /> {order.customerPhone || 'N/A'}
                </p>
                <p className="text-[10px] text-luxury-cream/40 line-clamp-1 mb-3">{order.address}</p>
                <div className="flex items-center gap-2">
                  <Truck size={12} className="text-luxury-gold" />
                  <span className="text-[8px] uppercase tracking-widest text-luxury-cream/60">{order.status}</span>
                </div>
              </button>
            ))}
            {orders.filter(o => o.status !== 'Delivered').length === 0 && (
              <div className="py-20 text-center">
                <p className="text-luxury-cream/20 uppercase tracking-widest text-[10px]">No active deliveries</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
