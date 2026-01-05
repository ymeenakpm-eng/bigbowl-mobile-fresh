import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { BlackBackHeader } from '@/components/BlackBackHeader';
import { MEAL_BOX_TYPES, type MealBoxTypeKey } from '@/src/data/mealBoxGuided';

function encodeState(state: any) {
  return encodeURIComponent(JSON.stringify(state));
}

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
      borderRadius: 18,
      padding: 14,
      borderWidth: selected ? 2 : 1,
      borderColor: selected ? '#7C3AED' : '#E5E7EB',
      backgroundColor: selected ? '#F5F3FF' : '#FFFFFF',
      marginBottom: 12,
    }}
  >
    <Text style={{ fontSize: 16, fontWeight: '900', color: '#111827', marginBottom: 4 }}>{title}</Text>
    <Text style={{ fontSize: 12, color: '#6B7280' }}>{subtitle}</Text>
  </TouchableOpacity>
);

export default function MealBoxGuidedStartScreen() {
  const router = useRouter();
  const [typeKey, setTypeKey] = useState<MealBoxTypeKey | null>(null);

  const canContinue = useMemo(() => Boolean(typeKey), [typeKey]);

  const selectedType = useMemo(() => {
    if (!typeKey) return null;
    return MEAL_BOX_TYPES.find((t) => t.key === typeKey) ?? null;
  }, [typeKey]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <BlackBackHeader title="Meal Box" subtitle="Select meal box type" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {MEAL_BOX_TYPES.map((t) => (
          <Card
            key={t.key}
            title={t.title}
            subtitle={`₹${t.pricePerBoxRupees} / box`}
            selected={typeKey === t.key}
            onPress={() => setTypeKey(t.key)}
          />
        ))}

        <TouchableOpacity
          disabled={!canContinue}
          onPress={() => {
            if (!selectedType) return;
            router.push({
              pathname: '/meal-box/guided/customize',
              params: {
                state: encodeState({
                  typeKey: selectedType.key,
                  boxes: 10,
                  selection: {
                    starters: [],
                    main_course: [],
                    rice_biryani: [],
                    breads: [],
                    desserts: [],
                  },
                  customerName: '',
                  eventDateISO: '',
                  eventTime: '',
                }),
              },
            } as any);
          }}
          activeOpacity={0.9}
          style={{
            marginTop: 6,
            paddingVertical: 12,
            borderRadius: 18,
            backgroundColor: canContinue ? '#3366FF' : '#CBD5E1',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
