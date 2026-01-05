import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { BlackBackHeader } from '@/components/BlackBackHeader';

import { apiJson } from '@/src/utils/api';

type SectionKey = 'Starters' | 'Main Course' | 'Rice / Biryani' | 'Breads' | 'Accompaniments' | 'Desserts';

type MenuItem = {
  id: string;
  name: string;
  section: SectionKey;
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

type Params = {
  guests?: string;
  occ?: string;
  pref?: string;
  date?: string;
  eventDate?: string;
  time?: string;
  type?: string;
  packageId?: string;
  items?: string;
};

export default function PartyBoxReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const data = await apiJson('/api/catalog/partybox');
        const t = Array.isArray((data as any)?.tiers) ? ((data as any).tiers as Tier[]) : [];
        const m = Array.isArray((data as any)?.menu) ? ((data as any).menu as MenuItem[]) : [];
        setTiers(t);
        setMenu(m);
      } catch {
        setTiers([]);
        setMenu([]);
      }
    })();
  }, []);

  const selectedItems = useMemo(() => {
    const raw = String(params.items ?? '');
    if (!raw) return [];
    return raw.split(',').filter(Boolean);
  }, [params.items]);

  const selectedItemNames = useMemo(() => {
    const byId = new Map(menu.map((x) => [x.id, x.name]));
    return selectedItems.map((id) => byId.get(id) ?? id);
  }, [menu, selectedItems]);

  const selectedItemMeta = useMemo(() => {
    const byId = new Map(menu.map((x) => [x.id, x]));
    return selectedItems.map((id) => {
      const it = byId.get(id);
      const deltaPaise = Number(it?.priceDeltaPerPlate ?? it?.premiumDelta ?? 0);
      const deltaRupees = Math.round((Number.isFinite(deltaPaise) ? deltaPaise : 0) / 100);
      return { id, name: it?.name ?? id, deltaRupees };
    });
  }, [menu, selectedItems]);

  const tier = useMemo(() => {
    const key = String(params.type ?? 'standard');
    return tiers.find((t) => String(t.key) === key) ?? null;
  }, [params.type, tiers]);

  const premiumPerPlate = useMemo(() => {
    const byId = new Map(menu.map((m) => [m.id, m]));
    let sum = 0;
    const unique = new Set(selectedItems);
    for (const id of unique) {
      const it = byId.get(id);
      const d = Number(it?.priceDeltaPerPlate ?? it?.premiumDelta ?? 0);
      if (Number.isFinite(d) && d > 0) sum += d;
    }
    return sum;
  }, [menu, selectedItems]);

  const title = useMemo(() => {
    if (tier?.title) return tier.title;
    const t = String(params.type ?? 'standard');
    return t === 'premium' ? 'Premium Party Box' : t === 'custom' ? 'Custom Party Box' : 'Standard Party Box';
  }, [params.type, tier?.title]);

  const paxGuess = useMemo(() => {
    const g = String(params.guests ?? '').trim();
    if (g.includes('-')) {
      const parts = g.split('-');
      const max = Number(parts[1]);
      return Number.isFinite(max) ? String(max) : '20';
    }
    if (g.includes('+')) {
      const n = Number(g.replace('+', ''));
      return Number.isFinite(n) ? String(n) : '50';
    }
    const n = Number(g);
    return Number.isFinite(n) && n > 0 ? String(n) : '20';
  }, [params.guests]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <BlackBackHeader title="Review & Cart" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <View
          style={{
            borderRadius: 16,
            padding: 14,
            backgroundColor: '#F6F3FB',
            borderWidth: 1,
            borderColor: '#E5E7EB',
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '900', marginBottom: 6, color: '#111827' }}>{title}</Text>
          <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>
            Guests: {String(params.guests ?? '-')}  |  Occasion: {String(params.occ ?? '-')}
          </Text>
          <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>
            Preference: {String(params.pref ?? '-').replace('_', '-')}  |  Slot: {String(params.date ?? '-')}
            {' • '}
            {String(params.time ?? '-')}
          </Text>
          <Text style={{ fontSize: 12, color: '#111827', fontWeight: '800', marginTop: 6 }}>
            Price/plate (est.): ₹{Math.round(Number(tier?.perPlate ?? 0) / 100)}
          </Text>
          {premiumPerPlate > 0 ? (
            <Text style={{ fontSize: 12, color: '#111827', fontWeight: '800', marginTop: 4 }}>
              Premium add-ons: +₹{Math.round(premiumPerPlate / 100)}/plate
            </Text>
          ) : null}
        </View>

        <View
          style={{
            borderRadius: 16,
            padding: 14,
            backgroundColor: '#F6F3FB',
            borderWidth: 1,
            borderColor: '#E5E7EB',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '900', marginBottom: 8, color: '#111827' }}>Selected items</Text>
          {selectedItemMeta.length === 0 ? (
            <Text style={{ fontSize: 12, color: '#6B7280' }}>No items selected.</Text>
          ) : (
            selectedItemMeta.map((it, idx) => (
              <View key={`${it.id}_${idx}`} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: '#111827', paddingRight: 10, flex: 1 }}>• {it.name}</Text>
                <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '800' }}>
                  {it.deltaRupees > 0 ? `+₹${it.deltaRupees}/plate` : 'Included'}
                </Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          onPress={() => {
            const pkgId = String(params.packageId ?? tier?.packageId ?? '').trim();
            if (!pkgId) return;

            const selection = {
              kind: 'party_box',
              tierKey: String(params.type ?? 'standard'),
              pref: String(params.pref ?? 'mixed'),
              guests: String(params.guests ?? ''),
              occasion: String(params.occ ?? ''),
              date: String(params.date ?? ''),
              time: String(params.time ?? ''),
              items: selectedItems,
            };

            router.push({
              pathname: '/quote',
              params: {
                packageId: pkgId,
                pax: paxGuess,
                eventDate: String(params.eventDate ?? ''),
                selection: JSON.stringify(selection),
              },
            } as any);
          }}
          activeOpacity={0.9}
          style={{
            marginTop: 12,
            paddingVertical: 12,
            borderRadius: 18,
            backgroundColor: '#3366FF',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Get Quote</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
