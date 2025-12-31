import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { mapItemToImage } from '../../src/utils/mapItemToImage';

import { apiJson } from '@/src/utils/api';

type Params = {
  guests?: string;
  occ?: string;
  pref?: string;
  date?: string;
  eventDate?: string;
  time?: string;
  type?: string;
  packageId?: string;
};

type SectionKey = 'Starters' | 'Main Course' | 'Rice / Biryani' | 'Breads' | 'Accompaniments' | 'Desserts';

function sectionToImageCategory(section: SectionKey): Parameters<typeof mapItemToImage>[0]['category'] {
  if (section === 'Starters') return 'starters';
  if (section === 'Main Course') return 'main_course';
  if (section === 'Rice / Biryani') return 'rice_biryani';
  if (section === 'Breads') return 'breads';
  if (section === 'Accompaniments') return 'accompaniments';
  return 'desserts';
}

type FoodPref = 'veg' | 'non_veg' | 'mixed';

type Item = {
  id: string;
  name: string;
  section: SectionKey;
  isVeg: boolean;
  isPremium?: boolean;
  premiumDelta?: number;
  priceDeltaPerPlate?: number;
};

type Tier = {
  key: string;
  title: string;
  perPlate: number;
  rules: Record<string, number>;
  packageId: string;
};

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={{ fontSize: 16, fontWeight: '800', marginTop: 12, marginBottom: 8, color: '#111827' }}>{title}</Text>
);

export default function PartyBoxBuilderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();

  const pref = String(params.pref ?? 'mixed') as FoodPref;
  const tierKey = String(params.type ?? 'standard');
  const packageId = String(params.packageId ?? '').trim();

  const [menu, setMenu] = useState<Item[]>([]);
  const [tier, setTier] = useState<Tier | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await apiJson('/api/catalog/partybox');
        const tiers = Array.isArray((data as any)?.tiers) ? ((data as any).tiers as Tier[]) : [];
        const items = Array.isArray((data as any)?.menu) ? ((data as any).menu as Item[]) : [];
        setMenu(items);
        setTier(tiers.find((t) => String(t.key) === tierKey) ?? null);
      } catch {
        setMenu([]);
        setTier(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [tierKey]);

  const rules = useMemo(() => {
    const r = (tier?.rules ?? {}) as Record<string, number>;
    return {
      Starters: Number(r.Starters ?? 0),
      'Main Course': Number(r['Main Course'] ?? 0),
      'Rice / Biryani': Number(r['Rice / Biryani'] ?? 0),
      Breads: Number(r.Breads ?? 0),
      Accompaniments: Number(r.Accompaniments ?? 0),
      Desserts: Number(r.Desserts ?? 0),
    };
  }, [tier?.rules]);

  const selectedBySection = useMemo(() => {
    const byId = new Map(menu.map((m) => [m.id, m]));
    const init: Record<SectionKey, string[]> = {
      Starters: [],
      'Main Course': [],
      'Rice / Biryani': [],
      Breads: [],
      Accompaniments: [],
      Desserts: [],
    };
    for (const id of selectedIds) {
      const item = byId.get(id);
      if (!item) continue;
      init[item.section].push(id);
    }
    return init;
  }, [menu, selectedIds]);

  const canReview = useMemo(() => {
    if (!tier) return false;
    return (
      selectedBySection.Starters.length === rules.Starters &&
      selectedBySection['Main Course'].length === rules['Main Course'] &&
      selectedBySection['Rice / Biryani'].length === rules['Rice / Biryani'] &&
      selectedBySection.Breads.length === rules.Breads &&
      selectedBySection.Accompaniments.length === rules.Accompaniments &&
      selectedBySection.Desserts.length === rules.Desserts
    );
  }, [rules, selectedBySection, tier]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      const item = menu.find((m) => m.id === id);
      if (!item) return prev;
      const max = Number((rules as any)[item.section] ?? 0);
      const current = prev.reduce((acc, selId) => {
        const it = menu.find((m) => m.id === selId);
        return it?.section === item.section ? acc + 1 : acc;
      }, 0);
      if (max > 0 && current >= max) {
        Alert.alert('Limit reached', 'Already allowed no. of items selected. Please deselect if needed.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const grouped = useMemo(() => {
    const sections: SectionKey[] = ['Starters', 'Main Course', 'Rice / Biryani', 'Breads', 'Accompaniments', 'Desserts'];

    const filteredMenu = menu.filter((i) => {
      if (pref === 'veg') return i.isVeg;
      if (pref === 'non_veg') return !i.isVeg;
      return true;
    });

    return sections.map((s) => ({
      section: s,
      items: filteredMenu.filter((i) => i.section === s),
    }));
  }, [menu, pref]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: 56 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F0F0F0', marginRight: 8 }}
        >
          <Text style={{ fontSize: 12 }}>Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '700' }}>Menu Builder</Text>
          <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
            {tier ? `${tier.title}  •  ₹${Math.round(Number(tier.perPlate) / 100)}/plate` : 'Loading...'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {loading ? <Text style={{ color: '#6B7280' }}>Loading menu...</Text> : null}
        {grouped.map(({ section, items }) => (
          <View key={section}>
            <SectionHeader title={section} />
            <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
              Select {Number((rules as any)[section] ?? 0)}  •  Chosen {(selectedBySection as any)[section]?.length ?? 0}
            </Text>
            {items.map((item) => {
              const selected = selectedIds.includes(item.id);
              const deltaPaise = Number(item.priceDeltaPerPlate ?? item.premiumDelta ?? 0);
              const deltaRupees = Math.round((Number.isFinite(deltaPaise) ? deltaPaise : 0) / 100);
              const img = mapItemToImage({
                itemName: item.name,
                category: sectionToImageCategory(section),
                subcategory: item.isVeg ? 'veg' : 'non_veg',
              });
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => toggle(item.id)}
                  activeOpacity={0.9}
                  style={{
                    borderRadius: 14,
                    padding: 12,
                    marginBottom: 10,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? '#7C3AED' : '#E5E7EB',
                    backgroundColor: selected ? '#F5F3FF' : '#FFFFFF',
                    flexDirection: 'column',
                  }}
                >
                  <Image
                    source={img}
                    style={{ width: '100%', height: 120, borderRadius: 12, marginBottom: 10 }}
                    contentFit="cover"
                    transition={150}
                  />
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', flex: 1, paddingRight: 8 }}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: selected ? '#4C1D95' : '#6B7280' }}>
                      {selected ? 'Added' : '+ Add'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>
                    {deltaRupees > 0 ? `+₹${deltaRupees}/plate` : 'Included'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <TouchableOpacity
          disabled={!canReview}
          onPress={() => {
            const ids = selectedIds.join(',');
            router.push(
              `/party-box/review?guests=${encodeURIComponent(String(params.guests ?? ''))}&occ=${encodeURIComponent(
                String(params.occ ?? ''),
              )}&pref=${encodeURIComponent(String(params.pref ?? ''))}&date=${encodeURIComponent(
                String(params.date ?? ''),
              )}&eventDate=${encodeURIComponent(String(params.eventDate ?? ''))}&time=${encodeURIComponent(String(params.time ?? ''))}&type=${encodeURIComponent(
                String(params.type ?? ''),
              )}&packageId=${encodeURIComponent(packageId)}&items=${encodeURIComponent(ids)}` as any,
            );
          }}
          activeOpacity={0.9}
          style={{
            marginTop: 8,
            paddingVertical: 12,
            borderRadius: 18,
            backgroundColor: canReview ? '#3366FF' : '#CBD5E1',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Review Party Box</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
