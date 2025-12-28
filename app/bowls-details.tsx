import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { apiJson } from '@/src/utils/api';

type Params = {
  bowlId?: string;
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
};

export default function BowlsDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();

  const bowlId = String(params.bowlId ?? '').trim();

  const [bowl, setBowl] = useState<Bowl | null>(null);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<Set<string>>(new Set());

  const [qty, setQty] = useState<number>(10);

  const [loading, setLoading] = useState(true);
  const [quoting, setQuoting] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        if (!bowlId) {
          setBowl(null);
          return;
        }

        const [bowlData, addOnData] = await Promise.all([
          apiJson(`/api/bowls/${encodeURIComponent(bowlId)}`),
          apiJson('/api/bowls/addons'),
        ]);

        const b = bowlData as Bowl;
        setBowl(b);
        setQty((prev) => Math.max(Number.isFinite(prev) ? prev : 0, Math.max(1, Number(b?.minQty ?? 10))));

        const items = Array.isArray((addOnData as any)?.items) ? ((addOnData as any).items as AddOn[]) : [];
        setAddOns(items);
      } catch (e: any) {
        Alert.alert('Error', String(e?.message ?? e));
        setBowl(null);
        setAddOns([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [bowlId]);

  const addOnIdsArray = useMemo(() => Array.from(selectedAddOnIds.values()).sort(), [selectedAddOnIds]);

  useEffect(() => {
    (async () => {
      try {
        if (!bowlId) return;
        if (!Number.isFinite(qty) || qty <= 0) return;

        setQuoting(true);
        const data: any = await apiJson('/api/bowls/quote', {
          method: 'POST',
          body: JSON.stringify({ bowlId, qty, addOnIds: addOnIdsArray }),
        });

        setQuote({
          deliveryFee: Number(data?.deliveryFee ?? 0),
          subtotal: Number(data?.subtotal ?? 0),
          total: Number(data?.total ?? 0),
          lines: Array.isArray(data?.lines) ? data.lines : [],
        });
      } catch {
        setQuote(null);
      } finally {
        setQuoting(false);
      }
    })();
  }, [addOnIdsArray, bowlId, qty]);

  const money = (paise: any) => {
    const n = Number(paise);
    if (!Number.isFinite(n)) return '0';
    return String(Math.round(n / 100));
  };

  const minQty = Math.max(1, Number(bowl?.minQty ?? 10));

  const canContinue = Boolean(bowlId && bowl && Number.isFinite(qty) && qty >= minQty);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: 40 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F0F0F0', marginRight: 8 }}
        >
          <Text style={{ fontSize: 12 }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700' }}>Bowl details</Text>
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <ActivityIndicator />
        </View>
      ) : bowl ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }}>
          <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 12, backgroundColor: '#FFFFFF' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={{ fontSize: 18, fontWeight: '900', flex: 1, paddingRight: 8 }}>{bowl.title}</Text>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: bowl.isVeg ? '#16A34A' : '#DC2626',
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: bowl.isVeg ? '#16A34A' : '#DC2626' }}>
                  {bowl.isVeg ? 'VEG' : 'NON-VEG'}
                </Text>
              </View>
            </View>

            <Text style={{ color: '#6B7280', marginTop: 8 }}>₹{money(bowl.pricePerUnit)}/bowl</Text>
            <Text style={{ color: '#6B7280', marginTop: 4 }}>Minimum order: {bowl.minQty}</Text>
          </View>

          {Array.isArray(bowl.inclusions) && bowl.inclusions.length > 0 ? (
            <View style={{ marginTop: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 8 }}>What’s inside</Text>
              <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 12, backgroundColor: '#FFFFFF' }}>
                {bowl.inclusions.map((x, idx) => (
                  <Text key={`${x}-${idx}`} style={{ color: '#111827', marginBottom: idx === bowl.inclusions.length - 1 ? 0 : 6 }}>
                    {x}
                  </Text>
                ))}
              </View>
            </View>
          ) : null}

          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 8 }}>Quantity</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setQty((q) => Math.max(minQty, Math.round(Number(q) - 1)))}
                style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB' }}
              >
                <Text style={{ fontSize: 16, fontWeight: '900' }}>-</Text>
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '900' }}>{qty}</Text>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>Bowls</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setQty((q) => Math.max(minQty, Math.round(Number(q) + 1)))}
                style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB' }}
              >
                <Text style={{ fontSize: 16, fontWeight: '900' }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 8 }}>Add-ons (optional)</Text>
            <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, backgroundColor: '#FFFFFF' }}>
              {addOns.length === 0 ? (
                <Text style={{ padding: 12, color: '#6B7280' }}>No add-ons available.</Text>
              ) : (
                addOns.map((a) => {
                  const selected = selectedAddOnIds.has(a.id);
                  return (
                    <TouchableOpacity
                      key={a.id}
                      activeOpacity={0.9}
                      onPress={() => {
                        setSelectedAddOnIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(a.id)) next.delete(a.id);
                          else next.add(a.id);
                          return next;
                        });
                      }}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        borderTopWidth: 1,
                        borderTopColor: '#E5E7EB',
                        backgroundColor: selected ? '#EEF2FF' : '#FFFFFF',
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontWeight: '800', color: '#111827', flex: 1, paddingRight: 10 }}>{a.title}</Text>
                        <Text style={{ color: '#111827', fontWeight: '900' }}>+₹{money(a.pricePerUnit)}</Text>
                      </View>
                      <Text style={{ marginTop: 4, color: '#6B7280', fontSize: 12 }}>
                        {selected ? 'Added' : 'Tap to add'}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 8 }}>Price</Text>
            <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 12, backgroundColor: '#FFFFFF' }}>
              {quoting ? <ActivityIndicator /> : null}
              {quote?.lines?.length ? (
                <View style={{ marginTop: quoting ? 10 : 0 }}>
                  {quote.lines.map((l, idx) => (
                    <View key={`${l.label}-${idx}`} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ color: '#111827', flex: 1, paddingRight: 10 }}>{l.label}</Text>
                      <Text style={{ color: '#111827', fontWeight: '900' }}>₹{money(l.amount)}</Text>
                    </View>
                  ))}
                  <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#111827', fontWeight: '900' }}>Total</Text>
                    <Text style={{ color: '#111827', fontWeight: '900' }}>₹{money(quote.total)}</Text>
                  </View>
                </View>
              ) : (
                <Text style={{ color: '#6B7280' }}>Enter quantity to see total.</Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            disabled={!canContinue}
            activeOpacity={0.9}
            onPress={() => {
              if (!bowl) return;
              if (!Number.isFinite(qty) || qty < minQty) {
                Alert.alert('Quantity too low', `Minimum order is ${minQty} bowls.`);
                return;
              }
              router.push({
                pathname: '/bowls-schedule',
                params: {
                  bowlId,
                  qty: String(qty),
                  addOnIds: JSON.stringify(addOnIdsArray),
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
        </ScrollView>
      ) : (
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={{ color: '#6B7280' }}>Could not load this bowl.</Text>
        </View>
      )}
    </View>
  );
}
