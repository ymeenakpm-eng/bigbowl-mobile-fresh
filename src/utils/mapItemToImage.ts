import { startersVegImages } from '../imageMaps/startersVeg';

export type ImageCategory = 'starters';
export type ImageSubcategory = 'veg' | 'non_veg';

const DEFAULT_PLACEHOLDER = require('../../assets/images/food-1.png');

export function normalizeItemKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function mapItemToImage(params: {
  itemName: string;
  category: ImageCategory;
  subcategory: ImageSubcategory;
}): number {
  const key = normalizeItemKey(params.itemName);

  if (params.category === 'starters' && params.subcategory === 'veg') {
    return startersVegImages[key] ?? DEFAULT_PLACEHOLDER;
  }

  return DEFAULT_PLACEHOLDER;
}
