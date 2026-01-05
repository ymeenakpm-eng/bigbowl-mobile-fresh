import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { BlackBackHeader } from '@/components/BlackBackHeader';
import { useAuth } from '@/src/contexts/AuthContext';
import { apiJson } from '@/src/utils/api';

type Params = {
  quoteId?: string;
  customerName?: string;
};

const ADVANCE_PCT = 50;

function formatRupees(rupees: number) {
  const n = Number(rupees);
  if (!Number.isFinite(n)) return '0';
  try {
    return new Intl.NumberFormat('en-IN').format(Math.round(n));
  } catch {
    return String(Math.round(n));
  }
}

function rupeesFromPaise(paise: any) {
  const n = Number(paise);
  if (!Number.isFinite(n)) return '0';
  return formatRupees(Math.round(n / 100));
}

function parseDeliveryConfigFromLabel(label: string): { freeKm: number | null; perKmRupees: number | null } {
  const text = String(label ?? '');
  const per = text.match(/₹\s*(\d+(?:\.\d+)?)\s*\/km/i);
  const after = text.match(/after\s*(\d+(?:\.\d+)?)\s*km/i);
  const perKmRupees = per ? Number(per[1]) : null;
  const freeKm = after ? Number(after[1]) : null;
  return {
    freeKm: Number.isFinite(freeKm as any) ? (freeKm as number) : null,
    perKmRupees: Number.isFinite(perKmRupees as any) ? (perKmRupees as number) : null,
  };
}

function parsePerPlateRupeesFromLabel(label: string): number | null {
  const text = String(label ?? '');
  const m = text.match(/plates\s*×\s*₹\s*(\d+)/i);
  const per = m ? Number(m[1]) : null;
  return Number.isFinite(per as any) ? (per as number) : null;
}

function computeCateringBulkDiscountPct(pax: number) {
  const p = Math.max(0, Math.round(Number(pax ?? 0)));
  if (p >= 200) return 15;
  return 0;
}

function parseGstPctFromLabel(label: string): number | null {
  const text = String(label ?? '');
  const m = text.match(/gst\s*(\d+(?:\.\d+)?)\s*%/i);
  const pct = m ? Number(m[1]) : null;
  return Number.isFinite(pct as any) ? (pct as number) : null;
}

function normalizeMealTypeLabel(raw: any) {
  const s = String(raw ?? '').trim().toLowerCase();
  if (s === 'breakfast') return 'Breakfast';
  if (s === 'lunch') return 'Lunch';
  if (s === 'dinner') return 'Dinner';
  return '';
}

