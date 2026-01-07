import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { BlackBackHeader } from '@/components/BlackBackHeader';

import { useLocation } from '@/src/contexts/LocationContext';
import { apiJson, getApiBaseUrl } from '@/src/utils/api';

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
  mealType?: string;
};

type QuoteResponse = {
  id: string;
  subtotal: number;
  gst: number;
  total: number;
  breakdown: any;
  expiresAt: string;
};

function inferPackageMealTypeClient(pkg: any) {
  const title = String(pkg?.title ?? '').toLowerCase();
  if (title.includes('snacks') || title.includes('snack')) return 'snacks';
  if (title.includes('breakfast')) return 'breakfast';
  if (title.includes('dinner')) return 'dinner';
  if (title.includes('lunch')) return 'lunch';
  return 'lunch';
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

 export default function CateringQuoteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
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

  const selectionMealType = useMemo(() => {
    const raw = String((selection as any)?.mealType ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_');
    if (!raw) return '';
    if (raw === 'dinner') return 'lunch';
    if (raw === 'snacks_veg' || raw === 'snacks_nonveg') return 'snacks';
    if (raw === 'breakfast' || raw === 'lunch' || raw === 'dinner' || raw === 'snacks') return raw;
    return raw;
  }, [selection]);

  const packagesForMealType = useMemo(() => {
    if (!selectionMealType) return packages;
    return packages.filter((p) => {
      const fromServer = String((p as any)?.mealType ?? '').toLowerCase();
      const mtRaw = fromServer ? fromServer : inferPackageMealTypeClient(p);
      const mt = String(mtRaw ?? '').toLowerCase();
      if (selectionMealType === 'snacks') return mt === 'snacks' || mt === 'snack';
      return mt === selectionMealType;
    });
  }, [packages, selectionMealType]);

  const [customerName, setCustomerName] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState<string>('');
  const [city, setCity] = useState(String((location as any)?.state?.city ?? ''));
  const [distanceKm, setDistanceKm] = useState('0');
  const [pax, setPax] = useState(String(params.pax ?? '').trim() || '80');
  const [eventDate, setEventDate] = useState(String(params.eventDate ?? '').trim() || todayISO());

  const [loadingQuote, setLoadingQuote] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const v = await getApiBaseUrl();
        setApiBaseUrl(v);
      } catch {
        setApiBaseUrl('');
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoadingPkgs(true);
        const data = await apiJson('/api/catalog/packages');
        const items = Array.isArray((data as any)?.items) ? ((data as any).items as PackageItem[]) : [];
        setPackages(items);
      } catch {
        setPackages([]);
      } finally {
        setLoadingPkgs(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (packageId) {
      const chosen = packagesForMealType.find((p) => String(p.id) === String(packageId));
      if (chosen) return;
    }

    if (packagesForMealType.length > 0) {
      setPackageId(String(packagesForMealType[0].id));
      return;
    }

    if (!selectionMealType && packages.length > 0) {
      setPackageId(String(packages[0].id));
    }
  }, [packageId, packages, packagesForMealType, selectionMealType]);

  async function createQuote() {
    try {
      setLoadingQuote(true);

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

      const q = data as QuoteResponse;
      const quoteId = String((q as any)?.id ?? '').trim();
      if (!quoteId) {
        throw new Error('Server did not return quote id');
      }

      if (!customerName.trim()) {
        Alert.alert('Missing name', 'Please enter customer name.');
        return;
      }

      router.push({
        pathname: '/catering-quote-preview',
        params: { quoteId, customerName: customerName.trim() },
      } as any);
    } catch (e: any) {
      Alert.alert('Quote failed', String(e?.message ?? e));
    } finally {
      setLoadingQuote(false);
    }
  }

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
      <BlackBackHeader title="Catering Quote" />

      <Modal
        visible={howItWorksOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setHowItWorksOpen(false)}
      >
        <Pressable
          onPress={() => setHowItWorksOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(17,24,39,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <Pressable
            onPress={() => null}
            style={{ width: '100%', maxWidth: 360, borderRadius: 18, paddingVertical: 18, paddingHorizontal: 16, backgroundColor: '#FFFFFF' }}
          >
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 10 }}>How It Works</Text>
            <Text style={{ color: '#374151', marginBottom: 8 }}>1. Select platters and choose quantities.</Text>
            <Text style={{ color: '#374151', marginBottom: 8 }}>2. Bulk discount applies automatically based on pax:</Text>
            <Text style={{ color: '#6B7280', marginBottom: 6, marginLeft: 10 }}>- 50–100 pax: 5%</Text>
            <Text style={{ color: '#6B7280', marginBottom: 6, marginLeft: 10 }}>- 101–200 pax: 10%</Text>
            <Text style={{ color: '#6B7280', marginBottom: 8, marginLeft: 10 }}>- 200+ pax: 15%</Text>
            <Text style={{ color: '#374151', marginBottom: 8 }}>3. View the Quote Summary (discount, GST, total, advance, balance).</Text>
            <Text style={{ color: '#374151', marginBottom: 8 }}>4. Confirm your booking by paying 50% advance.</Text>
            <Text style={{ color: '#374151', marginBottom: 8 }}>5. After payment, you can share the invoice on WhatsApp or download PDF.</Text>
            <Text style={{ color: '#374151' }}>6. Pay the remaining balance as per delivery/service.</Text>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setHowItWorksOpen(false)}
              style={{ marginTop: 14, paddingVertical: 10, borderRadius: 14, alignItems: 'center', backgroundColor: '#111827' }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Got it</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">

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

        <TouchableOpacity
          onPress={() => {
            if (!customerName.trim()) {
              Alert.alert('Missing name', 'Please enter customer name.');
              return;
            }
            if (loadingPkgs) {
              Alert.alert('Please wait', 'Loading quote details...');
              return;
            }
            if (!selection) {
              Alert.alert('Unable to quote', 'Missing selection. Please go back and try again.');
              return;
            }
            if (selectedItems.length === 0) {
              Alert.alert('Select items', 'Please add at least 1 item to create a quote.');
              return;
            }
            if (!String(city ?? '').trim()) {
              Alert.alert('Missing city', 'Please enter city.');
              return;
            }
            if (!String(eventDate ?? '').trim()) {
              Alert.alert('Missing date', 'Please enter event date.');
              return;
            }
            const paxN = Number(pax);
            if (!Number.isFinite(paxN) || paxN <= 0) {
              Alert.alert('Invalid pax', 'Please enter a valid pax value.');
              return;
            }
            const distN = Number(distanceKm);
            if (!Number.isFinite(distN) || distN < 0) {
              Alert.alert('Invalid distance', 'Please enter a valid distance value.');
              return;
            }
            if (!packageId) {
              const pkgLines = packages
                .slice(0, 8)
                .map((p) => {
                  const mt = String((p as any)?.mealType ?? inferPackageMealTypeClient(p));
                  return `${String(p.title ?? '')} [${mt}]`;
                })
                .join('\n');

              Alert.alert(
                'Unable to quote',
                `No package found for ${selectionMealType || 'this selection'}.
API: ${apiBaseUrl || '(unknown)'}
Loaded: ${packages.length}, Matching: ${packagesForMealType.length}
Top packages:\n${pkgLines || '(none)'}`,
              );
              return;
            }
            createQuote();
          }}
          disabled={loadingQuote}
          activeOpacity={0.9}
          style={{
            backgroundColor: loadingQuote ? '#AAB' : '#3366FF',
            paddingVertical: 12,
            borderRadius: 14,
            alignItems: 'center',
            marginTop: 6,
          }}
        >
          {loadingQuote ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Quote</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
