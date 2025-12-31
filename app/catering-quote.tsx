import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { useAuth } from '@/src/contexts/AuthContext';
import { useLocation } from '@/src/contexts/LocationContext';
import { apiJson } from '@/src/utils/api';

type Params = {
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

function rupeesFromPaise(paise: any) {
  const n = Number(paise);
  if (!Number.isFinite(n)) return '0';
  return String(Math.round(n / 100));
}

export default function CateringQuoteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const auth = useAuth();
  const location = useLocation();

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

  const selectedItems = useMemo(() => {
    const items = Array.isArray((selection as any)?.items) ? ((selection as any).items as any[]) : [];
    return items
      .map((x) => ({
        id: String(x?.id ?? ''),
        name: String(x?.name ?? ''),
        count: Math.max(0, Math.round(Number(x?.count ?? 0))),
        accompaniments: Array.isArray(x?.accompaniments) ? x.accompaniments.map((a: any) => String(a)).filter(Boolean) : [],
      }))
      .filter((x) => x.id && x.count > 0);
  }, [selection]);

  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loadingPkgs, setLoadingPkgs] = useState(true);
  const [packageId, setPackageId] = useState<string>('');

  const [customerName, setCustomerName] = useState('');
  const [city, setCity] = useState(location.state.city);
  const [distanceKm, setDistanceKm] = useState('0');
  const [pax, setPax] = useState(String(params.pax ?? '').trim() || '80');
  const [eventDate, setEventDate] = useState(String(params.eventDate ?? '').trim() || todayISO());

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [sentWhatsApp, setSentWhatsApp] = useState(false);
  const [autoQuoteTriggered, setAutoQuoteTriggered] = useState(false);

  const isLoggedIn = Boolean(auth.state.token);

  useEffect(() => {
    (async () => {
      try {
        setLoadingPkgs(true);
        const data = await apiJson('/api/catalog/packages');
        const items = Array.isArray((data as any)?.items) ? ((data as any).items as PackageItem[]) : [];
        setPackages(items);

        if (!packageId && items.length > 0) {
          const mealType = String((selection as any)?.mealType ?? '').toLowerCase();
          const preferBreakfast = mealType.includes('breakfast');
          const preferBiryani = mealType.includes('lunch') || mealType.includes('dinner') || mealType.includes('snacks');

          const byTitle = (needle: string) =>
            items.find((p) => String(p.title ?? '').toLowerCase().includes(needle.toLowerCase())) ?? null;

          const guess =
            (preferBreakfast ? byTitle('breakfast') : null) ??
            (preferBiryani ? byTitle('biryani') : null) ??
            items[0];

          setPackageId(String(guess?.id ?? items[0].id));
        }
      } catch {
        setPackages([]);
      } finally {
        setLoadingPkgs(false);
      }
    })();
  }, []);

  const breakdownLines = useMemo(() => {
    const b: any = quote?.breakdown;
    if (!b) return [];
    if (Array.isArray(b)) return b;
    if (Array.isArray(b?.lines)) return b.lines;
    return [];
  }, [quote?.breakdown]);

  const canQuote = useMemo(() => {
    const paxN = Number(pax);
    const distN = Number(distanceKm);
    if (!packageId) return false;
    if (!Number.isFinite(paxN) || paxN <= 0) return false;
    if (!city.trim()) return false;
    if (!eventDate.trim()) return false;
    if (!Number.isFinite(distN) || distN < 0) return false;
    if (!selection) return false;
    if (selectedItems.length === 0) return false;
    return true;
  }, [city, distanceKm, eventDate, packageId, pax, selectedItems.length, selection]);

  async function createQuote() {
    try {
      setLoadingQuote(true);
      setQuote(null);
      setSentWhatsApp(false);

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

  useEffect(() => {
    (async () => {
      if (autoQuoteTriggered) return;
      if (loadingPkgs) return;
      if (!canQuote) return;
      setAutoQuoteTriggered(true);
      await createQuote();
    })();
  }, [autoQuoteTriggered, canQuote, loadingPkgs]);

  const whatsappMessage = useMemo(() => {
    if (!quote) return '';

    const lines: string[] = [];
    lines.push(`Catering Quote`);
    lines.push(`Customer: ${customerName.trim()}`);
    lines.push(`City: ${city.trim()}`);
    lines.push(`Event date: ${eventDate.trim()}`);
    lines.push(`Pax: ${String(pax).trim()}`);
    lines.push(`Distance: ${String(distanceKm).trim()} km`);
    lines.push('');

    lines.push('Items:');
    for (const it of selectedItems) {
      lines.push(`- ${it.name} × ${it.count}`);
      if (it.accompaniments?.length) {
        lines.push(`  Accompaniments: ${it.accompaniments.join(', ')}`);
      }
    }

    lines.push('');
    lines.push('Breakdown:');
    for (const b of breakdownLines) {
      lines.push(`- ${String(b?.label ?? '')}: ₹${rupeesFromPaise(b?.amount)}`);
    }

    lines.push('');
    lines.push(`Total: ₹${rupeesFromPaise(quote.total)}`);

    return lines.join('\n');
  }, [breakdownLines, city, customerName, distanceKm, eventDate, pax, quote, selectedItems]);

  useEffect(() => {
    (async () => {
      if (!quote?.id) return;
      if (sentWhatsApp) return;
      if (!customerName.trim()) return;
      if (!whatsappMessage) return;

      try {
        const url = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
        const can = await Linking.canOpenURL(url);
        if (can) {
          await Linking.openURL(url);
          setSentWhatsApp(true);
        }
      } catch {
        // ignore
      }
    })();
  }, [quote?.id, sentWhatsApp, whatsappMessage]);

  const presetForModify = useMemo(() => {
    const selected: Record<string, any> = {};
    for (const it of selectedItems) {
      selected[it.id] = { count: it.count, accompaniments: it.accompaniments ?? [] };
    }

    return JSON.stringify({
      step: 4,
      state: {
        dateOption: 'date',
        occasion: String((selection as any)?.occasion ?? ''),
        guestsRange: String((selection as any)?.guestsRange ?? ''),
        mealType: String((selection as any)?.mealType ?? ''),
      },
      specificDateISO: eventDate ? new Date(`${eventDate}T00:00:00`).toISOString() : undefined,
      selected,
    });
  }, [eventDate, selectedItems, selection]);

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
          <Text style={{ fontSize: 22, fontWeight: '800' }}>Catering Quote</Text>
        </View>

        {selectedItems.length === 0 ? (
          <Text style={{ color: '#B91C1C', marginBottom: 12 }}>No catering items found. Please go back and add items.</Text>
        ) : null}

        <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, padding: 12, backgroundColor: '#FFFFFF', marginBottom: 12 }}>
          <Text style={{ fontWeight: '800', marginBottom: 8 }}>Selected items</Text>
          {selectedItems.map((it) => (
            <View key={it.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ fontWeight: '700', color: '#111827' }}>
                  {it.name} × {it.count}
                </Text>
                {it.accompaniments?.length ? (
                  <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>
                    {it.accompaniments.join(', ')}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={() => {
                  router.push({ pathname: '/catering', params: { preset: presetForModify } } as any);
                }}
                style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}
                activeOpacity={0.9}
              >
                <Text style={{ fontWeight: '800', fontSize: 12 }}>Modify</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <Text style={{ fontSize: 12, color: '#333', marginBottom: 6 }}>Customer name</Text>
        <TextInput
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="Customer name"
          autoCapitalize="words"
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 12 }}
        />

        <Text style={{ fontSize: 12, color: '#333', marginBottom: 6 }}>City</Text>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="Hyderabad"
          autoCapitalize="words"
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 12 }}
        />

        <Text style={{ fontSize: 12, color: '#333', marginBottom: 6 }}>Distance (km)</Text>
        <TextInput
          value={distanceKm}
          onChangeText={(t) => setDistanceKm(t.replace(/[^0-9.]/g, ''))}
          placeholder="0"
          keyboardType="number-pad"
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 12 }}
        />

        <Text style={{ fontSize: 12, color: '#333', marginBottom: 6 }}>Pax</Text>
        <TextInput
          value={pax}
          onChangeText={(t) => setPax(t.replace(/\D/g, ''))}
          placeholder="80"
          keyboardType="number-pad"
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 12 }}
        />

        <Text style={{ fontSize: 12, color: '#333', marginBottom: 6 }}>Event date (YYYY-MM-DD)</Text>
        <TextInput
          value={eventDate}
          onChangeText={setEventDate}
          placeholder={todayISO()}
          autoCapitalize="none"
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 12 }}
        />

        <Text style={{ fontSize: 12, color: '#333', marginBottom: 6 }}>Package</Text>
        {loadingPkgs ? (
          <View style={{ paddingVertical: 10 }}>
            <ActivityIndicator />
          </View>
        ) : packages.length === 0 ? (
          <Text style={{ color: '#B91C1C', marginBottom: 12 }}>No packages available.</Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
            {packages.map((p) => {
              const selected = packageId === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setPackageId(p.id)}
                  activeOpacity={0.9}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? '#4C1D95' : '#E5E7EB',
                    backgroundColor: selected ? '#F5F3FF' : '#FFFFFF',
                    marginRight: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#111827' }}>{p.title}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          onPress={createQuote}
          disabled={!canQuote || loadingQuote}
          activeOpacity={0.9}
          style={{
            backgroundColor: canQuote ? '#3366FF' : '#AAB',
            paddingVertical: 12,
            borderRadius: 14,
            alignItems: 'center',
            marginTop: 6,
          }}
        >
          {loadingQuote ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Create Quote</Text>}
        </TouchableOpacity>

        {quote ? (
          <View style={{ marginTop: 18, padding: 14, borderRadius: 12, backgroundColor: '#F7F7F7' }}>
            <Text style={{ fontWeight: '800', marginBottom: 8 }}>Quote</Text>
            <Text style={{ color: '#333' }}>Subtotal: ₹{rupeesFromPaise(quote.subtotal)}</Text>
            <Text style={{ color: '#333' }}>GST: ₹{rupeesFromPaise(quote.gst)}</Text>
            <Text style={{ color: '#333', fontWeight: '800', marginTop: 6 }}>Total: ₹{rupeesFromPaise(quote.total)}</Text>
            <Text style={{ color: '#666', marginTop: 8 }}>Expires: {new Date(quote.expiresAt).toLocaleString()}</Text>

            <View style={{ marginTop: 12 }}>
              {breakdownLines?.map((b: any) => (
                <View key={String(b.label)} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: '#333', flex: 1, paddingRight: 10 }}>{String(b.label)}</Text>
                  <Text style={{ color: '#333' }}>₹{rupeesFromPaise(b.amount)}</Text>
                </View>
              ))}
            </View>

            {!isLoggedIn ? (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/account' as any)}
                activeOpacity={0.8}
                style={{ marginTop: 14 }}
              >
                <Text style={{ color: '#111827', fontWeight: '800' }}>Please login to continue</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={async () => {
                if (!customerName.trim()) {
                  Alert.alert('Missing name', 'Please enter customer name.');
                  return;
                }
                if (!whatsappMessage) return;
                const url = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
                await Linking.openURL(url);
              }}
              activeOpacity={0.9}
              style={{
                marginTop: 14,
                backgroundColor: '#111827',
                paddingVertical: 12,
                borderRadius: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Send on WhatsApp</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
