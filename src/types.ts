export interface Dessert {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  image: string;
  category: 'featured' | 'trending' | 'chef' | 'festival';
  ingredients: string[];
  reviews: Review[];
  chefNote?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

export interface CartItem extends Dessert {
  quantity: number;
}

export interface User {
  name: string;
  email: string;
  loyaltyPoints: number;
  isVIP: boolean;
}

export type ThemeType = 'default' | 'valentine' | 'christmas' | 'ramadan' | 'summer';

export interface Campaign {
  active: boolean;
  theme: ThemeType;
  bannerImage: string;
  promoText: string;
  startDate: string;
  endDate: string;
}

export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: CartItem[];
  total: number;
  address: string;
  latitude?: number;
  longitude?: number;
  status: string;
  createdAt: any;
  updatedAt: any;
}
