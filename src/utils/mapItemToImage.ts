import { accompanimentsNonVegImages } from '../imageMaps/accompanimentsNonVeg';
import { accompanimentsVegImages } from '../imageMaps/accompanimentsVeg';
import { breadsNonVegImages } from '../imageMaps/breadsNonVeg';
import { breadsVegImages } from '../imageMaps/breadsVeg';
import { dessertsNonVegImages } from '../imageMaps/dessertsNonVeg';
import { dessertsVegImages } from '../imageMaps/dessertsVeg';
import { mainCourseNonVegImages } from '../imageMaps/mainCourseNonVeg';
import { mainCourseVegImages } from '../imageMaps/mainCourseVeg';
import { riceBiryaniNonVegImages } from '../imageMaps/riceBiryaniNonVeg';
import { riceBiryaniVegImages } from '../imageMaps/riceBiryaniVeg';
import { startersNonVegImages } from '../imageMaps/startersNonVeg';
import { startersVegImages } from '../imageMaps/startersVeg';

export type ImageCategory =
  | 'starters'
  | 'main_course'
  | 'rice_biryani'
  | 'breads'
  | 'accompaniments'
  | 'desserts';
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

  if (params.category === 'starters') {
    return params.subcategory === 'veg'
      ? startersVegImages[key] ?? DEFAULT_PLACEHOLDER
      : startersNonVegImages[key] ?? DEFAULT_PLACEHOLDER;
  }

  if (params.category === 'main_course') {
    return params.subcategory === 'veg'
      ? mainCourseVegImages[key] ?? DEFAULT_PLACEHOLDER
      : mainCourseNonVegImages[key] ?? DEFAULT_PLACEHOLDER;
  }

  if (params.category === 'rice_biryani') {
    return params.subcategory === 'veg'
      ? riceBiryaniVegImages[key] ?? DEFAULT_PLACEHOLDER
      : riceBiryaniNonVegImages[key] ?? DEFAULT_PLACEHOLDER;
  }

  if (params.category === 'breads') {
    return params.subcategory === 'veg'
      ? breadsVegImages[key] ?? DEFAULT_PLACEHOLDER
      : breadsNonVegImages[key] ?? DEFAULT_PLACEHOLDER;
  }

  if (params.category === 'accompaniments') {
    return params.subcategory === 'veg'
      ? accompanimentsVegImages[key] ?? DEFAULT_PLACEHOLDER
      : accompanimentsNonVegImages[key] ?? DEFAULT_PLACEHOLDER;
  }

  if (params.category === 'desserts') {
    return params.subcategory === 'veg'
      ? dessertsVegImages[key] ?? DEFAULT_PLACEHOLDER
      : dessertsNonVegImages[key] ?? DEFAULT_PLACEHOLDER;
  }

  return DEFAULT_PLACEHOLDER;
}
