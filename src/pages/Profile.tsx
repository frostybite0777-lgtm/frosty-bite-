import { useState } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Package, Heart, Award, Crown, ChevronRight, LogOut, MapPin, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const [adminClicks, setAdminClicks] = useState(0);
  const { user, profile, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleSecretTap = () => {
    const newCount = adminClicks + 1;
    if (newCount >= 5) {
      navigate('/admin');
    } else {
      setAdminClicks(newCount);
      setTimeout(() => setAdminClicks(0), 2000);
    }
  };

  if (loading) return null;

  if (!user) {
    return (
      <div className="pt-40 pb-32 px-6 flex flex-col items-center justify-center text-center space-y-8">
        <div className="w-24 h-24 glass-card rounded-full flex items-center justify-center text-luxury-gold/20">
          <UserIcon size={48} />
        </div>
        <h1 className="text-4xl font-serif">Join the Boutique</h1>
        <p className="text-luxury-cream/50 max-w-md">Sign in to access your luxury profile and track your exquisite orders.</p>
        <button onClick={() => navigate('/login')} className="gold-button">Sign In / Sign Up</button>
      </div>
    );
  }

  const nextTierPoints = 1000;
  const loyaltyPoints = profile?.loyaltyPoints || 0;
  const progress = (loyaltyPoints / nextTierPoints) * 100;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="pt-32 pb-32 px-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Sidebar */}
        <div className="space-y-8">
          <div className="glass-card p-10 rounded-3xl text-center space-y-6">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-luxury-gold p-1">
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.fullName || user.email || 'User')}&background=D4AF37&color=0F0F0F`} 
                  alt="User" 
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              {profile?.isVIP && (
                <div className="absolute -bottom-2 -right-2 bg-luxury-gold text-luxury-black p-2 rounded-full shadow-lg">
                  <Crown size={16} />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-serif">{profile?.fullName || user.displayName || 'Connoisseur'}</h2>
              <p className="text-xs text-luxury-cream/40 uppercase tracking-widest mt-1">{user.email || user.phoneNumber}</p>
            </div>
            <div className="pt-6 flex justify-center gap-4">
              <button 
                onClick={handleLogout}
                className="text-luxury-cream/30 hover:text-red-400 transition-colors flex items-center gap-2 text-xs uppercase tracking-widest"
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>

          <div className="glass-card p-8 rounded-3xl space-y-6">
            <h3 
              onClick={handleSecretTap}
              className="text-xs uppercase tracking-[0.3em] text-luxury-gold cursor-default select-none"
            >
              VIP Dessert Club
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-luxury-cream/60">Current Status</span>
                <span className="text-luxury-gold font-bold">{profile?.isVIP ? 'Platinum Member' : 'Gold Member'}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase tracking-widest text-luxury-cream/40">
                  <span>{loyaltyPoints} Points</span>
                  <span>{nextTierPoints} Points for Platinum</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-luxury-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                  />
                </div>
              </div>
              <p className="text-[10px] text-luxury-cream/40 italic">You are in the top 5% of our connoisseurs.</p>
            </div>
          </div>

          <div className="glass-card p-8 rounded-3xl space-y-6">
            <h3 className="text-xs uppercase tracking-[0.3em] text-luxury-gold">Delivery Details</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4 text-sm">
                <MapPin size={18} className="text-luxury-gold shrink-0 mt-1" />
                <p className="text-luxury-cream/60 leading-relaxed">
                  {profile?.defaultAddress || 'No address saved yet.'}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Phone size={18} className="text-luxury-gold shrink-0" />
                <p className="text-luxury-cream/60">
                  {profile?.phoneNumber || user.phoneNumber || 'No phone number saved.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          <section className="space-y-8">
            <div className="flex justify-between items-end">
              <h2 className="text-3xl font-serif">Recent Orders</h2>
              <button className="text-xs uppercase tracking-widest text-luxury-gold hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              <div className="glass-card p-12 rounded-2xl text-center">
                <p className="text-sm text-luxury-cream/30 italic">Your exquisite order history will appear here.</p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="space-y-6">
              <h3 className="text-xs uppercase tracking-[0.3em] text-luxury-gold flex items-center gap-2">
                <Heart size={14} /> Saved Desserts
              </h3>
              <div className="glass-card p-6 rounded-2xl text-center py-12">
                <p className="text-sm text-luxury-cream/30 italic">Your favorites will appear here.</p>
              </div>
            </section>
            <section className="space-y-6">
              <h3 className="text-xs uppercase tracking-[0.3em] text-luxury-gold flex items-center gap-2">
                <Award size={14} /> Achievements
              </h3>
              <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 bg-luxury-gold/20 rounded-full flex items-center justify-center text-luxury-gold">
                  <Crown size={18} />
                </div>
                <div>
                  <h5 className="text-sm font-medium">Early Connoisseur</h5>
                  <p className="text-[10px] text-luxury-cream/40 uppercase tracking-widest">Joined in first month</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
