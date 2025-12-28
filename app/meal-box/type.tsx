import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

type MealType = 'single' | 'family' | 'office';

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

export default function MealBoxTypeScreen() {
  const router = useRouter();

  const [mealType, setMealType] = useState<MealType | null>(null);

  const canContinue = useMemo(() => Boolean(mealType), [mealType]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: 40 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F0F0F0', marginRight: 8 }}
        >
          <Text style={{ fontSize: 12 }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700' }}>Meal Type</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <Card
          title="Single Meal"
          subtitle="Best for 1 person"
          selected={mealType === 'single'}
          onPress={() => setMealType('single')}
        />
        <Card
          title="Family Meal (2–4)"
          subtitle="Perfect for couples & small families"
          selected={mealType === 'family'}
          onPress={() => setMealType('family')}
        />
        <Card
          title="Office Lunch"
          subtitle="Quick, filling, and on-time"
          selected={mealType === 'office'}
          onPress={() => setMealType('office')}
        />

        <TouchableOpacity
          disabled={!canContinue}
          onPress={() => {
            if (!mealType) return;
            router.push(`/meal-box/preferences?type=${encodeURIComponent(mealType)}` as any);
          }}
          activeOpacity={0.9}
          style={{
            marginTop: 4,
            paddingVertical: 12,
            borderRadius: 18,
            backgroundColor: canContinue ? '#3366FF' : '#CBD5E1',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
