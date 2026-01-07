import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { mapItemToImage } from '../../src/utils/mapItemToImage';

import { BlackBackHeader } from '@/components/BlackBackHeader';

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

const SECTIONS: SectionKey[] = ['Starters', 'Main Course', 'Rice / Biryani', 'Breads', 'Accompaniments', 'Desserts'];

const SECTION_META: Record<SectionKey, { icon: string; tint: string }> = {
  Starters: { icon: '🥗', tint: '#F0FDF4' },
  'Main Course': { icon: '🍛', tint: '#EEF2FF' },
  'Rice / Biryani': { icon: '🍲', tint: '#FFF7ED' },
  Breads: { icon: '🍞', tint: '#FDF2F8' },
  Accompaniments: { icon: '🥗', tint: '#ECFEFF' },
  Desserts: { icon: '🍰', tint: '#F5F3FF' },
};

export default function PartyBoxBuilderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const insets = useSafeAreaInsets();

  const scrollRef = useRef<ScrollView | null>(null);

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

  const pendingSelections = useMemo(() => {
    const pending: { section: SectionKey; remaining: number; required: number }[] = [];
    for (const s of SECTIONS) {
      const required = Number((rules as any)[s] ?? 0);
      const chosen = Number((selectedBySection as any)[s]?.length ?? 0);
      const remaining = Math.max(0, required - chosen);
      if (required > 0 && remaining > 0) pending.push({ section: s, remaining, required });
    }
    return pending;
  }, [rules, selectedBySection]);

  const pendingText = useMemo(() => {
    if (pendingSelections.length === 0) return '';
    return pendingSelections
      .map((p) => `• ${p.section} – select ${p.remaining} more item${p.remaining === 1 ? '' : 's'}`)
      .join('\n');
  }, [pendingSelections]);

  function buildSelectedNamesBySection(ids: string[]) {
    const byId = new Map(menu.map((m) => [m.id, m]));
    const init: Record<SectionKey, string[]> = {
      Starters: [],
      'Main Course': [],
      'Rice / Biryani': [],
      Breads: [],
      Accompaniments: [],
      Desserts: [],
    };
    for (const id of ids) {
      const it = byId.get(id);
      if (!it) continue;
      init[it.section].push(it.name);
    }
    return init;
  }

  function formatLimitReachedMessage(selectedNames: Record<SectionKey, string[]>) {
    const lines: string[] = [];
    lines.push('You have already selected the allowed items.');
    lines.push('');
    for (const s of SECTIONS) {
      const required = Number((rules as any)[s] ?? 0);
      if (required <= 0) continue;
      const names = selectedNames[s] ?? [];
      if (names.length === 0) continue;
      lines.push(`${s} (${names.length}/${required}):`);
      for (const n of names) lines.push(`• ${n}`);
      lines.push('');
    }
    lines.push('Please go back and deselect items to continue.');
    return lines.join('\n');
  }

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
        const selectedNames = buildSelectedNamesBySection(prev);
        Alert.alert('Selection limit reached', formatLimitReachedMessage(selectedNames), [{ text: 'OK', style: 'cancel' }]);
        return prev;
      }
      return [...prev, id];
    });
  };

  const grouped = useMemo(() => {
    const filteredMenu = menu.filter((i) => {
      if (pref === 'veg') return i.isVeg;
      if (pref === 'non_veg') return !i.isVeg;
      return true;
    });

    return SECTIONS.map((s) => ({
      section: s,
      items: filteredMenu.filter((i) => i.section === s),
    }));
  }, [menu, pref]);

  const activeSections = useMemo(() => {
    return SECTIONS.filter((s) => {
      const required = Number((rules as any)[s] ?? 0);
      return Number.isFinite(required) && required > 0;
    });
  }, [rules]);

  const [activeSection, setActiveSection] = useState<SectionKey>('Starters');

  React.useEffect(() => {
    if (activeSections.length === 0) return;
    if (!activeSections.includes(activeSection)) {
      setActiveSection(activeSections[0]);
    }
  }, [activeSection, activeSections]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [activeSection]);

  const activeIndex = useMemo(() => {
    return Math.max(0, activeSections.indexOf(activeSection));
  }, [activeSection, activeSections]);

  const activeRequired = useMemo(() => {
    return Number((rules as any)[activeSection] ?? 0);
  }, [activeSection, rules]);

  const activeSelected = useMemo(() => {
    return (selectedBySection as any)?.[activeSection] ?? [];
  }, [activeSection, selectedBySection]);

  const activeComplete = useMemo(() => {
    const req = Number.isFinite(activeRequired) ? activeRequired : 0;
    const chosen = Array.isArray(activeSelected) ? activeSelected.length : 0;
    return req > 0 && chosen === req;
  }, [activeRequired, activeSelected]);

  const activeItems = useMemo(() => {
    return grouped.find((g) => g.section === activeSection)?.items ?? [];
  }, [activeSection, grouped]);

  const selectedSlots = useMemo(() => {
    const byId = new Map(menu.map((m) => [m.id, m]));
    const req = Math.max(0, Number.isFinite(activeRequired) ? activeRequired : 0);
    const chosenIds: string[] = Array.isArray(activeSelected) ? activeSelected : [];
    return Array.from({ length: req }).map((_, idx) => {
      const id = chosenIds[idx] ?? '';
      const it = id ? byId.get(id) : null;
      const img = it
        ? mapItemToImage({
            itemName: it.name,
            category: sectionToImageCategory(activeSection),
            subcategory: it.isVeg ? 'veg' : 'non_veg',
          })
        : null;
      return { id, img };
    });
  }, [activeRequired, activeSection, activeSelected, menu]);

  const footerHeight = 150 + insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <BlackBackHeader
        title="Menu Builder"
        subtitle={tier ? `${tier.title}  •  ₹${Math.round(Number(tier.perPlate) / 100)}/plate` : 'Loading...'}
      />

      <View
        style={{
          height: 90,
          marginHorizontal: 16,
          marginTop: 10,
          marginBottom: 8,
          padding: 10,
          borderRadius: 16,
          backgroundColor: '#F6F3FB',
          borderWidth: 1,
          borderColor: '#E5E7EB',
          overflow: 'hidden',
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ alignItems: 'center', paddingRight: 6 }}
        >
          {activeSections.map((s) => {
            const required = Number((rules as any)[s] ?? 0);
            const chosen = Number((selectedBySection as any)?.[s]?.length ?? 0);
            const selected = s === activeSection;
            return (
              <TouchableOpacity
                key={s}
                activeOpacity={0.9}
                onPress={() => setActiveSection(s)}
                style={{
                  marginRight: 10,
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? '#4C1D95' : '#E5E7EB',
                  backgroundColor: selected ? '#F4F1FA' : '#F6F3FB',
                  minWidth: 110,
                  height: 70,
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 18, marginBottom: 2 }}>{SECTION_META[s].icon}</Text>
                <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '900', color: '#111827' }}>
                  {s}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '800',
                    color: '#6B7280',
                    marginTop: 2,
                  }}
                >
                  {chosen}/{required}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {!canReview && pendingSelections.length > 0 ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 2, paddingBottom: 6 }}>
          <View style={{ borderRadius: 14, padding: 12, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA' }}>
            {selectedSlots.length > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                {selectedSlots.map((slot, idx) => (
                  <View
                    key={`${slot.id || 'slot'}_${idx}`}
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 14,
                      marginRight: 10,
                      backgroundColor: slot.img ? '#F4F1FA' : '#FFECC7',
                      borderWidth: 1,
                      borderColor: '#FED7AA',
                      overflow: 'hidden',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {slot.img ? (
                      <Image source={slot.img} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={150} />
                    ) : (
                      <Text style={{ fontWeight: '900', color: '#7C2D12' }}>{idx + 1}</Text>
                    )}
                  </View>
                ))}
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {pendingSelections.map((p) => (
                <View key={p.section} style={{ width: '48%', marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, color: '#7C2D12', lineHeight: 18 }}>{p.section}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef as any}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: footerHeight }}
      >
        {loading ? <Text style={{ color: '#6B7280' }}>Loading menu...</Text> : null}

        <View
          style={{
            borderRadius: 18,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            backgroundColor: '#F6F3FB',
            padding: 12,
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#111827' }}>
                {SECTION_META[activeSection].icon} {activeSection}{' '}
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#6B7280' }}>({Number((rules as any)[activeSection] ?? 0)} allowed)</Text>
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                Chosen {(selectedBySection as any)[activeSection]?.length ?? 0} / {Number((rules as any)[activeSection] ?? 0)}
              </Text>
            </View>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
            >
              <Text style={{ color: '#111827', fontWeight: '900', fontSize: 12 }}>
                {String((selectedBySection as any)[activeSection]?.length ?? 0)}/{String((rules as any)[activeSection] ?? 0)}
              </Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: '#E5E7EB', opacity: 1, marginTop: 10, marginBottom: 10 }} />

          {activeItems.map((item) => {
            const selected = selectedIds.includes(item.id);
            const deltaPaise = Number(item.priceDeltaPerPlate ?? item.premiumDelta ?? 0);
            const deltaRupees = Math.round((Number.isFinite(deltaPaise) ? deltaPaise : 0) / 100);
            const img = mapItemToImage({
              itemName: item.name,
              category: sectionToImageCategory(activeSection),
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
                  borderColor: selected ? '#4C1D95' : '#E5E7EB',
                  backgroundColor: selected ? '#F4F1FA' : '#F6F3FB',
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
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', flex: 1, paddingRight: 8 }}>{item.name}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: selected ? '#4C1D95' : '#111827' }}>{selected ? 'Added' : '+ Add'}</Text>
                </View>
                <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>{deltaRupees > 0 ? `+₹${deltaRupees}/plate` : 'Included'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
          onPress={() => {
            const isLast = activeSections.length > 0 && activeIndex >= activeSections.length - 1;
            if (!isLast) {
              if (!activeComplete) {
                Alert.alert(
                  'Complete selections to continue',
                  pendingText || 'Complete all required selections to continue.',
                  [{ text: 'OK', style: 'cancel' }],
                );
                return;
              }
              const next = activeSections[activeIndex + 1];
              if (next) setActiveSection(next);
              return;
            }

            if (!canReview) {
              Alert.alert(
                'Complete selections to continue',
                pendingText || 'Complete all required selections to continue.',
                [{ text: 'OK', style: 'cancel' }],
              );
              return;
            }

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
            paddingVertical: 14,
            borderRadius: 18,
            backgroundColor:
              activeSections.length > 0 && activeIndex < activeSections.length - 1
                ? activeComplete
                  ? '#3366FF'
                  : '#94A3B8'
                : canReview
                  ? '#3366FF'
                  : '#94A3B8',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>
            {activeSections.length > 0 && activeIndex < activeSections.length - 1
              ? `Next (${activeIndex + 1}/${activeSections.length})`
              : 'Confirm Selection'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
