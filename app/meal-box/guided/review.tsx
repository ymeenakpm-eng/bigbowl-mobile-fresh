import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { BlackBackHeader } from '@/components/BlackBackHeader';
import { useAuth } from '@/src/contexts/AuthContext';
import {
    MEAL_BOX_CATEGORIES,
    MEAL_BOX_ITEMS,
    MEAL_BOX_TYPES,
    type MealBoxCategoryKey,
    type MealBoxTypeKey,
} from '@/src/data/mealBoxGuided';
import { apiJson } from '@/src/utils/api';

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

const ADVANCE_PCT = 50;

export default function MealBoxGuidedReviewScreen() {
  const router = useRouter();
  const auth = useAuth();
  const params = useLocalSearchParams<{ state?: string }>();
  const state = useMemo(() => decodeState(params.state), [params.state]);

  const [loading, setLoading] = useState(false);

  const type = useMemo(() => {
    return MEAL_BOX_TYPES.find((t) => t.key === state?.typeKey) ?? MEAL_BOX_TYPES[0];
  }, [state?.typeKey]);

  const boxes = Math.max(10, Math.round(Number(state?.boxes ?? 10)));
  const totalRupees = Math.max(0, Math.round(type.pricePerBoxRupees * boxes));
  const advanceRupees = Math.max(1, Math.round((totalRupees * ADVANCE_PCT) / 100));
  const balanceRupees = Math.max(0, totalRupees - advanceRupees);

  const selectionsByCategory = useMemo(() => {
    const sel = state?.selection;
    if (!sel) return [] as Array<{ title: string; items: string[] }>;

    return MEAL_BOX_CATEGORIES.map((c) => {
      const ids = Array.isArray(sel[c.key]) ? sel[c.key] : [];
      const names = ids
        .map((id) => MEAL_BOX_ITEMS.find((x) => x.id === id)?.name ?? id)
        .filter(Boolean);
      return { title: c.title, items: names };
    });
  }, [state?.selection]);

  const canPay = useMemo(() => {
    if (!state) return false;
    if (!state.customerName.trim()) return false;
    if (!state.eventDateISO) return false;
    if (!state.eventTime) return false;
    if (!auth.state.token) return false;
    return true;
  }, [auth.state.token, state]);

  const confirmAndPayAdvance = async () => {
    try {
      if (!state) return;
      if (!auth.state.token) {
        Alert.alert('Login required', 'Please login from Account to continue.');
        return;
      }

      setLoading(true);

      const data: any = await apiJson('/api/razorpay/orders', {
        method: 'POST',
        body: JSON.stringify({
          currency: 'INR',
          receipt: `mb_${Date.now()}`,
          advancePct: ADVANCE_PCT,
          items: [
            {
              name: `${type.title} (${boxes} boxes)` ,
              price: type.pricePerBoxRupees,
              quantity: boxes,
            },
          ],
          notes: {
            kind: 'meal_box',
            customerName: state.customerName,
            eventDate: state.eventDateISO,
            eventTime: state.eventTime,
            selection: state.selection,
          },
        }),
      });

      const orderId = String(data?.id ?? '');
      const amountPaise = String(data?.amount ?? '');
      const currency = String(data?.currency ?? 'INR');

      if (!orderId || !amountPaise) {
        throw new Error('Server did not return Razorpay order/amount');
      }

      router.push({ pathname: '/checkout/razorpay', params: { orderId, amountPaise, currency } } as any);
    } catch (e: any) {
      Alert.alert('Payment failed', String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <BlackBackHeader title="Meal Box" subtitle="Review & confirm" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {!state ? (
          <View style={{ paddingTop: 20 }}>
            <Text style={{ color: '#B91C1C', fontWeight: '800' }}>Missing state. Please restart the flow.</Text>
          </View>
        ) : (
          <>
            <View style={{ borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', marginBottom: 12 }}>
              <Text style={{ fontWeight: '900', color: '#111827', fontSize: 16 }}>{type.title}</Text>
              <Text style={{ color: '#6B7280', marginTop: 6 }}>
                {state.customerName} • {state.eventDateISO} • {state.eventTime}
              </Text>
            </View>

            <View style={{ borderRadius: 18, padding: 14, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 }}>
              <Text style={{ fontWeight: '900', color: '#111827', marginBottom: 10 }}>Quote Summary</Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#6B7280' }}>Per box</Text>
                <Text style={{ fontWeight: '800', color: '#111827' }}>₹{type.pricePerBoxRupees}</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#6B7280' }}>Boxes</Text>
                <Text style={{ fontWeight: '800', color: '#111827' }}>{boxes}</Text>
              </View>

              <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 10 }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontWeight: '900', color: '#111827' }}>Total</Text>
                <Text style={{ fontWeight: '900', color: '#111827' }}>₹{totalRupees}</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#6B7280' }}>Advance Payable ({ADVANCE_PCT}%)</Text>
                <Text style={{ fontWeight: '900', color: '#111827' }}>₹{advanceRupees}</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#6B7280' }}>Balance due</Text>
                <Text style={{ fontWeight: '800', color: '#111827' }}>₹{balanceRupees}</Text>
              </View>
            </View>

            <View style={{ borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', marginBottom: 12 }}>
              <Text style={{ fontWeight: '900', color: '#111827', marginBottom: 10 }}>Selected Items</Text>
              {selectionsByCategory.map((c) => (
                <View key={c.title} style={{ marginBottom: 10 }}>
                  <Text style={{ fontWeight: '800', color: '#111827', marginBottom: 6 }}>{c.title}</Text>
                  {c.items.length ? (
                    c.items.map((n, idx) => (
                      <Text key={`${c.title}_${idx}`} style={{ color: '#374151' }}>
                        - {n}
                      </Text>
                    ))
                  ) : (
                    <Text style={{ color: '#9CA3AF' }}>-</Text>
                  )}
                </View>
              ))}
            </View>

            {!auth.state.token ? (
              <TouchableOpacity onPress={() => router.push('/(tabs)/account' as any)} activeOpacity={0.85} style={{ marginBottom: 10 }}>
                <Text style={{ color: '#111827', fontWeight: '800', textAlign: 'center' }}>Please login to continue</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.9}
              disabled={!canPay || loading}
              onPress={confirmAndPayAdvance}
              style={{
                backgroundColor: canPay ? '#3366FF' : '#CBD5E1',
                paddingVertical: 12,
                borderRadius: 18,
                alignItems: 'center',
              }}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Confirm & Pay Advance</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