function shortWhatsAppMessage(args: {
  customerName: string;
  eventDateISO: string;
  mealTypeLabel: string;
  pax: number;
  distanceKm: number;
  platePricePerPlatePaise: number | null;
  extraItemsCostPaise: number;
  deliveryCfg: { freeKm: number | null; perKmRupees: number | null };
  foodCostPaise: number;
  deliveryFeePaise: number;
  subtotalBeforeDiscountPaise: number;
  discountPct: number;
  discountPaise: number;
  subtotalAfterDiscountPaise: number;
  gstPct: number;
  gstPaise: number;
  totalPaise: number;
  advancePaise: number;
  balancePaise: number;
}) {
  const money = (paise: number) => rupeesFromPaise(paise);
  const platePriceRupees = args.platePricePerPlatePaise != null ? Math.round(args.platePricePerPlatePaise / 100) : 0;
  const platesCostRupees = Math.round((args.platePricePerPlatePaise != null ? args.platePricePerPlatePaise : 0) * args.pax / 100);
  const extraItemsRupees = Math.round(args.extraItemsCostPaise / 100);
  const extraPerPlateRupees = args.pax > 0 ? Math.round(args.extraItemsCostPaise / args.pax / 100) : 0;
  const foodCostRupees = Math.round(args.foodCostPaise / 100);
  const subtotalRupees = Math.round(args.subtotalBeforeDiscountPaise / 100);
  const discountRupees = Math.round(args.discountPaise / 100);
  const afterRupees = Math.round(args.subtotalAfterDiscountPaise / 100);
  const gstRupees = Math.round(args.gstPaise / 100);
  const totalRupees = Math.round(args.totalPaise / 100);
  const advRupees = Math.round(args.advancePaise / 100);
  const balRupees = Math.round(args.balancePaise / 100);

  const freeKm = args.deliveryCfg.freeKm;
  const perKm = args.deliveryCfg.perKmRupees;
  const hasDeliveryCfg = Number.isFinite(freeKm as any) && Number.isFinite(perKm as any);
  const free = hasDeliveryCfg ? Math.max(0, Number(freeKm)) : null;
  const per = hasDeliveryCfg ? Math.max(0, Number(perKm)) : null;
  const chargeableKm = free != null ? Math.max(0, args.distanceKm - free) : null;
  const deliveryRupees = Math.round(args.deliveryFeePaise / 100);

  const AMT = '<<AMT>>';
  const withAmt = (left: string, amt: string) => {
    const parts = String(left).split('\n');
    if (!parts.length) return [`${AMT}${amt}`];
    const last = parts[parts.length - 1];
    parts[parts.length - 1] = `${last}${AMT}${amt}`;
    return parts;
  };

  const bodyLines: string[] = [];
  bodyLines.push(...withAmt(`Plates Cost\n  = ${args.pax} × ₹${platePriceRupees}`, `₹${formatRupees(platesCostRupees)}`));
  bodyLines.push('');
  bodyLines.push(...withAmt(`Extra Items Cost\n  = ${args.pax} × ₹${extraPerPlateRupees}`, `₹${formatRupees(extraItemsRupees)}`));
  bodyLines.push('');
  bodyLines.push(...withAmt('Food Cost\n  = Plates Cost + Extra Items Cost', `₹${formatRupees(foodCostRupees)}`));
  bodyLines.push('');
  if (hasDeliveryCfg && free != null && per != null && chargeableKm != null) {
    bodyLines.push(
      ...withAmt(
        `Delivery Charges\n  = (${Math.round(args.distanceKm)} − ${Math.round(free)}) km × ₹${Math.round(per)}\n  = ${Math.round(chargeableKm)} × ₹${Math.round(per)}`,
        `₹${formatRupees(deliveryRupees)}`,
      ),
    );
  } else {
    bodyLines.push(...withAmt('Delivery Charges', `₹${money(args.deliveryFeePaise)}`));
  }
  bodyLines.push('');
  bodyLines.push(...withAmt('Subtotal\n  = Food Cost + Delivery Charges', `₹${formatRupees(subtotalRupees)}`));
  if (args.discountPct > 0 && args.discountPaise > 0) {
    bodyLines.push('');
    bodyLines.push(
      ...withAmt(
        `Bulk Discount (${Math.round(args.discountPct)}%)\n  = ${Math.round(args.discountPct)}% of Food Cost\n  = ${Math.round(args.discountPct)}% × ₹${formatRupees(foodCostRupees)}`,
        `-₹${formatRupees(discountRupees)}`,
      ),
    );
  }
  bodyLines.push('');
  bodyLines.push(...withAmt('Total After Discount\n  = Subtotal − Discount', `₹${formatRupees(afterRupees)}`));
  bodyLines.push('');
  bodyLines.push(
    ...withAmt(
      `GST (${Math.round(args.gstPct)}%)\n  = ${Math.round(args.gstPct)}% × ₹${formatRupees(afterRupees)}`,
      `₹${formatRupees(gstRupees)}`,
    ),
  );
  bodyLines.push('');
  bodyLines.push('------------------------------------------------------');
  bodyLines.push(...withAmt('FINAL TOTAL', `₹${formatRupees(totalRupees)}`));
  bodyLines.push(...withAmt('Advance Payable', `₹${formatRupees(advRupees)}`));
  bodyLines.push(...withAmt('Balance Due', `₹${formatRupees(balRupees)}`));

  const maxBeforeAmt = bodyLines.reduce((acc, line) => {
    const idx = line.indexOf(AMT);
    if (idx < 0) return acc;
    return Math.max(acc, idx);
  }, 0);
  const alignedBody = bodyLines
    .map((line) => {
      const idx = line.indexOf(AMT);
      if (idx < 0) return line;
      const left = line.slice(0, idx);
      const right = line.slice(idx + AMT.length);
      const pad = ' '.repeat(Math.max(1, maxBeforeAmt - left.length + 2));
      return `${left}${pad}${right}`;
    })
    .join('\n');

  return [
    'BigBowl Catering – Quote',
    '',
    `Customer: ${args.customerName}`,
    `Event Date: ${args.eventDateISO}`,
    `Guests: ${args.pax}`,
    args.mealTypeLabel ? `Meal Type: ${args.mealTypeLabel}` : 'Meal Type: -',
    `Plate Price: ₹${formatRupees(platePriceRupees)} / plate`,
    `Extra Items Cost: ₹${formatRupees(extraItemsRupees)}`,
    '',
    '```',
    alignedBody,
    '```',
    '',
    'Please confirm to proceed.',
  ].join('\n');
}

