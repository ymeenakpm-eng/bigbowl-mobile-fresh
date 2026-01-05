import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { BlackBackHeader } from '@/components/BlackBackHeader';
import { MEAL_BOX_TYPES, type MealBoxCategoryKey, type MealBoxTypeKey } from '@/src/data/mealBoxGuided';

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

type TimeSlot = '11:00-12:00' | '12:00-13:00' | '19:00-20:00' | '20:00-21:00';

const Chip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
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
    <Text style={{ fontSize: 13, fontWeight: selected ? '800' : '600', color: '#111827' }}>{label}</Text>
  </TouchableOpacity>
);

export default function MealBoxGuidedDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ state?: string }>();

  const initial = useMemo(() => decodeState(params.state), [params.state]);
  const [customerName, setCustomerName] = useState<string>(String(initial?.customerName ?? ''));

  const [pickedDate, setPickedDate] = useState<Date | null>(() => {
    const iso = String(initial?.eventDateISO ?? '').trim();
    if (!iso) return null;
    const d = new Date(`${iso}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [timeSlot, setTimeSlot] = useState<TimeSlot | ''>(String(initial?.eventTime ?? '') as any);

  const type = useMemo(() => MEAL_BOX_TYPES.find((t) => t.key === initial?.typeKey) ?? MEAL_BOX_TYPES[0], [initial?.typeKey]);

  const eventDateISO = useMemo(() => {
    if (!pickedDate) return '';
    const yyyy = pickedDate.getFullYear();
    const mm = String(pickedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(pickedDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, [pickedDate]);

  const canContinue = useMemo(() => {
    if (!customerName.trim()) return false;
    if (!eventDateISO) return false;
    if (!timeSlot) return false;
    return true;
  }, [customerName, eventDateISO, timeSlot]);

  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'set' && date) {
      setPickedDate(date);
    }
    setShowDatePicker(false);
  };

  const minimumDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <BlackBackHeader title="Meal Box" subtitle="Customer details" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <View style={{ borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', marginBottom: 14 }}>
          <Text style={{ fontWeight: '900', color: '#111827' }}>{type.title}</Text>
          <Text style={{ color: '#6B7280', marginTop: 4, fontSize: 12 }}>Enter delivery details (future date only)</Text>
        </View>

        <Text style={{ fontWeight: '800', marginBottom: 8 }}>Customer Name</Text>
        <TextInput
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="Enter name"
          placeholderTextColor="#9CA3AF"
          style={{
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 14,
            color: '#111827',
          }}
        />

        <Text style={{ fontWeight: '800', marginBottom: 8 }}>Event Date</Text>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setShowDatePicker(true)}
          style={{
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 12,
            marginBottom: 10,
            backgroundColor: '#FFFFFF',
          }}
        >
          <Text style={{ color: eventDateISO ? '#111827' : '#9CA3AF', fontWeight: '700' }}>{eventDateISO || 'Pick a date'}</Text>
        </TouchableOpacity>

        {showDatePicker ? (
          <DateTimePicker mode="date" value={pickedDate ?? minimumDate} minimumDate={minimumDate} onChange={onDateChange} />
        ) : null}

        <Text style={{ fontWeight: '800', marginBottom: 8, marginTop: 6 }}>Event Time</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {([
            { key: '11:00-12:00', label: '11:00 AM – 12:00 PM' },
            { key: '12:00-13:00', label: '12:00 PM – 1:00 PM' },
            { key: '19:00-20:00', label: '7:00 PM – 8:00 PM' },
            { key: '20:00-21:00', label: '8:00 PM – 9:00 PM' },
          ] as const).map((t) => (
            <Chip key={t.key} label={t.label} selected={timeSlot === t.key} onPress={() => setTimeSlot(t.key)} />
          ))}
        </View>

        <TouchableOpacity
          disabled={!canContinue}
          onPress={() => {
            if (!initial) return;
            const next: GuidedState = {
              ...initial,
              customerName: customerName.trim(),
              eventDateISO,
              eventTime: String(timeSlot),
            };
            router.push({ pathname: '/meal-box/guided/review', params: { state: encodeState(next) } } as any);
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
          <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Next</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
