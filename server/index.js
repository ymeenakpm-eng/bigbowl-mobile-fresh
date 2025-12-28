import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import crypto from 'crypto';
import 'dotenv/config';
import express from 'express';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf?.toString('utf8');
    },
  })
);

const PORT = Number(process.env.PORT ?? 4000);
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const ADVANCE_PERCENT = Number(process.env.ADVANCE_PERCENT ?? 30);
const GST_RATE = Number(process.env.GST_RATE ?? 0.05);
const WEEKEND_SURGE_PCT = Number(process.env.WEEKEND_SURGE_PCT ?? 0);
const FREE_KM = Number(process.env.FREE_KM ?? 10);
const PER_KM_FEE = Number(process.env.PER_KM_FEE ?? 0);

const BOWLS_DELIVERY_FEE = Number(process.env.BOWLS_DELIVERY_FEE ?? 9900);
const BOWLS_FREE_DELIVERY_QTY = Number(process.env.BOWLS_FREE_DELIVERY_QTY ?? 25);

const hasRazorpayConfig = Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
const hasDbConfig = Boolean(DATABASE_URL);
const hasJwtConfig = Boolean(JWT_SECRET);
const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!hasRazorpayConfig) {
  console.warn('Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment (or a .env file).');
}

if (!hasDbConfig) {
  console.warn('Database not configured. Set DATABASE_URL in your environment (or a .env file).');
}

if (!hasJwtConfig) {
  console.warn('JWT not configured. Set JWT_SECRET in your environment (or a .env file).');
}

if (!hasSupabaseConfig) {
  console.warn('Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in your environment (or a .env file).');
}

const prisma = hasDbConfig ? new PrismaClient() : null;
const supabase = hasSupabaseConfig
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

const orderStore = new Map();

const QUICK_CATALOG = {
  mealBoxes: [
    {
      id: 'mb1',
      title: 'Andhra Veg Meal Box',
      includes: 'Rice, dal, curry, fry, curd',
      serves: '1',
      price: 159,
      tag: 'Best seller',
      isVeg: true,
      spice: 'medium',
      mealType: 'single',
    },
    {
      id: 'mb2',
      title: 'Chicken Meal Box',
      includes: 'Rice, chicken curry, fry, pickle',
      serves: '1',
      price: 199,
      tag: 'Spicy',
      isVeg: false,
      spice: 'spicy',
      mealType: 'single',
    },
    {
      id: 'mb5',
      title: 'Paneer Special Meal Box',
      includes: 'Rice, paneer curry, dal, salad, curd',
      serves: '1',
      price: 189,
      tag: 'Premium veg',
      isVeg: true,
      spice: 'medium',
      mealType: 'single',
    },
    {
      id: 'mb6',
      title: 'Egg Curry Meal Box',
      includes: 'Rice, egg curry, fry, pickle',
      serves: '1',
      price: 179,
      tag: 'High protein',
      isVeg: false,
      spice: 'medium',
      mealType: 'single',
    },
    {
      id: 'mb3',
      title: 'Family Veg Feast',
      includes: 'Biryani, curry, starter, dessert',
      serves: '2–3',
      price: 399,
      tag: 'Family',
      isVeg: true,
      spice: 'medium',
      mealType: 'family',
    },
    {
      id: 'mb7',
      title: 'Family Chicken Feast',
      includes: 'Chicken biryani, curry, starter, dessert',
      serves: '2–3',
      price: 499,
      tag: 'Family',
      isVeg: false,
      spice: 'spicy',
      mealType: 'family',
    },
    {
      id: 'mb8',
      title: 'Family Mixed Feast',
      includes: 'Veg + chicken biryani, curries, starter, dessert',
      serves: '3–4',
      price: 549,
      tag: 'Value',
      isVeg: false,
      spice: 'medium',
      mealType: 'family',
    },
    {
      id: 'mb4',
      title: 'Office Lunch Combo',
      includes: 'Rice, curry, fry, buttermilk',
      serves: '1',
      price: 179,
      tag: 'Quick',
      isVeg: true,
      spice: 'mild',
      mealType: 'office',
    },
    {
      id: 'mb9',
      title: 'Office Veg Thali Box',
      includes: 'Rice, dal, 2 veg curries, roti, salad',
      serves: '1',
      price: 199,
      tag: 'Office',
      isVeg: true,
      spice: 'mild',
      mealType: 'office',
    },
    {
      id: 'mb10',
      title: 'Office Chicken Curry Box',
      includes: 'Rice/roti, chicken curry, fry, salad',
      serves: '1',
      price: 219,
      tag: 'Office',
      isVeg: false,
      spice: 'medium',
      mealType: 'office',
    },
  ],
  snackBoxes: [
    { id: 'sb1', title: 'Punugulu Pack', includes: 'Punugulu + chutney + sambar', serves: '2–3', price: 129, isVeg: true },
    { id: 'sb2', title: 'Samosa & Chai Combo', includes: '4 samosas + 2 chai', serves: '2', price: 149, isVeg: true },
    { id: 'sb3', title: 'Office Snacks Box', includes: 'Sandwich + fries + juice', serves: '1', price: 179, isVeg: true },
    { id: 'sb4', title: 'Kids Party Mini Box', includes: 'Burger + fries + brownie', serves: '1', price: 199, isVeg: false },
    { id: 'sb5', title: 'Mirchi Bajji Box', includes: 'Mirchi bajji + chutney', serves: '2–3', price: 139, isVeg: true },
    { id: 'sb6', title: 'Pakoda & Chai Combo', includes: 'Onion pakoda + 2 chai', serves: '2', price: 159, isVeg: true },
    { id: 'sb7', title: 'Veg Cutlet Snack Box', includes: 'Cutlets + fries + dips', serves: '2', price: 189, isVeg: true },
    { id: 'sb8', title: 'Chicken 65 Snack Box', includes: 'Chicken 65 + salad + dips', serves: '2', price: 249, isVeg: false },
    { id: 'sb9', title: 'Mixed Starters Platter', includes: 'Veg + non-veg starters + dips', serves: '3–5', price: 499, isVeg: false },
  ],
  bowls: [
    {
      id: 'bowl-biryani-single',
      name: 'Biryani Bowl (Single Serve)',
      description: 'Individual biryani bowl with raita and salan.',
      price: 299,
      image: 'https://images.unsplash.com/photo-1604908176997-1251884b08a0?auto=format&fit=crop&w=800&q=80',
      rating: 4.7,
      isVeg: false,
      prepTime: '25-30 min',
    },
    {
      id: 'bowl-comfort-meal',
      name: 'Comfort Meal Bowl',
      description: 'Rice bowl with dal, curry and salad in a single comfort portion.',
      price: 249,
      image: 'https://images.unsplash.com/photo-1625945277069-2f1c9c6b2217?auto=format&fit=crop&w=800&q=80',
      rating: 4.5,
      isVeg: true,
      prepTime: '20-25 min',
    },
    {
      id: 'bowl-curd-rice',
      name: 'Curd Rice Bowl',
      description: 'Cooling curd rice with pickle and papad.',
      price: 199,
      image: 'https://images.unsplash.com/photo-1625945277069-2f1c9c6b2217?auto=format&fit=crop&w=800&q=80',
      rating: 4.4,
      isVeg: true,
      prepTime: '15-20 min',
    },
    {
      id: 'bowl-rajma-chawal',
      name: 'Rajma Chawal Bowl',
      description: 'Rajma gravy with steamed rice and onions.',
      price: 259,
      image: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
      rating: 4.5,
      isVeg: true,
      prepTime: '20-25 min',
    },
    {
      id: 'bowl-chicken-curry',
      name: 'Chicken Curry Rice Bowl',
      description: 'Chicken curry with rice and salad.',
      price: 299,
      image: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
      rating: 4.6,
      isVeg: false,
      prepTime: '25-30 min',
    },
  ],
};

