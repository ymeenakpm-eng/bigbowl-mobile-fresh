import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { Alert, FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CateringCourse, CateringItem, cateringItems, CateringMealType } from '../src/data/cateringMenu';
import { mapItemToImage } from '../src/utils/mapItemToImage';
import { setStoredItem } from '../src/utils/storage';

interface StepState {
  dateOption?: 'date' | 'this_week' | 'this_month' | 'exploring';
  occasion?: string;
  guestsRange?: '10-40' | '41-150' | '151-400' | '400+';
  mealType?: CateringMealType;
}

const dateOptions: { key: StepState['dateOption']; label: string }[] = [
  { key: 'date', label: 'Choose a date' },
  { key: 'this_week', label: 'This week' },
  { key: 'this_month', label: 'This month' },
  { key: 'exploring', label: "I\'m just exploring" },
];

const occasionOptions = [
  'Wedding Ceremonies',
  'Party & Celebrations',
  'Formal & Corporate Events',
  'Pooja & Traditional Festivals',
  'Others',
];

const guestOptions: { key: StepState['guestsRange']; label: string; helper: string }[] = [
  { key: '10-40', label: '10-40 Guests', helper: 'Just close ones' },
  { key: '41-150', label: '41-150 Guests', helper: 'Medium crowd' },
  { key: '151-400', label: '151-400 Guests', helper: 'Large crowd' },
  { key: '400+', label: '400+ Guests', helper: "It's a huge gathering" },
];

const mealOptions: { key: CateringMealType; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snacks', label: 'Snacks' },
];

const BREAKFAST_ACCOMPANIMENTS = [
  'Tomato Chutney',
  'Peanut Chutney',
  'Pickle',
  'Sambar',
  'Allam Chutney',
  'Extra accompaniments - Chicken curry',
];

type PlannerCategoryKey = CateringCourse | 'dessert';

const BASE_PLATE_RUPEES_LUNCH = 249;
const BASE_PLATE_RUPEES_BREAKFAST = 149;
const BASE_PLATE_RUPEES_SNACKS = 129;

const INCLUDED_BASE_BY_CATEGORY_LUNCH: Partial<Record<PlannerCategoryKey, number>> = {
  starter: 1,
  curry: 1,
  bread: 1,
  dessert: 1,
};

const EXTRA_RUPEES_BY_CATEGORY_LUNCH: Partial<Record<PlannerCategoryKey, number>> = {
  starter: 25,
  curry: 30,
  rice: 20,
  biryani_pulav: 40,
  bread: 10,
  dessert: 15,
};

const INCLUDED_BASE_BY_CATEGORY_BREAKFAST: Partial<Record<PlannerCategoryKey, number>> = {
  main_breakfast: 2,
  accompaniments: 4,
  beverages: 2,
  sweets_fruits: 2,
};

const INCLUDED_BASE_BY_CATEGORY_SNACKS: Partial<Record<PlannerCategoryKey, number>> = {
  snacks: 1,
  chutneys_dips: 1,
  snacks_beverages: 1,
};

const EXTRA_RUPEES_BY_CATEGORY_BREAKFAST: Partial<Record<PlannerCategoryKey, number>> = {
  main_breakfast: 25,
  accompaniments: 10,
  beverages: 15,
  sweets_fruits: 20,
};

const EXTRA_RUPEES_BY_CATEGORY_SNACKS: Partial<Record<PlannerCategoryKey, number>> = {
  chutneys_dips: 20,
  snacks_beverages: 20,
};

const PLANNER_CATEGORIES_LUNCH: { key: PlannerCategoryKey; title: string; icon: string }[] = [
  { key: 'starter', title: 'Starters', icon: '🥗' },
  { key: 'curry', title: 'Main Course', icon: '🍛' },
  { key: 'rice', title: 'Rice', icon: '🍚' },
  { key: 'biryani_pulav', title: 'Biryani / Pulav', icon: '🍲' },
  { key: 'bread', title: 'Breads', icon: '🍞' },
  { key: 'dessert', title: 'Desserts', icon: '🍰' },
];

const PLANNER_CATEGORIES_BREAKFAST: { key: PlannerCategoryKey; title: string; icon: string }[] = [
  { key: 'main_breakfast', title: 'Main Breakfast', icon: '🍽️' },
  { key: 'accompaniments', title: 'Accompaniments', icon: '🥣' },
  { key: 'beverages', title: 'Beverages', icon: '🥤' },
  { key: 'sweets_fruits', title: 'Sweets / Fruits', icon: '🍉' },
];

const PLANNER_CATEGORIES_SNACKS: { key: PlannerCategoryKey; title: string; icon: string }[] = [
  { key: 'snacks', title: 'Snacks', icon: '🥟' },
  { key: 'chutneys_dips', title: 'Chutneys / Dips', icon: '🥣' },
  { key: 'snacks_beverages', title: 'Beverages', icon: '☕' },
];

const RECOMMENDED_LABEL_BY_CATEGORY_LUNCH: Partial<Record<PlannerCategoryKey, string>> = {
  starter: 'Recommended: 3–5 items',
  curry: 'Recommended: 4–6 items',
  rice: 'Recommended: 1–2 items',
  biryani_pulav: 'Recommended: 1–2 items',
  bread: 'Recommended: 2–3 items',
  dessert: 'Recommended: 1–2 items',
};

const RECOMMENDED_LABEL_BY_CATEGORY_BREAKFAST: Partial<Record<PlannerCategoryKey, string>> = {
  main_breakfast: 'Recommended: 2–3 items',
  accompaniments: 'Recommended: 3–5 items',
  beverages: 'Recommended: 1–2 items',
  sweets_fruits: 'Recommended: 1–2 items',
};

const RECOMMENDED_LABEL_BY_CATEGORY_SNACKS: Partial<Record<PlannerCategoryKey, string>> = {
  snacks: 'Recommended: 2–4 items',
  chutneys_dips: 'Recommended: 1–2 items',
  snacks_beverages: 'Recommended: 1–2 items',
};

const RECOMMENDED_MAX_BY_CATEGORY_LUNCH: Partial<Record<PlannerCategoryKey, number>> = {
  starter: 5,
  curry: 6,
  rice: 2,
  biryani_pulav: 2,
  bread: 3,
  dessert: 2,
};

const RECOMMENDED_MAX_BY_CATEGORY_BREAKFAST: Partial<Record<PlannerCategoryKey, number>> = {
  main_breakfast: 4,
  accompaniments: 6,
  beverages: 4,
  sweets_fruits: 4,
};

const RECOMMENDED_MAX_BY_CATEGORY_SNACKS: Partial<Record<PlannerCategoryKey, number>> = {
  snacks: 6,
  chutneys_dips: 4,
  snacks_beverages: 4,
};

type SelectedCateringItem = {
  item: CateringItem;
  count: number;
  accompaniments?: string[];
  addedAt?: number;
};

const SectionHeader = ({ title }: { title: string }) => (
  <Text
    style={{
      fontSize: 18,
      fontWeight: '700',
      marginTop: 16,
      marginBottom: 8,
      color: '#111827',
    }}
  >
    {title}
  </Text>
);

