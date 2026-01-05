import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useCart } from '../../src/contexts/CartContext';

import { BlackBackHeader } from '@/components/BlackBackHeader';

import { apiJson } from '@/src/utils/api';

type Params = {
  occ?: string;
  people?: string;
};

type SnackBox = {
  id: string;
  title: string;
  includes: string;
  serves: string;
  price: number;
};

const BOXES: SnackBox[] = [
  { id: 'sb1', title: 'Punugulu Pack', includes: 'Punugulu + chutney + sambar', serves: '2–3', price: 129 },
  { id: 'sb2', title: 'Samosa & Chai Combo', includes: '4 samosas + 2 chai', serves: '2', price: 149 },
  { id: 'sb3', title: 'Office Snacks Box', includes: 'Sandwich + fries + juice', serves: '1', price: 179 },
  { id: 'sb4', title: 'Kids Party Mini Box', includes: 'Burger + fries + brownie', serves: '1', price: 199 },
  { id: 'sb5', title: 'Mirchi Bajji Box', includes: 'Mirchi bajji + chutney', serves: '2–3', price: 139 },
  { id: 'sb6', title: 'Pakoda & Chai Combo', includes: 'Onion pakoda + 2 chai', serves: '2', price: 159 },
  { id: 'sb7', title: 'Veg Cutlet Snack Box', includes: 'Cutlets + fries + dips', serves: '2', price: 189 },
  { id: 'sb8', title: 'Chicken 65 Snack Box', includes: 'Chicken 65 + salad + dips', serves: '2', price: 249 },
  { id: 'sb9', title: 'Mixed Starters Platter', includes: 'Veg + non-veg starters + dips', serves: '3–5', price: 499 },
];

export default function SnackBoxListingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const { addToCart } = useCart();

  const [remoteBoxes, setRemoteBoxes] = useState<SnackBox[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data: any = await apiJson('/api/catalog/quick');
        const boxes = Array.isArray(data?.snackBoxes) ? (data.snackBoxes as SnackBox[]) : null;
        setRemoteBoxes(boxes);
      } catch {
        setRemoteBoxes(null);
      }
    })();
  }, []);

  const subtitle = useMemo(() => {
    const parts: string[] = [];
    if (params.occ) parts.push(String(params.occ));
    if (params.people) parts.push(`People ${params.people}`);
    return parts.join(' • ');
  }, [params]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <BlackBackHeader title="Snack Boxes" subtitle={subtitle || null} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {(remoteBoxes ?? BOXES).map((b) => (
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
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 6 }}>{b.title}</Text>
            <Text style={{ fontSize: 12, color: '#6B7280' }}>{b.includes}</Text>
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
