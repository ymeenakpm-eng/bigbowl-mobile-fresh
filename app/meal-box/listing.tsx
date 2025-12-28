import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useCart } from '../../src/contexts/CartContext';

import { apiJson } from '@/src/utils/api';

type Params = {
  type?: string;
  pref?: string;
  budget?: string;
  spice?: string;
};

type Pref = 'veg' | 'non_veg';

type Budget = '99-149' | '150-199' | '200+';

type Spice = 'mild' | 'medium' | 'spicy';

type MealType = 'single' | 'family' | 'office';

type Box = {
  id: string;
  title: string;
  includes: string;
  serves: string;
  price: number;
  tag?: string;
  isVeg: boolean;
  spice: Spice;
  mealType: MealType;
};

const BOXES: Box[] = [
  {
    id: 'mb1',
    title: 'Andhra Veg Meal Box',
    includes: 'Rice, dal, curry, fry, curd',
    serves: '1',
    price: 159,
    tag: 'Best seller',
    isVeg: true,
    spice: 'medium',
    mealType: 'single',
  },
  {
    id: 'mb2',
    title: 'Chicken Meal Box',
    includes: 'Rice, chicken curry, fry, pickle',
    serves: '1',
    price: 199,
    tag: 'Spicy',
    isVeg: false,
    spice: 'spicy',
    mealType: 'single',
  },
  {
    id: 'mb5',
    title: 'Paneer Special Meal Box',
    includes: 'Rice, paneer curry, dal, salad, curd',
    serves: '1',
    price: 189,
    tag: 'Premium veg',
    isVeg: true,
    spice: 'medium',
    mealType: 'single',
  },
  {
    id: 'mb6',
    title: 'Egg Curry Meal Box',
    includes: 'Rice, egg curry, fry, pickle',
    serves: '1',
    price: 179,
    tag: 'High protein',
    isVeg: false,
    spice: 'medium',
    mealType: 'single',
  },
  {
    id: 'mb3',
    title: 'Family Veg Feast',
    includes: 'Biryani, curry, starter, dessert',
    serves: '2–3',
    price: 399,
    tag: 'Family',
    isVeg: true,
    spice: 'medium',
    mealType: 'family',
  },
  {
    id: 'mb7',
    title: 'Family Chicken Feast',
    includes: 'Chicken biryani, curry, starter, dessert',
    serves: '2–3',
    price: 499,
    tag: 'Family',
    isVeg: false,
    spice: 'spicy',
    mealType: 'family',
  },
  {
    id: 'mb8',
    title: 'Family Mixed Feast',
    includes: 'Veg + chicken biryani, curries, starter, dessert',
    serves: '3–4',
    price: 549,
    tag: 'Value',
    isVeg: false,
    spice: 'medium',
    mealType: 'family',
  },
  {
    id: 'mb4',
    title: 'Office Lunch Combo',
    includes: 'Rice, curry, fry, buttermilk',
    serves: '1',
    price: 179,
    tag: 'Quick',
    isVeg: true,
    spice: 'mild',
    mealType: 'office',
  },
  {
    id: 'mb9',
    title: 'Office Veg Thali Box',
    includes: 'Rice, dal, 2 veg curries, roti, salad',
    serves: '1',
    price: 199,
    tag: 'Office',
    isVeg: true,
    spice: 'mild',
    mealType: 'office',
  },
  {
    id: 'mb10',
    title: 'Office Chicken Curry Box',
    includes: 'Rice/roti, chicken curry, fry, salad',
    serves: '1',
    price: 219,
    tag: 'Office',
    isVeg: false,
    spice: 'medium',
    mealType: 'office',
  },
];

export default function MealBoxListingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const { addToCart } = useCart();

  const [remoteBoxes, setRemoteBoxes] = useState<Box[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoadError(false);
        const data: any = await apiJson('/api/catalog/quick');
        const boxes = Array.isArray(data?.mealBoxes) ? (data.mealBoxes as Box[]) : null;
        setRemoteBoxes(boxes);
        if (!boxes) setLoadError(true);
      } catch {
        setRemoteBoxes(null);
        setLoadError(true);
      }
    })();
  }, []);

  const pref = (params.pref ? String(params.pref) : null) as Pref | null;
  const budget = (params.budget ? String(params.budget) : null) as Budget | null;
  const spice = (params.spice ? String(params.spice) : null) as Spice | null;
  const type = (params.type ? String(params.type) : null) as MealType | null;

  const subtitle = useMemo(() => {
    const parts: string[] = [];
    if (pref) parts.push(pref.replace('_', '-'));
    if (budget) parts.push(`Budget ${budget}`);
    if (spice) parts.push(String(spice));
    if (type) parts.push(String(type));
    return parts.join(' • ');
  }, [budget, pref, spice, type]);

  const filteredBoxes = useMemo(() => {
    const list = remoteBoxes && remoteBoxes.length > 0 ? remoteBoxes : BOXES;
    return list.filter((b) => {
      if (pref === 'veg' && !b.isVeg) return false;
      if (pref === 'non_veg' && b.isVeg) return false;

      if (spice && b.spice !== spice) return false;
      if (type && b.mealType !== type) return false;

      if (budget === '99-149' && b.price > 149) return false;
      if (budget === '150-199' && (b.price < 150 || b.price > 199)) return false;
      if (budget === '200+' && b.price < 200) return false;

      return true;
    });
  }, [budget, pref, remoteBoxes, spice, type]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: 40 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F0F0F0', marginRight: 8 }}
        >
          <Text style={{ fontSize: 12 }}>Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '700' }}>Meal Boxes</Text>
          {subtitle ? <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{subtitle}</Text> : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {loadError ? (
          <View style={{ borderRadius: 14, padding: 12, backgroundColor: '#FEF3C7', marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: '#7C2D12', fontWeight: '700' }}>Can’t reach server</Text>
            <Text style={{ fontSize: 11, color: '#7C2D12', marginTop: 4 }}>
              Showing default meal boxes. Set the API Base URL in Account tab for live catalog.
            </Text>
          </View>
        ) : null}

        {filteredBoxes.length === 0 ? (
          <View style={{ borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 6 }}>No meal boxes found</Text>
            <Text style={{ fontSize: 12, color: '#6B7280' }}>Try changing your preference, spice, or budget.</Text>
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.9}
              style={{ marginTop: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: '#111827', alignItems: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Change filters</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {filteredBoxes.map((b) => (
          <View
            key={b.id}
            style={{
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              backgroundColor: '#FFFFFF',
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827', flex: 1, paddingRight: 8 }}>{b.title}</Text>
              {b.tag ? (
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: '#F3E8FF' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#4C1D95' }}>{b.tag}</Text>
                </View>
              ) : null}
            </View>
            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>{b.includes}</Text>
            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Serves: {b.serves}</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>Rs {b.price}</Text>
              <TouchableOpacity
                onPress={() => {
                  addToCart({ name: b.title, price: b.price });
                  router.push('/cart' as any);
                }}
                activeOpacity={0.9}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#3366FF' }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
