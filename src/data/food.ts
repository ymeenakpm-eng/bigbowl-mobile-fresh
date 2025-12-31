export type Category = {
  id: string;
  name: string;
  icon: string;
};

export type FoodItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  isVeg: boolean;
  prepTime: string;
};

export const categories: Category[] = [
  { id: '1', name: 'All', icon: 'food' },
  { id: '2', name: 'Breakfast', icon: 'coffee' },
  { id: '3', name: 'Snacks', icon: 'food-variant' },
  { id: '4', name: 'Lunch', icon: 'silverware-fork-knife' },
  { id: '5', name: 'Dinner', icon: 'silverware' },
];

export const hyderabadItems: FoodItem[] = [
  // BIRYANIS
  
  {
    id: 'hyd-biryani-veg-family',
    name: 'BigBowl Veg Biryani Box',
    description: 'Dum veg biryani with mirchi ka salan & raita for 4–5 guests.',
    price: 899,
    category: 'Biryani',
    image:
      'https://images.unsplash.com/photo-1604908176997-1251884b08a0?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    isVeg: true,
    prepTime: '35-40 min',
  },
  {
    id: 'hyd-biryani-chicken-family',
    name: 'Signature Chicken Biryani Feast',
    description: 'Classic chicken dum biryani with double masala, salan & raita.',
    price: 1099,
    category: 'Biryani',
    image:
      'https://images.unsplash.com/photo-1604908554168-3cd9e1d5d655?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    isVeg: false,
    prepTime: '40-45 min',
  },
  {
    id: 'hyd-biryani-mixed',
    name: 'Veg & Chicken Biryani Combo',
    description: 'Half veg, half chicken biryani box for mixed groups.',
    price: 1299,
    category: 'Biryani',
    image:
      'https://images.unsplash.com/photo-1608924888495-5c7b9f1d9d3c?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    isVeg: false,
    prepTime: '40-45 min',
  },

  // STARTERS
  {
    id: 'hyd-starter-paneer',
    name: 'Tandoori Paneer Platter',
    description: 'Paneer tikka, hariyali tikka & malai tikka with mint chutney.',
    price: 749,
    category: 'Starters',
    image:
      'https://images.unsplash.com/photo-1604908176997-1251884b08a0?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    isVeg: true,
    prepTime: '25-30 min',
  },
  {
    id: 'hyd-starter-chicken',
    name: 'Spicy Chicken Starters Box',
    description: 'Chicken 65, lollipops & tikka skewers for party snacking.',
    price: 899,
    category: 'Starters',
    image:
      'https://images.unsplash.com/photo-1608038509085-7bb9d5c0d4be?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    isVeg: false,
    prepTime: '25-30 min',
  },
  {
    id: 'hyd-starter-mixed',
    name: 'Veg & Non-Veg Starter Medley',
    description: 'Mix of veg cutlets, paneer tikka & chicken bites.',
    price: 999,
    category: 'Starters',
    image:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    isVeg: false,
    prepTime: '25-30 min',
  },

  // BREAKFAST BOXES
  {
    id: 'hyd-breakfast-south',
    name: 'South Indian Breakfast Box',
    description: 'Idli, vada, upma, chutneys & sambar – ideal for office mornings.',
    price: 299,
    category: 'Breakfast',
    image:
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    rating: 4.5,
    isVeg: true,
    prepTime: '20-25 min',
  },
  {
    id: 'hyd-breakfast-combo',
    name: 'BigBowl Vijayawada Breakfast Combo',
    description: 'Mini idli, pongal, poori bhaji & filter coffee cups (addons).',
    price: 349,
    category: 'Breakfast',
    image:
      'https://images.unsplash.com/photo-1625944229409-3e77c9a93d1b?auto=format&fit=crop&w=800&q=80',
    rating: 4.5,
    isVeg: true,
    prepTime: '20-25 min',
  },

  // COMBO MEALS
  {
    id: 'hyd-combo-northveg',
    name: 'North Indian Veg Party Combo',
    description: 'Paneer curry, dal, jeera rice, rotis, salad & gulab jamun.',
    price: 399,
    category: 'Combos',
    image:
      'https://images.unsplash.com/photo-1625945277069-2f1c9c6b2217?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    isVeg: true,
    prepTime: '25-30 min',
  },
  {
    id: 'hyd-combo-nonveg',
    name: 'Chicken Curry Combo Box',
    description: 'Homestyle chicken curry, rice/roti, salad & dessert.',
    price: 429,
    category: 'Combos',
    image:
      'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    isVeg: false,
    prepTime: '25-30 min',
  },

  // DESSERTS
  {
    id: 'hyd-dessert-gulab',
    name: 'Warm Gulab Jamun Box',
    description: 'Soft jamuns in sugar syrup, ready to serve for your guests.',
    price: 249,
    category: 'Desserts',
    image:
      'https://images.unsplash.com/photo-1631452180519-557027c63e60?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    isVeg: true,
    prepTime: '15-20 min',
  },
  {
    id: 'hyd-dessert-kheer',
    name: 'Kesar Badam Kheer',
    description: 'Slow-cooked rice kheer with saffron & almonds.',
    price: 299,
    category: 'Desserts',
    image:
      'https://images.unsplash.com/photo-1606318620273-95b03f3999b8?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    isVeg: true,
    prepTime: '20-25 min',
  },

  // PARTY BOXES
  {
    id: 'box-party-10',
    name: 'BigBowl Party Box (10 Guests)',
    description: 'Veg & chicken biryani, starters and dessert for your house party.',
    price: 3999,
    category: 'Party Boxes',
    image:
      'https://images.unsplash.com/photo-1604908176997-1251884b08a0?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    isVeg: false,
    prepTime: '1 day pre-order',
  },
  {
    id: 'box-party-veg',
    name: 'Veg Celebration Box (12 Guests)',
    description: 'Veg biryani, paneer starters and sweets for small get-togethers.',
    price: 3699,
    category: 'Party Boxes',
    image:
      'https://images.unsplash.com/photo-1625945277069-2f1c9c6b2217?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    isVeg: true,
    prepTime: '1 day pre-order',
  },

  // MEAL BOXES
  {
    id: 'box-meal-office',
    name: 'Office Lunch Meal Box',
    description: 'Dal, sabzi, rice, roti and dessert packed as individual meal boxes.',
    price: 249,
    category: 'Meal Boxes',
    image:
      'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
    rating: 4.5,
    isVeg: true,
    prepTime: '20-30 min',
  },
  {
    id: 'box-meal-homestyle',
    name: 'Homestyle Curry Meal Box',
    description: 'Choice of veg/non-veg curry with rice/roti, salad and sweet.',
    price: 279,
    category: 'Meal Boxes',
    image:
      'https://images.unsplash.com/photo-1625944229409-3e77c9a93d1b?auto=format&fit=crop&w=800&q=80',
    rating: 4.5,
    isVeg: false,
    prepTime: '25-30 min',
  },
  {
    id: 'box-meal-paneer',
    name: 'Paneer Meal Box',
    description: 'Paneer curry, dal, rice/roti, salad and dessert.',
    price: 299,
    category: 'Meal Boxes',
    image:
      'https://images.unsplash.com/photo-1604908176997-1251884b08a0?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    isVeg: true,
    prepTime: '25-30 min',
  },
  {
    id: 'box-meal-chicken',
    name: 'Chicken Curry Meal Box',
    description: 'Chicken curry with rice/roti, salad and sweet.',
    price: 329,
    category: 'Meal Boxes',
    image:
      'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    isVeg: false,
    prepTime: '30-35 min',
  },

  // SNACK BOXES
  {
    id: 'box-snack-starters',
    name: 'Starter Snack Box',
    description: 'Mix of paneer bites, veg cutlets and fries for 10–12 guests.',
    price: 2299,
    category: 'Snack Boxes',
    image:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    isVeg: true,
    prepTime: '30-40 min',
  },
  {
    id: 'box-snack-mixed',
    name: 'Mixed Snack Platter Box',
    description: 'Veg and chicken starters with dips for your evening gatherings.',
    price: 2599,
    category: 'Snack Boxes',
    image:
      'https://images.unsplash.com/photo-1608038509085-7bb9d5c0d4be?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    isVeg: false,
    prepTime: '30-40 min',
  },
  {
    id: 'box-snack-veg-teatime',
    name: 'Tea-time Veg Snack Box',
    description: 'Samosa, pakoda, chutneys and dessert bites for small groups.',
    price: 1799,
    category: 'Snack Boxes',
    image:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    rating: 4.5,
    isVeg: true,
    prepTime: '25-35 min',
  },
  {
    id: 'box-snack-nonveg',
    name: 'Chicken Starters Snack Box',
    description: 'Chicken 65, lollipops, fries and dips for 8–10 guests.',
    price: 2899,
    category: 'Snack Boxes',
    image:
      'https://images.unsplash.com/photo-1608038509085-7bb9d5c0d4be?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    isVeg: false,
    prepTime: '30-40 min',
  },
];

export const popularItems: FoodItem[] = hyderabadItems.filter((i) => i.category !== 'Bowls');