export default function CateringQuotePreviewScreen() {
  const router = useRouter();
  const auth = useAuth();
  const params = useLocalSearchParams<Params>();

  const quoteId = String(params.quoteId ?? '').trim();
  const customerName = String(params.customerName ?? '').trim();

  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!quoteId) {
          setQuote(null);
          setLoading(false);
          return;
        }
        setLoading(true);
        const data = await apiJson(`/api/quotes/${quoteId}`);
        setQuote(data ?? null);
      } catch (e: any) {
        setQuote(null);
        Alert.alert('Failed to load quote', String(e?.message ?? e));
      } finally {
        setLoading(false);
      }
    })();
  }, [quoteId]);

  const breakdownLines = useMemo(() => {
    const b: any = quote?.breakdown;
    if (!b) return [];
    if (Array.isArray(b)) return b;
    if (Array.isArray(b?.lines)) return b.lines;
    return [];
  }, [quote?.breakdown]);

  const meta = useMemo(() => {
    const b: any = quote?.breakdown;
    const m = b && typeof b === 'object' ? b?.meta : null;
    return m && typeof m === 'object' ? m : null;
  }, [quote?.breakdown]);

  const selection = useMemo(() => {
    const b: any = quote?.breakdown;
    const s = b && typeof b === 'object' ? b?.selection : null;
    return s && typeof s === 'object' ? s : null;
  }, [quote?.breakdown]);

  const mealTypeLabel = useMemo(() => normalizeMealTypeLabel((selection as any)?.mealType), [selection]);

  const selectedMenuNames = useMemo<string[]>(() => {
    const items = Array.isArray(selection?.items) ? selection.items : [];
    const names = items.map((x: any) => String(x?.name ?? '')).filter(Boolean);
    return Array.from(new Set(names));
  }, [selection?.items]);

  const pax = useMemo(() => {
    const n = Number(quote?.pax);
    return Number.isFinite(n) ? Math.max(1, Math.round(n)) : 0;
  }, [quote?.pax]);

  const distanceKm = useMemo(() => {
    const n = Number(quote?.distanceKm);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }, [quote?.distanceKm]);

  const eventDateISO = useMemo(() => {
    try {
      const d = new Date(quote?.eventDate);
      if (Number.isNaN(d.getTime())) return '';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return '';
    }
  }, [quote?.eventDate]);

  const baseFoodRow = useMemo(() => {
    return (
      breakdownLines.find((x: any) => {
        const label = String(x?.label ?? '').toLowerCase();
        if (!label) return false;
        return label.includes('plates') || label.includes('plate') || label.includes(' pax') || label.startsWith('pax');
      }) ?? null
    );
  }, [breakdownLines]);

  const perPlatePaiseFromMeta = useMemo(() => {
    const n = Number(meta?.perPlatePaise);
    return Number.isFinite(n) && n > 0 ? Math.max(0, Math.round(n)) : null;
  }, [meta?.perPlatePaise]);

  const perPlateRupees = useMemo(() => {
    const per = parsePerPlateRupeesFromLabel(String(baseFoodRow?.label ?? ''));
    return per != null ? per : null;
  }, [baseFoodRow?.label]);

  const perPlatePaise = useMemo(() => {
    if (perPlatePaiseFromMeta != null) return perPlatePaiseFromMeta;
    if (perPlateRupees != null) return Math.max(0, Math.round(perPlateRupees * 100));
    const amt = Number(baseFoodRow?.amount);
    if (pax > 0 && Number.isFinite(amt) && amt > 0) return Math.max(0, Math.round(amt / pax));
    return null;
  }, [baseFoodRow?.amount, pax, perPlatePaiseFromMeta, perPlateRupees]);

  const platePricePerPlatePaise = useMemo(() => {
    if (perPlatePaiseFromMeta != null) return perPlatePaiseFromMeta;
    return perPlatePaise;
  }, [perPlatePaise, perPlatePaiseFromMeta]);

  const extraItemsCostPaise = useMemo(() => {
    let sum = 0;
    for (const line of breakdownLines as any[]) {
      const label = String((line as any)?.label ?? '').toLowerCase();
      if (!label) continue;
      if (!label.includes('extra') || !label.includes('item')) continue;
      const amt = Number((line as any)?.amount);
      if (!Number.isFinite(amt) || amt <= 0) continue;
      sum += Math.round(amt);
    }
    return Math.max(0, Math.round(sum));
  }, [breakdownLines]);

  const extraItemsPerPlatePaise = useMemo(() => {
    if (pax <= 0) return 0;
    return Math.max(0, Math.round(extraItemsCostPaise / pax));
  }, [extraItemsCostPaise, pax]);

  const platesCostPaise = useMemo(() => {
    if (pax <= 0) return 0;
    if (platePricePerPlatePaise == null) return 0;
    return Math.max(0, Math.round(pax * platePricePerPlatePaise));
  }, [pax, platePricePerPlatePaise]);

  const deliveryRow = useMemo(() => {
    return (
      breakdownLines.find((x: any) => typeof x?.label === 'string' && x.label.toLowerCase().includes('distance fee')) ?? null
    );
  }, [breakdownLines]);

  const deliveryCfg = useMemo(() => parseDeliveryConfigFromLabel(String(deliveryRow?.label ?? '')), [deliveryRow?.label]);

  const deliveryFeePaise = useMemo(() => {
    const freeKm = Number(deliveryCfg.freeKm);
    const perKmRupees = Number(deliveryCfg.perKmRupees);

    if (!Number.isFinite(freeKm) || !Number.isFinite(perKmRupees)) {
      const amt = Number(deliveryRow?.amount);
      return Number.isFinite(amt) ? Math.max(0, Math.round(amt)) : 0;
    }

    const free = Math.max(0, freeKm);
    const per = Math.max(0, perKmRupees);

    const chargeableKm = Math.max(0, distanceKm - free);
    return Math.max(0, Math.round(chargeableKm * per * 100));
  }, [deliveryCfg.freeKm, deliveryCfg.perKmRupees, deliveryRow?.amount, distanceKm]);

  const metaSubtotalBeforeDiscountPaise = useMemo(() => {
    const n = Number(meta?.subtotalBeforeDiscount);
    return Number.isFinite(n) ? Math.max(0, Math.round(n)) : null;
  }, [meta?.subtotalBeforeDiscount]);

  const foodCostFromLinesPaise = useMemo(() => {
    let sum = 0;
    for (const line of breakdownLines as any[]) {
      const label = String(line?.label ?? '').toLowerCase();
      if (!label) continue;
      if (label.includes('distance fee')) continue;
      if (label.includes('gst')) continue;
      if (label.includes('bulk') && label.includes('discount')) continue;
      if (label.includes('weekend') && label.includes('surge')) continue;

      const amt = Number((line as any)?.amount);
      if (!Number.isFinite(amt)) continue;
      if (amt <= 0) continue;
      sum += Math.round(amt);
    }
    return Math.max(0, Math.round(sum));
  }, [breakdownLines]);

  const foodCostPaise = useMemo(() => {
    if (foodCostFromLinesPaise > 0) return foodCostFromLinesPaise;
    if (metaSubtotalBeforeDiscountPaise != null) return Math.max(0, Math.round(metaSubtotalBeforeDiscountPaise - deliveryFeePaise));
    if (!pax || pax <= 0) return 0;
    if (perPlatePaise == null) return 0;
    return Math.max(0, Math.round(pax * perPlatePaise));
  }, [deliveryFeePaise, foodCostFromLinesPaise, metaSubtotalBeforeDiscountPaise, pax, perPlatePaise]);

  const displayPricePerPlatePaise = useMemo(() => {
    if (pax > 0 && foodCostPaise > 0) return Math.max(0, Math.round(foodCostPaise / pax));
    return perPlatePaise;
  }, [foodCostPaise, pax, perPlatePaise]);

  const discountPct = useMemo(() => computeCateringBulkDiscountPct(pax), [pax]);

  const expectedDiscountPct = useMemo(() => computeCateringBulkDiscountPct(pax), [pax]);

  const discountTierLabel = useMemo(() => {
    const pct = discountPct > 0 ? discountPct : expectedDiscountPct;
    if (pct === 15) return '200+ pax';
    return '';
  }, [discountPct, expectedDiscountPct]);

  const subtotalBeforeDiscountDerivedPaise = useMemo(() => {
    return Math.max(0, Math.round(foodCostPaise + deliveryFeePaise));
  }, [deliveryFeePaise, foodCostPaise]);

  const subtotalBeforeDiscountPaise = useMemo(() => {
    return subtotalBeforeDiscountDerivedPaise;
  }, [subtotalBeforeDiscountDerivedPaise]);

  const discountPaise = useMemo(() => {
    if (discountPct <= 0) return 0;
    return Math.max(0, Math.round((foodCostPaise * discountPct) / 100));
  }, [discountPct, foodCostPaise]);

  const subtotalAfterDiscountPaise = useMemo(() => {
    return Math.max(0, Math.round(subtotalBeforeDiscountDerivedPaise - discountPaise));
  }, [discountPaise, subtotalBeforeDiscountDerivedPaise]);

  const displayDiscountPct = useMemo(() => (discountPct > 0 ? discountPct : expectedDiscountPct), [discountPct, expectedDiscountPct]);

  const displayDiscountPaise = useMemo(() => discountPaise, [discountPaise]);

  const gstPaise = useMemo(() => {
    const gstRow = breakdownLines.find((x: any) => typeof x?.label === 'string' && x.label.toLowerCase().includes('gst')) ?? null;
    const pct = parseGstPctFromLabel(String(gstRow?.label ?? ''));
    const rate = pct != null ? pct / 100 : 0.05;
    return Math.max(0, Math.round(subtotalAfterDiscountPaise * rate));
  }, [breakdownLines, subtotalAfterDiscountPaise]);

  const gstPct = useMemo(() => {
    const gstRow = breakdownLines.find((x: any) => typeof x?.label === 'string' && x.label.toLowerCase().includes('gst')) ?? null;
    const pct = parseGstPctFromLabel(String(gstRow?.label ?? ''));
    return pct != null ? pct : 5;
  }, [breakdownLines]);

  const totalPaise = useMemo(() => {
    return Math.max(0, Math.round(subtotalAfterDiscountPaise + gstPaise));
  }, [gstPaise, subtotalAfterDiscountPaise]);

  const pricePerPlateFromTotalPaise = useMemo(() => {
    if (!pax || pax <= 0) return 0;
    const per = Math.round(totalPaise / pax);
    return Number.isFinite(per) ? Math.max(0, per) : 0;
  }, [pax, totalPaise]);

  const advancePaise = useMemo(() => Math.max(1, Math.round((totalPaise * ADVANCE_PCT) / 100)), [totalPaise]);
  const balancePaise = useMemo(() => Math.max(0, totalPaise - advancePaise), [advancePaise, totalPaise]);

  const confirmAndSendToWhatsApp = async () => {
    try {
      if (!customerName || !eventDateISO || !pax || !totalPaise) return;
      const msg = shortWhatsAppMessage({
        customerName,
        eventDateISO,
        mealTypeLabel,
        pax,
        distanceKm,
        platePricePerPlatePaise,
        extraItemsCostPaise,
        deliveryCfg,
        foodCostPaise,
        deliveryFeePaise,
        subtotalBeforeDiscountPaise,
        discountPct,
        discountPaise,
        subtotalAfterDiscountPaise,
        gstPct,
        gstPaise,
        totalPaise,
        advancePaise,
        balancePaise,
      });
      const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
      const can = await Linking.canOpenURL(url);
      if (!can) {
        Alert.alert('WhatsApp not available', 'This device cannot open WhatsApp.');
        return;
      }
      await Linking.openURL(url);
    } catch (e: any) {
      Alert.alert('WhatsApp failed', String(e?.message ?? e));
    }
  };

  const confirmAndPayAdvance = async () => {
    try {
      if (!quoteId) return;
      if (!auth.state.token) {
        Alert.alert('Login required', 'Please login from Account to continue.');
        return;
      }
      const data = await apiJson('/api/bookings', {
        method: 'POST',
        token: auth.state.token,
        body: JSON.stringify({ quoteId }),
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
      if (!orderId || !amountPaise) throw new Error('Server did not return razorpayOrderId/amountPaise');
      router.push({ pathname: '/checkout/razorpay', params: { bookingId, orderId, amountPaise, currency } } as any);
    } catch (e: any) {
      Alert.alert('Booking failed', String(e?.message ?? e));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <BlackBackHeader title="Quote Preview" subtitle="Review before sending" />

      {loading ? (
        <View style={{ paddingTop: 30, alignItems: 'center' }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 10, color: '#6B7280' }}>Loading quote...</Text>
        </View>
      ) : !quote ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: '#B91C1C', fontWeight: '800' }}>Quote not found.</Text>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.9} style={{ marginTop: 14, backgroundColor: '#111827', paddingVertical: 12, borderRadius: 14, alignItems: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Go back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <View style={{ borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', overflow: 'hidden', marginBottom: 12 }}>
            <View style={{ padding: 14, backgroundColor: '#111827' }}>
              <Text style={{ fontWeight: '900', color: '#FFFFFF', fontSize: 16 }}>BigBowl Catering – Quote Preview</Text>
            </View>

            <View style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#6B7280' }}>Customer</Text>
                <Text style={{ fontWeight: '900', color: '#111827' }}>{customerName || '-'}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#6B7280' }}>City</Text>
                <Text style={{ fontWeight: '800', color: '#111827' }}>{String(quote?.city ?? '-')}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#6B7280' }}>Event Date</Text>
                <Text style={{ fontWeight: '800', color: '#111827' }}>{eventDateISO || '-'}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#6B7280' }}>Guests (Pax)</Text>
                <Text style={{ fontWeight: '900', color: '#111827' }}>{pax || '-'}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#6B7280' }}>Meal Type</Text>
                <Text style={{ fontWeight: '800', color: '#111827' }}>{mealTypeLabel || '-'}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#6B7280' }}>Plate Price</Text>
                <Text style={{ fontWeight: '900', color: '#111827' }}>₹{platePricePerPlatePaise != null ? rupeesFromPaise(platePricePerPlatePaise) : '0'} / plate</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#6B7280' }}>Delivery Distance</Text>
                <Text style={{ fontWeight: '800', color: '#111827' }}>{distanceKm} km</Text>
              </View>
            </View>
          </View>

          <View style={{ borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', padding: 14, marginBottom: 12 }}>
            <Text style={{ fontWeight: '900', color: '#111827', marginBottom: 10 }}>Selected Menu</Text>
            {selectedMenuNames.length
              ? selectedMenuNames.map((n) => (
                  <Text key={n} style={{ color: '#111827', marginBottom: 6 }}>
                    • {n}
                  </Text>
                ))
              : (
                  <Text style={{ color: '#6B7280' }}>-</Text>
                )}
          </View>

          <View style={{ borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', padding: 14, marginBottom: 12 }}>
            <Text style={{ fontWeight: '900', color: '#111827', marginBottom: 10 }}>Pricing Breakdown</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: '#6B7280', flex: 1, paddingRight: 10 }}>
                Plates Cost
                {'\n'}  = {pax} × ₹{platePricePerPlatePaise != null ? Math.round(platePricePerPlatePaise / 100) : 0}
              </Text>
              <Text style={{ fontWeight: '900', color: '#111827', textAlign: 'right', alignSelf: 'flex-end' }}>₹{rupeesFromPaise(platesCostPaise)}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: '#6B7280', flex: 1, paddingRight: 10 }}>
                Extra Items Cost
                {'\n'}  = {pax} × ₹{Math.round(extraItemsPerPlatePaise / 100)}
              </Text>
              <Text style={{ fontWeight: '900', color: '#111827', textAlign: 'right', alignSelf: 'flex-end' }}>₹{rupeesFromPaise(extraItemsCostPaise)}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: '#6B7280', flex: 1, paddingRight: 10 }}>
                Food Cost
                {'\n'}  = Plates Cost + Extra Items Cost
              </Text>
              <Text style={{ fontWeight: '900', color: '#111827', textAlign: 'right', alignSelf: 'flex-end' }}>₹{rupeesFromPaise(foodCostPaise)}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: '#6B7280', flex: 1, paddingRight: 10 }}>
                Delivery Charges
                {deliveryCfg.freeKm != null && deliveryCfg.perKmRupees != null ? (
                  `\n  = (${Math.round(distanceKm)} − ${Math.round(Number(deliveryCfg.freeKm))}) km × ₹${Math.round(Number(deliveryCfg.perKmRupees))}` +
                  `\n  = ${Math.max(0, Math.round(distanceKm - Number(deliveryCfg.freeKm)))} × ₹${Math.round(Number(deliveryCfg.perKmRupees))}`
                ) : (
                  ''
                )}
              </Text>
              <Text style={{ fontWeight: '900', color: '#111827', textAlign: 'right', alignSelf: 'flex-end' }}>₹{rupeesFromPaise(deliveryFeePaise)}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: '#6B7280', flex: 1, paddingRight: 10 }}>
                Subtotal
                {'\n'}  = Food Cost + Delivery Charges
              </Text>
              <Text style={{ fontWeight: '900', color: '#111827', textAlign: 'right', alignSelf: 'flex-end' }}>₹{rupeesFromPaise(subtotalBeforeDiscountPaise)}</Text>
            </View>

            {displayDiscountPct > 0 && displayDiscountPaise > 0 ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ color: '#6B7280', flex: 1, paddingRight: 10 }}>
                  Bulk Discount ({displayDiscountPct}%)
                  {'\n'}  = {displayDiscountPct}% of Food Cost
                  {'\n'}  = {displayDiscountPct}% × ₹{rupeesFromPaise(foodCostPaise)}
                </Text>
                <Text style={{ fontWeight: '900', color: '#111827', textAlign: 'right', alignSelf: 'flex-end' }}>-₹{rupeesFromPaise(displayDiscountPaise)}</Text>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: '#6B7280', flex: 1, paddingRight: 10 }}>
                Total After Discount
                {'\n'}  = Subtotal − Discount
              </Text>
              <Text style={{ fontWeight: '900', color: '#111827', textAlign: 'right', alignSelf: 'flex-end' }}>₹{rupeesFromPaise(subtotalAfterDiscountPaise)}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: '#6B7280', flex: 1, paddingRight: 10 }}>
                GST ({Math.round(gstPct)}%)
                {'\n'}  = {Math.round(gstPct)}% × ₹{rupeesFromPaise(subtotalAfterDiscountPaise)}
              </Text>
              <Text style={{ fontWeight: '900', color: '#111827', textAlign: 'right', alignSelf: 'flex-end' }}>₹{rupeesFromPaise(gstPaise)}</Text>
            </View>

            <View style={{ height: 1, backgroundColor: '#E5E7EB', marginBottom: 10 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontWeight: '900', color: '#111827' }}>FINAL TOTAL</Text>
              <Text style={{ fontWeight: '900', color: '#111827' }}>₹{rupeesFromPaise(totalPaise)}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#6B7280' }}>Advance Payable ({ADVANCE_PCT}%)</Text>
              <Text style={{ fontWeight: '900', color: '#111827' }}>₹{rupeesFromPaise(advancePaise)}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#6B7280' }}>Balance Due</Text>
              <Text style={{ fontWeight: '800', color: '#111827' }}>₹{rupeesFromPaise(balancePaise)}</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={confirmAndSendToWhatsApp}
            style={{ backgroundColor: '#111827', paddingVertical: 12, borderRadius: 14, alignItems: 'center', marginBottom: 10 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Confirm & Send to WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={confirmAndPayAdvance}
            style={{ backgroundColor: '#3366FF', paddingVertical: 12, borderRadius: 14, alignItems: 'center' }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Confirm & Pay Advance</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}
