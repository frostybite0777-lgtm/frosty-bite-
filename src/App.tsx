/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import Intro from './components/Intro';
import Home from './pages/Home';
import DessertDetail from './pages/DessertDetail';
import Cart from './pages/Cart';
import Payment from './pages/Payment';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Admin from './pages/Admin';
import Collections from './pages/Collections';
import Login from './pages/Login';

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function AppContent() {
  const [showIntro, setShowIntro] = useState(true);
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      {showIntro ? (
        <Intro key="intro" onComplete={() => setShowIntro(false)} />
      ) : (
        <Layout key="main">
          <Toaster position="top-center" reverseOrder={false} />
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageTransition><Home /></PageTransition>} />
              <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
              <Route path="/dessert/:id" element={<PageTransition><DessertDetail /></PageTransition>} />
              <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
              <Route path="/payment" element={<PageTransition><ProtectedRoute><Payment /></ProtectedRoute></PageTransition>} />
              <Route path="/orders" element={<PageTransition><ProtectedRoute><Orders /></ProtectedRoute></PageTransition>} />
              <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/:tab" element={<Admin />} />
              <Route path="/collections" element={<PageTransition><Collections /></PageTransition>} />
              <Route path="/chef" element={<PageTransition><Home /></PageTransition>} />
            </Routes>
          </AnimatePresence>
        </Layout>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <CartProvider>
            <Router>
              <ScrollToTop />
              <AppContent />
            </Router>
          </CartProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
