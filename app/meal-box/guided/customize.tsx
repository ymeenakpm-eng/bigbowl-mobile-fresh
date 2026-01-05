import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { BlackBackHeader } from '@/components/BlackBackHeader';
import {
    MEAL_BOX_CATEGORIES,
    MEAL_BOX_ITEMS,
    MEAL_BOX_TYPES,
    getMealBoxCategoryLimit,
    isMealBoxSelectionComplete,
    type MealBoxCategoryKey,
    type MealBoxTypeKey,
} from '@/src/data/mealBoxGuided';
import { mapItemToImage, type ImageCategory } from '@/src/utils/mapItemToImage';

type GuidedState = {
  typeKey: MealBoxTypeKey;
  boxes: number;
  selection: Record<MealBoxCategoryKey, string[]>;
  customerName: string;
  eventDateISO: string;
  eventTime: string;
};

function decodeState(raw: any): GuidedState | null {
  try {
    const s = JSON.parse(decodeURIComponent(String(raw ?? '')));
    return s && typeof s === 'object' ? (s as GuidedState) : null;
  } catch {
    return null;
  }
}

function encodeState(state: GuidedState) {
  return encodeURIComponent(JSON.stringify(state));
}

function categoryKeyToImageCategory(key: MealBoxCategoryKey): ImageCategory {
  if (key === 'starters') return 'starters';
  if (key === 'main_course') return 'main_course';
  if (key === 'rice_biryani') return 'rice_biryani';
  if (key === 'breads') return 'breads';
  return 'desserts';
}

