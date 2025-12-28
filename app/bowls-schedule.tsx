import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

type Params = {
  bowlId?: string;
  qty?: string;
  addOnIds?: string;
};

type DateOption = 'today' | 'tomorrow' | 'pick_date';

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
      borderColor: selected ? '#3366FF' : '#E5E7EB',
      backgroundColor: selected ? '#EEF2FF' : '#FFFFFF',
      marginRight: 10,
      marginBottom: 10,
    }}
  >
    <Text style={{ fontSize: 13, fontWeight: selected ? '800' : '600', color: '#111827' }}>{label}</Text>
  </TouchableOpacity>
);

function dateIso(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function BowlsScheduleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();

  const bowlId = String(params.bowlId ?? '').trim();
  const qty = String(params.qty ?? '').trim();
  const addOnIds = String(params.addOnIds ?? '').trim();

  const [dateOption, setDateOption] = useState<DateOption>('tomorrow');
  const [pickedDate, setPickedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('12:00-13:00');

  const selectedDate = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (dateOption === 'today') return today;
    if (dateOption === 'tomorrow') return tomorrow;
    return pickedDate ?? null;
  }, [dateOption, pickedDate]);

  const selectedDateLabel = useMemo(() => {
    const d = selectedDate;
    return d ? d.toLocaleDateString() : 'Pick date';
  }, [selectedDate]);

  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'set' && date) {
      setPickedDate(date);
      setDateOption('pick_date');
    }
    setShowDatePicker(false);
  };

  const canContinue = Boolean(bowlId && qty && selectedDate && timeSlot);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: 40 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F0F0F0', marginRight: 8 }}
        >
          <Text style={{ fontSize: 12 }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700' }}>Schedule</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 8 }}>Delivery date</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {([
            { key: 'today', label: 'Today' },
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
          <DateTimePicker mode="date" value={pickedDate ?? new Date()} onChange={onDateChange} />
        ) : null}

        <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 8, marginTop: 8 }}>Delivery time</Text>
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
            if (!selectedDate) {
              Alert.alert('Missing date', 'Pick a delivery date to continue.');
              return;
            }
            router.push({
              pathname: '/bowls-address',
              params: {
                bowlId,
                qty,
                addOnIds,
                deliveryDate: dateIso(selectedDate),
                timeSlot,
              },
            } as any);
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
          <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
