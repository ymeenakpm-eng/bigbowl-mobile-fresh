import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CateringItem, cateringItems, CateringMealType } from '../src/data/cateringMenu';
import { mapItemToImage } from '../src/utils/mapItemToImage';

interface StepState {
  dateOption?: 'date' | 'this_week' | 'this_month' | 'exploring';
  occasion?: string;
  guestsRange?: '10-40' | '41-150' | '151-400' | '400+';
  mealType?: CateringMealType | 'snacks';
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

const mealOptions: { key: CateringMealType | 'snacks'; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch/Dinner' },
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

type SelectedCateringItem = {
  item: CateringItem;
  count: number;
  accompaniments?: string[];
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
      borderColor: selected ? '#7C3AED' : '#E5E7EB',
      backgroundColor: selected ? '#F5F3FF' : '#FFFFFF',
      marginBottom: 10,
    }}
  >
    <Text
      style={{
        fontSize: 15,
        fontWeight: selected ? '700' : '500',
        color: selected ? '#4C1D95' : '#111827',
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
          next[id] = { item: it, count, accompaniments };
        }
        setSelectedItemsById(next);
      }
    } catch {
      // ignore
    }
  }, [params.preset]);

  const effectiveMealType: CateringMealType | undefined = useMemo(() => {
    if (state.mealType === 'snacks') return 'lunch'; // map snacks to lunch menu for now
    return state.mealType as CateringMealType | undefined;
  }, [state.mealType]);

  const itemsForMeal = useMemo(() => {
    if (!effectiveMealType) return [] as CateringItem[];
    return cateringItems.filter((item) => item.mealType === effectiveMealType);
  }, [effectiveMealType]);

  const groupedByCourse = useMemo(() => {
    const groups: Record<string, CateringItem[]> = {};
    itemsForMeal.forEach((item) => {
      if (!groups[item.course]) groups[item.course] = [];
      groups[item.course].push(item);
    });
    return groups;
  }, [itemsForMeal]);

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
    if (effectiveMealType === 'breakfast') {
      setAccompanimentsItem(item);
      setTempAccompaniments([]);
      return;
    }

    setSelectedItemsById((prev) => {
      const cur = prev[item.id];
      const nextCount = (cur?.count ?? 0) + 1;
      return { ...prev, [item.id]: { item, count: nextCount, accompaniments: cur?.accompaniments } };
    });
  };

  const handleRemoveItem = (item: CateringItem) => {
    setSelectedItemsById((prev) => {
      const cur = prev[item.id];
      const nextCount = Math.max(0, (cur?.count ?? 0) - 1);
      if (nextCount <= 0) {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      }
      return { ...prev, [item.id]: { item, count: nextCount, accompaniments: cur?.accompaniments } };
    });
  };

  const handleConfirmAccompaniments = () => {
    if (!accompanimentsItem) return;

    const item = accompanimentsItem;
    const acc = tempAccompaniments;
    setSelectedItemsById((prev) => {
      const cur = prev[item.id];
      const nextCount = (cur?.count ?? 0) + 1;
      return { ...prev, [item.id]: { item, count: nextCount, accompaniments: acc } };
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
                    borderColor: selected ? '#7C3AED' : '#E5E7EB',
                    backgroundColor: selected ? '#EEF2FF' : '#F9FAFB',
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
      <View>
        <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 4 }}>
          Suggested menu
        </Text>
        {effectiveMealType ? (
          <Text style={{ color: '#6B7280', marginBottom: 12 }}>
            For {effectiveMealType.charAt(0).toUpperCase() + effectiveMealType.slice(1)}
          </Text>
        ) : null}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {(['starter', 'biryani_pulav', 'rice', 'curry', 'hot_snack', 'bread'] as const).map(
            (course) => {
              const list = groupedByCourse[course];
              if (!list || list.length === 0) return null;

              const titleMap: Record<typeof course, string> = {
                starter: 'Starters',
                biryani_pulav: 'Biryani / Pulav',
                rice: 'Flavoured Rice',
                curry: 'Curries',
                hot_snack: 'Hot Snacks',
                bread: 'Breads',
              } as const;

              return (
                <View key={course}>
                  <SectionHeader title={titleMap[course]} />
                  {list.map((item) => (
                    <View
                      key={item.id}
                      style={{
                        flexDirection: 'column',
                        marginBottom: 10,
                        backgroundColor: '#F9FAFB',
                        borderRadius: 12,
                        overflow: 'hidden',
                      }}
                    >
                      <Image
                        source={
                          item.course === 'starter' && item.vegType === 'veg'
                            ? mapItemToImage({ itemName: item.name, category: 'starters', subcategory: 'veg' })
                            : { uri: item.image }
                        }
                        style={{ width: '100%', height: 140 }}
                        contentFit="cover"
                        transition={150}
                      />
                      <View style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 10 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 2,
                          }}
                        >
                          <Text style={{ fontWeight: '600', fontSize: 14 }}>{item.name}</Text>
                          <View
                            style={{
                              marginLeft: 6,
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 999,
                              backgroundColor:
                                item.vegType === 'veg'
                                  ? 'rgba(22,163,74,0.12)'
                                  : 'rgba(220,38,38,0.12)',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: '600',
                                color: item.vegType === 'veg' ? '#16A34A' : '#DC2626',
                              }}
                            >
                              {item.vegType === 'veg' ? 'VEG' : 'NON-VEG'}
                            </Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 11, color: '#6B7280' }} numberOfLines={2}>
                          {item.description}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                          {Number(selectedItemsById[item.id]?.count ?? 0) > 0 ? (
                            <TouchableOpacity
                              onPress={() => handleRemoveItem(item)}
                              style={{
                                marginRight: 10,
                                alignSelf: 'flex-start',
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 999,
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                                backgroundColor: '#FFFFFF',
                              }}
                            >
                              <Text style={{ color: '#111827', fontSize: 11, fontWeight: '700' }}>Remove</Text>
                            </TouchableOpacity>
                          ) : null}
                          <TouchableOpacity
                            onPress={() => handleAddItem(item)}
                            style={{
                              alignSelf: 'flex-start',
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: 999,
                              backgroundColor: '#4C1D95',
                            }}
                          >
                            <Text
                              style={{
                                color: '#FFFFFF',
                                fontSize: 11,
                                fontWeight: '600',
                              }}
                            >
                              {Number(selectedItemsById[item.id]?.count ?? 0) > 0
                                ? `Add (${Number(selectedItemsById[item.id]?.count ?? 0)})`
                                : 'Add'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              );
            },
          )}
        </ScrollView>
      </View>
    );
  };

  const canGoNext = () => {
    if (step === 0) return !!state.dateOption;
    if (step === 1) return !!state.occasion;
    if (step === 2) return !!state.guestsRange;
    if (step === 3) return !!state.mealType;
    return true;
  };

  const onNext = () => {
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

    const selection = {
      kind: 'catering',
      occasion: state.occasion ?? '',
      guestsRange: state.guestsRange ?? '',
      mealType: state.mealType ?? '',
      items: Object.values(selectedItemsById)
        .map((x) => ({
          id: x.item.id,
          name: x.item.name,
          count: x.count,
          accompaniments: x.accompaniments ?? [],
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
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: 56 }}>
      {/* Simple header */}
 <View
  style={{
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#4C1D95',
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
    <Text style={{ fontSize: 28, fontWeight: '700', color: '#FFFFFF' }}>←</Text>
  </TouchableOpacity>
  <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>
    Catering planner
  </Text>
  <View style={{ width: 28 }} />
</View>

      <View
        style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
      >
        {renderStep()}
      </View>

      {/* Bottom next button */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 16 + insets.bottom,
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          backgroundColor: '#FFFFFF',
        }}
      >
        <TouchableOpacity
          onPress={onNext}
          activeOpacity={canGoNext() ? 0.9 : 1}
          style={{
            height: 44,
            borderRadius: 999,
            backgroundColor: canGoNext() ? '#4C1D95' : '#E5E7EB',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          disabled={!canGoNext()}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
            {step < 4 ? 'Next' : 'Done'}
          </Text>
        </TouchableOpacity>
      </View>

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
                  backgroundColor: '#4C1D95',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