const PARTYBOX_MENU = [
  { id: 's1', name: 'Gobi 65', section: 'Starters', isVeg: true, premiumDelta: 0 },
  { id: 's2', name: 'Paneer 65', section: 'Starters', isVeg: true, premiumDelta: 1000 },
  { id: 's3', name: 'Crispy Corn', section: 'Starters', isVeg: true, premiumDelta: 0 },
  { id: 's4', name: 'Veg Manchurian', section: 'Starters', isVeg: true, premiumDelta: 0 },
  { id: 's5', name: 'Chilli Paneer', section: 'Starters', isVeg: true, premiumDelta: 1000 },
  { id: 's6', name: 'Chicken 65', section: 'Starters', isVeg: false, premiumDelta: 1500 },
  { id: 's7', name: 'Chicken Manchurian', section: 'Starters', isVeg: false, premiumDelta: 1500 },
  { id: 's8', name: 'Chilli Chicken', section: 'Starters', isVeg: false, premiumDelta: 2000 },
  { id: 's9', name: 'Fish Fry', section: 'Starters', isVeg: false, premiumDelta: 2500 },
  { id: 's10', name: 'Mutton Seekh Kebab', section: 'Starters', isVeg: false, premiumDelta: 3000 },
  { id: 's11', name: 'Veg Spring Roll', section: 'Starters', isVeg: true, premiumDelta: 0 },
  { id: 's12', name: 'Hara Bhara Kebab', section: 'Starters', isVeg: true, premiumDelta: 500 },
  { id: 's13', name: 'Paneer Tikka', section: 'Starters', isVeg: true, premiumDelta: 1000 },
  { id: 's14', name: 'Baby Corn 65', section: 'Starters', isVeg: true, premiumDelta: 0 },
  { id: 's15', name: 'Chicken Lollipop', section: 'Starters', isVeg: false, premiumDelta: 2000 },
  { id: 's16', name: 'Tandoori Chicken', section: 'Starters', isVeg: false, premiumDelta: 2500 },
  { id: 's17', name: 'Apollo Fish', section: 'Starters', isVeg: false, premiumDelta: 2500 },
  { id: 's18', name: 'Pepper Mutton Fry', section: 'Starters', isVeg: false, premiumDelta: 3000 },

  { id: 'm1', name: 'Paneer Butter Masala', section: 'Main Course', isVeg: true, premiumDelta: 1500 },
  { id: 'm2', name: 'Kadai Paneer', section: 'Main Course', isVeg: true, premiumDelta: 1000 },
  { id: 'm3', name: 'Dal Tadka', section: 'Main Course', isVeg: true, premiumDelta: 0 },
  { id: 'm4', name: 'Veg Kurma', section: 'Main Course', isVeg: true, premiumDelta: 0 },
  { id: 'm5', name: 'Palak Paneer', section: 'Main Course', isVeg: true, premiumDelta: 1000 },
  { id: 'm6', name: 'Chicken Curry', section: 'Main Course', isVeg: false, premiumDelta: 1500 },
  { id: 'm7', name: 'Butter Chicken', section: 'Main Course', isVeg: false, premiumDelta: 2000 },
  { id: 'm8', name: 'Gongura Chicken', section: 'Main Course', isVeg: false, premiumDelta: 2000 },
  { id: 'm9', name: 'Mutton Rogan Josh', section: 'Main Course', isVeg: false, premiumDelta: 3000 },
  { id: 'm10', name: 'Prawns Masala', section: 'Main Course', isVeg: false, premiumDelta: 3000 },
  { id: 'm11', name: 'Dal Makhani', section: 'Main Course', isVeg: true, premiumDelta: 500 },
  { id: 'm12', name: 'Chole Masala', section: 'Main Course', isVeg: true, premiumDelta: 0 },
  { id: 'm13', name: 'Mixed Veg Curry', section: 'Main Course', isVeg: true, premiumDelta: 0 },
  { id: 'm14', name: 'Paneer Tikka Masala', section: 'Main Course', isVeg: true, premiumDelta: 1500 },
  { id: 'm15', name: 'Egg Curry', section: 'Main Course', isVeg: false, premiumDelta: 1000 },
  { id: 'm16', name: 'Andhra Chicken Curry', section: 'Main Course', isVeg: false, premiumDelta: 1500 },
  { id: 'm17', name: 'Hyderabadi Mutton Curry', section: 'Main Course', isVeg: false, premiumDelta: 3000 },
  { id: 'm18', name: 'Fish Curry', section: 'Main Course', isVeg: false, premiumDelta: 2500 },

  { id: 'r1', name: 'Veg Biryani', section: 'Rice / Biryani', isVeg: true, premiumDelta: 0 },
  { id: 'r2', name: 'Jeera Rice', section: 'Rice / Biryani', isVeg: true, premiumDelta: 0 },
  { id: 'r3', name: 'Steamed Rice', section: 'Rice / Biryani', isVeg: true, premiumDelta: 0 },
  { id: 'r4', name: 'Chicken Dum Biryani', section: 'Rice / Biryani', isVeg: false, premiumDelta: 2000 },
  { id: 'r5', name: 'Mutton Biryani', section: 'Rice / Biryani', isVeg: false, premiumDelta: 3000 },
  { id: 'r6', name: 'Veg Fried Rice', section: 'Rice / Biryani', isVeg: true, premiumDelta: 0 },
  { id: 'r7', name: 'Bagara Rice', section: 'Rice / Biryani', isVeg: true, premiumDelta: 0 },
  { id: 'r8', name: 'Veg Pulao', section: 'Rice / Biryani', isVeg: true, premiumDelta: 0 },
  { id: 'r9', name: 'Curd Rice', section: 'Rice / Biryani', isVeg: true, premiumDelta: 0 },
  { id: 'r10', name: 'Egg Fried Rice', section: 'Rice / Biryani', isVeg: false, premiumDelta: 1000 },
  { id: 'r11', name: 'Chicken Fried Rice', section: 'Rice / Biryani', isVeg: false, premiumDelta: 1500 },
  { id: 'r12', name: 'Veg Lemon Rice', section: 'Rice / Biryani', isVeg: true, premiumDelta: 0 },

  { id: 'b1', name: 'Plain Naan', section: 'Breads', isVeg: true, premiumDelta: 0 },
  { id: 'b2', name: 'Butter Naan', section: 'Breads', isVeg: true, premiumDelta: 0 },
  { id: 'b3', name: 'Tandoori Roti', section: 'Breads', isVeg: true, premiumDelta: 0 },
  { id: 'b4', name: 'Rumali Roti', section: 'Breads', isVeg: true, premiumDelta: 500 },
  { id: 'b5', name: 'Kulcha', section: 'Breads', isVeg: true, premiumDelta: 500 },
  { id: 'b6', name: 'Parotta', section: 'Breads', isVeg: true, premiumDelta: 0 },
  { id: 'b7', name: 'Garlic Naan', section: 'Breads', isVeg: true, premiumDelta: 500 },
  { id: 'b8', name: 'Butter Roti', section: 'Breads', isVeg: true, premiumDelta: 0 },

  { id: 'a1', name: 'Onion Raita', section: 'Accompaniments', isVeg: true, premiumDelta: 0 },
  { id: 'a2', name: 'Boondi Raita', section: 'Accompaniments', isVeg: true, premiumDelta: 0 },
  { id: 'a3', name: 'Green Salad', section: 'Accompaniments', isVeg: true, premiumDelta: 0 },
  { id: 'a4', name: 'Papad', section: 'Accompaniments', isVeg: true, premiumDelta: 0 },
  { id: 'a5', name: 'Pickle & Chutney', section: 'Accompaniments', isVeg: true, premiumDelta: 0 },
  { id: 'a6', name: 'Curd', section: 'Accompaniments', isVeg: true, premiumDelta: 0 },
  { id: 'a7', name: 'Mirchi Ka Salan', section: 'Accompaniments', isVeg: true, premiumDelta: 0 },
  { id: 'a8', name: 'Bagara Baingan', section: 'Accompaniments', isVeg: true, premiumDelta: 0 },
  { id: 'a9', name: 'Mint Chutney', section: 'Accompaniments', isVeg: true, premiumDelta: 0 },
  { id: 'a10', name: 'Sambar', section: 'Accompaniments', isVeg: true, premiumDelta: 0 },

  { id: 'd1', name: 'Gulab Jamun', section: 'Desserts', isVeg: true, premiumDelta: 0 },
  { id: 'd2', name: 'Double Ka Meetha', section: 'Desserts', isVeg: true, premiumDelta: 1000 },
  { id: 'd3', name: 'Fruit Custard', section: 'Desserts', isVeg: true, premiumDelta: 0 },
  { id: 'd4', name: 'Ice Cream', section: 'Desserts', isVeg: true, premiumDelta: 500 },
  { id: 'd5', name: 'Gajar Halwa', section: 'Desserts', isVeg: true, premiumDelta: 1000 },
  { id: 'd6', name: 'Phirni', section: 'Desserts', isVeg: true, premiumDelta: 1000 },
  { id: 'd7', name: 'Rasmalai', section: 'Desserts', isVeg: true, premiumDelta: 1000 },
  { id: 'd8', name: 'Moong Dal Halwa', section: 'Desserts', isVeg: true, premiumDelta: 1000 },
  { id: 'd9', name: 'Chocolate Brownie', section: 'Desserts', isVeg: true, premiumDelta: 1000 },
];

