import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/src/contexts/AuthContext';
import { apiJson } from '@/src/utils/api';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string; bookingId?: string }>();
  const auth = useAuth();

  const orderId = String(params.orderId ?? '');
  const bookingId = String(params.bookingId ?? '');
  const [status, setStatus] = useState<string>('PAID');
  const [booking, setBooking] = useState<any>(null);
  const [menuIndex, setMenuIndex] = useState<Map<string, string>>(new Map());
  const [tierIndex, setTierIndex] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    (async () => {
      try {
        if (!orderId) return;
        const data: any = await apiJson(`/api/orders/${orderId}`);
        if (data?.status) setStatus(String(data.status));
      } catch {
        // ignore
      }
    })();
  }, [orderId]);

  useEffect(() => {
    (async () => {
      try {
        if (!bookingId) return;
        if (!auth.state.token) return;
        const data: any = await apiJson(`/api/bookings/${bookingId}`, { token: auth.state.token });
        setBooking(data ?? null);
      } catch {
        setBooking(null);
      }
    })();
  }, [auth.state.token, bookingId]);

  useEffect(() => {
    (async () => {
      try {
        const data: any = await apiJson('/api/catalog/partybox');
        const menu = Array.isArray(data?.menu) ? data.menu : [];
        const tiers = Array.isArray(data?.tiers) ? data.tiers : [];
        const m = new Map<string, string>();
        const t = new Map<string, string>();
        for (const it of menu) {
          const id = String(it?.id ?? '').trim();
          const name = String(it?.name ?? '').trim();
          if (id && name) m.set(id, name);
        }
        for (const it of tiers) {
          const key = String(it?.key ?? '').trim();
          const title = String(it?.title ?? '').trim();
          if (key && title) t.set(key, title);
        }
        setMenuIndex(m);
        setTierIndex(t);
      } catch {
        setMenuIndex(new Map());
        setTierIndex(new Map());
      }
    })();
  }, []);

  const selectionSummary = (() => {
    const breakdown = booking?.quote?.breakdown;
    const sel = breakdown && typeof breakdown === 'object' ? breakdown?.selection : null;
    if (!sel || typeof sel !== 'object') return null;
    if (String(sel.kind ?? '') !== 'party_box') return null;

    const guests = String(sel.guests ?? '').trim();
    const occasion = String(sel.occasion ?? '').trim();
    const date = String(sel.date ?? '').trim();
    const time = String(sel.time ?? '').trim();
    const tierKey = String(sel.tierKey ?? '').trim();
    const pref = String(sel.pref ?? '').trim();

    const tierTitle = tierIndex.get(tierKey) ?? '';

    const items = Array.isArray(sel.items) ? sel.items.map((x: any) => String(x)).filter(Boolean) : [];
    const names = items.map((id: string) => menuIndex.get(id) ?? id);

    return { guests, occasion, date, time, tierKey, tierTitle, pref, names };
  })();

  const money = (paise: any) => {
    const n = Number(paise);
    if (!Number.isFinite(n)) return '0';
    return String(Math.round(n / 100));
  };

  const quote = booking?.quote ?? null;
  const totalPaise = quote?.total;
  const subtotalPaise = quote?.subtotal;
  const gstPaise = quote?.gst;
  const advancePaise = booking?.advanceAmount;
  const balancePaise = Number.isFinite(Number(totalPaise)) && Number.isFinite(Number(advancePaise)) ? Math.max(0, Number(totalPaise) - Number(advancePaise)) : null;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: 60 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: '900', marginBottom: 8 }}>
          Payment Successful
        </Text>

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
          <Text style={{ color: '#555555' }}>
            Order: {orderId || '-'}
            {'\n'}
            Payment status: {status}
          </Text>
        </View>

        {booking ? (
          <View
            style={{
              borderRadius: 16,
              padding: 14,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#E5E7EB',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontWeight: '900', marginBottom: 10 }}>Booking</Text>

            <Text style={{ color: '#555555' }}>
              Booking ID: {String(booking.id ?? '-')}
              {'\n'}
              Booking status: {String(booking.status ?? '-')}
            </Text>

            {quote ? (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontWeight: '900', marginBottom: 6 }}>Totals</Text>
                <Text style={{ color: '#555555' }}>
                  Subtotal: ₹{money(subtotalPaise)}
                  {'\n'}
                  GST: ₹{money(gstPaise)}
                  {'\n'}
                  Total: ₹{money(totalPaise)}
                </Text>

                <View style={{ marginTop: 10 }}>
                  <Text style={{ color: '#555555' }}>
                    Advance: ₹{money(advancePaise)} ({String(booking.advancePct ?? '-') }%)
                    {'\n'}
                    Balance due: ₹{balancePaise == null ? '-' : money(balancePaise)}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {selectionSummary ? (
          <View
            style={{
              borderRadius: 16,
              padding: 14,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#E5E7EB',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontWeight: '900', marginBottom: 10 }}>Party Box</Text>
            <Text style={{ color: '#555555' }}>
              {selectionSummary.tierTitle || selectionSummary.tierKey ? `Tier: ${selectionSummary.tierTitle || selectionSummary.tierKey}` : 'Tier: -'}
              {'\n'}
              Guests: {selectionSummary.guests || '-'}
              {'\n'}
              Occasion: {selectionSummary.occasion || '-'}
              {'\n'}
              Slot: {selectionSummary.date || '-'} {selectionSummary.time ? `• ${selectionSummary.time}` : ''}
              {'\n'}
              Preference: {selectionSummary.pref || '-'}
            </Text>

            {selectionSummary.names.length > 0 ? (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontWeight: '900', marginBottom: 6 }}>Menu</Text>
                {selectionSummary.names.slice(0, 10).map((n: string, idx: number) => (
                  <Text key={`${n}_${idx}`} style={{ color: '#555555' }}>
                    - {n}
                  </Text>
                ))}
                {selectionSummary.names.length > 10 ? (
                  <Text style={{ color: '#555555', marginTop: 6 }}>
                    +{selectionSummary.names.length - 10} more
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.replace('/' as any)}
          style={{
            backgroundColor: '#3366FF',
            paddingVertical: 12,
            borderRadius: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
