import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
 
import { BlackBackHeader } from '@/components/BlackBackHeader';

import { apiJson } from '@/src/utils/api';

type BoxType = 'standard' | 'premium' | 'custom';

type Params = {
  guests?: string;
  occ?: string;
  pref?: string;
  date?: string;
  eventDate?: string;
  time?: string;
};

type Tier = {
  key: BoxType;
  title: string;
  subtitle: string;
  perPlate: number;
  rules: Record<string, number>;
  packageId: string;
};

const FALLBACK_TIERS: Tier[] = [
  {
    key: 'standard',
    title: 'Standard Party Box',
    subtitle: 'Value picks • Great for birthdays & small functions',
    perPlate: 24900,
    rules: { Starters: 2, 'Main Course': 2, 'Rice / Biryani': 1, Breads: 1, Accompaniments: 1, Desserts: 1 },
    packageId: '',
  },
  {
    key: 'premium',
    title: 'Premium Party Box',
    subtitle: 'Best sellers • Extra starters & desserts',
    perPlate: 34900,
    rules: { Starters: 3, 'Main Course': 3, 'Rice / Biryani': 1, Breads: 2, Accompaniments: 2, Desserts: 2 },
    packageId: '',
  },
  {
    key: 'custom',
    title: 'Custom Party Box',
    subtitle: 'Build your own menu • Choose every item',
    perPlate: 39900,
    rules: { Starters: 2, 'Main Course': 2, 'Rice / Biryani': 1, Breads: 1, Accompaniments: 1, Desserts: 1 },
    packageId: '',
  },
];

const Card = ({
  title,
  priceLabel,
  subtitle,
  rules,
  badge,
  tint,
  selected,
  onPress,
}: {
  title: string;
  priceLabel: string;
  subtitle: string;
  rules: Record<string, number>;
  badge: string;
  tint: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    style={{
      borderRadius: 18,
      padding: 14,
      borderWidth: selected ? 2 : 1,
      borderColor: selected ? '#4C1D95' : '#E5E7EB',
      backgroundColor: selected ? '#F4F1FA' : '#F6F3FB',
      marginBottom: 12,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: '900', color: '#111827' }}>{title}</Text>
        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{subtitle}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: '#111827',
            marginBottom: 8,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 12 }}>{priceLabel}</Text>
        </View>
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: '#FDE68A' }}>
          <Text style={{ fontSize: 10, fontWeight: '900', color: '#7C2D12' }}>{badge}</Text>
        </View>
      </View>
    </View>

    <View style={{ marginTop: 12 }}>
      {(
        [
          { k: 'Starters', icon: '🥘' },
          { k: 'Main Course', icon: '🍛' },
          { k: 'Rice / Biryani', icon: '🍲' },
          { k: 'Breads', icon: '🍞' },
          { k: 'Accompaniments', icon: '🥗' },
          { k: 'Desserts', icon: '🍰' },
        ] as const
      ).map(({ k, icon }) => {
        const n = Number((rules as any)?.[k] ?? 0);
        if (!Number.isFinite(n) || n <= 0) return null;
        return (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ width: 20, textAlign: 'center' }}>{icon}</Text>
            <Text style={{ fontSize: 12, color: '#111827', marginLeft: 6, flex: 1, lineHeight: 18 }}>
              {n} {k}
            </Text>
          </View>
        );
      })}
    </View>
  </TouchableOpacity>
);

export default function PartyBoxTypeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const insets = useSafeAreaInsets();

  const [boxType, setBoxType] = useState<BoxType | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setLoadError(false);
        const data = await apiJson('/api/catalog/partybox');
        const items = Array.isArray((data as any)?.tiers) ? ((data as any).tiers as Tier[]) : [];
        setTiers(items);
      } catch {
        setLoadError(true);
        setTiers([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visibleTiers = useMemo(() => {
    if (tiers.length > 0) return tiers;
    return FALLBACK_TIERS;
  }, [tiers]);

  const summary = useMemo(() => {
    const parts: string[] = [];
    if (params.guests) parts.push(`${params.guests} guests`);
    if (params.occ) parts.push(String(params.occ));
    if (params.pref) parts.push(String(params.pref).replace('_', '-'));
    if (params.date && params.time) parts.push(`${params.date} • ${params.time}`);
    return parts.join('  |  ');
  }, [params]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <BlackBackHeader title="Party Box Type" subtitle={summary || null} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 + insets.bottom }}>
        {loadError ? (
          <View style={{ borderRadius: 14, padding: 12, backgroundColor: '#FEF3C7', marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: '#7C2D12', fontWeight: '700' }}>Can’t reach server</Text>
            <Text style={{ fontSize: 11, color: '#7C2D12', marginTop: 4 }}>
              Showing default types. Set the API Base URL in Account tab and try again for live pricing.
            </Text>
          </View>
        ) : null}

        {(loading ? FALLBACK_TIERS : visibleTiers).map((t) => (
          <Card
            key={t.key}
            title={t.title}
            priceLabel={`₹${Math.round(Number(t.perPlate) / 100)}/plate`}
            subtitle={t.subtitle}
            rules={t.rules}
            badge={t.key === 'premium' ? 'Best Seller' : t.key === 'standard' ? 'Value Pick' : 'Build Your Own'}
            tint={'#F6F3FB'}
            selected={boxType === t.key}
            onPress={() => setBoxType(t.key)}
          />
        ))}
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 12 + insets.bottom,
        }}
      >
        <TouchableOpacity
          disabled={!boxType}
          onPress={() => {
            if (!boxType) return;
            const tier = visibleTiers.find((x) => x.key === boxType) ?? null;
            router.push(
              `/party-box/builder?guests=${encodeURIComponent(String(params.guests ?? ''))}&occ=${encodeURIComponent(
                String(params.occ ?? ''),
              )}&pref=${encodeURIComponent(String(params.pref ?? ''))}&date=${encodeURIComponent(
                String(params.date ?? ''),
              )}&eventDate=${encodeURIComponent(String(params.eventDate ?? ''))}&time=${encodeURIComponent(String(params.time ?? ''))}&type=${encodeURIComponent(boxType)}&packageId=${encodeURIComponent(
                String(tier?.packageId ?? ''),
              )}` as any,
            );
          }}
          activeOpacity={0.9}
          style={{
            paddingVertical: 14,
            borderRadius: 18,
            backgroundColor: boxType ? '#3366FF' : '#CBD5E1',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.16,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Confirm Party Box</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
