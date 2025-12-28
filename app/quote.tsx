import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { useAuth } from '@/src/contexts/AuthContext';
import { useLocation } from '@/src/contexts/LocationContext';

import { apiJson, getApiBaseUrl } from '@/src/utils/api';

type Params = {
  packageId?: string;
  selection?: string;
  pax?: string;
  eventDate?: string;
};

type PackageItem = {
  id: string;
  title: string;
  cuisine: string;
  minPax: number;
  basePrice: number;
  perPax: number;
  isVeg: boolean;
};

type QuoteResponse = {
  id: string;
  subtotal: number;
  gst: number;
  total: number;
  breakdown: any;
  expiresAt: string;
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function QuoteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const auth = useAuth();
  const location = useLocation();

  const packageId = String(params.packageId ?? '').trim();

  const initialPax = String(params.pax ?? '').trim();
  const initialEventDate = String(params.eventDate ?? '').trim();
  const selectionRaw = String(params.selection ?? '').trim();
  const selection = useMemo(() => {
    if (!selectionRaw) return null;
    try {
      const parsed = JSON.parse(selectionRaw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }, [selectionRaw]);

  const [pkg, setPkg] = useState<PackageItem | null>(null);
  const [loadingPkg, setLoadingPkg] = useState(true);
  const [pax, setPax] = useState(initialPax || '80');
  const [distanceKm, setDistanceKm] = useState('0');
  const [city, setCity] = useState(location.state.city);
  const [eventDate, setEventDate] = useState(initialEventDate || todayISO());

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState(false);

  const [apiBaseUrl, setApiBaseUrl] = useState<string>('');

  useEffect(() => {
    (async () => {
      const v = await getApiBaseUrl();
      setApiBaseUrl(v);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoadingPkg(true);
        const data = await apiJson('/api/catalog/packages');
        const items = Array.isArray((data as any)?.items) ? ((data as any).items as PackageItem[]) : [];
        const found = items.find((x) => x.id === packageId) ?? null;
        setPkg(found);
      } catch (e: any) {
        Alert.alert('Error', String(e?.message ?? e));
      } finally {
        setLoadingPkg(false);
      }
    })();
  }, [packageId]);

  const canQuote = useMemo(() => {
    const paxN = Number(pax);
    const distN = Number(distanceKm);
    if (!packageId) return false;
    if (!Number.isFinite(paxN) || paxN <= 0) return false;
    if (!city.trim()) return false;
    if (!eventDate.trim()) return false;
    if (!Number.isFinite(distN) || distN < 0) return false;
    return true;
  }, [city, distanceKm, eventDate, packageId, pax]);

  const isLoggedIn = Boolean(auth.state.token);

  async function createQuote() {
    try {
      setLoadingQuote(true);
      setQuote(null);

      const payload = {
        packageId,
        pax: Number(pax),
        city: city.trim(),
        distanceKm: Number(distanceKm),
        eventDate: eventDate.trim(),
        selection: selection ?? undefined,
      };

      const data = await apiJson('/api/quotes/instant', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setQuote(data as QuoteResponse);
    } catch (e: any) {
      Alert.alert('Quote failed', String(e?.message ?? e));
    } finally {
      setLoadingQuote(false);
    }
  }

  const breakdownLines = useMemo(() => {
    const b: any = quote?.breakdown;
    if (!b) return [];
    if (Array.isArray(b)) return b;
    if (Array.isArray(b?.lines)) return b.lines;
    return [];
  }, [quote?.breakdown]);

  async function createBookingAndPay() {
    try {
      if (!quote?.id) {
        Alert.alert('Missing quote', 'Create a quote first.');
        return;
      }
      if (!auth.state.token) {
        Alert.alert('Login required', 'Go to Account tab and login with OTP first.');
        return;
      }

      setLoadingBooking(true);

      const data = await apiJson('/api/bookings', {
        method: 'POST',
        token: auth.state.token,
        body: JSON.stringify({ quoteId: quote.id }),
      });

      const bookingId = String((data as any)?.bookingId ?? '');
      const orderId = String((data as any)?.razorpayOrderId ?? '');
      const amountPaise = String((data as any)?.amountPaise ?? '');
      const currency = String((data as any)?.currency ?? 'INR');

      const alreadyPaid = Boolean((data as any)?.alreadyPaid) || Boolean((data as any)?.advancePaid);
      if (alreadyPaid && bookingId) {
        router.replace({ pathname: '/checkout/success', params: { bookingId, orderId } } as any);
        return;
      }

      if (!orderId || !amountPaise) {
        throw new Error('Server did not return razorpayOrderId/amountPaise');
      }

      router.push({
        pathname: '/checkout/razorpay',
        params: { bookingId, orderId, amountPaise, currency },
      } as any);
    } catch (e: any) {
      Alert.alert('Booking failed', String(e?.message ?? e));
    } finally {
      setLoadingBooking(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#FFFFFF' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F0F0F0', marginRight: 8 }}
          >
            <Text style={{ fontSize: 12 }}>Back</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: '700' }}>Quote</Text>
        </View>

        <Text style={{ color: '#666666', marginBottom: 16 }}>
          {loadingPkg ? 'Loading package...' : pkg ? pkg.title : 'Package not found'}
        </Text>

        {loadingPkg ? (
          <View style={{ paddingVertical: 20 }}>
            <ActivityIndicator />
          </View>
        ) : null}

        <View style={{ marginTop: 8 }}>
          <Text style={{ fontSize: 12, color: '#333', marginBottom: 6 }}>City</Text>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="Hyderabad"
            autoCapitalize="words"
            style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 }}
          />
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 12, color: '#333', marginBottom: 6 }}>Pax</Text>
          <TextInput
            value={pax}
            onChangeText={setPax}
            placeholder="80"
            keyboardType="number-pad"
            style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 }}
          />
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 12, color: '#333', marginBottom: 6 }}>Distance (km)</Text>
          <TextInput
            value={distanceKm}
            onChangeText={setDistanceKm}
            placeholder="0"
            keyboardType="number-pad"
            style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 }}
          />
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 12, color: '#333', marginBottom: 6 }}>Event date (YYYY-MM-DD)</Text>
          <TextInput
            value={eventDate}
            onChangeText={setEventDate}
            placeholder={todayISO()}
            autoCapitalize="none"
            style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 }}
          />
        </View>

        <View style={{ marginTop: 14 }}>
          <TouchableOpacity
            onPress={createQuote}
            disabled={!canQuote || loadingQuote}
            style={{
              backgroundColor: canQuote ? '#3366FF' : '#AAB',
              paddingVertical: 12,
              borderRadius: 14,
              alignItems: 'center',
            }}
          >
            {loadingQuote ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Create Quote</Text>}
          </TouchableOpacity>
        </View>

        {quote ? (
          <View style={{ marginTop: 18, padding: 14, borderRadius: 12, backgroundColor: '#F7F7F7' }}>
            <Text style={{ fontWeight: '800', marginBottom: 8 }}>Quote</Text>
            <Text style={{ color: '#333' }}>Subtotal: ₹{(quote.subtotal / 100).toFixed(0)}</Text>
            <Text style={{ color: '#333' }}>GST: ₹{(quote.gst / 100).toFixed(0)}</Text>
            <Text style={{ color: '#333', fontWeight: '800', marginTop: 6 }}>Total: ₹{(quote.total / 100).toFixed(0)}</Text>
            <Text style={{ color: '#666', marginTop: 8 }}>Expires: {new Date(quote.expiresAt).toLocaleString()}</Text>

            <View style={{ marginTop: 12 }}>
              {breakdownLines?.map((b: any) => (
                <View key={b.label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: '#333', flex: 1, paddingRight: 10 }}>{b.label}</Text>
                  <Text style={{ color: '#333' }}>₹{(Number(b.amount) / 100).toFixed(0)}</Text>
                </View>
              ))}
            </View>

            <View style={{ marginTop: 14 }}>
              <TouchableOpacity
                onPress={createBookingAndPay}
                disabled={!isLoggedIn || loadingBooking}
                style={{
                  backgroundColor: isLoggedIn ? '#111' : '#AAB',
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: 'center',
                }}
              >
                {loadingBooking ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Book & Pay Advance</Text>
                )}
              </TouchableOpacity>
              {!isLoggedIn ? (
                <Text style={{ color: '#666', marginTop: 8 }}>
                  Login first from Account tab to book.
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        <Text style={{ color: '#666', marginTop: 18, fontSize: 12 }}>
          API: {apiBaseUrl}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