const ItemCard = ({
  title,
  image,
  selected,
  disabled,
  onPress,
  isVeg,
}: {
  title: string;
  image: number;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
  isVeg: boolean;
}) => (
  <TouchableOpacity
    activeOpacity={0.9}
    onPress={onPress}
    disabled={disabled}
    style={{
      width: 160,
      borderRadius: 18,
      marginRight: 12,
      overflow: 'hidden',
      borderWidth: selected ? 2 : 1,
      borderColor: selected ? '#7C3AED' : '#E5E7EB',
      backgroundColor: selected ? '#F5F3FF' : '#FFFFFF',
      opacity: disabled ? 0.55 : 1,
    }}
  >
    <View style={{ height: 96, backgroundColor: '#F3F4F6' }}>
      <Image source={image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
    </View>
    <View style={{ padding: 10 }}>
      <Text numberOfLines={2} style={{ fontWeight: '900', color: '#111827', fontSize: 13, marginBottom: 6 }}>
        {title}
      </Text>
      <Text style={{ color: isVeg ? '#16A34A' : '#DC2626', fontWeight: '800', fontSize: 11 }}>
        {isVeg ? 'VEG' : 'NON-VEG'}
      </Text>
    </View>
  </TouchableOpacity>
);

export default function MealBoxGuidedCustomizeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ state?: string }>();

  const initial = useMemo(() => decodeState(params.state), [params.state]);
  const [state, setState] = useState<GuidedState>(
    initial ?? {
      typeKey: 'veg',
      boxes: 10,
      selection: { starters: [], main_course: [], rice_biryani: [], breads: [], desserts: [] },
      customerName: '',
      eventDateISO: '',
      eventTime: '',
    },
  );

  const type = useMemo(() => MEAL_BOX_TYPES.find((t) => t.key === state.typeKey) ?? MEAL_BOX_TYPES[0], [state.typeKey]);

  const totalRupees = useMemo(() => Math.max(0, Math.round(type.pricePerBoxRupees * state.boxes)), [state.boxes, type.pricePerBoxRupees]);

  const hasNonVegSelection = useMemo(() => {
    const allIds = Object.values(state.selection ?? {}).flatMap((x) => (Array.isArray(x) ? x : []));
    const unique = new Set(allIds.map((x) => String(x)));
    for (const id of unique) {
      const it = MEAL_BOX_ITEMS.find((x) => x.id === id);
      if (it && !it.isVeg) return true;
    }
    return false;
  }, [state.selection]);

  const isComplete = useMemo(() => {
    const base = isMealBoxSelectionComplete(state.selection);
    if (!base) return false;
    if (type.isVeg) return true;
    return hasNonVegSelection;
  }, [hasNonVegSelection, state.selection, type.isVeg]);

  const setBoxes = (next: number) => {
    const v = Math.max(10, Math.round(Number(next)));
    setState((s) => ({ ...s, boxes: v }));
  };

  const toggle = (category: MealBoxCategoryKey, id: string) => {
    setState((s) => {
      const current = Array.isArray(s.selection[category]) ? s.selection[category] : [];
      const limit = getMealBoxCategoryLimit(category);

      const isSelected = current.includes(id);
      if (isSelected) {
        return {
          ...s,
          selection: { ...s.selection, [category]: current.filter((x) => x !== id) },
        };
      }

      if (current.length >= limit) {
        Alert.alert("Selection limit reached", "You’ve selected the allowed items. Deselect to change.");
        return s;
      }

      return {
        ...s,
        selection: { ...s.selection, [category]: [...current, id] },
      };
    });
  };

  const [summaryExpanded, setSummaryExpanded] = useState(false);

  const selectedByCategory = useMemo(() => {
    const out: Record<MealBoxCategoryKey, { total: number; items: { name: string; count: number }[] }> = {
      starters: { total: 0, items: [] },
      main_course: { total: 0, items: [] },
      rice_biryani: { total: 0, items: [] },
      breads: { total: 0, items: [] },
      desserts: { total: 0, items: [] },
    };

    (Object.keys(out) as MealBoxCategoryKey[]).forEach((key) => {
      const chosenIds = Array.isArray(state.selection?.[key]) ? state.selection[key] : [];
      const tmp: Record<string, number> = {};
      chosenIds.forEach((id) => {
        const it = MEAL_BOX_ITEMS.find((x) => x.id === id);
        if (!it) return;
        tmp[it.name] = (tmp[it.name] ?? 0) + 1;
      });
      const items = Object.entries(tmp)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));
      out[key] = { total: chosenIds.length, items };
    });

    return out;
  }, [state.selection]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <BlackBackHeader title="Meal Box" subtitle="Customize items" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 190 }}>
        <View style={{ borderRadius: 18, padding: 14, backgroundColor: '#111827', marginBottom: 14 }}>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14 }}>{type.title}</Text>
          <Text style={{ color: '#E5E7EB', marginTop: 4, fontSize: 12 }}>₹{type.pricePerBoxRupees} / box • Min 10 boxes</Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <Text style={{ color: '#E5E7EB', fontSize: 12 }}>Boxes</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setBoxes(state.boxes - 1)}
                style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 18 }}>-</Text>
              </TouchableOpacity>
              <Text style={{ color: '#FFFFFF', fontWeight: '900', width: 54, textAlign: 'center' }}>{state.boxes}</Text>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setBoxes(state.boxes + 1)}
                style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 18 }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#E5E7EB', fontSize: 12 }}>Total</Text>
            <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>₹{totalRupees}</Text>
          </View>
        </View>

        {MEAL_BOX_CATEGORIES.map((cat) => {
          const chosen = state.selection[cat.key] ?? [];
          const items = MEAL_BOX_ITEMS.filter((it) => {
            if (it.category !== cat.key) return false;
            if (type.isVeg) return it.isVeg;
            if (cat.key === 'breads' || cat.key === 'desserts') return it.isVeg;
            return !it.isVeg;
          });

          return (
            <View key={cat.key} style={{ marginBottom: 18 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <Text style={{ fontWeight: '900', color: '#111827' }}>{cat.title}</Text>
                <Text style={{ color: '#6B7280', fontSize: 12 }}>
                  {cat.title} ({chosen.length}/{cat.limit} selected)
                </Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 2 }}>
                {items.map((it) => {
                  const selected = chosen.includes(it.id);
                  const disabled = !selected && chosen.length >= cat.limit;
                  const img = mapItemToImage({
                    itemName: it.name,
                    category: categoryKeyToImageCategory(cat.key),
                    subcategory: it.isVeg ? 'veg' : 'non_veg',
                  });

                  return (
                    <ItemCard
                      key={it.id}
                      title={it.name}
                      image={img}
                      selected={selected}
                      disabled={disabled}
                      onPress={() => toggle(cat.key, it.id)}
                      isVeg={it.isVeg}
                    />
                  );
                })}

                {items.length === 0 ? (
                  <View style={{ width: 240, borderRadius: 18, borderWidth: 1, borderColor: '#E5E7EB', padding: 12 }}>
                    <Text style={{ color: '#6B7280' }}>No items available.</Text>
                  </View>
                ) : null}
              </ScrollView>
            </View>
          );
        })}

      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 14,
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          backgroundColor: '#FFFFFF',
        }}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setSummaryExpanded((v) => !v)}
          style={{
            borderRadius: 16,
            padding: 12,
            backgroundColor: '#F5F3FF',
            borderWidth: 1,
            borderColor: '#DDD6FE',
            marginBottom: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '900', color: '#4C1D95' }}>Selected items (by category)</Text>
            <Text style={{ fontSize: 12, fontWeight: '900', color: '#4C1D95' }}>{summaryExpanded ? 'Hide' : 'View'}</Text>
          </View>

          {MEAL_BOX_CATEGORIES.map((cat) => {
            const bucket = selectedByCategory[cat.key];
            const total = Math.max(0, Math.round(Number(bucket?.total ?? 0)));
            const items = Array.isArray(bucket?.items) ? bucket.items : [];
            if (total <= 0) return null;

            if (!summaryExpanded) {
              const head = items
                .slice(0, 2)
                .map((x) => `${x.name}${x.count > 1 ? ` ×${x.count}` : ''}`)
                .filter(Boolean);
              const more = Math.max(0, items.length - head.length);
              return (
                <Text key={cat.key} style={{ fontSize: 12, color: '#4C1D95', lineHeight: 18, marginBottom: 6 }}>
                  {cat.title} ({total}): {head.join(', ')}{more > 0 ? ` (+${more})` : ''}
                </Text>
              );
            }

            return (
              <View key={cat.key} style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#4C1D95', marginBottom: 4 }}>
                  {cat.title} ({total}):
                </Text>
                {items.map((x, idx) => (
                  <Text key={`${cat.key}_${idx}`} style={{ fontSize: 12, color: '#4C1D95', lineHeight: 18 }}>
                    • {x.name}{x.count > 1 ? ` ×${x.count}` : ''}
                  </Text>
                ))}
              </View>
            );
          })}

          {Object.values(state.selection ?? {}).flatMap((x) => (Array.isArray(x) ? x : [])).length === 0 ? (
            <Text style={{ fontSize: 12, color: '#4C1D95', lineHeight: 18 }}>No items selected yet.</Text>
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!isComplete}
          onPress={() => {
            if (!isComplete) {
              if (!type.isVeg && !hasNonVegSelection) {
                Alert.alert('Select at least one non-veg item', 'For Non-Veg Meal Boxes, please include at least 1 non-veg dish.');
                return;
              }
              Alert.alert('Incomplete selection', 'Please complete all categories to continue.');
              return;
            }
            router.push({
              pathname: '/meal-box/guided/details',
              params: { state: encodeState(state) },
            } as any);
          }}
          style={{
            height: 48,
            borderRadius: 18,
            backgroundColor: isComplete ? '#3366FF' : '#CBD5E1',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
