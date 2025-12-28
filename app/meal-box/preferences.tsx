import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

type Pref = 'veg' | 'non_veg';

type Budget = '99-149' | '150-199' | '200+';

type Spice = 'mild' | 'medium' | 'spicy';

type Params = { type?: string };

const Chip = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    style={{
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: selected ? 2 : 1,
      borderColor: selected ? '#7C3AED' : '#E5E7EB',
      backgroundColor: selected ? '#F5F3FF' : '#FFFFFF',
      marginRight: 10,
      marginBottom: 10,
    }}
  >
    <Text style={{ fontSize: 13, fontWeight: selected ? '700' : '500', color: '#111827' }}>{label}</Text>
  </TouchableOpacity>
);

export default function MealBoxPreferencesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();

  const [pref, setPref] = useState<Pref>('veg');
  const [budget, setBudget] = useState<Budget>('150-199');
  const [spice, setSpice] = useState<Spice>('medium');

  const subtitle = useMemo(() => {
    const t = String(params.type ?? 'single');
    return t === 'family' ? 'Family meal preferences' : t === 'office' ? 'Office lunch preferences' : 'Meal preferences';
  }, [params.type]);

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
          <Text style={{ fontSize: 20, fontWeight: '700' }}>Preferences</Text>
          <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{subtitle}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Veg / Non-veg</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {([
            { key: 'veg', label: 'Veg' },
            { key: 'non_veg', label: 'Non-veg' },
          ] as const).map((p) => (
            <Chip key={p.key} label={p.label} selected={pref === p.key} onPress={() => setPref(p.key)} />
          ))}
        </View>

        <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8, marginTop: 6 }}>Budget</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {([
            { key: '99-149', label: '₹99–149' },
            { key: '150-199', label: '₹150–199' },
            { key: '200+', label: '₹200+' },
          ] as const).map((b) => (
            <Chip key={b.key} label={b.label} selected={budget === b.key} onPress={() => setBudget(b.key)} />
          ))}
        </View>

        <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8, marginTop: 6 }}>Spice</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {([
            { key: 'mild', label: 'Mild' },
            { key: 'medium', label: 'Medium' },
            { key: 'spicy', label: 'Spicy (Andhra)' },
          ] as const).map((s) => (
            <Chip key={s.key} label={s.label} selected={spice === s.key} onPress={() => setSpice(s.key)} />
          ))}
        </View>

        <TouchableOpacity
          onPress={() => {
            router.push(
              `/meal-box/listing?type=${encodeURIComponent(String(params.type ?? ''))}&pref=${encodeURIComponent(
                pref,
              )}&budget=${encodeURIComponent(budget)}&spice=${encodeURIComponent(spice)}` as any,
            );
          }}
          activeOpacity={0.9}
          style={{
            marginTop: 10,
            paddingVertical: 12,
            borderRadius: 18,
            backgroundColor: '#3366FF',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>View Meal Boxes</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
