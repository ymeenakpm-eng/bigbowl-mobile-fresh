import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useCart } from '../../src/contexts/CartContext';

import { apiJson } from '@/src/utils/api';

export default function CheckoutScreen() {
  const router = useRouter();
  const { state, getCartTotal } = useCart();

  const total = getCartTotal();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canPay = useMemo(
    () => state.items.length > 0 && total > 0,
    [state.items.length, total]
  );

  const createOrderAndPay = async () => {
    try {
      setErr(null);
      setLoading(true);

      const data: any = await apiJson('/api/razorpay/orders', {
        method: 'POST',
        body: JSON.stringify({
          currency: 'INR',
          receipt: `bb_${Date.now()}`,
          items: state.items.map((i) => ({
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        }),
      });

      router.push({
        pathname: '/checkout/razorpay',
        params: {
          orderId: String(data.id),
          amountPaise: String(data.amount),
          currency: String(data.currency ?? 'INR'),
        },
      } as any);
    } catch (e: any) {
      setErr(e?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: 56 }}>
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', marginBottom: 8 }}>
          Checkout
        </Text>
        <Text style={{ color: '#666666', marginBottom: 14 }}>
          Total payable: Rs {total.toFixed(0)}
        </Text>

        {err ? (
          <Text style={{ color: '#D11', marginBottom: 12 }}>{err}</Text>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!canPay || loading}
          onPress={createOrderAndPay}
          style={{
            backgroundColor: canPay ? '#3366FF' : '#AAB',
            paddingVertical: 12,
            borderRadius: 16,
            alignItems: 'center',
          }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>
              Pay with Razorpay (Test)
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.back()}
          style={{
            marginTop: 10,
            paddingVertical: 12,
            borderRadius: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#DDDDDD',
          }}
        >
          <Text style={{ fontWeight: '800' }}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
