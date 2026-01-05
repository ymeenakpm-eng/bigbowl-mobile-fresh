import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { BlackBackHeader } from '@/components/BlackBackHeader';

export default function PaymentFailureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string; reason?: string; bookingId?: string; bowlOrderId?: string; amountPaise?: string; currency?: string }>();

  const orderId = String(params.orderId ?? '');
  const reason = String(params.reason ?? '');
  const bookingId = String(params.bookingId ?? '');
  const bowlOrderId = String(params.bowlOrderId ?? '');
  const amountPaise = String(params.amountPaise ?? '');
  const currency = String(params.currency ?? 'INR');

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <BlackBackHeader title="Payment Failed" subtitle={orderId ? `Order: ${orderId}` : null} />
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '900', marginBottom: 8 }}>
          Payment Failed
        </Text>
        <Text style={{ color: '#555555', marginBottom: 18 }}>
          Order: {orderId || '-'}
          {'\n'}
          You can retry the payment.
        </Text>

        {reason ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: '#F0C1C1',
              backgroundColor: '#FFF5F5',
              borderRadius: 12,
              padding: 12,
              marginBottom: 14,
            }}
          >
            <Text style={{ fontWeight: '900', marginBottom: 6, color: '#8A1F1F' }}>
              Details
            </Text>
            <Text style={{ color: '#8A1F1F' }}>{reason}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            if (orderId && amountPaise) {
              router.replace({
                pathname: '/checkout/razorpay',
                params: { orderId, amountPaise, currency, bookingId, bowlOrderId },
              } as any);
              return;
            }
            router.replace('/checkout' as any);
          }}
          style={{
            backgroundColor: '#3366FF',
            paddingVertical: 12,
            borderRadius: 16,
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
