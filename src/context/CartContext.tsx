import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { useAuth } from './AuthContext';
import { getFirebaseDb } from '../firebase';
import { CartItem, Dessert } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (dessert: Dessert, quantity: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load cart from Firestore on login
  useEffect(() => {
    const db = getFirebaseDb();
    if (user && db) {
      const cartRef = doc(db, 'carts', user.uid);
      
      const unsubscribe = onSnapshot(cartRef, (docSnap) => {
        if (docSnap.exists() && !isSyncing) {
          setCart(docSnap.data().items || []);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `carts/${user.uid}`);
      });

      return () => unsubscribe();
    } else if (!user) {
      // Load from localStorage for guests
      const savedCart = localStorage.getItem('cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    }
  }, [user]);

  // Sync cart to Firestore/localStorage on change
  useEffect(() => {
    const syncCart = async () => {
      const db = getFirebaseDb();
      if (user && db) {
        setIsSyncing(true);
        try {
          await setDoc(doc(db, 'carts', user.uid), { items: cart });
        } catch (error) {
          console.error("Error syncing cart:", error);
        } finally {
          setIsSyncing(false);
        }
      } else {
        localStorage.setItem('cart', JSON.stringify(cart));
      }
    };

    const timeoutId = setTimeout(syncCart, 500); // Debounce sync
    return () => clearTimeout(timeoutId);
  }, [cart, user]);

  const addToCart = (dessert: Dessert, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === dessert.id);
      if (existing) {
        return prev.map(item => 
          item.id === dessert.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...dessert, quantity }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
