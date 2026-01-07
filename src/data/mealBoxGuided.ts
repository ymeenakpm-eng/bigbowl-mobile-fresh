export type MealBoxCategoryKey = 'starters' | 'main_course' | 'rice_biryani' | 'breads' | 'desserts';

export type MealBoxTypeKey = 'veg' | 'premium_veg' | 'non_veg' | 'premium_non_veg';

export type MealBoxItem = {
  id: string;
  name: string;
  isVeg: boolean;
  category: MealBoxCategoryKey;
};

export const MEAL_BOX_TYPES: { key: MealBoxTypeKey; title: string; pricePerBoxRupees: number; isVeg: boolean }[] = [
  { key: 'veg', title: 'Veg Meal Box', pricePerBoxRupees: 249, isVeg: true },
  { key: 'premium_veg', title: 'Premium Veg Meal Box', pricePerBoxRupees: 349, isVeg: true },
  { key: 'non_veg', title: 'Non-Veg Meal Box', pricePerBoxRupees: 299, isVeg: false },
  { key: 'premium_non_veg', title: 'Premium Non-Veg Meal Box', pricePerBoxRupees: 399, isVeg: false },
];

export const MEAL_BOX_CATEGORIES: { key: MealBoxCategoryKey; title: string; limit: number }[] = [
  { key: 'starters', title: 'Starters', limit: 1 },
  { key: 'main_course', title: 'Main Course', limit: 2 },
  { key: 'rice_biryani', title: 'Rice / Biryani', limit: 1 },
  { key: 'breads', title: 'Bread', limit: 1 },
  { key: 'desserts', title: 'Dessert', limit: 1 },
];

export const MEAL_BOX_ITEMS: MealBoxItem[] = [
  { id: 'st_paneer_tikka', name: 'Paneer Tikka', isVeg: true, category: 'starters' },
  { id: 'st_gobi_manchurian', name: 'Gobi Manchurian', isVeg: true, category: 'starters' },
  { id: 'st_crispy_corn', name: 'Crispy Corn', isVeg: true, category: 'starters' },

  { id: 'st_chicken_65', name: 'Chicken 65', isVeg: false, category: 'starters' },
  { id: 'st_chicken_tikka', name: 'Chicken Tikka', isVeg: false, category: 'starters' },

  { id: 'mc_paneer_butter_masala', name: 'Paneer Butter Masala', isVeg: true, category: 'main_course' },
  { id: 'mc_dal_makhani', name: 'Dal Makhani', isVeg: true, category: 'main_course' },
  { id: 'mc_chole_masala', name: 'Chole Masala', isVeg: true, category: 'main_course' },

  { id: 'mc_butter_chicken', name: 'Butter Chicken', isVeg: false, category: 'main_course' },
  { id: 'mc_chicken_curry', name: 'Chicken Curry', isVeg: false, category: 'main_course' },

  { id: 'rb_veg_biryani', name: 'Veg Biryani', isVeg: true, category: 'rice_biryani' },
  { id: 'rb_jeera_rice', name: 'Jeera Rice', isVeg: true, category: 'rice_biryani' },

  { id: 'rb_chicken_biryani', name: 'Chicken Biryani', isVeg: false, category: 'rice_biryani' },

  { id: 'br_tandoori_roti', name: 'Tandoori Roti', isVeg: true, category: 'breads' },
  { id: 'br_butter_naan', name: 'Butter Naan', isVeg: true, category: 'breads' },

  { id: 'ds_gulab_jamun', name: 'Gulab Jamun', isVeg: true, category: 'desserts' },
  { id: 'ds_rasmalai', name: 'Rasmalai', isVeg: true, category: 'desserts' },
];

export function getMealBoxCategoryLimit(key: MealBoxCategoryKey): number {
  const c = MEAL_BOX_CATEGORIES.find((x) => x.key === key);
  return c ? c.limit : 0;
}

export function isMealBoxSelectionComplete(selection: Record<MealBoxCategoryKey, string[]>): boolean {
  for (const cat of MEAL_BOX_CATEGORIES) {
    const chosen = Array.isArray(selection?.[cat.key]) ? selection[cat.key] : [];
    if (chosen.length !== cat.limit) return false;
  }
  return true;
}
