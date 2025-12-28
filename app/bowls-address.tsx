import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/src/contexts/AuthContext';
import { apiJson } from '@/src/utils/api';

type Params = {
  bowlId?: string;
  qty?: string;
  addOnIds?: string;
  deliveryDate?: string;
  timeSlot?: string;
};

type Address = {
  id: string;
  label: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  pincode?: string | null;
  landmark?: string | null;
  isDefault?: boolean;
};

export default function BowlsAddressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const auth = useAuth();

  const bowlId = String(params.bowlId ?? '').trim();
  const qty = String(params.qty ?? '').trim();
  const addOnIds = String(params.addOnIds ?? '').trim();
  const deliveryDate = String(params.deliveryDate ?? '').trim();
  const timeSlot = String(params.timeSlot ?? '').trim();

  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');

  const [showNew, setShowNew] = useState(false);
  const [label, setLabel] = useState('Home');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('Vijayawada');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [saving, setSaving] = useState(false);

  const token = auth.state.token;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        if (!token) {
          setAddresses([]);
          setSelectedId('');
          return;
        }
        const data: any = await apiJson('/api/addresses', { token });
        const items = Array.isArray(data?.items) ? (data.items as Address[]) : [];
        setAddresses(items);
        const def = items.find((x) => x.isDefault) ?? items[0] ?? null;
        setSelectedId(def?.id ?? '');
      } catch {
        setAddresses([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const canContinue = Boolean(bowlId && qty && deliveryDate && timeSlot && selectedId);

  async function createAddress() {
    try {
      if (!token) {
        Alert.alert('Login required', 'Go to Account tab and login with OTP first.');
        return;
      }

      const payload = {
        label: label.trim(),
        line1: line1.trim(),
        line2: line2.trim() || undefined,
        city: city.trim(),
        state: state.trim() || undefined,
        pincode: pincode.trim() || undefined,
        landmark: landmark.trim() || undefined,
        isDefault: addresses.length === 0,
      };

      if (!payload.label || !payload.line1 || !payload.city) {
        Alert.alert('Missing fields', 'Please fill Label, Address line 1, and City.');
        return;
      }

      setSaving(true);
      const created: any = await apiJson('/api/addresses', {
        method: 'POST',
        token,
        body: JSON.stringify(payload),
      });

      const next: Address = {
        id: String(created?.id ?? ''),
        label: String(created?.label ?? ''),
        line1: String(created?.line1 ?? ''),
        line2: created?.line2 ?? null,
        city: String(created?.city ?? ''),
        state: created?.state ?? null,
        pincode: created?.pincode ?? null,
        landmark: created?.landmark ?? null,
        isDefault: Boolean(created?.isDefault),
      };

      if (!next.id) throw new Error('Server did not return address id');

      setAddresses((prev) => [next, ...prev]);
      setSelectedId(next.id);
      setShowNew(false);
      setLine1('');
      setLine2('');
      setState('');
      setPincode('');
      setLandmark('');
    } catch (e: any) {
      Alert.alert('Could not save address', String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  const selectedAddress = useMemo(() => addresses.find((a) => a.id === selectedId) ?? null, [addresses, selectedId]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: 40 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F0F0F0', marginRight: 8 }}
        >
          <Text style={{ fontSize: 12 }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700' }}>Delivery address</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {!token ? (
          <View style={{ borderWidth: 1, borderColor: '#FCD34D', backgroundColor: '#FFFBEB', borderRadius: 16, padding: 12, marginBottom: 12 }}>
            <Text style={{ fontWeight: '900', color: '#92400E', marginBottom: 6 }}>Login required</Text>
            <Text style={{ color: '#92400E' }}>Please login from the Account tab to save/select an address.</Text>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: '800' }}>Saved addresses</Text>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setShowNew((v) => !v)}
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#E5E7EB' }}
          >
            <Text style={{ fontWeight: '800' }}>{showNew ? 'Close' : 'Add new'}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator />
        ) : (
          <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, backgroundColor: '#FFFFFF' }}>
            {addresses.length === 0 ? (
              <Text style={{ padding: 12, color: '#6B7280' }}>No addresses saved yet.</Text>
            ) : (
              addresses.map((a, idx) => {
                const selected = a.id === selectedId;
                return (
                  <TouchableOpacity
                    key={a.id}
                    activeOpacity={0.9}
                    onPress={() => setSelectedId(a.id)}
                    style={{
                      padding: 12,
                      borderTopWidth: idx === 0 ? 0 : 1,
                      borderTopColor: '#E5E7EB',
                      backgroundColor: selected ? '#EEF2FF' : '#FFFFFF',
                    }}
                  >
                    <Text style={{ fontWeight: '900', color: '#111827' }}>{a.label}</Text>
                    <Text style={{ color: '#374151', marginTop: 4 }}>{a.line1}</Text>
                    {a.line2 ? <Text style={{ color: '#374151' }}>{a.line2}</Text> : null}
                    <Text style={{ color: '#6B7280', marginTop: 4 }}>{a.city}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {showNew ? (
          <View style={{ marginTop: 14, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 12, backgroundColor: '#FFFFFF' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 10 }}>New address</Text>

            <Text style={{ fontWeight: '800', marginBottom: 6 }}>Label</Text>
            <TextInput value={label} onChangeText={setLabel} placeholder="Home" style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 10, marginBottom: 10 }} />

            <Text style={{ fontWeight: '800', marginBottom: 6 }}>Address line 1</Text>
            <TextInput value={line1} onChangeText={setLine1} placeholder="Flat / Street" style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 10, marginBottom: 10 }} />

            <Text style={{ fontWeight: '800', marginBottom: 6 }}>Address line 2 (optional)</Text>
            <TextInput value={line2} onChangeText={setLine2} placeholder="Area" style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 10, marginBottom: 10 }} />

            <Text style={{ fontWeight: '800', marginBottom: 6 }}>City</Text>
            <TextInput value={city} onChangeText={setCity} placeholder="City" style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 10, marginBottom: 10 }} />

            <Text style={{ fontWeight: '800', marginBottom: 6 }}>State (optional)</Text>
            <TextInput value={state} onChangeText={setState} placeholder="State" style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 10, marginBottom: 10 }} />

            <Text style={{ fontWeight: '800', marginBottom: 6 }}>Pincode (optional)</Text>
            <TextInput value={pincode} onChangeText={setPincode} placeholder="Pincode" keyboardType="number-pad" style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 10, marginBottom: 10 }} />

            <Text style={{ fontWeight: '800', marginBottom: 6 }}>Landmark (optional)</Text>
            <TextInput value={landmark} onChangeText={setLandmark} placeholder="Near ..." style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 10, marginBottom: 12 }} />

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={createAddress}
              disabled={saving}
              style={{ paddingVertical: 12, borderRadius: 16, backgroundColor: saving ? '#CBD5E1' : '#111827', alignItems: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>{saving ? 'Saving...' : 'Save address'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <TouchableOpacity
          disabled={!canContinue}
          activeOpacity={0.9}
          onPress={() => {
            if (!selectedId) {
              Alert.alert('Missing address', 'Select an address to continue.');
              return;
            }
            router.push({
              pathname: '/bowls-summary',
              params: {
                bowlId,
                qty,
                addOnIds,
                deliveryDate,
                timeSlot,
                addressId: selectedId,
              },
            } as any);
          }}
          style={{
            marginTop: 16,
            paddingVertical: 12,
            borderRadius: 18,
            backgroundColor: canContinue ? '#3366FF' : '#CBD5E1',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Continue</Text>
        </TouchableOpacity>

        {selectedAddress ? (
          <Text style={{ marginTop: 10, color: '#6B7280', fontSize: 12 }}>
            Delivering to: {selectedAddress.label}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
