import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/src/contexts/AuthContext';
import { apiJson } from '@/src/utils/api';

type Params = {
  bowlOrderId?: string;
};

type BowlOrder = {
  id: string;
  status: string;
  qty: number;
  deliveryDate: string;
  timeSlot: string;
  deliveryFee: number;
  subtotal: number;
  total: number;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  bowl: { id: string; title: string; pricePerUnit: number; minQty: number; isVeg: boolean };
  address: { id: string; label: string; line1: string; line2?: string | null; city: string };
  addons: { id: string; title: string; pricePerUnit: number }[];
};

function statusSteps(status: string) {
  const normalized = String(status ?? '').toUpperCase();
  const isConfirmed = ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(normalized);
  const isPreparing = ['PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(normalized);
  const isOut = ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(normalized);
  const isDelivered = ['DELIVERED'].includes(normalized);

  return [
    { key: 'CONFIRMED', title: 'Confirmed', done: isConfirmed },
    { key: 'PREPARING', title: 'Preparing', done: isPreparing },
    { key: 'OUT_FOR_DELIVERY', title: 'Out for delivery', done: isOut },
    { key: 'DELIVERED', title: 'Delivered', done: isDelivered },
  ];
}

export default function BowlsStatusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const auth = useAuth();

  const bowlOrderId = String(params.bowlOrderId ?? '').trim();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<BowlOrder | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        if (!bowlOrderId) {
          setOrder(null);
          return;
        }
        if (!auth.state.token) {
          setOrder(null);
          return;
        }

        const data: any = await apiJson(`/api/bowls/orders/${encodeURIComponent(bowlOrderId)}`, { token: auth.state.token });
        setOrder(data as BowlOrder);
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [auth.state.token, bowlOrderId]);

  const money = (paise: any) => {
    const n = Number(paise);
    if (!Number.isFinite(n)) return '0';
    return String(Math.round(n / 100));
  };

  const steps = useMemo(() => statusSteps(order?.status ?? ''), [order?.status]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: 60 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: '900', marginBottom: 8 }}>Order status</Text>

        <View
          style={{
            borderRadius: 16,
            padding: 14,
            backgroundColor: '#F8FAFC',
            borderWidth: 1,
            borderColor: '#E5E7EB',
            marginBottom: 12,
          }}
        >
          <Text style={{ fontWeight: '900' }}>Order ID</Text>
          <Text style={{ color: '#6B7280', marginTop: 6 }}>{bowlOrderId || '-'}</Text>
        </View>

        {!auth.state.token ? (
          <View style={{ borderWidth: 1, borderColor: '#FCD34D', backgroundColor: '#FFFBEB', borderRadius: 16, padding: 12, marginBottom: 12 }}>
            <Text style={{ fontWeight: '900', color: '#92400E', marginBottom: 6 }}>Login required</Text>
            <Text style={{ color: '#92400E' }}>Please login from the Account tab to view your order details.</Text>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator />
        ) : order ? (
          <>
            <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 12, backgroundColor: '#FFFFFF' }}>
              <Text style={{ fontWeight: '900', fontSize: 16 }}>{order.bowl.title}</Text>
              <Text style={{ color: '#6B7280', marginTop: 6 }}>
                Qty: {order.qty}
                {'\n'}
                Delivery: {String(order.deliveryDate).slice(0, 10)} ({order.timeSlot})
              </Text>
              <Text style={{ color: '#6B7280', marginTop: 8 }}>
                Address: {order.address.label} • {order.address.city}
              </Text>
            </View>

            <View style={{ marginTop: 14, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 12, backgroundColor: '#FFFFFF' }}>
              <Text style={{ fontSize: 16, fontWeight: '900', marginBottom: 10 }}>Timeline</Text>

              {steps.map((s, idx) => (
                <View key={s.key} style={{ flexDirection: 'row', marginBottom: idx === steps.length - 1 ? 0 : 12 }}>
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 999,
                      marginTop: 2,
                      marginRight: 10,
                      backgroundColor: s.done ? '#16A34A' : '#E5E7EB',
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '900', color: '#111827' }}>{s.title}</Text>
                    <Text style={{ color: '#6B7280', marginTop: 2 }}>
                      {s.done ? 'Completed' : 'Pending'}
                    </Text>
                  </View>
                </View>
              ))}

              <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 }} />
              <Text style={{ color: '#6B7280' }}>Current status: {String(order.status ?? '').replace(/_/g, ' ')}</Text>
            </View>

            <View style={{ marginTop: 14, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 12, backgroundColor: '#FFFFFF' }}>
              <Text style={{ fontSize: 16, fontWeight: '900', marginBottom: 10 }}>Payment</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#111827' }}>Subtotal</Text>
                <Text style={{ color: '#111827', fontWeight: '900' }}>₹{money(order.subtotal)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#111827' }}>Delivery fee</Text>
                <Text style={{ color: '#111827', fontWeight: '900' }}>₹{money(order.deliveryFee)}</Text>
              </View>
              <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#111827', fontWeight: '900' }}>Total paid</Text>
                <Text style={{ color: '#111827', fontWeight: '900' }}>₹{money(order.total)}</Text>
              </View>
            </View>
          </>
        ) : (
          <Text style={{ color: '#6B7280' }}>Could not load order details.</Text>
        )}

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.replace('/' as any)}
          style={{
            marginTop: 16,
            paddingVertical: 12,
            borderRadius: 18,
            backgroundColor: '#111827',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Back to home</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
