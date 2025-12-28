import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/src/contexts/AuthContext';
import { apiJson } from '@/src/utils/api';

type Params = {
  bowlId?: string;
  qty?: string;
  addOnIds?: string;
  deliveryDate?: string;
  timeSlot?: string;
  addressId?: string;
};

type Bowl = {
  id: string;
  title: string;
  pricePerUnit: number;
  minQty: number;
  isVeg: boolean;
  images: string[];
  inclusions: string[];
};

type AddOn = {
  id: string;
  title: string;
  pricePerUnit: number;
};

type Quote = {
  deliveryFee: number;
  subtotal: number;
  total: number;
  lines: { label: string; amount: number }[];
  addOns: AddOn[];
  bowl: Bowl;
};

export default function BowlsSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const auth = useAuth();

  const bowlId = String(params.bowlId ?? '').trim();
  const qty = Number(String(params.qty ?? '0'));
  const addOnIdsRaw = String(params.addOnIds ?? '').trim();
  const deliveryDate = String(params.deliveryDate ?? '').trim();
  const timeSlot = String(params.timeSlot ?? '').trim();
  const addressId = String(params.addressId ?? '').trim();

  const addOnIds = useMemo(() => {
    if (!addOnIdsRaw) return [] as string[];
    try {
      const parsed = JSON.parse(addOnIdsRaw);
      return Array.isArray(parsed) ? parsed.map((x) => String(x)).filter(Boolean) : [];
    } catch {
      return [];
    }
  }, [addOnIdsRaw]);

  const [quoting, setQuoting] = useState(true);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setQuoting(true);
        const data: any = await apiJson('/api/bowls/quote', {
          method: 'POST',
          body: JSON.stringify({ bowlId, qty, addOnIds }),
        });

        const b = data?.bowl as Bowl;
        const a = Array.isArray(data?.addOns) ? (data.addOns as AddOn[]) : [];

        setQuote({
          bowl: b,
          addOns: a,
          deliveryFee: Number(data?.deliveryFee ?? 0),
          subtotal: Number(data?.subtotal ?? 0),
          total: Number(data?.total ?? 0),
          lines: Array.isArray(data?.lines) ? data.lines : [],
        });
      } catch (e: any) {
        Alert.alert('Quote failed', String(e?.message ?? e));
        setQuote(null);
      } finally {
        setQuoting(false);
      }
    })();
  }, [addOnIds, bowlId, qty]);

  const money = (paise: any) => {
    const n = Number(paise);
    if (!Number.isFinite(n)) return '0';
    return String(Math.round(n / 100));
  };

  const canPlace = Boolean(!quoting && quote && bowlId && qty > 0 && deliveryDate && timeSlot && addressId);

  async function placeAndPay() {
    try {
      if (!auth.state.token) {
        Alert.alert('Login required', 'Go to Account tab and login with OTP first.');
        return;
      }
      if (!canPlace) return;

      setPlacing(true);

      const data: any = await apiJson('/api/bowls/order', {
        method: 'POST',
        token: auth.state.token,
        body: JSON.stringify({ bowlId, qty, addOnIds, deliveryDate, timeSlot, addressId }),
      });

      const bowlOrderId = String(data?.bowlOrderId ?? '').trim();
      const orderId = String(data?.razorpayOrderId ?? '').trim();
      const amountPaise = String(data?.amountPaise ?? '').trim();
      const currency = String(data?.currency ?? 'INR');

      if (!bowlOrderId) throw new Error('Server did not return bowlOrderId');
      if (!orderId || !amountPaise) throw new Error('Server did not return razorpayOrderId/amountPaise');

      router.push({
        pathname: '/checkout/razorpay',
        params: { orderId, amountPaise, currency, bowlOrderId },
      } as any);
    } catch (e: any) {
      Alert.alert('Could not place order', String(e?.message ?? e));
    } finally {
      setPlacing(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: 40 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F0F0F0', marginRight: 8 }}
        >
          <Text style={{ fontSize: 12 }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700' }}>Order summary</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {quoting ? (
          <ActivityIndicator />
        ) : quote ? (
          <>
            <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 12, backgroundColor: '#FFFFFF' }}>
              <Text style={{ fontSize: 16, fontWeight: '900', marginBottom: 6 }}>{quote.bowl.title}</Text>
              <Text style={{ color: '#6B7280' }}>
                Qty: {qty}
                {'\n'}
                Delivery: {deliveryDate} ({timeSlot})
              </Text>

              {quote.addOns.length > 0 ? (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontWeight: '900', marginBottom: 6 }}>Add-ons</Text>
                  {quote.addOns.map((a) => (
                    <Text key={a.id} style={{ color: '#111827', marginBottom: 4 }}>
                      {a.title} (+₹{money(a.pricePerUnit)}/bowl)
                    </Text>
                  ))}
                </View>
              ) : (
                <Text style={{ marginTop: 10, color: '#6B7280' }}>No add-ons selected.</Text>
              )}
            </View>

            <View style={{ marginTop: 14, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 12, backgroundColor: '#FFFFFF' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 8 }}>Price</Text>

              {quote.lines.map((l, idx) => (
                <View key={`${l.label}-${idx}`} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: '#111827', flex: 1, paddingRight: 10 }}>{l.label}</Text>
                  <Text style={{ color: '#111827', fontWeight: '900' }}>₹{money(l.amount)}</Text>
                </View>
              ))}

              <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#111827', fontWeight: '900' }}>Total payable</Text>
                <Text style={{ color: '#111827', fontWeight: '900' }}>₹{money(quote.total)}</Text>
              </View>
            </View>

            <TouchableOpacity
              disabled={!canPlace || placing}
              activeOpacity={0.9}
              onPress={placeAndPay}
              style={{
                marginTop: 16,
                paddingVertical: 12,
                borderRadius: 18,
                backgroundColor: !canPlace || placing ? '#CBD5E1' : '#3366FF',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>{placing ? 'Creating payment...' : 'Pay now'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={{ color: '#6B7280' }}>Could not calculate total. Go back and try again.</Text>
        )}
      </ScrollView>
    </View>
  );
}
