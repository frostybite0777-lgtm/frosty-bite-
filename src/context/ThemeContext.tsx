import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { getFirebaseDb } from '../firebase';
import { Campaign, ThemeType } from '../types';

interface ThemeContextType {
  campaign: Campaign | null;
  activeTheme: ThemeType;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const THEMES: Record<ThemeType, { bg: string; accent: string; text: string; secondary: string }> = {
  default: {
    bg: '#0F0F0F',
    accent: '#D4AF37',
    text: '#F8F5F0',
    secondary: '#1A1A1A'
  },
  valentine: {
    bg: '#FFF5F7',
    accent: '#FF4D6D',
    text: '#590D22',
    secondary: '#FFB3C1'
  },
  christmas: {
    bg: '#0B1D12',
    accent: '#D4AF37',
    text: '#F8F5F0',
    secondary: '#8B0000'
  },
  ramadan: {
    bg: '#062C1E',
    accent: '#D4AF37',
    text: '#F8F5F0',
    secondary: '#0A4D34'
  },
  summer: {
    bg: '#FFF8F0',
    accent: '#FF9F1C',
    text: '#2D3142',
    secondary: '#FFBF69'
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [activeTheme, setActiveTheme] = useState<ThemeType>('default');

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) return;

    const unsubscribe = onSnapshot(doc(db, 'settings', 'theme'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Campaign;
        
        // Check if campaign is currently active based on dates
        const now = new Date();
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        
        const isCurrentlyActive = data.active && now >= start && now <= end;
        
        if (isCurrentlyActive) {
          setCampaign(data);
          setActiveTheme(data.theme);
        } else {
          setCampaign(null);
          setActiveTheme('default');
        }
      } else {
        setCampaign(null);
        setActiveTheme('default');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/theme');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const theme = THEMES[activeTheme];
    const root = document.documentElement;
    root.style.setProperty('--bg-color', theme.bg);
    root.style.setProperty('--accent-color', theme.accent);
    root.style.setProperty('--text-color', theme.text);
    root.style.setProperty('--secondary-color', theme.secondary);
    
    // Update body background directly for smooth transition
    document.body.style.backgroundColor = theme.bg;
    document.body.style.color = theme.text;
  }, [activeTheme]);

  return (
    <ThemeContext.Provider value={{ campaign, activeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