const PARTYBOX_TIERS = [
  {
    key: 'standard',
    title: 'Standard Party Box',
    subtitle: 'Value picks • Great for birthdays & small functions',
    perPlate: 24900,
    rules: { Starters: 2, 'Main Course': 2, 'Rice / Biryani': 1, Breads: 1, Accompaniments: 1, Desserts: 1 },
  },
  {
    key: 'premium',
    title: 'Premium Party Box',
    subtitle: 'Best sellers • Extra starters & desserts',
    perPlate: 34900,
    rules: { Starters: 3, 'Main Course': 3, 'Rice / Biryani': 1, Breads: 2, Accompaniments: 2, Desserts: 2 },
  },
  {
    key: 'custom',
    title: 'Custom Party Box',
    subtitle: 'Build your own menu • Choose every item',
    perPlate: 39900,
    rules: { Starters: 2, 'Main Course': 2, 'Rice / Biryani': 1, Breads: 1, Accompaniments: 1, Desserts: 1 },
  },
];

function nowTs() {
  return Math.floor(Date.now() / 1000);
}

function requireDb(res) {
  if (!prisma) {
    res.status(500).json({ error: 'DATABASE_URL not configured' });
    return null;
  }
  return prisma;
}

function requireJwt(res) {
  if (!JWT_SECRET) {
    res.status(500).json({ error: 'JWT_SECRET not configured' });
    return null;
  }
  return JWT_SECRET;
}

