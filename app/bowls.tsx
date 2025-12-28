import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { popularItems } from '../src/data/food';

import { apiJson } from '@/src/utils/api';

type BowlItem = {
  id: string;
  title: string;
  pricePerUnit: number;
  minQty: number;
  isVeg: boolean;
  images: string[];
  inclusions?: string[];
};

type VegFilter = 'all' | 'veg' | 'nonveg';

export default function BowlsScreen() {
  const router = useRouter();

  const [remoteBowls, setRemoteBowls] = useState<BowlItem[] | null>(null);
  const [vegFilter, setVegFilter] = useState<VegFilter>('all');

  useEffect(() => {
    (async () => {
      try {
        const data: any = await apiJson('/api/bowls');
        const bowls = Array.isArray(data?.items) ? (data.items as BowlItem[]) : null;
        setRemoteBowls(bowls);
      } catch {
        try {
          const data: any = await apiJson('/api/catalog/quick');
          const bowlsRaw = Array.isArray(data?.bowls) ? data.bowls : null;
          if (bowlsRaw && bowlsRaw.length > 0) {
            const mapped: BowlItem[] = bowlsRaw.map((b: any) => ({
              id: String(b?.id ?? ''),
              title: String(b?.name ?? b?.title ?? ''),
              pricePerUnit: Math.round(Number(b?.price ?? 0) * 100),
              minQty: Number.isFinite(Number(b?.minQty)) ? Math.max(1, Math.round(Number(b?.minQty))) : 10,
              isVeg: Boolean(b?.isVeg),
              images: [String(b?.image ?? '')].filter(Boolean),
              inclusions: Array.isArray(b?.inclusions) ? b.inclusions : [],
            }));
            setRemoteBowls(mapped.filter((x) => x.id && x.title));
            return;
          }
        } catch {
          // ignore
        }
        setRemoteBowls(null);
      }
    })();
  }, []);

  const bowls = useMemo(() => {
    if (remoteBowls && remoteBowls.length > 0) return remoteBowls;
    return popularItems
      .filter((i) => i.category === 'Bowls')
      .map((i) => ({
        id: i.id,
        title: i.name,
        pricePerUnit: Math.round(Number(i.price ?? 0) * 100),
        minQty: 10,
        isVeg: Boolean(i.isVeg),
        images: [String(i.image ?? '')].filter(Boolean),
      }));
  }, [remoteBowls]);

  const filtered = useMemo(() => {
    if (vegFilter === 'veg') return bowls.filter((b) => b.isVeg);
    if (vegFilter === 'nonveg') return bowls.filter((b) => !b.isVeg);
    return bowls;
  }, [bowls, vegFilter]);

  const money = (paise: any) => {
    const n = Number(paise);
    if (!Number.isFinite(n)) return '0';
    return String(Math.round(n / 100));
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: 40 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F0F0F0', marginRight: 8 }}
        >
          <Text style={{ fontSize: 12 }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700' }}>Bowls</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          {([
            { key: 'all', label: 'All' },
            { key: 'veg', label: 'Veg' },
            { key: 'nonveg', label: 'Non-veg' },
          ] as const).map((x) => {
            const selected = vegFilter === x.key;
            return (
              <TouchableOpacity
                key={x.key}
                activeOpacity={0.9}
                onPress={() => setVegFilter(x.key)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? '#3366FF' : '#E5E7EB',
                  backgroundColor: selected ? '#EEF2FF' : '#FFFFFF',
                  marginRight: 8,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: selected ? '800' : '600', color: '#111827' }}>
                  {x.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {filtered.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.9}
            onPress={() => router.push(`/bowls-details?bowlId=${encodeURIComponent(item.id)}` as any)}
            style={{
              borderRadius: 16,
              padding: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              backgroundColor: '#FFFFFF',
              marginBottom: 12,
              flexDirection: 'row',
            }}
          >
            <Image
              source={{ uri: item.images?.[0] ?? '' }}
              style={{ width: 72, height: 72, borderRadius: 14, backgroundColor: '#EEE' }}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827', flex: 1, paddingRight: 8 }}>
                  {item.title}
                </Text>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: item.isVeg ? '#16A34A' : '#DC2626',
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '800', color: item.isVeg ? '#16A34A' : '#DC2626' }}>
                    {item.isVeg ? 'VEG' : 'NON-VEG'}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>₹{money(item.pricePerUnit)}/bowl</Text>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    backgroundColor: '#F8FAFC',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#111827' }}>
                    Min {item.minQty}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filtered.length === 0 ? (
          <Text style={{ color: '#6B7280', textAlign: 'center', marginTop: 20 }}>
            No bowls available right now.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
