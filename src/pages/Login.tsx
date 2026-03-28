import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb, googleProvider } from '../firebase';
import { Mail, Lock, Phone, ArrowRight, Loader2, Chrome, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { isConfigured } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'phone'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoClicks, setLogoClicks] = useState(0);
  const navigate = useNavigate();

  const handleLogoClick = () => {
    const newCount = logoClicks + 1;
    if (newCount >= 5) {
      navigate('/admin');
    } else {
      setLogoClicks(newCount);
      // Reset counter after 2 seconds of inactivity
      setTimeout(() => setLogoClicks(0), 2000);
    }
  };

  const setupRecaptcha = () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    if (!auth || !db) {
      setError('Authentication service is not configured.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          fullName,
          email,
          role: 'client',
          phoneNumber: '',
          defaultAddress: '',
          loyaltyPoints: 0,
          isVIP: false,
          createdAt: new Date().toISOString()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password') setError('Incorrect password. Please try again.');
      else if (err.code === 'auth/invalid-email') setError('Invalid email address.');
      else if (err.code === 'auth/user-not-found') setError('No user found with this email.');
      else setError('Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    if (!auth || !db) {
      setError('Authentication service is not configured.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          uid: user.uid,
          fullName: user.displayName || '',
          email: user.email || '',
          role: 'client',
          phoneNumber: '',
          defaultAddress: '',
          loyaltyPoints: 0,
          isVIP: false,
          createdAt: new Date().toISOString()
        });
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const auth = getFirebaseAuth();
    if (!auth) {
      setError('Authentication service is not configured.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      setupRecaptcha();
      const verifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(result);
    } catch (err: any) {
      console.error(err);
      setError('Failed to send OTP. Please check the phone number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    const db = getFirebaseDb();
    if (!db) {
      setError('Database service is not configured.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          uid: user.uid,
          fullName: '',
          email: '',
          role: 'client',
          phoneNumber: user.phoneNumber || '',
          defaultAddress: '',
          loyaltyPoints: 0,
          isVIP: false,
          createdAt: new Date().toISOString()
        });
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="relative min-h-screen bg-luxury-black flex flex-col items-center justify-center px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
            <div className="relative w-full h-full scale-[1.5]">
              <iframe
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[177.77vw] min-h-[100vh] min-w-[56.25vh] pointer-events-none opacity-100"
                src="https://www.youtube.com/embed/WWoCbT-ZW4c?autoplay=1&mute=1&controls=0&loop=1&playlist=WWoCbT-ZW4c&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1"
                allow="autoplay; encrypted-media"
                title="Background Video"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-luxury-black/40 via-transparent to-luxury-black/40" />
            {/* Protective Masks */}
            <div className="absolute top-0 left-0 right-0 h-[20%] bg-luxury-black z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-luxury-black z-10" />
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-20 w-full max-w-md glass-card p-12 rounded-[2.5rem] text-center space-y-8"
        >
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="text-amber-500" size={32} />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-serif text-luxury-gold uppercase tracking-widest">Configuration Required</h2>
            <p className="text-sm text-luxury-cream/60 leading-relaxed">
              The Firebase Authentication service has not been configured yet. Please add your Firebase API keys to the AI Studio Secrets panel to enable secure login.
            </p>
          </div>
          <div className="pt-4">
            <button onClick={() => navigate('/')} className="text-xs uppercase tracking-[0.3em] text-luxury-cream/30 hover:text-luxury-gold transition-colors">
              Return to Boutique
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-luxury-black flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
          <div className="relative w-full h-full scale-[1.5]">
            <iframe
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[177.77vw] min-h-[100vh] min-w-[56.25vh] pointer-events-none opacity-100"
              src="https://www.youtube.com/embed/WWoCbT-ZW4c?autoplay=1&mute=1&controls=0&loop=1&playlist=WWoCbT-ZW4c&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1"
              allow="autoplay; encrypted-media"
              title="Background Video"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-luxury-black/40 via-transparent to-luxury-black/40" />
          {/* Protective Masks */}
          <div className="absolute top-0 left-0 right-0 h-[20%] bg-luxury-black z-10" />
          <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-luxury-black z-10" />
        </div>
      </div>

      <div id="recaptcha-container"></div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={handleLogoClick}
        className="relative z-20 mb-12 flex flex-col items-center cursor-default select-none"
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

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 w-full max-w-md glass-card p-10 rounded-[2.5rem] space-y-8 border-white/5"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif text-luxury-cream uppercase tracking-widest">
            {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Join the Boutique' : 'Phone Sign In'}
          </h1>
          <p className="text-[10px] text-luxury-cream/40 uppercase tracking-[0.3em]">
            {mode === 'login' ? 'Enter your credentials' : mode === 'signup' ? 'Create your luxury profile' : 'Verify your identity'}
          </p>
        </div>

        <div className="flex gap-4 border-b border-white/5 pb-4">
          <button 
            onClick={() => { setMode('login'); setError(''); setConfirmationResult(null); }}
            className={`text-[10px] uppercase tracking-widest flex-1 pb-2 transition-colors ${mode === 'login' ? 'text-luxury-gold border-b border-luxury-gold' : 'text-luxury-cream/30'}`}
          >
            Login
          </button>
          <button 
            onClick={() => { setMode('signup'); setError(''); setConfirmationResult(null); }}
            className={`text-[10px] uppercase tracking-widest flex-1 pb-2 transition-colors ${mode === 'signup' ? 'text-luxury-gold border-b border-luxury-gold' : 'text-luxury-cream/30'}`}
          >
            Signup
          </button>
          <button 
            onClick={() => { setMode('phone'); setError(''); setConfirmationResult(null); }}
            className={`text-[10px] uppercase tracking-widest flex-1 pb-2 transition-colors ${mode === 'phone' ? 'text-luxury-gold border-b border-luxury-gold' : 'text-luxury-cream/30'}`}
          >
            Phone
          </button>
        </div>

        {mode !== 'phone' ? (
          <form onSubmit={handleEmailAuth} className="space-y-6">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-luxury-cream/50 ml-6">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full py-4 px-8 text-sm focus:outline-none focus:border-luxury-gold/50 transition-all"
                  placeholder="Enter your name"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-luxury-cream/50 ml-6">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-luxury-cream/20" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-14 pr-8 text-sm focus:outline-none focus:border-luxury-gold/50 transition-all"
                  placeholder="Enter your email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-luxury-cream/50 ml-6">Password</label>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-luxury-cream/20" size={16} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-14 pr-8 text-sm focus:outline-none focus:border-luxury-gold/50 transition-all"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-[10px] uppercase tracking-widest text-center">{error}</p>}

            <button type="submit" disabled={loading} className="w-full gold-button py-5 flex items-center justify-center gap-3">
              {loading ? <Loader2 size={18} className="animate-spin" /> : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={confirmationResult ? handleVerifyOtp : handleSendOtp} className="space-y-6">
            {!confirmationResult ? (
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-luxury-cream/50 ml-6">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-luxury-cream/20" size={16} />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-14 pr-8 text-sm focus:outline-none focus:border-luxury-gold/50 transition-all"
                    placeholder="+91 77358 00239"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-luxury-cream/50 ml-6">Verification Code</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-luxury-cream/20" size={16} />
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-14 pr-8 text-sm focus:outline-none focus:border-luxury-gold/50 transition-all"
                    placeholder="Enter 6-digit OTP"
                  />
                </div>
              </div>
            )}

            {error && <p className="text-red-400 text-[10px] uppercase tracking-widest text-center">{error}</p>}

            <button type="submit" disabled={loading} className="w-full gold-button py-5 flex items-center justify-center gap-3">
              {loading ? <Loader2 size={18} className="animate-spin" /> : confirmationResult ? 'Verify OTP' : 'Send OTP'}
            </button>
          </form>
        )}

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-luxury-black px-4 text-luxury-cream/20">Or continue with</span></div>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white/5 border border-white/10 rounded-full py-4 flex items-center justify-center gap-3 text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          <Chrome size={18} className="text-luxury-gold" />
          Google Sign In
        </button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-12 text-[10px] text-luxury-cream/20 uppercase tracking-[0.5em]"
      >
        Luxury Experience Guaranteed
      </motion.p>
    </div>
  );
}