function authMiddleware(req, res, next) {
  const secret = JWT_SECRET;
  if (!secret) return res.status(500).json({ error: 'JWT_SECRET not configured' });

  const header = String(req.headers.authorization ?? '');
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
  if (!token) return res.status(401).json({ error: 'Missing Authorization Bearer token' });

  try {
    const payload = jwt.verify(token, secret);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function isWeekend(date) {
  const d = new Date(date);
  const day = d.getDay();
  return day === 0 || day === 6;
}

function computeQuote({ pkg, pax, distanceKm, eventDate, addons = [], pricing = null }) {
  const breakdown = [];
  let subtotal = 0;

  const pricingMode = pricing && typeof pricing === 'object' ? String(pricing.mode ?? '') : '';
  if (pricingMode === 'per_plate') {
    const perPlate = Number(pricing?.perPlate ?? pkg.perPax ?? pkg.basePrice);
    const base = Math.round(Math.max(0, pax) * perPlate);
    subtotal += base;
    breakdown.push({ label: `${pax} plates × ₹${Math.round(perPlate / 100)}`, amount: base });
  } else {
    subtotal = Number(pkg.basePrice);
    breakdown.push({ label: `Base (min ${pkg.minPax})`, amount: subtotal });

    if (pax > pkg.minPax) {
      const extra = (pax - pkg.minPax) * Number(pkg.perPax);
      subtotal += extra;
      breakdown.push({ label: `Extra ${pax - pkg.minPax} pax`, amount: extra });
    }
  }

  if (Array.isArray(addons)) {
    for (const a of addons) {
      const amt = Number(a?.amount);
      const label = String(a?.label ?? '').trim();
      if (!label || !Number.isFinite(amt) || amt === 0) continue;
      subtotal += amt;
      breakdown.push({ label, amount: amt });
    }
  }

  const dist = Math.max(0, Number(distanceKm ?? 0));
  if (PER_KM_FEE > 0 && dist > FREE_KM) {
    const fee = Math.round((dist - FREE_KM) * PER_KM_FEE);
    subtotal += fee;
    breakdown.push({ label: 'Distance fee', amount: fee });
  }

  if (WEEKEND_SURGE_PCT > 0 && isWeekend(eventDate)) {
    const surge = Math.round((subtotal * WEEKEND_SURGE_PCT) / 100);
    subtotal += surge;
    breakdown.push({ label: `Weekend surge ${WEEKEND_SURGE_PCT}%`, amount: surge });
  }

  const gst = Math.round(subtotal * GST_RATE);
  const total = subtotal + gst;
  breakdown.push({ label: `GST ${Math.round(GST_RATE * 100)}%`, amount: gst });

  return { subtotal, gst, total, breakdown };
}

function computeBowlTotals({ bowlPricePerUnit, qty, addOns, deliveryFee }) {
  const q = Math.max(0, Math.round(Number(qty)));
  const unit = Math.max(0, Math.round(Number(bowlPricePerUnit)));
  const addOnList = Array.isArray(addOns) ? addOns : [];

  let addOnsPerUnit = 0;
  for (const a of addOnList) {
    const p = Math.max(0, Math.round(Number(a?.pricePerUnit ?? 0)));
    addOnsPerUnit += p;
  }

  const bowlsSubtotal = q * unit;
  const addOnsTotal = q * addOnsPerUnit;
  const fee = Math.max(0, Math.round(Number(deliveryFee ?? 0)));
  const subtotal = bowlsSubtotal + addOnsTotal;
  const total = subtotal + fee;

  return {
    qty: q,
    bowlsSubtotal,
    addOnsTotal,
    addOnsPerUnit,
    deliveryFee: fee,
    subtotal,
    total,
  };
}

async function createRazorpayOrder({ amountPaise, currency, receipt, notes }) {
  const basicAuth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
  const r = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${basicAuth}`,
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency,
      receipt,
      notes,
    }),
  });

  const data = await r.json();
  if (!r.ok) {
    return { ok: false, data };
  }
  return { ok: true, data };
}

function calculateTotalPaiseFromItems(items) {
  if (!Array.isArray(items)) return null;
  let totalRupees = 0;
  for (const item of items) {
    const price = Number(item?.price);
    const quantity = Number(item?.quantity);
    if (!Number.isFinite(price) || !Number.isFinite(quantity) || quantity <= 0) return null;
    totalRupees += price * quantity;
  }
  if (!Number.isFinite(totalRupees) || totalRupees <= 0) return null;
  return Math.round(totalRupees * 100);
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/api/catalog/quick', (_req, res) => {
  return res.json(QUICK_CATALOG);
});

app.get('/api/bowls', async (_req, res) => {
  try {
    const db = requireDb(res);
    if (!db) return;
    const items = await db.bowl.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
    return res.json({ items });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
});

app.get('/api/bowls/:id', async (req, res) => {
  try {
    const db = requireDb(res);
    if (!db) return;
    const id = String(req.params.id ?? '').trim();
    if (!id) return res.status(400).json({ error: 'Missing bowl id' });
    const bowl = await db.bowl.findUnique({ where: { id } });
    if (!bowl || !bowl.isActive) return res.status(404).json({ error: 'Not found' });
    return res.json({
      id: bowl.id,
      title: bowl.title,
      pricePerUnit: bowl.pricePerUnit,
      minQty: bowl.minQty,
      isVeg: bowl.isVeg,
      images: bowl.images,
      inclusions: bowl.inclusions,
    });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
});

app.get('/api/bowls/addons', async (_req, res) => {
  try {
    const db = requireDb(res);
    if (!db) return;
    const items = await db.bowlAddOn.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
    return res.json({ items });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
});

app.post('/api/bowls/quote', async (req, res) => {
  try {
    const db = requireDb(res);
    if (!db) return;

    const bowlId = String(req.body?.bowlId ?? '').trim();
    const qty = Number(req.body?.qty);
    const addOnIds = Array.isArray(req.body?.addOnIds) ? req.body.addOnIds.map((x) => String(x)).filter(Boolean) : [];

    if (!bowlId) return res.status(400).json({ error: 'Missing bowlId' });
    if (!Number.isFinite(qty) || qty <= 0) return res.status(400).json({ error: 'Invalid qty' });

    const bowl = await db.bowl.findUnique({ where: { id: bowlId } });
    if (!bowl || !bowl.isActive) return res.status(404).json({ error: 'Bowl not found' });

    const uniqueAddOnIds = [...new Set(addOnIds)];
    const addOns = uniqueAddOnIds.length
      ? await db.bowlAddOn.findMany({ where: { id: { in: uniqueAddOnIds }, isActive: true } })
      : [];

    const deliveryFee = Number.isFinite(BOWLS_FREE_DELIVERY_QTY) && qty >= BOWLS_FREE_DELIVERY_QTY ? 0 : BOWLS_DELIVERY_FEE;
    const totals = computeBowlTotals({ bowlPricePerUnit: bowl.pricePerUnit, qty, addOns, deliveryFee });

    return res.json({
      bowl: {
        id: bowl.id,
        title: bowl.title,
        pricePerUnit: bowl.pricePerUnit,
        minQty: bowl.minQty,
        isVeg: bowl.isVeg,
        images: bowl.images,
        inclusions: bowl.inclusions,
      },
      addOns: addOns.map((a) => ({ id: a.id, title: a.title, pricePerUnit: a.pricePerUnit })),
      deliveryFee: totals.deliveryFee,
      subtotal: totals.subtotal,
      total: totals.total,
      lines: [
        { label: `${totals.qty} bowls × ₹${Math.round(bowl.pricePerUnit / 100)}`, amount: totals.bowlsSubtotal },
        ...(totals.addOnsPerUnit > 0
          ? [{ label: `Add-ons +₹${Math.round(totals.addOnsPerUnit / 100)}/bowl`, amount: totals.addOnsTotal }]
          : []),
        ...(totals.deliveryFee > 0 ? [{ label: 'Delivery fee', amount: totals.deliveryFee }] : [{ label: 'Delivery fee', amount: 0 }]),
      ],
    });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
});

app.get('/api/addresses', authMiddleware, async (req, res) => {
  try {
    const db = requireDb(res);
    if (!db) return;
    const userId = String(req.user?.sub ?? '').trim();
    if (!userId) return res.status(401).json({ error: 'Invalid auth token' });

    const items = await db.address.findMany({ where: { userId }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });
    return res.json({ items });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
});

app.post('/api/addresses', authMiddleware, async (req, res) => {
  try {
    const db = requireDb(res);
    if (!db) return;
    const userId = String(req.user?.sub ?? '').trim();
    if (!userId) return res.status(401).json({ error: 'Invalid auth token' });

    const label = String(req.body?.label ?? '').trim();
    const line1 = String(req.body?.line1 ?? '').trim();
    const line2 = String(req.body?.line2 ?? '').trim();
    const city = String(req.body?.city ?? '').trim();
    const state = String(req.body?.state ?? '').trim();
    const pincode = String(req.body?.pincode ?? '').trim();
    const landmark = String(req.body?.landmark ?? '').trim();
    const makeDefault = Boolean(req.body?.isDefault);

    if (!label) return res.status(400).json({ error: 'Missing label' });
    if (!line1) return res.status(400).json({ error: 'Missing line1' });
    if (!city) return res.status(400).json({ error: 'Missing city' });

    if (makeDefault) {
      await db.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const created = await db.address.create({
      data: {
        userId,
        label,
        line1,
        line2: line2 || null,
        city,
        state: state || null,
        pincode: pincode || null,
        landmark: landmark || null,
        isDefault: makeDefault,
      },
    });

    return res.json({
      id: created.id,
      label: created.label,
      line1: created.line1,
      line2: created.line2,
      city: created.city,
      state: created.state,
      pincode: created.pincode,
      landmark: created.landmark,
      isDefault: created.isDefault,
    });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
});

app.post('/api/bowls/order', authMiddleware, async (req, res) => {
  try {
    if (!hasRazorpayConfig) {
      return res.status(503).json({
        error: 'Razorpay is not configured on this server.',
        code: 'RAZORPAY_NOT_CONFIGURED',
        details: 'Missing env vars: RAZORPAY_KEY_ID and/or RAZORPAY_KEY_SECRET',
      });
    }

    const db = requireDb(res);
    if (!db) return;

    const userId = String(req.user?.sub ?? '').trim();
    if (!userId) return res.status(401).json({ error: 'Invalid auth token' });

    const bowlId = String(req.body?.bowlId ?? '').trim();
    const qty = Number(req.body?.qty);
    const addOnIds = Array.isArray(req.body?.addOnIds) ? req.body.addOnIds.map((x) => String(x)).filter(Boolean) : [];
    const deliveryDateRaw = String(req.body?.deliveryDate ?? '').trim();
    const timeSlot = String(req.body?.timeSlot ?? '').trim();
    const addressId = String(req.body?.addressId ?? '').trim();

    if (!bowlId) return res.status(400).json({ error: 'Missing bowlId' });
    if (!Number.isFinite(qty) || qty <= 0) return res.status(400).json({ error: 'Invalid qty' });
    if (!deliveryDateRaw) return res.status(400).json({ error: 'Missing deliveryDate' });
    if (!timeSlot) return res.status(400).json({ error: 'Missing timeSlot' });
    if (!addressId) return res.status(400).json({ error: 'Missing addressId' });

    const deliveryDate = new Date(deliveryDateRaw);
    if (Number.isNaN(deliveryDate.getTime())) return res.status(400).json({ error: 'Invalid deliveryDate' });

    const bowl = await db.bowl.findUnique({ where: { id: bowlId } });
    if (!bowl || !bowl.isActive) return res.status(404).json({ error: 'Bowl not found' });
    if (qty < bowl.minQty) return res.status(400).json({ error: `Minimum order is ${bowl.minQty} bowls` });

    const address = await db.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== userId) return res.status(403).json({ error: 'Invalid address' });

    const uniqueAddOnIds = [...new Set(addOnIds)];
    const addOns = uniqueAddOnIds.length
      ? await db.bowlAddOn.findMany({ where: { id: { in: uniqueAddOnIds }, isActive: true } })
      : [];

    const deliveryFee = Number.isFinite(BOWLS_FREE_DELIVERY_QTY) && qty >= BOWLS_FREE_DELIVERY_QTY ? 0 : BOWLS_DELIVERY_FEE;
    const totals = computeBowlTotals({ bowlPricePerUnit: bowl.pricePerUnit, qty, addOns, deliveryFee });

    const order = await db.bowlOrder.create({
      data: {
        userId,
        bowlId: bowl.id,
        addressId: address.id,
        qty: totals.qty,
        deliveryDate,
        timeSlot,
        status: 'PAYMENT_PENDING',
        deliveryFee: totals.deliveryFee,
        subtotal: totals.subtotal,
        total: totals.total,
        addons: {
          create: addOns.map((a) => ({ addOnId: a.id, unitPrice: a.pricePerUnit })),
        },
      },
    });

    const receipt = `bo_${order.id}_${Date.now()}`;
    const rp = await createRazorpayOrder({
      amountPaise: order.total,
      currency: 'INR',
      receipt,
      notes: { kind: 'bowl_order', bowlOrderId: order.id, userId },
    });
    if (!rp.ok) return res.status(500).json({ error: 'Razorpay order create failed', details: rp.data });

    await db.bowlOrder.update({ where: { id: order.id }, data: { razorpayOrderId: String(rp.data.id) } });

    return res.json({
      bowlOrderId: order.id,
      razorpayOrderId: String(rp.data.id),
      amountPaise: order.total,
      currency: 'INR',
    });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e?.message ?? e) });
  }
});

app.get('/api/bowls/orders/:id', authMiddleware, async (req, res) => {
  try {
    const db = requireDb(res);
    if (!db) return;

    const id = String(req.params.id ?? '').trim();
    if (!id) return res.status(400).json({ error: 'Missing order id' });

    const userId = String(req.user?.sub ?? '').trim();
    if (!userId) return res.status(401).json({ error: 'Invalid auth token' });

    const order = await db.bowlOrder.findUnique({
      where: { id },
      include: { bowl: true, address: true, addons: { include: { addOn: true } } },
    });
    if (!order) return res.status(404).json({ error: 'Not found' });
    if (order.userId !== userId) return res.status(403).json({ error: 'Forbidden' });

    return res.json({
      id: order.id,
      status: order.status,
      qty: order.qty,
      deliveryDate: order.deliveryDate,
      timeSlot: order.timeSlot,
      deliveryFee: order.deliveryFee,
      subtotal: order.subtotal,
      total: order.total,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      bowl: {
        id: order.bowl.id,
        title: order.bowl.title,
        pricePerUnit: order.bowl.pricePerUnit,
        minQty: order.bowl.minQty,
        isVeg: order.bowl.isVeg,
        images: order.bowl.images,
        inclusions: order.bowl.inclusions,
      },
      address: {
        id: order.address.id,
        label: order.address.label,
        line1: order.address.line1,
        line2: order.address.line2,
        city: order.address.city,
        state: order.address.state,
        pincode: order.address.pincode,
        landmark: order.address.landmark,
      },
      addons: order.addons.map((x) => ({
        id: x.addOn.id,
        title: x.addOn.title,
        pricePerUnit: x.unitPrice,
      })),
    });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
});

app.post('/api/auth/otp', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    const phone = String(req.body?.phone ?? '').trim();
    if (!phone) return res.status(400).json({ error: 'Missing phone' });

    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
});

app.post('/api/auth/verify', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    const db = requireDb(res);
    if (!db) return;
    const secret = requireJwt(res);
    if (!secret) return;

    const phone = String(req.body?.phone ?? '').trim();
    const token = String(req.body?.token ?? '').trim();
    if (!phone || !token) return res.status(400).json({ error: 'Missing phone or token' });

    const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error) return res.status(400).json({ error: error.message });

    const user = await db.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });

    const jwtToken = jwt.sign({ sub: user.id, role: user.role, phone: user.phone }, secret, {
      expiresIn: '30d',
    });

    return res.json({ ok: true, token: jwtToken, user: { id: user.id, phone: user.phone } });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
});

app.get('/api/catalog/partybox', async (_req, res) => {
  try {
    const db = requireDb(res);
    if (!db) return;

    const tiers = [];
    for (const t of PARTYBOX_TIERS) {
      const existing = await db.package.findFirst({ where: { title: t.title } });
      const pkg =
        existing ??
        (await db.package.create({
          data: {
            title: t.title,
            cuisine: 'Party Box',
            minPax: 1,
            basePrice: t.perPlate,
            perPax: t.perPlate,
            isVeg: false,
            images: [],
          },
        }));
      tiers.push({ ...t, packageId: pkg.id });
    }

    const menu = PARTYBOX_MENU.map((m) => {
      const delta = Number(m.premiumDelta ?? 0);
      return {
        id: m.id,
        name: m.name,
        section: m.section,
        isVeg: m.isVeg,
        premiumDelta: Number.isFinite(delta) ? delta : 0,
        priceDeltaPerPlate: Number.isFinite(delta) ? delta : 0,
        isPremium: Number.isFinite(delta) ? delta > 0 : false,
      };
    });

    return res.json({ tiers, menu });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
});

app.post('/api/auth/demo', async (_req, res) => {
  try {
    const db = requireDb(res);
    if (!db) return;
    const secret = requireJwt(res);
    if (!secret) return;

    const phone = '+910000000000';

    const user = await db.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });

    const jwtToken = jwt.sign({ sub: user.id, role: user.role, phone: user.phone }, secret, {
      expiresIn: '30d',
    });

    return res.json({ ok: true, token: jwtToken, user: { id: user.id, phone: user.phone } });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
});

app.get('/api/catalog/packages', async (_req, res) => {
  try {
    const db = requireDb(res);
    if (!db) return;
    const items = await db.package.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
    return res.json({ items });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
});

app.post('/api/quotes/instant', async (req, res) => {
  try {
    const db = requireDb(res);
    if (!db) return;

    const packageId = String(req.body?.packageId ?? '').trim();
    const pax = Number(req.body?.pax);
    const city = String(req.body?.city ?? '').trim();
    const distanceKm = Number(req.body?.distanceKm ?? 0);
    const eventDate = new Date(req.body?.eventDate);

    if (!packageId) return res.status(400).json({ error: 'Missing packageId' });
    if (!Number.isFinite(pax) || pax <= 0) return res.status(400).json({ error: 'Invalid pax' });
    if (!city) return res.status(400).json({ error: 'Missing city' });
    if (Number.isNaN(eventDate.getTime())) return res.status(400).json({ error: 'Invalid eventDate' });

    const pkg = await db.package.findUnique({ where: { id: packageId } });
    if (!pkg || !pkg.isActive) return res.status(404).json({ error: 'Package not found' });

    const selection = req.body?.selection;
    const addons = [];
    let usePerPlatePricing = false;
    let premiumPerPlate = 0;
    let premiumCount = 0;
    if (selection && typeof selection === 'object') {
      const kind = String(selection?.kind ?? '').trim();
      const items = Array.isArray(selection?.items) ? selection.items : [];
      if (kind === 'party_box' && items.length > 0) {
        usePerPlatePricing = true;
        const uniqueIds = new Set(items.map((x) => String(x)).filter(Boolean));
        for (const id of uniqueIds) {
          const found = PARTYBOX_MENU.find((m) => m.id === id);
          const delta = Number(found?.premiumDelta ?? 0);
          if (Number.isFinite(delta) && delta > 0) {
            premiumPerPlate += delta;
            premiumCount += 1;
          }
        }
        if (premiumPerPlate > 0) {
          addons.push({
            label: `Premium add-ons (${premiumCount} items) +₹${Math.round(premiumPerPlate / 100)}/plate`,
            amount: Math.round(premiumPerPlate * pax),
          });
        }
      }
    }

    const { subtotal, gst, total, breakdown } = computeQuote({
      pkg,
      pax,
      distanceKm,
      eventDate,
      addons,
      pricing: usePerPlatePricing ? { mode: 'per_plate', perPlate: Number(pkg.perPax) } : null,
    });
    const expiresAt = new Date(Date.now() + 45 * 60 * 1000);

    const breakdownJson = selection && typeof selection === 'object' ? { lines: breakdown, selection } : breakdown;

    const quote = await db.quote.create({
      data: {
        packageId: pkg.id,
        pax,
        city,
        distanceKm: Number.isFinite(distanceKm) ? Math.max(0, Math.round(distanceKm)) : 0,
        eventDate,
        subtotal,
        gst,
        total,
        breakdown: breakdownJson,
        expiresAt,
      },
    });

    return res.json({
      id: quote.id,
      subtotal: quote.subtotal,
      gst: quote.gst,
      total: quote.total,
      breakdown: quote.breakdown,
      expiresAt: quote.expiresAt,
    });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
});

app.get('/api/quotes/:id', async (req, res) => {
  try {
    const db = requireDb(res);
    if (!db) return;
    const id = String(req.params.id ?? '').trim();
    if (!id) return res.status(400).json({ error: 'Missing quote id' });

    const quote = await db.quote.findUnique({ where: { id }, include: { package: true } });
    if (!quote) return res.status(404).json({ error: 'Not found' });

    return res.json({
      id: quote.id,
      subtotal: quote.subtotal,
      gst: quote.gst,
      total: quote.total,
      breakdown: quote.breakdown,
      expiresAt: quote.expiresAt,
      pax: quote.pax,
      city: quote.city,
      distanceKm: quote.distanceKm,
      eventDate: quote.eventDate,
      package: {
        id: quote.package.id,
        title: quote.package.title,
        cuisine: quote.package.cuisine,
        minPax: quote.package.minPax,
        isVeg: quote.package.isVeg,
      },
    });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
});

app.post('/api/bookings', authMiddleware, async (req, res) => {
  try {
    if (!hasRazorpayConfig) {
      return res.status(503).json({
        error: 'Razorpay is not configured on this server.',
        code: 'RAZORPAY_NOT_CONFIGURED',
        details: 'Missing env vars: RAZORPAY_KEY_ID and/or RAZORPAY_KEY_SECRET',
      });
    }
    const db = requireDb(res);
    if (!db) return;

    const quoteId = String(req.body?.quoteId ?? '').trim();
    if (!quoteId) return res.status(400).json({ error: 'Missing quoteId' });

    const quote = await db.quote.findUnique({ where: { id: quoteId }, include: { package: true } });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    if (new Date(quote.expiresAt).getTime() < Date.now()) return res.status(400).json({ error: 'Quote expired' });

    const userId = String(req.user?.sub ?? '').trim();
    if (!userId) return res.status(401).json({ error: 'Invalid auth token' });

    const pct = Number.isFinite(ADVANCE_PERCENT) ? Math.max(1, Math.min(100, Math.round(ADVANCE_PERCENT))) : 30;
    const advanceAmount = Math.max(1, Math.round((quote.total * pct) / 100));

    const existing = await db.booking.findUnique({ where: { quoteId } });
    if (existing) {
      if (existing.userId !== userId) return res.status(403).json({ error: 'Forbidden' });

      if (existing.advancePaid || existing.status === 'CONFIRMED') {
        return res.json({
          bookingId: existing.id,
          status: existing.status,
          advancePaid: true,
          alreadyPaid: true,
          razorpayOrderId: existing.razorpayOrderId,
          amountPaise: existing.advanceAmount,
          currency: 'INR',
          advancePct: existing.advancePct,
        });
      }

      if (!existing.razorpayOrderId) {
        const receipt = `bk_${quote.id}_${Date.now()}`;
        const rp = await createRazorpayOrder({
          amountPaise: existing.advanceAmount,
          currency: 'INR',
          receipt,
          notes: { quoteId: quote.id, userId },
        });
        if (!rp.ok) return res.status(500).json({ error: 'Razorpay order create failed', details: rp.data });

        const updated = await db.booking.update({
          where: { id: existing.id },
          data: { razorpayOrderId: String(rp.data.id) },
        });

        return res.json({
          bookingId: updated.id,
          status: updated.status,
          advancePaid: updated.advancePaid,
          razorpayOrderId: updated.razorpayOrderId,
          amountPaise: updated.advanceAmount,
          currency: 'INR',
          advancePct: updated.advancePct,
        });
      }

      return res.json({
        bookingId: existing.id,
        status: existing.status,
        advancePaid: existing.advancePaid,
        razorpayOrderId: existing.razorpayOrderId,
        amountPaise: existing.advanceAmount,
        currency: 'INR',
        advancePct: existing.advancePct,
      });
    }

    const receipt = `bk_${quote.id}_${Date.now()}`;
    const rp = await createRazorpayOrder({
      amountPaise: advanceAmount,
      currency: 'INR',
      receipt,
      notes: { quoteId: quote.id, userId },
    });
    if (!rp.ok) return res.status(500).json({ error: 'Razorpay order create failed', details: rp.data });

    const booking = await db.booking.create({
      data: {
        userId,
        quoteId: quote.id,
        advancePct: pct,
        advanceAmount,
        advancePaid: false,
        razorpayOrderId: String(rp.data.id),
      },
    });

    return res.json({
      bookingId: booking.id,
      status: booking.status,
      advancePaid: booking.advancePaid,
      razorpayOrderId: booking.razorpayOrderId,
      amountPaise: booking.advanceAmount,
      currency: 'INR',
      advancePct: booking.advancePct,
    });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e?.message ?? e) });
  }
});

app.get('/api/bookings/:id', authMiddleware, async (req, res) => {
  try {
    const db = requireDb(res);
    if (!db) return;

    const id = String(req.params.id ?? '').trim();
    if (!id) return res.status(400).json({ error: 'Missing booking id' });

    const booking = await db.booking.findUnique({
      where: { id },
      include: { quote: { include: { package: true } } },
    });
    if (!booking) return res.status(404).json({ error: 'Not found' });

    const userId = String(req.user?.sub ?? '').trim();
    if (booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' });

    return res.json({
      id: booking.id,
      status: booking.status,
      advancePaid: booking.advancePaid,
      advanceAmount: booking.advanceAmount,
      advancePct: booking.advancePct,
      razorpayOrderId: booking.razorpayOrderId,
      quote: {
        id: booking.quote.id,
        pax: booking.quote.pax,
        city: booking.quote.city,
        eventDate: booking.quote.eventDate,
        distanceKm: booking.quote.distanceKm,
        subtotal: booking.quote.subtotal,
        gst: booking.quote.gst,
        total: booking.quote.total,
        breakdown: booking.quote.breakdown,
        package: {
          id: booking.quote.package.id,
          title: booking.quote.package.title,
          cuisine: booking.quote.package.cuisine,
          isVeg: booking.quote.package.isVeg,
        },
      },
    });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
});

app.post('/api/payments/razorpay/webhook', async (req, res) => {
  try {
    const db = requireDb(res);
    if (!db) return;

    if (!RAZORPAY_WEBHOOK_SECRET) {
      return res.status(500).json({ error: 'RAZORPAY_WEBHOOK_SECRET not configured' });
    }

    const sig = String(req.headers['x-razorpay-signature'] ?? '');
    const raw = typeof req.rawBody === 'string' ? req.rawBody : JSON.stringify(req.body ?? {});
    const expected = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET).update(raw).digest('hex');
    if (!sig || sig !== expected) return res.status(400).json({ error: 'Invalid webhook signature' });

    const event = String(req.body?.event ?? '');
    const orderId = String(req.body?.payload?.payment?.entity?.order_id ?? '');
    const paymentId = String(req.body?.payload?.payment?.entity?.id ?? '');

    if (!orderId) return res.json({ ok: true });
    if (event === 'payment.captured' || event === 'payment.authorized') {
      await db.booking.updateMany({
        where: { razorpayOrderId: orderId },
        data: { advancePaid: true, razorpayPaymentId: paymentId, status: 'CONFIRMED' },
      });
    }

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
});

app.post('/api/razorpay/orders', async (req, res) => {
  try {
    if (!hasRazorpayConfig) {
      return res.status(500).json({
        error: 'Razorpay is not configured on this server.',
        details: 'Missing env vars: RAZORPAY_KEY_ID and/or RAZORPAY_KEY_SECRET',
      });
    }

    const currency = String(req.body?.currency ?? 'INR');
    const receipt = String(req.body?.receipt ?? `bb_${Date.now()}`);
    const notes = req.body?.notes ?? {};

    const items = req.body?.items ?? null;
    const totalPaiseFromItems = calculateTotalPaiseFromItems(items);

    const amountRupeesFallback = Number(req.body?.amount);
    const amountPaiseFallback = Number.isFinite(amountRupeesFallback) && amountRupeesFallback > 0
      ? Math.round(amountRupeesFallback * 100)
      : null;

    const amount = totalPaiseFromItems ?? amountPaiseFallback;

    if (!amount || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount. Provide items[] with price/quantity or amount (rupees).' });
    }

    const basicAuth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt,
        notes: { ...notes, env: 'test' },
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(500).json({ error: 'Razorpay order create failed', details: data });
    }

    orderStore.set(data.id, {
      orderId: data.id,
      status: 'PENDING',
      amount: data.amount,
      currency: data.currency,
      receipt: data.receipt,
      items: Array.isArray(items) ? items : null,
      createdAt: nowTs(),
      updatedAt: nowTs(),
    });

    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
});

app.post('/api/razorpay/verify', (req, res) => {
  try {
    if (!hasRazorpayConfig) {
      return res.status(500).json({
        error: 'Razorpay is not configured on this server.',
        details: 'Missing env vars: RAZORPAY_KEY_ID and/or RAZORPAY_KEY_SECRET',
      });
    }

    const razorpay_order_id = String(req.body?.razorpay_order_id ?? '');
    const razorpay_payment_id = String(req.body?.razorpay_payment_id ?? '');
    const razorpay_signature = String(req.body?.razorpay_signature ?? '');

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing fields: razorpay_order_id, razorpay_payment_id, razorpay_signature' });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(payload)
      .digest('hex');

    const ok = expected === razorpay_signature;
    const existing = orderStore.get(razorpay_order_id) ?? {
      orderId: razorpay_order_id,
      status: 'PENDING',
      amount: null,
      currency: 'INR',
      receipt: null,
      items: null,
      createdAt: nowTs(),
      updatedAt: nowTs(),
    };

    const status = ok ? 'PAID' : 'FAILED';

    orderStore.set(razorpay_order_id, {
      ...existing,
      status,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      updatedAt: nowTs(),
    });

    if (ok && prisma) {
      prisma.booking
        .updateMany({
          where: { razorpayOrderId: razorpay_order_id },
          data: { advancePaid: true, razorpayPaymentId: razorpay_payment_id, status: 'CONFIRMED' },
        })
        .catch(() => {});

      prisma.bowlOrder
        .updateMany({
          where: { razorpayOrderId: razorpay_order_id },
          data: { razorpayPaymentId: razorpay_payment_id, status: 'CONFIRMED' },
        })
        .catch(() => {});
    }

    return res.json({ ok, status });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
});

app.post('/api/orders/:orderId/fail', (req, res) => {
  const orderId = String(req.params.orderId ?? '');
  if (!orderId) return res.status(400).json({ error: 'Missing orderId' });

  const existing = orderStore.get(orderId);
  if (!existing) {
    orderStore.set(orderId, {
      orderId,
      status: 'FAILED',
      amount: null,
      currency: 'INR',
      receipt: null,
      items: null,
      createdAt: nowTs(),
      updatedAt: nowTs(),
    });
  } else {
    orderStore.set(orderId, { ...existing, status: 'FAILED', updatedAt: nowTs() });
  }

  return res.json({ ok: true, status: 'FAILED' });
});

app.get('/api/orders/:orderId', (req, res) => {
  const orderId = String(req.params.orderId ?? '');
  const existing = orderStore.get(orderId);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  return res.json(existing);
});

const server = app.listen(PORT, () => {
  console.log(`Razorpay test server listening on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err && typeof err === 'object' && 'code' in err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Either stop the other process or change PORT in server/.env (e.g. PORT=4001).`);
    process.exit(1);
  }
  throw err;
});