const Chip = ({
  label,
  selected,
  helper,
  onPress,
}: {
  label: string;
  selected: boolean;
  helper?: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    style={{
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: selected ? 2 : 1,
      borderColor: selected ? '#4C1D95' : '#E5E7EB',
      backgroundColor: selected ? '#F4F1FA' : '#F6F3FB',
      marginBottom: 10,
    }}
  >
    <Text
      style={{
        fontSize: 15,
        fontWeight: selected ? '700' : '500',
        color: '#111827',
      }}
    >
      {label}
    </Text>
    {helper ? (
      <Text
        style={{
          fontSize: 12,
          color: '#6B7280',
          marginTop: 2,
        }}
      >
        {helper}
      </Text>
    ) : null}
  </TouchableOpacity>
);

export default function CateringScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ preset?: string }>();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<number>(0);
  const [state, setState] = useState<StepState>({});
  const [specificDate, setSpecificDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedItemsById, setSelectedItemsById] = useState<Record<string, SelectedCateringItem>>({});
  const [accompanimentsItem, setAccompanimentsItem] = useState<CateringItem | null>(null);
  const [tempAccompaniments, setTempAccompaniments] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<PlannerCategoryKey>('starter');
  const [activeVegFilter, setActiveVegFilter] = useState<'veg' | 'non-veg'>('veg');
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [pendingExtraItem, setPendingExtraItem] = useState<CateringItem | null>(null);
  const [imagePreviewItem, setImagePreviewItem] = useState<{ source: any; name: string; vegType: 'veg' | 'non-veg' } | null>(null);
  const categoriesScrollRef = useRef<any>(null);
  const [categoriesScrollX, setCategoriesScrollX] = useState(0);
  const [categoriesContentW, setCategoriesContentW] = useState(0);
  const [categoriesLayoutW, setCategoriesLayoutW] = useState(0);
  const [overRecommendedOpen, setOverRecommendedOpen] = useState(false);
  const [overRecommendedCategory, setOverRecommendedCategory] = useState<PlannerCategoryKey | null>(null);
  const [pricingInfoOpen, setPricingInfoOpen] = useState(false);
  const [extraChargesOpen, setExtraChargesOpen] = useState(false);
  const [extraChargesShownOnce, setExtraChargesShownOnce] = useState(false);

  React.useEffect(() => {
    const raw = String(params.preset ?? '').trim();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;

      const nextStep = Number((parsed as any)?.step);
      const nextState = (parsed as any)?.state;
      const nextSpecificDate = String((parsed as any)?.specificDateISO ?? '').trim();
      const selected = (parsed as any)?.selected;

      if (Number.isFinite(nextStep) && nextStep >= 0 && nextStep <= 4) setStep(nextStep);
      if (nextState && typeof nextState === 'object') setState(nextState as StepState);
      if (nextSpecificDate) {
        const d = new Date(nextSpecificDate);
        if (!Number.isNaN(d.getTime())) setSpecificDate(d);
      }

      if (selected && typeof selected === 'object') {
        const next: Record<string, SelectedCateringItem> = {};
        for (const [id, v] of Object.entries(selected)) {
          const it = cateringItems.find((x) => x.id === id);
          if (!it) continue;
          const count = Math.max(0, Math.round(Number((v as any)?.count ?? 0)));
          if (count <= 0) continue;
          const accompaniments = Array.isArray((v as any)?.accompaniments)
            ? ((v as any).accompaniments as any[]).map((x) => String(x)).filter(Boolean)
            : undefined;
          const addedAt = Number((v as any)?.addedAt ?? 0);
          next[id] = { item: it, count, accompaniments, addedAt: Number.isFinite(addedAt) ? addedAt : 0 };
        }
        setSelectedItemsById(next);
      }
    } catch {
      // ignore
    }
  }, [params.preset]);

  const effectiveMealType: CateringMealType | undefined = useMemo(() => {
    if (state.mealType === 'dinner') return 'lunch'; // lunch/dinner share same menu
    const mt = String(state.mealType ?? '').trim().toLowerCase();
    if (mt === 'snacks_veg' || mt === 'snacks_nonveg') return 'snacks';
    return state.mealType as CateringMealType | undefined;
  }, [state.mealType]);

  const plannerCategories = useMemo(() => {
    if (effectiveMealType === 'breakfast') return PLANNER_CATEGORIES_BREAKFAST;
    if (effectiveMealType === 'snacks') return PLANNER_CATEGORIES_SNACKS;
    return PLANNER_CATEGORIES_LUNCH;
  }, [effectiveMealType]);

  const basePlateRupees = useMemo(() => {
    if (effectiveMealType === 'breakfast') return BASE_PLATE_RUPEES_BREAKFAST;
    if (effectiveMealType === 'snacks') return BASE_PLATE_RUPEES_SNACKS;
    return BASE_PLATE_RUPEES_LUNCH;
  }, [effectiveMealType]);

  const includedBaseByCategory = useMemo(() => {
    if (effectiveMealType === 'breakfast') return INCLUDED_BASE_BY_CATEGORY_BREAKFAST;
    if (effectiveMealType === 'snacks') return INCLUDED_BASE_BY_CATEGORY_SNACKS;
    return INCLUDED_BASE_BY_CATEGORY_LUNCH;
  }, [effectiveMealType]);

  const extraRupeesByCategory = useMemo(() => {
    if (effectiveMealType === 'breakfast') return EXTRA_RUPEES_BY_CATEGORY_BREAKFAST;
    if (effectiveMealType === 'snacks') return EXTRA_RUPEES_BY_CATEGORY_SNACKS;
    return EXTRA_RUPEES_BY_CATEGORY_LUNCH;
  }, [effectiveMealType]);

  const recommendedLabelByCategory = useMemo(() => {
    if (effectiveMealType === 'breakfast') return RECOMMENDED_LABEL_BY_CATEGORY_BREAKFAST;
    if (effectiveMealType === 'snacks') return RECOMMENDED_LABEL_BY_CATEGORY_SNACKS;
    return RECOMMENDED_LABEL_BY_CATEGORY_LUNCH;
  }, [effectiveMealType]);

  const recommendedMaxByCategory = useMemo(() => {
    if (effectiveMealType === 'breakfast') return RECOMMENDED_MAX_BY_CATEGORY_BREAKFAST;
    if (effectiveMealType === 'snacks') return RECOMMENDED_MAX_BY_CATEGORY_SNACKS;
    return RECOMMENDED_MAX_BY_CATEGORY_LUNCH;
  }, [effectiveMealType]);

  const itemsForMeal = useMemo(() => {
    if (!effectiveMealType) return [] as CateringItem[];
    return cateringItems.filter((item) => item.mealType === effectiveMealType);
  }, [effectiveMealType]);

  const activeCategoryItems = useMemo(() => {
    if (activeCategory === 'dessert') return [] as CateringItem[];
    return itemsForMeal.filter((x) => x.course === activeCategory);
  }, [activeCategory, itemsForMeal]);

  const visibleActiveCategoryItems = useMemo(() => {
    if (effectiveMealType === 'snacks' && activeCategory === 'snacks') {
      return activeCategoryItems.filter((x) => x.vegType === activeVegFilter);
    }
    if (effectiveMealType === 'snacks') return activeCategoryItems;
    return activeCategoryItems.filter((x) => x.vegType === activeVegFilter);
  }, [activeCategory, activeCategoryItems, activeVegFilter, effectiveMealType]);

  const totalSelectedCount = useMemo(() => {
    return Object.values(selectedItemsById).reduce((acc, x) => acc + Math.max(0, Number(x?.count ?? 0)), 0);
  }, [selectedItemsById]);

  const showCategoriesArrow = useMemo(() => {
    if (categoriesContentW <= 0 || categoriesLayoutW <= 0) return false;
    const maxX = Math.max(0, categoriesContentW - categoriesLayoutW);
    return maxX > 6 && categoriesScrollX < maxX - 6;
  }, [categoriesContentW, categoriesLayoutW, categoriesScrollX]);

  const selectedByCategory = useMemo(() => {
    const out: Record<string, { total: number; items: { name: string; count: number }[] }> = {};
    for (const c of plannerCategories) out[c.key] = { total: 0, items: [] };

    const tmp: Record<string, Record<string, number>> = {};
    for (const c of plannerCategories) tmp[c.key] = {};

    for (const v of Object.values(selectedItemsById)) {
      const it = v?.item;
      if (!it) continue;
      const ckey = (it.course ?? '') as PlannerCategoryKey;
      const count = Math.max(0, Math.round(Number(v?.count ?? 0)));
      if (count <= 0) continue;
      out[ckey] = out[ckey] ?? { total: 0, items: [] };
      tmp[ckey] = tmp[ckey] ?? {};
      out[ckey].total += count;
      tmp[ckey][it.name] = (tmp[ckey][it.name] ?? 0) + count;
    }

    for (const c of Object.keys(tmp)) {
      const pairs = Object.entries(tmp[c] ?? {}).map(([name, count]) => ({ name, count }));
      pairs.sort((a, b) => a.name.localeCompare(b.name));
      out[c] = out[c] ?? { total: 0, items: [] };
      out[c].items = pairs;
      out[c].total = pairs.length;
    }
    return out;
  }, [plannerCategories, selectedItemsById]);

  const extraPricing = useMemo(() => {
    const selected = Object.values(selectedItemsById)
      .filter((v) => v?.item && Math.max(0, Math.round(Number(v?.count ?? 0))) > 0)
      .map((v) => ({
        id: v.item.id,
        course: (v.item.course ?? '') as PlannerCategoryKey,
        vegType: v.item.vegType,
        addedAt: Number((v as any)?.addedAt ?? 0),
      }));

    const counts: Partial<Record<PlannerCategoryKey, number>> = {};
    for (const s of selected) counts[s.course] = (counts[s.course] ?? 0) + 1;

    const sortByAdded = (a: { id: string; addedAt: number }, b: { id: string; addedAt: number }) => {
      const da = Number.isFinite(a.addedAt) ? a.addedAt : 0;
      const db = Number.isFinite(b.addedAt) ? b.addedAt : 0;
      if (da !== db) return da - db;
      return String(a.id).localeCompare(String(b.id));
    };

    const extraIds = new Set<string>();
    let extraPerPlateRupees = 0;

    let riceOrBiryaniCount = 0;

    if (effectiveMealType === 'breakfast') {
      const cats: PlannerCategoryKey[] = ['main_breakfast', 'accompaniments', 'beverages', 'sweets_fruits'];
      for (const cat of cats) {
        const list = selected.filter((x) => x.course === cat);
        const included = Math.max(0, Math.round(Number(includedBaseByCategory[cat] ?? 0)));
        if (list.length <= included) continue;
        const price = Math.max(0, Math.round(Number(extraRupeesByCategory[cat] ?? 0)));
        if (price <= 0) continue;
        list.sort(sortByAdded);
        for (let i = included; i < list.length; i++) {
          extraIds.add(list[i].id);
          extraPerPlateRupees += price;
        }
      }
    } else if (effectiveMealType === 'snacks') {
      const snackList = selected.filter((x) => x.course === 'snacks');
      const includedSnacks = Math.max(0, Math.round(Number(includedBaseByCategory.snacks ?? 0)));
      if (snackList.length > includedSnacks) {
        snackList.sort(sortByAdded);
        for (let i = includedSnacks; i < snackList.length; i++) {
          const rupees = snackList[i].vegType === 'veg' ? 30 : 50;
          extraIds.add(snackList[i].id);
          extraPerPlateRupees += rupees;
        }
      }

      const dipList = selected.filter((x) => x.course === 'chutneys_dips');
      const includedDips = Math.max(0, Math.round(Number(includedBaseByCategory.chutneys_dips ?? 0)));
      const dipPrice = Math.max(0, Math.round(Number(extraRupeesByCategory.chutneys_dips ?? 0)));
      if (dipPrice > 0 && dipList.length > includedDips) {
        dipList.sort(sortByAdded);
        for (let i = includedDips; i < dipList.length; i++) {
          extraIds.add(dipList[i].id);
          extraPerPlateRupees += dipPrice;
        }
      }

      const bevList = selected.filter((x) => x.course === 'snacks_beverages');
      const includedBev = Math.max(0, Math.round(Number(includedBaseByCategory.snacks_beverages ?? 0)));
      const bevPrice = Math.max(0, Math.round(Number(extraRupeesByCategory.snacks_beverages ?? 0)));
      if (bevPrice > 0 && bevList.length > includedBev) {
        bevList.sort(sortByAdded);
        for (let i = includedBev; i < bevList.length; i++) {
          extraIds.add(bevList[i].id);
          extraPerPlateRupees += bevPrice;
        }
      }
    } else {
      const allowance1Cats: PlannerCategoryKey[] = ['starter', 'curry', 'bread', 'dessert'];
      for (const cat of allowance1Cats) {
        const list = selected.filter((x) => x.course === cat);
        if (list.length <= 1) continue;
        const price = Math.max(0, Math.round(Number(extraRupeesByCategory[cat] ?? 0)));
        if (price <= 0) continue;
        list.sort(sortByAdded);
        for (let i = 1; i < list.length; i++) {
          extraIds.add(list[i].id);
          extraPerPlateRupees += price;
        }
      }

      const riceOrBiryani = selected.filter((x) => x.course === 'rice' || x.course === 'biryani_pulav');
      riceOrBiryaniCount = riceOrBiryani.length;
      if (riceOrBiryani.length > 1) {
        riceOrBiryani.sort(sortByAdded);
        for (let i = 1; i < riceOrBiryani.length; i++) {
          const course = riceOrBiryani[i].course;
          const price = Math.max(0, Math.round(Number(extraRupeesByCategory[course] ?? 0)));
          if (price <= 0) continue;
          extraIds.add(riceOrBiryani[i].id);
          extraPerPlateRupees += price;
        }
      }
    }

    return {
      counts,
      riceOrBiryaniCount,
      extraIds,
      extraPerPlateRupees,
    };
  }, [effectiveMealType, extraRupeesByCategory, includedBaseByCategory, selectedItemsById]);

  const displayedPlateRupees = useMemo(() => {
    const extra = Math.max(0, Math.round(Number(extraPricing.extraPerPlateRupees ?? 0)));
    return basePlateRupees + extra;
  }, [basePlateRupees, extraPricing.extraPerPlateRupees]);

  const snacksBaseCounts = useMemo(() => {
    if (effectiveMealType !== 'snacks') {
      return { snacks: 0, chutneys_dips: 0, snacks_beverages: 0 };
    }

    const out = { snacks: 0, chutneys_dips: 0, snacks_beverages: 0 };
    for (const v of Object.values(selectedItemsById)) {
      const it = v?.item;
      if (!it) continue;
      const count = Math.max(0, Math.round(Number(v?.count ?? 0)));
      if (count <= 0) continue;

      const course = String((it as any)?.course ?? '');
      if (
        course === 'snacks' ||
        course === 'fried_snacks' ||
        course === 'steamed_baked' ||
        course === 'nonveg_snacks' ||
        course === 'veg_snacks'
      ) {
        out.snacks += 1;
      }
      if (course === 'chutneys_dips' || course === 'chutneys' || course === 'dips') {
        out.chutneys_dips += 1;
      }
      if (course === 'snacks_beverages') {
        out.snacks_beverages += 1;
      }
    }
    return out;
  }, [effectiveMealType, selectedItemsById]);

  const baseIncludedReached = useMemo(() => {
    if (effectiveMealType === 'breakfast') {
      const mainCnt = Math.max(0, Math.round(Number((selectedByCategory as any)?.main_breakfast?.total ?? 0)));
      const accCnt = Math.max(0, Math.round(Number((selectedByCategory as any)?.accompaniments?.total ?? 0)));
      const bevCnt = Math.max(0, Math.round(Number((selectedByCategory as any)?.beverages?.total ?? 0)));
      const sweetCnt = Math.max(0, Math.round(Number((selectedByCategory as any)?.sweets_fruits?.total ?? 0)));
      return mainCnt >= 1 && accCnt >= 1 && bevCnt >= 1 && sweetCnt >= 1;
    }

    if (effectiveMealType === 'snacks') {
      return snacksBaseCounts.snacks >= 1 && snacksBaseCounts.chutneys_dips >= 1 && snacksBaseCounts.snacks_beverages >= 1;
    }

    const starterCnt = Math.max(0, Math.round(Number((selectedByCategory as any)?.starter?.total ?? 0)));
    const curryCnt = Math.max(0, Math.round(Number((selectedByCategory as any)?.curry?.total ?? 0)));
    const breadCnt = Math.max(0, Math.round(Number((selectedByCategory as any)?.bread?.total ?? 0)));
    const riceCnt = Math.max(0, Math.round(Number((selectedByCategory as any)?.rice?.total ?? 0)));
    const biryaniCnt = Math.max(0, Math.round(Number((selectedByCategory as any)?.biryani_pulav?.total ?? 0)));

    const hasStarter = starterCnt >= 1;
    const hasMain = curryCnt >= 1;
    const hasBread = breadCnt >= 1;
    const hasRiceOrBiryani = riceCnt + biryaniCnt >= 1;

    return hasStarter && hasMain && hasBread && hasRiceOrBiryani;
  }, [effectiveMealType, selectedByCategory, snacksBaseCounts]);

  React.useEffect(() => {
    if (effectiveMealType === 'breakfast') {
      setActiveCategory('main_breakfast');
      return;
    }
    if (effectiveMealType === 'snacks') {
      setActiveCategory('snacks');
      return;
    }
    setActiveCategory('starter');
  }, [effectiveMealType]);

  React.useEffect(() => {
    if (step !== 4) return;
    if (!baseIncludedReached) return;
    if (extraChargesShownOnce) return;
    setExtraChargesShownOnce(true);
    setExtraChargesOpen(true);
  }, [baseIncludedReached, extraChargesShownOnce, step]);

  React.useEffect(() => {
    setActiveVegFilter('veg');
  }, [activeCategory]);

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'set' && date) {
      setSpecificDate(date);
      setState((s) => ({ ...s, dateOption: 'date' }));
    }
    setShowDatePicker(false);
  };

  const toggleTempAccompaniment = (name: string) => {
    setTempAccompaniments((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const handleAddItem = (item: CateringItem) => {
    if (effectiveMealType === 'breakfast' && item.course === 'main_breakfast') {
      setAccompanimentsItem(item);
      setTempAccompaniments([]);
      return;
    }

    setSelectedItemsById((prev) => {
      const cur = prev[item.id];
      if (cur?.count && cur.count > 0) return prev;

      const ckey = (item.course ?? '') as PlannerCategoryKey;

      if (effectiveMealType === 'breakfast') {
        const included = Math.max(0, Math.round(Number(includedBaseByCategory[ckey] ?? 0)));
        const currentUniqueInThisCategory = Object.values(prev).filter((x) => x.item.course === ckey && x.count > 0).length;
        if (included > 0 && currentUniqueInThisCategory >= included) {
          setPendingExtraItem(item);
          setExtraChargesOpen(true);
          return prev;
        }

        const next = { ...prev, [item.id]: { item, count: 1, accompaniments: cur?.accompaniments, addedAt: Date.now() } };
        const max = recommendedMaxByCategory[ckey];
        if (max != null) {
          const uniqueCount = Object.values(next).filter((x) => x.item.course === ckey && x.count > 0).length;
          if (uniqueCount > max) {
            setOverRecommendedCategory(ckey);
            setOverRecommendedOpen(true);
          }
        }

        return next;
      }

      if (effectiveMealType === 'snacks') {
        const included = Math.max(0, Math.round(Number(includedBaseByCategory[ckey] ?? 0)));
        const currentUniqueInThisCategory = Object.values(prev).filter((x) => x.item.course === ckey && x.count > 0).length;
        if (included > 0 && currentUniqueInThisCategory >= included) {
          setPendingExtraItem(item);
          setExtraChargesOpen(true);
          return prev;
        }

        const next = { ...prev, [item.id]: { item, count: 1, accompaniments: cur?.accompaniments, addedAt: Date.now() } };
        const max = recommendedMaxByCategory[ckey];
        if (max != null) {
          const uniqueCount = Object.values(next).filter((x) => x.item.course === ckey && x.count > 0).length;
          if (uniqueCount > max) {
            setOverRecommendedCategory(ckey);
            setOverRecommendedOpen(true);
          }
        }

        return next;
      }

      const includedStarter = Math.max(0, Math.round(Number(includedBaseByCategory.starter ?? 0)));
      const includedCurry = Math.max(0, Math.round(Number(includedBaseByCategory.curry ?? 0)));
      const includedBread = Math.max(0, Math.round(Number(includedBaseByCategory.bread ?? 0)));
      const includedDessert = Math.max(0, Math.round(Number(includedBaseByCategory.dessert ?? 0)));
      const includedRiceOrBiryani = 1;

      const selectedInCategory = (cat: PlannerCategoryKey) =>
        Object.values(prev).filter((x) => x.item.course === cat && x.count > 0).length;

      const currentUniqueInThisCategory = selectedInCategory(ckey);
      const currentRiceOrBiryani =
        selectedInCategory('rice') + selectedInCategory('biryani_pulav');

      const exceedsIncluded =
        (ckey === 'starter' && includedStarter > 0 && currentUniqueInThisCategory >= includedStarter) ||
        (ckey === 'curry' && includedCurry > 0 && currentUniqueInThisCategory >= includedCurry) ||
        (ckey === 'bread' && includedBread > 0 && currentUniqueInThisCategory >= includedBread) ||
        (ckey === 'dessert' && includedDessert > 0 && currentUniqueInThisCategory >= includedDessert) ||
        ((ckey === 'rice' || ckey === 'biryani_pulav') && currentRiceOrBiryani >= includedRiceOrBiryani);

      if (exceedsIncluded) {
        setPendingExtraItem(item);
        setExtraChargesOpen(true);
        return prev;
      }

      const next = { ...prev, [item.id]: { item, count: 1, accompaniments: cur?.accompaniments, addedAt: Date.now() } };
      const max = recommendedMaxByCategory[ckey];
      if (max != null) {
        const uniqueCount = Object.values(next).filter((x) => x.item.course === ckey && x.count > 0).length;
        if (uniqueCount > max) {
          setOverRecommendedCategory(ckey);
          setOverRecommendedOpen(true);
        }
      }

      return next;
    });
  };

  const handleRemoveItem = (item: CateringItem) => {
    setSelectedItemsById((prev) => {
      if (!prev[item.id]) return prev;
      const copy = { ...prev };
      delete copy[item.id];
      return copy;
    });
  };

  const handleConfirmAccompaniments = () => {
    if (!accompanimentsItem) return;

    const item = accompanimentsItem;
    const acc = tempAccompaniments;
    setSelectedItemsById((prev) => {
      const cur = prev[item.id];
      if (cur?.count && cur.count > 0) return prev;

      const ckey = (item.course ?? '') as PlannerCategoryKey;
      const included = Math.max(0, Math.round(Number(includedBaseByCategory[ckey] ?? 0)));
      const currentUniqueInThisCategory = Object.values(prev).filter((x) => x.item.course === ckey && x.count > 0).length;
      if (included > 0 && currentUniqueInThisCategory >= included) {
        setPendingExtraItem(item);
        setExtraChargesOpen(true);
        return prev;
      }

      const next = { ...prev, [item.id]: { item, count: 1, accompaniments: acc, addedAt: Date.now() } };
      const max = recommendedMaxByCategory[ckey];
      if (max != null) {
        const uniqueCount = Object.values(next).filter((x) => x.item.course === ckey && x.count > 0).length;
        if (uniqueCount > max) {
          setOverRecommendedCategory(ckey);
          setOverRecommendedOpen(true);
        }
      }

      return next;
    });
    setAccompanimentsItem(null);
    setTempAccompaniments([]);
  };

  const handleCancelAccompaniments = () => {
    setAccompanimentsItem(null);
    setTempAccompaniments([]);
  };

  const renderStep = () => {
    if (step === 0) {
      return (
        <View>
          <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 4 }}>
            When are you planning?
          </Text>
          <Text style={{ color: '#6B7280', marginBottom: 16 }}>Select event date</Text>

          {dateOptions.map((opt) => {
            if (opt.key === 'date') {
              const selected = state.dateOption === 'date';
              const dateLabel =
                specificDate != null
                  ? specificDate.toLocaleDateString()
                  : opt.label;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.9}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? '#4C1D95' : '#E5E7EB',
                    backgroundColor: selected ? '#F4F1FA' : '#F6F3FB',
                    marginBottom: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: selected ? '700' : '500',
                      color: '#111827',
                    }}
                  >
                    {dateLabel}
                  </Text>
                </TouchableOpacity>
              );
            }

            const dateChosen = state.dateOption === 'date';
            const disabled = dateChosen;

            return (
              <Chip
                key={opt.key}
                label={opt.label}
                selected={state.dateOption === opt.key}
                onPress={
                  disabled
                    ? () => {}
                    : () => setState((s) => ({ ...s, dateOption: opt.key }))
                }
              />
            );
          })}

          {showDatePicker && (
            <DateTimePicker
              mode="date"
              value={specificDate ?? new Date()}
              onChange={handleDateChange}
            />
          )}
        </View>

      );
    }

    if (step === 1) {
      return (
        <View>
          <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 4 }}>
            What are you celebrating?
          </Text>
          <Text style={{ color: '#6B7280', marginBottom: 16 }}>Choose an occasion</Text>

          {occasionOptions.map((occ) => (
            <Chip
              key={occ}
              label={occ}
              selected={state.occasion === occ}
              onPress={() => setState((s) => ({ ...s, occasion: occ }))}
            />
          ))}
        </View>
      );
    }

    if (step === 2) {
      return (
        <View>
          <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 4 }}>
            How big is your gathering?
          </Text>
          <Text style={{ color: '#6B7280', marginBottom: 16 }}>Choose your guest count</Text>

          {guestOptions.map((opt) => (
            <Chip
              key={opt.key}
              label={opt.label}
              helper={opt.helper}
              selected={state.guestsRange === opt.key}
              onPress={() => setState((s) => ({ ...s, guestsRange: opt.key }))}
            />
          ))}
        </View>
      );
    }

    if (step === 3) {
      return (
        <View>
          <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 4 }}>
            What meal are you planning?
          </Text>
          <Text style={{ color: '#6B7280', marginBottom: 16 }}>Choose a meal type</Text>

          {mealOptions.map((opt) => (
            <Chip
              key={opt.key}
              label={opt.label}
              selected={state.mealType === opt.key}
              onPress={() => setState((s) => ({ ...s, mealType: opt.key }))}
            />
          ))}
        </View>
      );
    }

    // Step 4: show menu
    return (
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: effectiveMealType === 'snacks' ? 'center' : 'baseline',
            flexWrap: effectiveMealType === 'snacks' ? 'nowrap' : 'wrap',
            marginBottom: 12,
          }}
        >
          {state.mealType === 'snacks' ? (
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ fontSize: 16, fontWeight: '700', color: '#111827', flexShrink: 1 }}
            >
              {`Menu Builder (Snacks) – ₹${basePlateRupees}${Math.max(0, Math.round(Number(extraPricing.extraPerPlateRupees ?? 0))) > 0 ? ` + ₹${Math.max(0, Math.round(Number(extraPricing.extraPerPlateRupees ?? 0)))} extras` : ''} / plate`}
            </Text>
          ) : (
            <>
              <Text style={{ fontSize: effectiveMealType === 'snacks' ? 20 : 22, fontWeight: '700', color: '#111827' }}>Menu Builder</Text>
              {effectiveMealType ? (
                <Text style={{ fontSize: effectiveMealType === 'snacks' ? 12 : 14, color: '#6B7280', marginLeft: 8 }}>
                  {state.mealType === 'breakfast'
                    ? `(Breakfast) – ₹${basePlateRupees} / plate`
                    : effectiveMealType === 'snacks'
                      ? `(Snacks) – ₹${basePlateRupees} / plate`
                      : `(Lunch / Dinner) · ₹${basePlateRupees} / plate`}
                </Text>
              ) : null}
            </>
          )}

          {effectiveMealType ? (
            <TouchableOpacity activeOpacity={0.9} onPress={() => setPricingInfoOpen(true)}>
              <Text style={{ fontSize: 14, color: '#6B7280', marginLeft: 6 }}>ℹ️</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {baseIncludedReached ? (
          <Text style={{ color: '#6B7280', marginBottom: 10 }}>
            Base plate completed. You may add extra items if required.
          </Text>
        ) : null}

        <View
          style={{
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: '#FFF7ED',
            borderWidth: 1,
            borderColor: '#FED7AA',
            marginBottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text numberOfLines={1} style={{ flex: 1, paddingRight: 10, fontSize: 12, fontWeight: '900', color: '#7C2D12' }}>
            {totalSelectedCount > 0 ? `Selected: ${totalSelectedCount} item${totalSelectedCount === 1 ? '' : 's'}` : 'Selected: None'}
          </Text>
          <TouchableOpacity activeOpacity={0.9} onPress={() => setSummaryExpanded(true)}>
            <Text style={{ fontSize: 12, fontWeight: '900', color: '#7C2D12' }}>View</Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            marginTop: 4,
            marginBottom: 8,
            paddingVertical: 8,
            paddingHorizontal: 10,
            borderRadius: 16,
            backgroundColor: '#F6F3FB',
            borderWidth: 1,
            borderColor: '#E5E7EB',
            overflow: 'hidden',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ScrollView
              ref={categoriesScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 10 }}
              onScroll={(e) => setCategoriesScrollX(e.nativeEvent.contentOffset.x)}
              scrollEventThrottle={16}
              onContentSizeChange={(w) => setCategoriesContentW(w)}
              onLayout={(e) => setCategoriesLayoutW(e.nativeEvent.layout.width)}
              style={{ flex: 1 }}
            >
              <View style={{ flexDirection: 'row' }}>
                {plannerCategories.map((c) => {
                  const selected = c.key === activeCategory;
                  const cnt = Math.max(0, Math.round(Number((selectedByCategory as any)?.[c.key]?.total ?? 0)));
                  return (
                    <TouchableOpacity
                      key={c.key}
                      activeOpacity={0.9}
                      onPress={() => setActiveCategory(c.key)}
                      style={{
                        marginRight: 10,
                        borderRadius: 999,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderWidth: selected ? 2 : 1,
                        borderColor: selected ? '#4C1D95' : '#E5E7EB',
                        backgroundColor: selected ? '#F4F1FA' : '#FFFFFF',
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 14, marginRight: 6 }}>{c.icon}</Text>
                      <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '900', color: '#111827' }}>
                        {c.title} • {cnt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {showCategoriesArrow ? (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  const maxX = Math.max(0, categoriesContentW - categoriesLayoutW);
                  const nextX = Math.min(maxX, categoriesScrollX + Math.max(120, categoriesLayoutW * 0.7));
                  categoriesScrollRef.current?.scrollTo?.({ x: nextX, animated: true });
                }}
                style={{
                  marginLeft: 8,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>›</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <FlatList
          data={activeCategory === 'dessert' ? [] : visibleActiveCategoryItems}
          numColumns={3}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          extraData={selectedItemsById}
          contentContainerStyle={{ paddingBottom: 80 }}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          ListHeaderComponent={
            <View style={{ marginBottom: 10 }}>
              <Text numberOfLines={1} style={{ flex: 1, fontWeight: '800', fontSize: 12, color: '#111827' }}>
                {plannerCategories.find((x) => x.key === activeCategory)?.title ?? ''}
                {recommendedLabelByCategory[activeCategory]
                  ? ` (${String(recommendedLabelByCategory[activeCategory]).replace(/^recommended\s*:\s*/i, 'Recommended ').replace(/^recommended\s*/i, 'Recommended ')})`
                  : ''}
              </Text>

              {effectiveMealType !== 'snacks' || activeCategory === 'snacks' ? (
                <View style={{ flexDirection: 'row', marginTop: 10 }}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setActiveVegFilter('veg')}
                    style={{
                      flex: 1,
                      marginRight: 10,
                      borderRadius: 12,
                      paddingVertical: 10,
                      alignItems: 'center',
                      borderWidth: activeVegFilter === 'veg' ? 2 : 1,
                      borderColor: activeVegFilter === 'veg' ? '#4C1D95' : '#E5E7EB',
                      backgroundColor: activeVegFilter === 'veg' ? '#F4F1FA' : '#F6F3FB',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: activeVegFilter === 'veg' ? '700' : '500', color: '#111827' }}>Veg</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setActiveVegFilter('non-veg')}
                    style={{
                      flex: 1,
                      borderRadius: 12,
                      paddingVertical: 10,
                      alignItems: 'center',
                      borderWidth: activeVegFilter === 'non-veg' ? 2 : 1,
                      borderColor: activeVegFilter === 'non-veg' ? '#4C1D95' : '#E5E7EB',
                      backgroundColor: activeVegFilter === 'non-veg' ? '#F4F1FA' : '#F6F3FB',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: activeVegFilter === 'non-veg' ? '700' : '500', color: '#111827' }}>Non-veg</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <View
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                padding: 12,
                backgroundColor: '#F6F3FB',
              }}
            >
              <Text style={{ color: '#6B7280' }}>No items available.</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const count = Math.max(0, Math.round(Number(selectedItemsById[item.id]?.count ?? 0)));
            const added = count > 0;
            const course = (item.course ?? '') as PlannerCategoryKey;
            const extraPriceRupees =
              effectiveMealType === 'snacks' && course === 'snacks'
                ? item.vegType === 'veg'
                  ? 30
                  : 50
                : Math.max(0, Math.round(Number(extraRupeesByCategory[course] ?? 0)));
            const isCurrentlyExtra = added && extraPricing.extraIds.has(item.id);
            const wouldBeExtraIfAdded =
              !added &&
              (effectiveMealType !== 'breakfast' && (course === 'rice' || course === 'biryani_pulav')
                ? Math.max(0, Math.round(Number(extraPricing.riceOrBiryaniCount ?? 0))) >= 1
                : Math.max(0, Math.round(Number(extraPricing.counts[course] ?? 0))) >=
                  Math.max(0, Math.round(Number(includedBaseByCategory[course] ?? 0))));
            const showExtraPrice = extraPriceRupees > 0 && (isCurrentlyExtra || wouldBeExtraIfAdded);
            const img =
              item.course === 'starter'
                ? mapItemToImage({ itemName: item.name, category: 'starters', subcategory: item.vegType === 'veg' ? 'veg' : 'non_veg' })
                : { uri: item.image };

            return (
              <View
                style={{
                  width: '32%',
                  marginBottom: 10,
                  backgroundColor: '#F6F3FB',
                  borderRadius: 16,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}
              >
                <TouchableOpacity activeOpacity={0.9} onPress={() => setImagePreviewItem({ source: img, name: item.name, vegType: item.vegType })}>
                  <View style={{ position: 'relative' }}>
                    <Image source={img} style={{ width: '100%', height: 64 }} contentFit="cover" transition={150} />
                    <View
                      style={{
                        position: 'absolute',
                        left: 6,
                        bottom: 6,
                        width: 14,
                        height: 14,
                        borderRadius: 2,
                        borderWidth: 1,
                        borderColor: item.vegType === 'veg' ? '#16A34A' : '#DC2626',
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <View
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 99,
                          backgroundColor: item.vegType === 'veg' ? '#16A34A' : '#DC2626',
                        }}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
                <View style={{ paddingHorizontal: 10, paddingVertical: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text numberOfLines={1} style={{ flex: 1, fontWeight: '800', fontSize: 12, color: '#111827' }}>
                      {item.name}
                    </Text>
                  </View>

                  <Text style={{ fontSize: 10, color: '#6B7280' }} numberOfLines={1}>
                    {item.description}
                  </Text>

                  <View style={{ height: 16, marginTop: 6, justifyContent: 'center' }}>
                    <Text
                      style={{ fontSize: 10, fontWeight: '800', color: '#6B7280', textAlign: 'center', opacity: showExtraPrice ? 1 : 0 }}
                    >
                      {`+₹${extraPriceRupees} / plate`}
                    </Text>
                  </View>

                  <View style={{ marginTop: 8, alignItems: 'center' }}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={added ? () => handleRemoveItem(item) : () => handleAddItem(item)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 999,
                        backgroundColor: '#3366FF',
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '900', color: '#FFFFFF' }}>{added ? 'Remove' : 'Add'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      </View>
    );
  };

  const canGoNext = () => {
    if (step === 0) return !!state.dateOption;
    if (step === 1) return !!state.occasion;
    if (step === 2) return !!state.guestsRange;
    if (step === 3) return !!state.mealType;
    if (step === 4) return true;
    return true;
  };

  const onNext = () => {
    if (step === 4 && !baseIncludedReached) {
      if (effectiveMealType === 'snacks') {
        const needSnack = Math.max(1, Math.round(Number(includedBaseByCategory.snacks ?? 1)));
        const needDip = Math.max(1, Math.round(Number(includedBaseByCategory.chutneys_dips ?? 1)));
        const needBev = Math.max(1, Math.round(Number(includedBaseByCategory.snacks_beverages ?? 1)));

        const haveSnack = Math.max(0, Math.round(Number(snacksBaseCounts.snacks ?? 0)));
        const haveDip = Math.max(0, Math.round(Number(snacksBaseCounts.chutneys_dips ?? 0)));
        const haveBev = Math.max(0, Math.round(Number(snacksBaseCounts.snacks_beverages ?? 0)));

        const missing: string[] = [];
        if (haveSnack < needSnack) missing.push('Snacks');
        if (haveDip < needDip) missing.push('Chutneys / Dips');
        if (haveBev < needBev) missing.push('Beverages');

        Alert.alert('Select included items', `Please add: ${missing.join(', ')}`);
        return;
      }

      Alert.alert('Select included items', 'Please select all included items to continue.');
      return;
    }

    if (!canGoNext()) return;
    if (step < 4) {
      setStep((s) => s + 1);
      return;
    }

    const totalSelected = Object.values(selectedItemsById).reduce((acc, x) => acc + Math.max(0, Number(x.count ?? 0)), 0);
    if (totalSelected <= 0) {
      Alert.alert('Select items', 'Please add at least 1 item to create a quote.');
      return;
    }

    const paxFromRange = (r: StepState['guestsRange']) => {
      if (r === '10-40') return 40;
      if (r === '41-150') return 150;
      if (r === '151-400') return 400;
      if (r === '400+') return 500;
      return 80;
    };

    const toIsoDate = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const baseDate = (() => {
      if (state.dateOption === 'date' && specificDate) return specificDate;
      const d = new Date();
      if (state.dateOption === 'this_week') d.setDate(d.getDate() + 7);
      if (state.dateOption === 'this_month') d.setDate(d.getDate() + 30);
      return d;
    })();

    void setStoredItem('bb_delivery_intent_v1', JSON.stringify({ kind: 'catering', deliveryDateISO: toIsoDate(baseDate) }));

    const selection = {
      kind: 'catering',
      occasion: state.occasion ?? '',
      guestsRange: state.guestsRange ?? '',
      mealType: (effectiveMealType ?? state.mealType ?? '') as any,
      items: Object.values(selectedItemsById)
        .map((x) => ({
          id: x.item.id,
          name: x.item.name,
          count: x.count,
          accompaniments: x.accompaniments ?? [],
          addedAt: Number.isFinite(Number((x as any)?.addedAt ?? 0)) ? Number((x as any).addedAt) : 0,
        }))
        .filter((x) => x.id && Number(x.count) > 0),
    };

    router.push({
      pathname: '/catering-quote',
      params: {
        selection: JSON.stringify(selection),
        pax: String(paxFromRange(state.guestsRange)),
        eventDate: toIsoDate(baseDate),
      },
    } as any);
  };

  const onBack = () => {
    if (step === 0) {
      router.back();
      return;
    }
    setStep((s) => Math.max(0, s - 1));
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Simple header */}
 <View
  style={{
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 10 + insets.top,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  }}
>
  <TouchableOpacity onPress={onBack}>
    <Text style={{ fontSize: 28, fontWeight: '700', color: '#111827' }}>←</Text>
  </TouchableOpacity>
  <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
    Catering planner
  </Text>
  <View style={{ width: 28 }} />
</View>

      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 }}>
        {renderStep()}
      </View>

      {/* Bottom next button */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 4,
          paddingBottom: insets.bottom,
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          backgroundColor: '#FFFFFF',
        }}
      >
        <TouchableOpacity
          onPress={onNext}
          activeOpacity={canGoNext() ? 0.9 : 1}
          style={{
            height: 40,
            borderRadius: 999,
            backgroundColor: canGoNext() ? '#3366FF' : '#E5E7EB',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          disabled={!canGoNext()}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
            {step < 4 ? 'Next' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>

      {summaryExpanded && step === 4 ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: '88%',
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
              padding: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>Selected items (by category)</Text>
              <TouchableOpacity onPress={() => setSummaryExpanded(false)}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#3366FF' }}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {plannerCategories.map((c) => {
                const bucket = (selectedByCategory as any)?.[c.key] as any;
                const total = Math.max(0, Math.round(Number(bucket?.total ?? 0)));
                const items = Array.isArray(bucket?.items) ? (bucket.items as any[]) : [];

                return (
                  <View key={c.key} style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: '#111827', marginBottom: 6 }}>
                      {c.title}
                    </Text>
                    {total <= 0 ? (
                      <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 18 }}>—</Text>
                    ) : (
                      items.map((x: any, idx: number) => (
                        <Text key={`${c.key}_${idx}`} style={{ fontSize: 12, color: '#111827', lineHeight: 18 }}>
                          {String(x?.name ?? '')}{Number(x?.count ?? 0) > 1 ? ` ×${Math.round(Number(x.count))}` : ''}
                        </Text>
                      ))
                    )}
                  </View>
                );
              })}

              {totalSelectedCount <= 0 ? (
                <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 18 }}>Selected items: None</Text>
              ) : null}
            </ScrollView>
          </View>
        </View>
      ) : null}

      {extraChargesOpen ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'flex-end',
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              setExtraChargesOpen(false);
              setPendingExtraItem(null);
            }}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          />
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: 14 + insets.bottom,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
            }}
          >
            <Text style={{ color: '#111827', fontWeight: '800', marginBottom: 10 }}>
              Allowed items have been already selected
            </Text>
            <Text style={{ color: '#6B7280', marginBottom: 10 }}>
              You can continue to add extra items or review your selection.
            </Text>
            <Text style={{ color: '#111827', lineHeight: 20 }}>
              {state.mealType === 'breakfast'
                ? `Extra items are charged per plate as below:\n• Main Breakfast: +₹25\n• Accompaniments: +₹10\n• Beverages: +₹15\n• Sweets / Fruits: +₹20`
                : state.mealType === 'snacks'
                  ? `Extra items (per plate):\n• Snack (Veg) – ₹30\n• Snack (Non-Veg) – ₹50\n• Chutney / Dip – ₹20\n• Beverage – ₹20`
                  : `Extra items are charged per plate as below:\n• Starter: +₹25\n• Main Course: +₹30\n• Rice: +₹20\n• Biryani / Pulav: +₹40\n• Bread: +₹10\n• Dessert / Sweet: +₹15`}
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 14 }}>
              <TouchableOpacity
                onPress={() => {
                  const item = pendingExtraItem;
                  setExtraChargesOpen(false);
                  setPendingExtraItem(null);
                  if (!item) return;

                  setSelectedItemsById((prev) => {
                    const cur = prev[item.id];
                    if (cur?.count && cur.count > 0) return prev;

                    const next = { ...prev, [item.id]: { item, count: 1, accompaniments: cur?.accompaniments, addedAt: Date.now() } };
                    const ckey = (item.course ?? '') as PlannerCategoryKey;
                    const max = recommendedMaxByCategory[ckey];
                    if (max != null) {
                      const uniqueCount = Object.values(next).filter((x) => x.item.course === ckey && x.count > 0).length;
                      if (uniqueCount > max) {
                        setOverRecommendedCategory(ckey);
                        setOverRecommendedOpen(true);
                      }
                    }
                    return next;
                  });
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: '#3366FF',
                  marginRight: 12,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setSummaryExpanded(true);
                  setExtraChargesOpen(false);
                  setPendingExtraItem(null);
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: '#3366FF',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}

      {pricingInfoOpen ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'flex-end',
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setPricingInfoOpen(false)}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          />
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: 14 + insets.bottom,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
            }}
          >
            <Text style={{ color: '#111827', lineHeight: 20 }}>
              {state.mealType === 'breakfast'
                ? `Included in base plate:\n• 2 Main Breakfast\n• 4 Accompaniments\n• 2 Beverages\n• 2 Sweets / Fruits\n\nExtra items are charged per plate as below:\n• Main Breakfast: +₹25\n• Accompaniments: +₹10\n• Beverages: +₹15\n• Sweets / Fruits: +₹20`
                : state.mealType === 'snacks'
                  ? `Included in base plate:\n• 1 Snack\n• 1 Chutney / Dip\n• 1 Beverage\n\nExtra items (per plate):\n• Snack (Veg) – ₹30\n• Snack (Non-Veg) – ₹50\n• Chutney / Dip – ₹20\n• Beverage – ₹20`
                : `Included in base plate:\n• 1 Starter\n• 1 Main Course\n• 1 Rice OR Biryani\n• 1 Bread\n• 1 Dessert\n\nExtra items are charged per plate as below:\n• Starter: +₹25\n• Main Course: +₹30\n• Rice: +₹20\n• Biryani / Pulav: +₹40\n• Bread: +₹10\n• Dessert / Sweet: +₹15`}
            </Text>
          </View>
        </View>
      ) : null}

      {imagePreviewItem ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setImagePreviewItem(null)}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          />
          <View style={{ width: '92%', borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
            <Image source={imagePreviewItem.source} style={{ width: '100%', height: 360 }} contentFit="contain" transition={150} />
            <View style={{ paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text numberOfLines={2} style={{ flex: 1, fontWeight: '900', color: '#111827', fontSize: 16 }}>
                  {imagePreviewItem.name}
                </Text>
                <View
                  style={{
                    marginLeft: 10,
                    width: 18,
                    height: 18,
                    borderRadius: 3,
                    borderWidth: 1,
                    borderColor: imagePreviewItem.vegType === 'veg' ? '#16A34A' : '#DC2626',
                    backgroundColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 99,
                      backgroundColor: imagePreviewItem.vegType === 'veg' ? '#16A34A' : '#DC2626',
                    }}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {accompanimentsItem && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: '88%',
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 4 }}>
              Choose accompaniments
            </Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
              For {accompanimentsItem.name}
            </Text>

            {BREAKFAST_ACCOMPANIMENTS.map((name) => {
              const selected = tempAccompaniments.includes(name);
              return (
                <TouchableOpacity
                  key={name}
                  onPress={() => toggleTempAccompaniment(name)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 6,
                  }}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: selected ? '#4C1D95' : '#D1D5DB',
                      backgroundColor: selected ? '#4C1D95' : '#FFFFFF',
                      marginRight: 10,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {selected ? (
                      <Text style={{ color: '#FFFFFF', fontSize: 12 }}>✓</Text>
                    ) : null}
                  </View>
                  <Text style={{ fontSize: 14, color: '#111827' }}>{name}</Text>
                </TouchableOpacity>
              );
            })}

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                marginTop: 16,
              }}
            >
              <TouchableOpacity onPress={handleCancelAccompaniments} style={{ marginRight: 12 }}>
                <Text style={{ color: '#6B7280', fontWeight: '500' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmAccompaniments}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: '#3366FF',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {overRecommendedOpen && overRecommendedCategory ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: '88%',
              borderRadius: 16,
              backgroundColor: '#FFFFFF',
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 6, color: '#111827' }}>
              You’ve added more than the recommended number of items.
            </Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>
              You can continue or review your selection.
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => {
                  setOverRecommendedOpen(false);
                  setOverRecommendedCategory(null);
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: '#3366FF',
                  marginRight: 12,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setSummaryExpanded(true);
                  setOverRecommendedOpen(false);
                  setOverRecommendedCategory(null);
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: '#3366FF',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
