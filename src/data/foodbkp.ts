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

export const popularItems: FoodItem[] = [
  {
    id: 'b1',
    name: 'Chicken Dum Biryani',
    description:
      'Aromatic basmati rice cooked with succulent chicken and authentic spices',
    price: 299,
    image:
      'https://www.licious.in/blog/wp-content/uploads/2022/06/chicken-hyderabadi-biryani-01.jpg',
    category: 'Biryani',
    rating: 4.8,
    isVeg: false,
    prepTime: '30-35 min',
  },
  {
    id: 'b2',
    name: 'Veg Biryani',
    description:
      'Fragrant basmati rice with mixed vegetables and aromatic spices',
    price: 249,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8',
    category: 'Biryani',
    rating: 4.5,
    isVeg: true,
    prepTime: '25-30 min',
  },
  {
    id: 'b3',
    name: 'Mutton Biryani',
    description: 'Flavorful basmati rice with tender mutton pieces and spices',
    price: 349,
    image:
      'https://www.licious.in/blog/wp-content/uploads/2022/03/Mutton-Biryani-Recipe-1.jpg',
    category: 'Biryani',
    rating: 4.7,
    isVeg: false,
    prepTime: '35-40 min',
  },
  {
    id: 'b4',
    name: 'Egg Biryani',
    description: 'Aromatic rice with boiled eggs and special spices',
    price: 229,
    image:
      'https://www.archanaskitchen.com/images/archanaskitchen/1-Author/Neha_Mathur/Anda_Biryani_Recipe_Egg_Biryani.jpg',
    category: 'Biryani',
    rating: 4.4,
    isVeg: false,
    prepTime: '25-30 min',
  },
  {
    id: 'b5',
    name: 'Veg Pulao',
    description:
      'Light and fragrant basmati rice cooked with mixed vegetables and whole spices',
    price: 199,
    image:
      'https://img.freepik.com/free-photo/veg-pulao-basmati-rice-cooked-with-vegetables-herbs_1150-26585.jpg',
    category: 'Biryani',
    rating: 4.3,
    isVeg: true,
    prepTime: '20-25 min',
  },
  {
    id: 'n1',
    name: 'Butter Chicken',
    description: 'Tender chicken in rich tomato and butter gravy',
    price: 349,
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398',
    category: 'North Indian',
    rating: 4.7,
    isVeg: false,
    prepTime: '25-30 min',
  },
  {
    id: 'n2',
    name: 'Paneer Tikka Masala',
    description: 'Grilled cottage cheese in spicy tomato gravy',
    price: 299,
    image: 'https://images.unsplash.com/photo-1633346541562-9f5e188a7844',
    category: 'North Indian',
    rating: 4.6,
    isVeg: true,
    prepTime: '20-25 min',
  },
  {
    id: 'n3',
    name: 'Dal Makhani',
    description: 'Creamy black lentils slow-cooked with butter and cream',
    price: 249,
    image:
      'https://www.vegrecipesofindia.com/wp-content/uploads/2020/01/dal-makhani-1.jpg',
    category: 'North Indian',
    rating: 4.5,
    isVeg: true,
    prepTime: '20-25 min',
  },
  {
    id: 'n4',
    name: 'Chole Bhature',
    description: 'Spicy chickpea curry with fried bread',
    price: 199,
    image:
      'https://www.whiskaffair.com/wp-content/uploads/2020/08/Chole-Bhature-1-1.jpg',
    category: 'North Indian',
    rating: 4.6,
    isVeg: true,
    prepTime: '20-25 min',
  },
  {
    id: 's1',
    name: 'Masala Dosa',
    description: 'Crispy rice crepe with spiced potato filling',
    price: 199,
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc',
    category: 'South Indian',
    rating: 4.6,
    isVeg: true,
    prepTime: '15-20 min',
  },
  {
    id: 's2',
    name: 'Idli Sambar',
    description: 'Steamed rice cakes with lentil soup and chutney',
    price: 149,
    image:
      'https://www.indianhealthyrecipes.com/wp-content/uploads/2022/03/idli-sambar-recipe.jpg',
    category: 'South Indian',
    rating: 4.4,
    isVeg: true,
    prepTime: '10-15 min',
  },
  {
    id: 's3',
    name: 'Vada Sambar',
    description: 'Crispy lentil donuts with spicy lentil soup',
    price: 159,
    image:
      'https://www.indianhealthyrecipes.com/wp-content/uploads/2021/06/vada-sambar-recipe.jpg',
    category: 'South Indian',
    rating: 4.5,
    isVeg: true,
    prepTime: '15-20 min',
  },
  {
    id: 's4',
    name: 'Pongal',
    description: 'Creamy rice and lentil porridge with ghee',
    price: 179,
    image:
      'https://www.indianhealthyrecipes.com/wp-content/uploads/2021/01/ven-pongal-recipe.jpg',
    category: 'South Indian',
    rating: 4.3,
    isVeg: true,
    prepTime: '20-25 min',
  },
  {
    id: 'c1',
    name: 'Veg Fried Rice',
    description: 'Stir-fried rice with mixed vegetables and soy sauce',
    price: 199,
    image: 'https://images.unsplash.com/photo-1572453800999-e8d2d1579a24',
    category: 'Chinese',
    rating: 4.3,
    isVeg: true,
    prepTime: '15-20 min',
  },
  {
    id: 'c2',
    name: 'Chicken Noodles',
    description: 'Stir-fried noodles with chicken and vegetables',
    price: 249,
    image:
      'https://www.archanaskitchen.com/images/archanaskitchen/1-Author/shaikhazraa/Chicken_Hakka_Noodles_Recipe.jpg',
    category: 'Chinese',
    rating: 4.5,
    isVeg: false,
    prepTime: '15-20 min',
  },
  {
    id: 'c3',
    name: 'Manchurian',
    description: 'Fried vegetable balls in sweet and spicy sauce',
    price: 219,
    image:
      'https://www.vegrecipesofindia.com/wp-content/uploads/2020/01/veg-manchurian-1.jpg',
    category: 'Chinese',
    rating: 4.4,
    isVeg: true,
    prepTime: '20-25 min',
  },
  {
    id: 'd1',
    name: 'Gulab Jamun',
    description: 'Soft milk dumplings in sugar syrup',
    price: 129,
    image:
      'https://images.unsplash.com/photo-1601050690597-df0568f70950',
    category: 'Desserts',
    rating: 4.8,
    isVeg: true,
    prepTime: '10-15 min',
  },
  {
    id: 'd2',
    name: 'Rasmalai',
    description: 'Soft cheese dumplings in sweetened milk',
    price: 149,
    image:
      'https://www.vegrecipesofindia.com/wp-content/uploads/2014/11/rasmalai-recipe-4.jpg',
    category: 'Desserts',
    rating: 4.7,
    isVeg: true,
    prepTime: '15-20 min',
  },
  {
    id: 'd3',
    name: 'Kaju Katli',
    description: 'Diamond-shaped cashew fudge',
    price: 399,
    image:
      'https://www.vegrecipesofindia.com/wp-content/uploads/2020/12/kaju-katli-recipe-1-1024x1536.jpg',
    category: 'Desserts',
    rating: 4.9,
    isVeg: true,
    prepTime: '30-35 min',
  },
];