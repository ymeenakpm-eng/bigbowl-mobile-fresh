import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { BlackBackHeader } from '@/components/BlackBackHeader';

type Occasion = 'Evening Snacks' | 'Office Meeting' | 'Kids Party' | 'Tea-time Combo';

type PeopleRange = '1-2' | '3-5' | '6-10' | '10+';

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

export default function SnackBoxOccasionScreen() {
  const router = useRouter();

  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [people, setPeople] = useState<PeopleRange>('1-2');

  const canContinue = useMemo(() => Boolean(occasion), [occasion]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <BlackBackHeader title="Snack Occasion" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Choose occasion</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {(['Evening Snacks', 'Office Meeting', 'Kids Party', 'Tea-time Combo'] as Occasion[]).map((o) => (
            <Chip key={o} label={o} selected={occasion === o} onPress={() => setOccasion(o)} />
          ))}
        </View>

        <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8, marginTop: 6 }}>People</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {([
            { key: '1-2', label: '1–2' },
            { key: '3-5', label: '3–5' },
            { key: '6-10', label: '6–10' },
            { key: '10+', label: '10+' },
          ] as const).map((p) => (
            <Chip key={p.key} label={p.label} selected={people === p.key} onPress={() => setPeople(p.key)} />
          ))}
        </View>

        <TouchableOpacity
          disabled={!canContinue}
          onPress={() => {
            if (!occasion) return;
            router.push(`/snack-box/listing?occ=${encodeURIComponent(occasion)}&people=${encodeURIComponent(people)}` as any);
          }}
          activeOpacity={0.9}
          style={{
            marginTop: 10,
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
