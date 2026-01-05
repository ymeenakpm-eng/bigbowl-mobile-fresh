import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';

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
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [menuIndex, setMenuIndex] = useState<Map<string, string>>(new Map());
  const [tierIndex, setTierIndex] = useState<Map<string, string>>(new Map());
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (!orderId) return;
        const data: any = await apiJson(`/api/orders/${orderId}`);
        if (data?.status) setStatus(String(data.status));
        setOrderDetails(data ?? null);
      } catch {
        setOrderDetails(null);
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

  const parseDeliveryConfigFromLabel = (label: string): { freeKm: number | null; perKmRupees: number | null } => {
    const text = String(label ?? '');
    const perKm = text.match(/₹\s*(\d+(?:\.\d+)?)\s*\/\s*km/i);
    const after = text.match(/after\s*(\d+(?:\.\d+)?)\s*km/i);
    const perKmRupees = perKm ? Number(perKm[1]) : null;
    const freeKm = after ? Number(after[1]) : null;
    return {
      freeKm: Number.isFinite(freeKm as any) ? (freeKm as number) : null,
      perKmRupees: Number.isFinite(perKmRupees as any) ? (perKmRupees as number) : null,
    };
  };

  const parseGstPctFromLabel = (label: string): number | null => {
    const text = String(label ?? '');
    const m = text.match(/gst\s*(\d+(?:\.\d+)?)\s*%/i);
    const pct = m ? Number(m[1]) : null;
    return Number.isFinite(pct as any) ? (pct as number) : null;
  };

  const formatRupees = (n: number) => {
    try {
      return new Intl.NumberFormat('en-IN').format(n);
    } catch {
      return String(n);
    }
  };

  const normalizeMealTypeLabel = (raw: any) => {
    const s = String(raw ?? '').trim().toLowerCase();
    if (s === 'breakfast') return 'Breakfast';
    if (s === 'lunch') return 'Lunch';
    if (s === 'dinner') return 'Dinner';
    return '';
  };

  const quote = booking?.quote ?? null;
  const totalPaise = quote?.total;
  const subtotalPaise = quote?.subtotal;
  const gstPaise = quote?.gst;
  const advancePaise = booking?.advanceAmount;
  const balancePaise = Number.isFinite(Number(totalPaise)) && Number.isFinite(Number(advancePaise)) ? Math.max(0, Number(totalPaise) - Number(advancePaise)) : null;

  const genericFullPaise = orderDetails && Number.isFinite(Number(orderDetails?.fullAmount)) ? Number(orderDetails.fullAmount) : null;
  const genericAdvancePct = orderDetails && Number.isFinite(Number(orderDetails?.advancePct)) ? Number(orderDetails.advancePct) : null;
  const genericAdvancePaise = orderDetails && Number.isFinite(Number(orderDetails?.amount)) ? Number(orderDetails.amount) : null;
  const genericBalancePaise =
    genericFullPaise != null && genericAdvancePaise != null ? Math.max(0, genericFullPaise - genericAdvancePaise) : null;

  const selectionKind = (() => {
    const breakdown = quote?.breakdown;
    const sel = breakdown && typeof breakdown === 'object' ? breakdown?.selection : null;
    return sel && typeof sel === 'object' ? String(sel.kind ?? '').trim() : '';
  })();

  const cateringMealTypeLabel = (() => {
    const breakdown = quote?.breakdown;
    const sel = breakdown && typeof breakdown === 'object' ? breakdown?.selection : null;
    if (!sel || typeof sel !== 'object') return '';
    if (String((sel as any)?.kind ?? '').trim() !== 'catering') return '';
    return normalizeMealTypeLabel((sel as any)?.mealType);
  })();

  const computeCateringBulkDiscountPct = (packs: any) => {
    const p = Math.max(0, Math.round(Number(packs ?? 0)));
    if (p >= 200) return 15;
    return 0;
  };

  const cateringInvoiceBreakdown = (() => {
    if (!quote) return null;

    const breakdown = quote?.breakdown;
    const lines = Array.isArray(breakdown)
      ? breakdown
      : breakdown && typeof breakdown === 'object' && Array.isArray((breakdown as any)?.lines)
        ? (breakdown as any).lines
        : [];
    const meta = breakdown && typeof breakdown === 'object' ? (breakdown as any)?.meta : null;

    const discountLine =
      lines.find((x: any) => typeof x?.label === 'string' && String(x.label).toLowerCase().includes('bulk') && String(x.label).toLowerCase().includes('discount')) ??
      null;

    const metaBulkDiscountAmount = Number(meta?.bulkDiscountAmount);
    const hasBulkDiscount =
      (Number.isFinite(metaBulkDiscountAmount) && Math.round(metaBulkDiscountAmount) > 0) ||
      (Number.isFinite(Number(discountLine?.amount)) && Math.round(Number(discountLine.amount)) < 0);

    const isCateringLike = selectionKind === 'catering' || hasBulkDiscount;
    if (!isCateringLike) return null;

    const pax = Number.isFinite(Number(quote?.pax)) ? Math.max(0, Math.round(Number(quote.pax))) : 0;
    const distanceKm = Number.isFinite(Number(quote?.distanceKm)) ? Math.max(0, Number(quote.distanceKm)) : 0;

    const deliveryRow =
      lines.find((x: any) => typeof x?.label === 'string' && String(x.label).toLowerCase().includes('distance fee')) ?? null;
    const deliveryCfg = parseDeliveryConfigFromLabel(String(deliveryRow?.label ?? ''));
    const deliveryFeePaise = Number.isFinite(Number(deliveryRow?.amount)) ? Math.max(0, Math.round(Number(deliveryRow.amount))) : 0;

    const subtotalAfterDiscountFromQuotePaise = Number.isFinite(Number(quote?.subtotal)) ? Math.max(0, Math.round(Number(quote.subtotal))) : 0;

    const discountPctFromMeta = Number.isFinite(Number(meta?.bulkDiscountPct)) ? Math.max(0, Math.round(Number(meta.bulkDiscountPct))) : 0;
    const discountPaiseFromMeta = Number.isFinite(Number(meta?.bulkDiscountAmount)) ? Math.max(0, Math.round(Number(meta.bulkDiscountAmount))) : 0;

    const discountPctFromLabel = (() => {
      const label = String(discountLine?.label ?? '');
      const m = label.match(/\((\d+)\s*%\)/);
      const pct = m ? Number(m[1]) : null;
      return Number.isFinite(pct as any) ? Math.max(0, Math.round(pct as number)) : 0;
    })();
    const discountPaiseFromLine = (() => {
      const amt = Number(discountLine?.amount);
      if (!Number.isFinite(amt)) return 0;
      if (amt >= 0) return 0;
      return Math.max(0, Math.round(Math.abs(amt)));
    })();

    const discountPaise = discountPaiseFromMeta > 0 ? discountPaiseFromMeta : discountPaiseFromLine;
    const discountPct = discountPctFromMeta > 0 ? discountPctFromMeta : discountPctFromLabel > 0 ? discountPctFromLabel : computeCateringBulkDiscountPct(pax);

    const subtotalBeforeDiscountFromMetaPaise = Number.isFinite(Number(meta?.subtotalBeforeDiscount))
      ? Math.max(0, Math.round(Number(meta.subtotalBeforeDiscount)))
      : null;
    const subtotalAfterDiscountFromMetaPaise = Number.isFinite(Number(meta?.subtotalAfterDiscount))
      ? Math.max(0, Math.round(Number(meta.subtotalAfterDiscount)))
      : null;

    const subtotalAfterDiscountPaise = subtotalAfterDiscountFromMetaPaise != null ? subtotalAfterDiscountFromMetaPaise : subtotalAfterDiscountFromQuotePaise;
    const subtotalBeforeDiscountPaise =
      subtotalBeforeDiscountFromMetaPaise != null
        ? subtotalBeforeDiscountFromMetaPaise
        : discountPaise > 0
          ? Math.max(0, Math.round(subtotalAfterDiscountPaise + discountPaise))
          : subtotalAfterDiscountPaise;

    const foodCostPaise = Math.max(0, Math.round(subtotalBeforeDiscountPaise - deliveryFeePaise));

    const gstRow = lines.find((x: any) => typeof x?.label === 'string' && String(x.label).toLowerCase().includes('gst')) ?? null;
    const gstPct = (() => {
      const pct = parseGstPctFromLabel(String(gstRow?.label ?? ''));
      return pct != null ? pct : 5;
    })();

    const gstPaiseComputed = Number.isFinite(Number(quote?.gst)) ? Math.max(0, Math.round(Number(quote.gst))) : 0;
    const totalPaiseComputed = Number.isFinite(Number(quote?.total)) ? Math.max(0, Math.round(Number(quote.total))) : 0;
    const advancePaiseComputed = Number.isFinite(Number(booking?.advanceAmount)) ? Math.max(0, Math.round(Number(booking.advanceAmount))) : 0;
    const balancePaiseComputed = Math.max(0, Math.round(totalPaiseComputed - advancePaiseComputed));

    const platePricePerPlatePaise = (() => {
      const m = Number(meta?.perPlatePaise);
      if (Number.isFinite(m) && m > 0) return Math.max(0, Math.round(m));
      return pax > 0 ? Math.max(0, Math.round(foodCostPaise / pax)) : 0;
    })();

    const extraItemsCostPaise = (() => {
      let sum = 0;
      for (const line of lines as any[]) {
        const label = String((line as any)?.label ?? '').toLowerCase();
        if (!label) continue;
        if (!label.includes('extra') || !label.includes('item')) continue;
        const amt = Number((line as any)?.amount);
        if (!Number.isFinite(amt) || amt <= 0) continue;
        sum += Math.round(amt);
      }
      return Math.max(0, Math.round(sum));
    })();

    const extraItemsPerPlatePaise = pax > 0 ? Math.max(0, Math.round(extraItemsCostPaise / pax)) : 0;
    const platesCostPaise = pax > 0 ? Math.max(0, Math.round(pax * platePricePerPlatePaise)) : 0;

    return {
      pax,
      distanceKm,
      deliveryCfg,
      mealTypeLabel: cateringMealTypeLabel,
      platePricePerPlatePaise,
      platesCostPaise,
      extraItemsCostPaise,
      extraItemsPerPlatePaise,
      foodCostPaise,
      deliveryFeePaise,
      subtotalBeforeDiscountPaise,
      discountPct,
      discountPaise,
      subtotalAfterDiscountPaise,
      gstPct,
      gstPaise: gstPaiseComputed,
      totalPaise: totalPaiseComputed,
      advancePaise: advancePaiseComputed,
      balancePaise: balancePaiseComputed,
    };
  })();

  const genericKind = (() => {
    const notes = orderDetails && typeof orderDetails === 'object' ? (orderDetails as any)?.notes : null;
    return notes && typeof notes === 'object' ? String((notes as any)?.kind ?? '').trim() : '';
  })();

  const invoiceWhatsAppMessage = (() => {
    if (!booking && !orderDetails) return '';
    const lines: string[] = [];
    lines.push('Invoice - BigBowl');
    if (booking) {
      lines.push(`Booking ID: ${String(booking.id ?? '-')}`);
    }
    lines.push(`Order ID: ${orderId || '-'}`);
    lines.push(`Payment status: ${String(status ?? '-')}`);
    if (cateringInvoiceBreakdown) {
      const b = cateringInvoiceBreakdown;
      const AMT = '<<AMT>>';
      const withAmt = (left: string, amt: string) => {
        const parts = String(left).split('\n');
        if (!parts.length) return [`${AMT}${amt}`];
        const last = parts[parts.length - 1];
        parts[parts.length - 1] = `${last}${AMT}${amt}`;
        return parts;
      };

      const platePriceRupees = Math.round(b.platePricePerPlatePaise / 100);
      const platesCostRupees = Math.round(b.platesCostPaise / 100);
      const extraItemsRupees = Math.round(b.extraItemsCostPaise / 100);
      const extraPerPlateRupees = Math.round(b.extraItemsPerPlatePaise / 100);
      const foodCostRupees = Math.round(b.foodCostPaise / 100);
      const deliveryRupees = Math.round(b.deliveryFeePaise / 100);
      const subtotalRupees = Math.round(b.subtotalBeforeDiscountPaise / 100);
      const discountRupees = Math.round(b.discountPaise / 100);
      const afterRupees = Math.round(b.subtotalAfterDiscountPaise / 100);
      const gstRupees = Math.round(b.gstPaise / 100);
      const totalRupees = Math.round(b.totalPaise / 100);
      const advRupees = Math.round(b.advancePaise / 100);
      const balRupees = Math.round(b.balancePaise / 100);

      lines.push('');
      lines.push(`Meal Type: ${b.mealTypeLabel || '-'}`);
      lines.push(`Plate Price: ₹${formatRupees(platePriceRupees)} / plate`);
      lines.push(`Extra Items Cost: ₹${formatRupees(extraItemsRupees)}`);

      const bodyLines: string[] = [];
      bodyLines.push(...withAmt(`Plates Cost\n  = ${b.pax} × ₹${platePriceRupees}`, `₹${formatRupees(platesCostRupees)}`));
      bodyLines.push('');
      bodyLines.push(...withAmt(`Extra Items Cost\n  = ${b.pax} × ₹${extraPerPlateRupees}`, `₹${formatRupees(extraItemsRupees)}`));
      bodyLines.push('');
      bodyLines.push(...withAmt('Food Cost\n  = Plates Cost + Extra Items Cost', `₹${formatRupees(foodCostRupees)}`));
      bodyLines.push('');
      if (b.deliveryCfg.freeKm != null && b.deliveryCfg.perKmRupees != null) {
        const free = Math.max(0, Number(b.deliveryCfg.freeKm));
        const per = Math.max(0, Number(b.deliveryCfg.perKmRupees));
        const chargeableKm = Math.max(0, b.distanceKm - free);
        bodyLines.push(
          ...withAmt(
            `Delivery Charges\n  = (${Math.round(b.distanceKm)} − ${Math.round(free)}) km × ₹${Math.round(per)}\n  = ${Math.round(chargeableKm)} × ₹${Math.round(per)}`,
            `₹${formatRupees(deliveryRupees)}`,
          ),
        );
      } else {
        bodyLines.push(...withAmt('Delivery Charges', `₹${money(b.deliveryFeePaise)}`));
      }
      bodyLines.push('');
      bodyLines.push(...withAmt('Subtotal\n  = Food Cost + Delivery Charges', `₹${formatRupees(subtotalRupees)}`));
      if (b.discountPct > 0 && b.discountPaise > 0) {
        bodyLines.push('');
        bodyLines.push(
          ...withAmt(
            `Bulk Discount (${Math.round(b.discountPct)}%)\n  = ${Math.round(b.discountPct)}% of Food Cost\n  = ${Math.round(b.discountPct)}% × ₹${formatRupees(foodCostRupees)}`,
            `-₹${formatRupees(discountRupees)}`,
          ),
        );
      }
      bodyLines.push('');
      bodyLines.push(...withAmt('Total After Discount\n  = Subtotal − Discount', `₹${formatRupees(afterRupees)}`));
      bodyLines.push('');
      bodyLines.push(
        ...withAmt(
          `GST (${Math.round(b.gstPct)}%)\n  = ${Math.round(b.gstPct)}% × ₹${formatRupees(afterRupees)}`,
          `₹${formatRupees(gstRupees)}`,
        ),
      );
      bodyLines.push('');
      bodyLines.push('------------------------------------------------------');
      bodyLines.push(...withAmt('FINAL TOTAL', `₹${formatRupees(totalRupees)}`));
      bodyLines.push(...withAmt('Advance Paid', `₹${formatRupees(advRupees)}`));
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

      lines.push('');
      lines.push('```');
      lines.push(alignedBody);
      lines.push('```');
    } else if (quote) {
      lines.push('');
      lines.push('Amount Summary');
      lines.push(`Subtotal: ₹${money(subtotalPaise)}`);
      lines.push(`GST: ₹${money(gstPaise)}`);
      lines.push(`Total: ₹${money(totalPaise)}`);
      lines.push(`Advance paid: ₹${money(advancePaise)} (${String(booking.advancePct ?? '-') }%)`);
      lines.push(`Balance due: ₹${balancePaise == null ? '-' : money(balancePaise)}`);
    } else if (orderDetails) {
      lines.push('');
      lines.push('Amount Summary');
      lines.push(`Total: ₹${genericFullPaise == null ? money(genericAdvancePaise) : money(genericFullPaise)}`);
      if (genericAdvancePct != null && genericAdvancePaise != null) {
        lines.push(`Advance paid: ₹${money(genericAdvancePaise)} (${String(genericAdvancePct)}%)`);
        lines.push(`Balance due: ₹${genericBalancePaise == null ? '-' : money(genericBalancePaise)}`);
      }
    }
    return lines.join('\n');
  })();

  const invoiceHtml = (() => {
    const bookingIdText = String(booking?.id ?? '-');
    const orderIdText = String(orderId ?? '-');
    const statusText = String(status ?? '-');
    const subtotalText = quote ? money(subtotalPaise) : '-';
    const gstText = quote ? money(gstPaise) : '-';
    const totalText = quote ? money(totalPaise) : '-';
    const advanceText = quote ? money(advancePaise) : '-';
    const balanceText = quote ? (balancePaise == null ? '-' : money(balancePaise)) : '-';
    const advancePctText = String(booking?.advancePct ?? '-');

    const genericTotalText = genericFullPaise == null ? (genericAdvancePaise == null ? '-' : money(genericAdvancePaise)) : money(genericFullPaise);
    const genericAdvanceText = genericAdvancePaise == null ? '-' : money(genericAdvancePaise);
    const genericBalanceText = genericBalancePaise == null ? '-' : money(genericBalancePaise);
    const genericAdvancePctText = genericAdvancePct == null ? '-' : String(genericAdvancePct);

    const b = cateringInvoiceBreakdown;
    const formatLineMoney = (paise: number) => formatRupees(Math.round(paise / 100));

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Invoice</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; padding: 24px; }
      .header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 18px; }
      .brand { font-weight: 900; font-size: 18px; }
      .muted { color: #6b7280; font-size: 12px; }
      .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-top: 12px; }
      .row { display: flex; justify-content: space-between; margin: 8px 0; }
      .row strong { font-weight: 800; }
      .divider { height: 1px; background: #e5e7eb; margin: 12px 0; }
      .pre { white-space: pre-line; }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="brand">BigBowl</div>
        <div class="muted">Invoice</div>
      </div>
      <div class="muted">${new Date().toLocaleString()}</div>
    </div>

    <div class="card">
      <div class="row"><span>Order ID</span><strong>${orderIdText}</strong></div>
      <div class="row"><span>Booking ID</span><strong>${bookingIdText}</strong></div>
      <div class="row"><span>Payment status</span><strong>${statusText}</strong></div>
      <div class="row"><span>Type</span><strong>${(selectionKind || genericKind) || '-'}</strong></div>
      ${b ? `<div class="row"><span>Meal Type</span><strong>${b.mealTypeLabel || '-'}</strong></div>` : ''}
      ${b ? `<div class="row"><span>Plate Price</span><strong>₹${formatLineMoney(b.platePricePerPlatePaise)} / plate</strong></div>` : ''}
      ${b ? `<div class="row"><span>Extra Items Cost</span><strong>₹${formatLineMoney(b.extraItemsCostPaise)}</strong></div>` : ''}
    </div>

    <div class="card">
      ${b ? `
      <div class="row"><span class="pre">Plates Cost\n  = ${b.pax} × ₹${Math.round(b.platePricePerPlatePaise / 100)}</span><strong>₹${formatLineMoney(b.platesCostPaise)}</strong></div>
      <div class="row"><span class="pre">Extra Items Cost\n  = ${b.pax} × ₹${Math.round(b.extraItemsPerPlatePaise / 100)}</span><strong>₹${formatLineMoney(b.extraItemsCostPaise)}</strong></div>
      <div class="row"><span class="pre">Food Cost\n  = Plates Cost + Extra Items Cost</span><strong>₹${formatLineMoney(b.foodCostPaise)}</strong></div>
      <div class="row"><span class="pre">Delivery Charges${b.deliveryCfg.freeKm != null && b.deliveryCfg.perKmRupees != null ? `\n  = (${Math.round(b.distanceKm)} − ${Math.round(Number(b.deliveryCfg.freeKm))}) km × ₹${Math.round(Number(b.deliveryCfg.perKmRupees))}\n  = ${Math.max(0, Math.round(b.distanceKm - Number(b.deliveryCfg.freeKm)))} × ₹${Math.round(Number(b.deliveryCfg.perKmRupees))}` : ''}</span><strong>₹${formatLineMoney(b.deliveryFeePaise)}</strong></div>
      <div class="row"><span class="pre">Subtotal\n  = Food Cost + Delivery Charges</span><strong>₹${formatLineMoney(b.subtotalBeforeDiscountPaise)}</strong></div>
      ${b.discountPct > 0 && b.discountPaise > 0 ? `<div class="row"><span class="pre">Bulk Discount (${Math.round(b.discountPct)}%)\n  = ${Math.round(b.discountPct)}% of Food Cost\n  = ${Math.round(b.discountPct)}% × ₹${formatLineMoney(b.foodCostPaise)}</span><strong>-₹${formatLineMoney(b.discountPaise)}</strong></div>` : ''}
      <div class="row"><span class="pre">Total After Discount\n  = Subtotal − Discount</span><strong>₹${formatLineMoney(b.subtotalAfterDiscountPaise)}</strong></div>
      <div class="row"><span class="pre">GST (${Math.round(b.gstPct)}%)\n  = ${Math.round(b.gstPct)}% × ₹${formatLineMoney(b.subtotalAfterDiscountPaise)}</span><strong>₹${formatLineMoney(b.gstPaise)}</strong></div>
      <div class="divider"></div>
      <div class="row"><span><strong>FINAL TOTAL</strong></span><strong>₹${formatLineMoney(b.totalPaise)}</strong></div>
      <div class="row"><span>Advance paid (${advancePctText}%)</span><strong>₹${formatLineMoney(b.advancePaise)}</strong></div>
      <div class="row"><span>Balance due</span><strong>₹${formatLineMoney(b.balancePaise)}</strong></div>
      ` : quote ? `
      <div class="row"><span>Subtotal</span><strong>₹${subtotalText}</strong></div>
      <div class="row"><span>GST</span><strong>₹${gstText}</strong></div>
      <div class="divider"></div>
      <div class="row"><span>Total</span><strong>₹${totalText}</strong></div>
      <div class="row"><span>Advance paid (${advancePctText}%)</span><strong>₹${advanceText}</strong></div>
      <div class="row"><span>Balance due</span><strong>₹${balanceText}</strong></div>
      ` : `
      <div class="row"><span>Total</span><strong>₹${genericTotalText}</strong></div>
      <div class="row"><span>Advance paid (${genericAdvancePctText}%)</span><strong>₹${genericAdvanceText}</strong></div>
      <div class="row"><span>Balance due</span><strong>₹${genericBalanceText}</strong></div>
      `}
    </div>
  </body>
</html>`;
  })();

  const shareInvoiceOnWhatsApp = async () => {
    try {
      if (!invoiceWhatsAppMessage) return;
      const url = `https://wa.me/?text=${encodeURIComponent(invoiceWhatsAppMessage)}`;
      await Linking.openURL(url);
    } catch (e: any) {
      Alert.alert('WhatsApp failed', String(e?.message ?? e));
    }
  };

  const downloadInvoicePdf = async () => {
    try {
      setSharing(true);
      const file = await Print.printToFileAsync({ html: invoiceHtml });
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Sharing not available', 'This device cannot share files.');
        return;
      }
      await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    } catch (e: any) {
      Alert.alert('Invoice failed', String(e?.message ?? e));
    } finally {
      setSharing(false);
    }
  };

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

        {booking || orderDetails ? (
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
            <Text style={{ fontWeight: '900', marginBottom: 10 }}>Invoice</Text>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={shareInvoiceOnWhatsApp}
              style={{
                backgroundColor: '#111827',
                paddingVertical: 12,
                borderRadius: 16,
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Send on WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={downloadInvoicePdf}
              disabled={sharing}
              style={{
                backgroundColor: sharing ? '#AAB' : '#3366FF',
                paddingVertical: 12,
                borderRadius: 16,
                alignItems: 'center',
              }}
            >
              {sharing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Download Invoice (PDF)</Text>}
            </TouchableOpacity>
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
