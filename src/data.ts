import { Dessert } from './types';

export const DESSERTS: Dessert[] = [
  {
    id: '1',
    name: 'Golden Velvet Macaron',
    description: 'A delicate almond shell filled with 24k gold-infused white chocolate ganache and Madagascar vanilla.',
    price: 450,
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=800',
    category: 'featured',
    ingredients: ['Almond Flour', 'Egg Whites', '24k Gold Leaf', 'Madagascar Vanilla', 'White Chocolate'],
    reviews: [
      { id: 'r1', user: 'Alexandra V.', rating: 5, comment: 'The most exquisite macaron I have ever tasted. Pure luxury.', date: '2024-03-01' }
    ]
  },
  {
    id: '2',
    name: 'Midnight Truffle Cake',
    description: 'Layers of 70% dark Belgian chocolate sponge and silk truffle cream, topped with edible gold dust.',
    price: 1200,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800',
    category: 'trending',
    ingredients: ['Belgian Dark Chocolate', 'Heavy Cream', 'Organic Cocoa', 'Gold Dust'],
    reviews: [
      { id: 'r2', user: 'Julian R.', rating: 5, comment: 'Rich, decadent, and absolutely stunning presentation.', date: '2024-02-28' }
    ]
  },
  {
    id: '3',
    name: 'Champagne Rose Tart',
    description: 'Crisp buttery pastry filled with Dom Pérignon infused rosewater custard and fresh organic raspberries.',
    price: 850,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&q=80&w=800',
    category: 'chef',
    ingredients: ['Dom Pérignon', 'Rosewater', 'Organic Raspberries', 'French Butter'],
    reviews: [],
    chefNote: 'The delicate balance of champagne and rose is the highlight of this seasonal masterpiece.'
  },
  {
    id: '4',
    name: 'Saffron Pistachio Delight',
    description: 'Persian saffron infused sponge with crushed Sicilian pistachios and a honey-gold glaze.',
    price: 950,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=800',
    category: 'festival',
    ingredients: ['Persian Saffron', 'Sicilian Pistachios', 'Wildflower Honey', 'Gold Glaze'],
    reviews: []
  },
  {
    id: '5',
    name: 'Crystal Berry Mousse',
    description: 'Light-as-air wild berry mousse encased in a clear sugar glass dome.',
    price: 650,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&q=80&w=800',
    category: 'featured',
    ingredients: ['Wild Berries', 'Sugar Glass', 'Organic Cream'],
    reviews: []
  },
  {
    id: '6',
    name: 'Opal White Forest',
    description: 'White chocolate shavings over kirsch-soaked cherries and chantilly cream.',
    price: 1100,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&q=80&w=800',
    category: 'trending',
    ingredients: ['White Chocolate', 'Kirsch', 'Morello Cherries'],
    reviews: []
  }
];
