import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocation } from '../src/contexts/LocationContext';

import { BlackBackHeader } from '@/components/BlackBackHeader';

export default function LocationScreen() {
  const router = useRouter();
  const { state, setLocation } = useLocation();

  const [city, setCity] = useState(state.city);
  const [pincode, setPincode] = useState(state.pincode);

  const canSave = useMemo(() => {
    const pin = pincode.trim();
    return city.trim().length > 1 && /^\d{6}$/.test(pin);
  }, [city, pincode]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <BlackBackHeader title="Location" />
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>
          Enter your delivery city and pincode to check service availability.
        </Text>

        <Text style={{ fontSize: 13, fontWeight: '700', marginBottom: 6 }}>City</Text>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="Vijayawada"
          style={{
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 12,
          }}
        />

        <Text style={{ fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Pincode</Text>
        <TextInput
          value={pincode}
          onChangeText={(t) => setPincode(t.replace(/\D/g, '').slice(0, 6))}
          placeholder="520001"
          keyboardType="number-pad"
          style={{
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 12,
          }}
        />

        <TouchableOpacity
          disabled={!canSave}
          activeOpacity={0.9}
          onPress={() => {
            if (!canSave) {
              Alert.alert('Invalid details', 'Please enter a valid 6-digit pincode.');
              return;
            }

            const next = { city: city.trim(), pincode: pincode.trim() };
            setLocation(next);
            router.back();
          }}
          style={{
            marginTop: 8,
            paddingVertical: 12,
            borderRadius: 18,
            backgroundColor: canSave ? '#3366FF' : '#CBD5E1',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Save</Text>
        </TouchableOpacity>

        <Text style={{ marginTop: 10, fontSize: 12, color: state.serviceAvailable ? '#166534' : '#991B1B' }}>
          {state.serviceAvailable
            ? 'Service available in your area.'
            : 'Service not available for this pincode yet.'}
        </Text>
      </View>
    </View>
  );
}
