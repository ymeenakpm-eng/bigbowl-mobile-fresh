import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { BlackBackHeader } from '@/components/BlackBackHeader';
import { setStoredItem } from '@/src/utils/storage';

type DateOption = 'tomorrow' | 'pick_date';

type TimeSlot = '11:00-12:00' | '12:00-13:00' | '19:00-20:00' | '20:00-21:00';

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

export default function MealBoxScheduleScreen() {
  const router = useRouter();

  const [dateOption, setDateOption] = useState<DateOption>('tomorrow');
  const [pickedDate, setPickedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('12:00-13:00');

  const selectedDateLabel = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (dateOption === 'tomorrow') return tomorrow.toLocaleDateString();
    return pickedDate ? pickedDate.toLocaleDateString() : 'Pick date';
  }, [dateOption, pickedDate]);

  const selectedEventDateISO = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const chosen = dateOption === 'tomorrow' ? tomorrow : pickedDate ? pickedDate : null;

    if (!chosen) return '';
    const yyyy = chosen.getFullYear();
    const mm = String(chosen.getMonth() + 1).padStart(2, '0');
    const dd = String(chosen.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, [dateOption, pickedDate]);

  const canContinue = useMemo(() => {
    if (!timeSlot) return false;
    if (dateOption === 'tomorrow') return true;
    return Boolean(pickedDate);
  }, [dateOption, pickedDate, timeSlot]);

  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'set' && date) {
      setPickedDate(date);
      setDateOption('pick_date');
    }
    setShowDatePicker(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <BlackBackHeader title="Meal Schedule" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Delivery date</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {([
            { key: 'tomorrow', label: 'Tomorrow' },
            { key: 'pick_date', label: selectedDateLabel },
          ] as const).map((d) => (
            <Chip
              key={d.key}
              label={d.label}
              selected={dateOption === d.key}
              onPress={() => {
                setDateOption(d.key);
                if (d.key === 'pick_date') setShowDatePicker(true);
              }}
            />
          ))}
        </View>

        {showDatePicker ? (
          <DateTimePicker
            mode="date"
            value={pickedDate ?? new Date(new Date().setDate(new Date().getDate() + 1))}
            minimumDate={new Date(new Date().setDate(new Date().getDate() + 1))}
            onChange={onDateChange}
          />
        ) : null}

        <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8, marginTop: 6 }}>Delivery time</Text>
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
            if (!canContinue) return;
            void setStoredItem('bb_delivery_intent_v1', JSON.stringify({ kind: 'meal_box', deliveryDateISO: selectedEventDateISO }));
            router.push(
              `/meal-box/type?date=${encodeURIComponent(selectedDateLabel)}&eventDate=${encodeURIComponent(
                selectedEventDateISO,
              )}&time=${encodeURIComponent(timeSlot)}` as any,
            );
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
          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Next</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
