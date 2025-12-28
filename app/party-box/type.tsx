import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

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
  subtitle,
  selected,
  onPress,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    style={{
      borderRadius: 16,
      padding: 14,
      borderWidth: selected ? 2 : 1,
      borderColor: selected ? '#7C3AED' : '#E5E7EB',
      backgroundColor: selected ? '#F5F3FF' : '#FFFFFF',
      marginBottom: 12,
    }}
  >
    <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 4 }}>{title}</Text>
    <Text style={{ fontSize: 12, color: '#6B7280' }}>{subtitle}</Text>
  </TouchableOpacity>
);

export default function PartyBoxTypeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();

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
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: 40 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F0F0F0', marginRight: 8 }}
        >
          <Text style={{ fontSize: 12 }}>Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '700' }}>Party Box Type</Text>
          {summary ? <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{summary}</Text> : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
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
            title={`${t.title}  •  ₹${Math.round(Number(t.perPlate) / 100)}/plate`}
            subtitle={t.subtitle}
            selected={boxType === t.key}
            onPress={() => setBoxType(t.key)}
          />
        ))}

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
            marginTop: 4,
            paddingVertical: 12,
            borderRadius: 18,
            backgroundColor: boxType ? '#3366FF' : '#CBD5E1',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Select Box</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
