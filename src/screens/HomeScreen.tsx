import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Image, Linking, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCart } from '../contexts/CartContext';
import { useLocation } from '../contexts/LocationContext';
import { getStoredItem } from '../utils/storage';

const vijayawadaHero = require('../../assets/images/vijayawada-hero.jpg');
const bulkBanner = require('../../assets/images/banners/bulk-banner.png');
const occasionsBanner = require('../../assets/images/banners/occasions.jpg');
const foodAnim1 = require('../../assets/images/animated/food-1.png');
const foodAnim2 = require('../../assets/images/animated/food-2.png');
const foodAnim3 = require('../../assets/images/animated/food-3.png');
const foodAnim4 = require('../../assets/images/animated/food-4.png');
const bigBowlLogo = require('../../assets/images/animated/logo.png');

const HomeScreen = () => {
  const { getCartItemCount, getCartTotal, addToCart } = useCart();
  const { state: locationState } = useLocation();

  const insets = useSafeAreaInsets();

  const count = getCartItemCount();
  const total = getCartTotal();

  const locationPrimaryLabel =
    locationState.city && locationState.pincode ? `${locationState.city} – ${locationState.pincode}` : 'Select delivery location';
  const locationSecondaryLabel =
    locationState.city && locationState.pincode && locationState.area ? locationState.area : '';

  type DeliveryIntent = { kind: 'meal_box' | 'party_box' | 'catering'; deliveryDateISO: string };
  const [deliveryIntent, setDeliveryIntent] = useState<DeliveryIntent | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const raw = await getStoredItem('bb_delivery_intent_v1');
          const parsed = raw ? JSON.parse(raw) : null;
          const kind = String(parsed?.kind ?? '').trim();
          const deliveryDateISO = String(parsed?.deliveryDateISO ?? '').trim();
          if (!deliveryDateISO || !/^\d{4}-\d{2}-\d{2}$/.test(deliveryDateISO)) {
            if (!cancelled) setDeliveryIntent(null);
            return;
          }
          if (kind !== 'meal_box' && kind !== 'party_box' && kind !== 'catering') {
            if (!cancelled) setDeliveryIntent(null);
            return;
          }
          if (!cancelled) setDeliveryIntent({ kind: kind as DeliveryIntent['kind'], deliveryDateISO });
        } catch {
          if (!cancelled) setDeliveryIntent(null);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [])
  );

  const etaLabel = useMemo(() => {
    const iso = deliveryIntent?.deliveryDateISO;
    if (!iso) return null;

    const parts = iso.split('-').map((x) => Number(x));
    if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
    const [y, m, d] = parts;

    const deliveryAt = new Date(y, m - 1, d, 12, 0, 0);
    if (Number.isNaN(deliveryAt.getTime())) return null;

    const now = new Date();
    const diffMs = Math.max(0, deliveryAt.getTime() - now.getTime());
    const totalMins = Math.floor(diffMs / (60 * 1000));
    const days = Math.floor(totalMins / (60 * 24));
    const hours = Math.floor((totalMins - days * 60 * 24) / 60);
    const mins = Math.max(0, totalMins - days * 60 * 24 - hours * 60);

    if (days <= 0 && hours <= 0) return `${Math.max(1, mins)} mins`;
    if (days <= 0) return mins > 0 ? `${hours} hrs ${mins} mins` : `${hours} hrs`;
    if (hours > 0) return `${days} day${days === 1 ? '' : 's'} ${hours} hr${hours === 1 ? '' : 's'}`;
    return `${days} day${days === 1 ? '' : 's'}`;
  }, [deliveryIntent]);

  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const scrollRef = useRef<ScrollView | null>(null);

  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const howItWorksAnim = useRef(new Animated.Value(0)).current;

  const sliderImages = [foodAnim1, foodAnim2, foodAnim3, foodAnim4];
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const PARALLAX_CARD_WIDTH = SCREEN_WIDTH;
  const PARALLAX_CARD_SPACING = 16;
  const PARALLAX_HORIZONTAL_PADDING = 0;
  const PARALLAX_STEP = PARALLAX_CARD_WIDTH + PARALLAX_CARD_SPACING;
  const PARALLAX_TOTAL_CARDS = sliderImages.length;
  const PARALLAX_MAX_OFFSET = PARALLAX_STEP * (PARALLAX_TOTAL_CARDS - 1);

  const scrollAnim = useRef(new Animated.Value(0)).current;
  const frontAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = () => {
      scrollAnim.setValue(0);
      Animated.timing(scrollAnim, {
        toValue: 1,
        duration: 12000,
        useNativeDriver: true,
      }).start(() => loop());
    };

    loop();

    return () => {
      scrollAnim.stopAnimation();
    };
  }, [scrollAnim]);

  useEffect(() => {
    const runSequence = () => {
      const sequence: any[] = [];

      for (let i = 0; i < PARALLAX_TOTAL_CARDS; i += 1) {
        const toValue = -PARALLAX_STEP * i;

        sequence.push(
          Animated.timing(frontAnim, {
            toValue,
            duration: i === 0 ? 0 : 600,
            useNativeDriver: true,
          }),
          Animated.delay(1000),
        );
      }

      Animated.loop(Animated.sequence(sequence)).start();
    };

    runSequence();

    return () => {
      frontAnim.stopAnimation();
    };
  }, [frontAnim, PARALLAX_STEP, PARALLAX_TOTAL_CARDS]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['left', 'right', 'bottom']}>
      <Modal
        visible={howItWorksOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          Animated.timing(howItWorksAnim, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }).start(() => setHowItWorksOpen(false));
        }}
      >
        <Pressable
          onPress={() => {
            Animated.timing(howItWorksAnim, {
              toValue: 0,
              duration: 180,
              useNativeDriver: true,
            }).start(() => setHowItWorksOpen(false));
          }}
          style={{ flex: 1, backgroundColor: 'rgba(17,24,39,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <Animated.View
            style={{
              width: '100%',
              maxWidth: 340,
              borderRadius: 20,
              paddingVertical: 22,
              paddingHorizontal: 18,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              transform: [
                {
                  scale: howItWorksAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.96, 1],
                    extrapolate: 'clamp',
                  }),
                },
              ],
              opacity: howItWorksAnim,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#FDE68A',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 26 }}>🛵</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827', textAlign: 'center' }}>
              We deliver, you enjoy!
            </Text>
            <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 6 }}>
              Fresh food • On-time delivery • Zero stress
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                Animated.timing(howItWorksAnim, {
                  toValue: 0,
                  duration: 180,
                  useNativeDriver: true,
                }).start(() => setHowItWorksOpen(false));
              }}
              style={{ marginTop: 14, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#111827' }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>Got it</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>

      <ScrollView
        ref={scrollRef as any}
        contentContainerStyle={{
          paddingBottom: count > 0 ? 120 + insets.bottom : 24,
        }}
      >
        <SafeAreaView style={{ backgroundColor: '#4C1D95' }} edges={['top']}>
          <View
            style={{
              paddingTop: 8,
              paddingBottom: 8,
              paddingHorizontal: 16,
              backgroundColor: '#4C1D95',
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ width: 110, paddingRight: 10 }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#F9FAFB' }}>Big Bowl</Text>
                </View>

                <View style={{ flex: 1, alignItems: 'center' }}>
                  <View
                    style={{
                      backgroundColor: '#F4F1FA',
                      borderRadius: 999,
                      padding: 3,
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 6,
                      elevation: 2,
                    }}
                  >
                    <Image source={bigBowlLogo} style={{ width: 32, height: 32, resizeMode: 'contain' }} />
                  </View>
                </View>

                <View style={{ width: 110, alignItems: 'flex-end' }}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => router.push('/(tabs)/account' as any)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>👤</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginTop: 6,
                  marginHorizontal: -16,
                  backgroundColor: '#4C1D95',
                  borderRadius: 0,
                  paddingVertical: 6,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.16)',
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push('/location' as any)}
                  style={{ flex: 1, paddingRight: 10 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#F9FAFB' }}>🏠</Text>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: '#F9FAFB', marginLeft: 6 }}>Deliver to Location</Text>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: '#F9FAFB', marginLeft: 4 }}>▾</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: '#E5E7EB' }}>📍</Text>
                    <Text numberOfLines={1} style={{ fontSize: 12, color: '#E5E7EB', fontWeight: '700', marginLeft: 6, flex: 1 }}>
                      {locationPrimaryLabel}
                    </Text>
                  </View>
                  {locationSecondaryLabel ? (
                    <Text numberOfLines={1} style={{ fontSize: 11, color: '#E5E7EB', marginTop: 2, marginLeft: 18 }}>
                      {locationSecondaryLabel}
                    </Text>
                  ) : null}
                </TouchableOpacity>

                <View style={{ flex: 1, alignItems: 'center', paddingTop: 4 }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF', textAlign: 'center' }}>
                    Hello, {locationState.city ? locationState.city : 'there'}!
                  </Text>
                </View>

                <View style={{ width: 118, alignItems: 'flex-end', paddingTop: 0 }}>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 10, color: '#E5E7EB', fontWeight: '800' }}>Delivers in</Text>
                    <View
                      style={{
                        marginTop: 4,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      <Text style={{ fontSize: 12, color: '#111827', fontWeight: '900' }}>{etaLabel ?? '—'}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </SafeAreaView>

        <View style={{ height: 14 }} />

        {/* Hero banner - flat light yellow CraftMyPlate-style hero (true full width) */}
        <View
          style={{
            borderRadius: 0,
            marginBottom: 12,
            backgroundColor: '#FFFFFF',
            paddingTop: 0,
            paddingHorizontal: 0,
          }}
        >
          <LinearGradient
            colors={['#F6F4FB', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ paddingTop: 20, paddingHorizontal: 16, paddingBottom: 24 }}
          >
            <View style={{ width: '100%' }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 4 }}>
                {[
                  {
                    label: 'Catering',
                    emoji: '🍽️',
                    desc: 'Premium catering menus',
                    guests: 'Guest 50+',
                    advance: 'Order 2 days in advance\n📞 Call us to customize',
                    onPress: () => router.push('/catering' as any),
                  },
                  {
                    label: 'Party Box',
                    emoji: '🎉',
                    desc: 'Perfect for parties',
                    guests: 'Guest 10+',
                    advance: 'Order 1 day in advance\n📞 Call us to customize',
                    onPress: () => router.push('/party-box/type' as any),
                  },
                  {
                    label: 'Meal Box',
                    emoji: '🍱',
                    desc: 'Daily meals made easy',
                    guests: 'Guests 25+',
                    advance: 'Order 1 day in advance\n📞 Call us to customize',
                    onPress: () => router.push('/meal-box/guided' as any),
                  },
                  {
                    label: 'Snack Box',
                    emoji: '🍟',
                    desc: 'Quick snack bundles',
                    guests: 'Guests 10+',
                    advance: 'Order 1 day in advance.\n📞 Call us to customize',
                    onPress: () => router.push('/snack-box/occasion' as any),
                  },
                ].map((box) => (
                  <TouchableOpacity
                    key={box.label}
                    activeOpacity={0.9}
                    onPress={box.onPress}
                    style={{
                      width: '47%',
                      minHeight: 170,
                      borderRadius: 14,
                      marginBottom: 16,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      backgroundColor: '#4C1D95',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.18)',
                      justifyContent: 'flex-start',
                      alignItems: 'center',
                      shadowColor: '#000000',
                      shadowOpacity: 0.06,
                      shadowOffset: { width: 0, height: 6 },
                      shadowRadius: 18,
                      elevation: 6,
                    }}
                  >
                    {/* Icon + text layout; special case for Call card */}
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: box.label === 'Catering' || box.label === 'Party Box' ? '#4C1D95' : '#FBBF24',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 10,
                      }}
                    >
                      <Text style={{ fontSize: 20, color: box.label === 'Catering' || box.label === 'Party Box' ? '#FBBF24' : '#4B1F8A' }}>{box.emoji}</Text>
                    </View>
                    <Text style={{ color: '#F9FAFB', fontWeight: '900', fontSize: 13, textAlign: 'center', width: '100%' }}>
                      {box.label}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{ color: '#E5E7EB', fontWeight: '700', fontSize: 11, textAlign: 'center', width: '100%', marginTop: 4 }}
                    >
                      {(box as any).desc}
                    </Text>
                    <View style={{ width: '100%', marginTop: 8 }}>
                      <Text numberOfLines={1} style={{ fontSize: 11, color: '#E5E7EB', fontWeight: '700', textAlign: 'center' }}>
                        👥 {(box as any).guests}
                      </Text>
                      <Text numberOfLines={3} style={{ fontSize: 11, color: '#E5E7EB', fontWeight: '700', marginTop: 4, textAlign: 'center' }}>
                        📅 {(box as any).advance}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Two feature cards (How it works, Call) */}
            <View
              style={{
                marginTop: 4,
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              {[
                {
                  title: 'How it works',
                  subtitle: 'See plans & pricing',
                  emoji: '📱',
                },
                {
                  title: 'Call & customise',
                  subtitle: 'Talk to our team',
                  emoji: '📞',
                },
              ].map((card, index) => {
                const Container: any = TouchableOpacity;

                const containerProps = {
                  activeOpacity: 0.9,
                  onPress: async () => {
                    if (card.title === 'How it works') {
                      setHowItWorksOpen(true);
                      howItWorksAnim.setValue(0);
                      Animated.timing(howItWorksAnim, {
                        toValue: 1,
                        duration: 220,
                        useNativeDriver: true,
                      }).start();
                      return;
                    }

                    if (card.title === 'Call & customise') {
                      try {
                        const phone = 'tel:+919999999999';
                        const can = await Linking.canOpenURL(phone);
                        if (!can) {
                          Alert.alert('Call not available', 'This device cannot open the dialer.');
                          return;
                        }
                        await Linking.openURL(phone);
                        return;
                      } catch (e: any) {
                        Alert.alert('Call failed', String(e?.message ?? e));
                        return;
                      }
                    }
                  },
                };

                return (
                  <Container
                    key={card.title}
                    {...containerProps}
                    style={{
                      flex: 1,
                      height: 90,
                      borderRadius: 14,
                      marginRight: index < 1 ? 10 : 0,
                      backgroundColor: '#4C1D95',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.18)',

                      paddingHorizontal: 8,
                      paddingVertical: 6,
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      shadowColor: '#000000',
                      shadowOpacity: 0.06,
                      shadowOffset: { width: 0, height: 6 },
                      shadowRadius: 18,
                      elevation: 6,
                    }}
                  >
                    {/* Icon + text layout; special case for Call card */}
                    {card.title === 'Call & customise' ? (
                      <>
                        <View
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            backgroundColor: '#FBBF24',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 2,
                          }}
                        >
                          <Text style={{ fontSize: 18, color: '#4B1F8A' }}>{card.emoji}</Text>
                        </View>
                        <View>
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '700',
                              color: '#F9FAFB',
                              textAlign: 'center',
                            }}
                          >
                            Call &
                          </Text>
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '500',
                              color: '#F9FAFB',
                              marginTop: 0,
                              textAlign: 'center',
                            }}
                          >
                            customise
                          </Text>

                          <Text
                            style={{
                              fontSize: 10,
                              color: '#E5E7EB',
                              marginTop: 2,
                              textAlign: 'center',
                            }}
                          >
                            {card.subtitle}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <View
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            backgroundColor: '#FBBF24',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 6,
                          }}
                        >
                          <Text style={{ fontSize: 18, color: '#4B1F8A' }}>{card.emoji}</Text>
                        </View>
                        <View>
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '700',
                              color: '#F9FAFB',
                              marginBottom: 2,
                              textAlign: 'center',
                            }}
                          >
                            {card.title}
                          </Text>
                          <Text style={{ fontSize: 10, color: '#E5E7EB', textAlign: 'center' }}>{card.subtitle}</Text>
                        </View>
                      </>
                    )}
                  </Container>
                );
              })}
            </View>
          </LinearGradient>

          <View
            style={{
              marginTop: 8,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                height: 200,
                borderRadius: 20,
                overflow: 'hidden',
                // Lighter backdrop so background cards remain visible
                backgroundColor: '#4C1D95',
                justifyContent: 'center',
              }}
            >
              {/* Background layer (slower, dimmed) */}
              <Animated.View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  flexDirection: 'row',
                  paddingHorizontal: PARALLAX_HORIZONTAL_PADDING,
                  // Slightly less dim so background cards show through
                  opacity: 0.45,

                  transform: [
                    {
                      translateX: frontAnim.interpolate({
                        inputRange: [-PARALLAX_MAX_OFFSET, 0],
                        outputRange: [-PARALLAX_MAX_OFFSET * 0.5, 0],
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                }}
              >
                {sliderImages.map((src, index) => (
                  <View
                    key={`back-${index}`}
                    style={{
                      width: PARALLAX_CARD_WIDTH,
                      height: 130,
                      marginRight: PARALLAX_CARD_SPACING,
                      borderRadius: 16,
                      overflow: 'hidden',
                      backgroundColor: '#F6F3FB',
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                    }}
                  >
                    <Image
                      source={src}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </Animated.View>

              {/* Foreground layer (snaps card-by-card with center pause, cover-flow style) */}
              <Animated.View
                style={{
                  flexDirection: 'row',
                  paddingHorizontal: PARALLAX_HORIZONTAL_PADDING,
                  transform: [
                    {
                      translateX: frontAnim,
                    },
                  ],
                }}
              >
                {sliderImages.map((src, index) => {
                  const label =
                    index % 4 === 0
                      ? 'Meal Box'
                    : index % 4 === 1
                      ? 'Snack Box'
                    : index % 4 === 2
                      ? 'Party Box'
                    : 'Catering';

                  const centerX = -PARALLAX_STEP * index;

                  const scale = frontAnim.interpolate({
                    inputRange: [centerX - PARALLAX_STEP, centerX, centerX + PARALLAX_STEP],
                    outputRange: [0.8, 1.08, 0.8],
                    extrapolate: 'clamp',
                  });

                  const translateY = frontAnim.interpolate({
                    inputRange: [centerX - PARALLAX_STEP, centerX, centerX + PARALLAX_STEP],
                    outputRange: [10, -8, 10],
                    extrapolate: 'clamp',
                  });

                  const rotateY = frontAnim.interpolate({
                    inputRange: [centerX - PARALLAX_STEP, centerX, centerX + PARALLAX_STEP],
                    outputRange: ['18deg', '0deg', '-18deg'],
                    extrapolate: 'clamp',
                  });

                  const opacity = frontAnim.interpolate({
                    inputRange: [centerX - PARALLAX_STEP * 1.5, centerX, centerX + PARALLAX_STEP * 1.5],
                    outputRange: [0.4, 1, 0.4],
                    extrapolate: 'clamp',
                  });

                  return (
                    <Animated.View
                      key={`front-${index}`}
                      style={{
                        width: PARALLAX_CARD_WIDTH,
                        height: 150,
                        marginRight: PARALLAX_CARD_SPACING,
                        borderRadius: 20,
                        overflow: 'hidden',
                        backgroundColor: '#F6F3FB',
                        justifyContent: 'flex-end',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.35,
                        shadowRadius: 10,
                        elevation: 8,
                        opacity,
                        transform: [
                          { perspective: 800 },
                          { rotateY },
                          { scale },
                          { translateY },
                        ],
                      }}
                    >
                      <Image
                        source={src}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />

                      {/* Bottom label for each image */}
                      <View
                        style={{
                          position: 'absolute',
                          left: 16,
                          right: 16,
                          bottom: 8,
                          paddingVertical: 4,
                          borderRadius: 999,
                          // Softer purple pill instead of near-black
                          backgroundColor: 'rgba(147, 51, 234, 0.92)',
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          style={{
                            color: '#F9FAFB',
                            fontSize: 12,
                            fontWeight: '600',
                          }}
                        >
                          {label}
                        </Text>
                      </View>
                    </Animated.View>
                  );
                })}
              </Animated.View>
            </View>
          </View>

          {/* Bulk food delivery banner (tappable CTA) */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              router.push('/party-box/details' as any);
            }}
            style={{
              borderRadius: 16,
              paddingTop: 48, // extra space so pill doesn’t cover text
              paddingHorizontal: 14,
              paddingBottom: 18,
              marginBottom: 12,
              marginTop: 22,
              backgroundColor: '#4C1D95',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.18)',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {/* Center delivery box visual overlapping near top edge, without covering text */}
            <View
              style={{
                position: 'absolute',
                top: -6,
                left: 32,
                right: 32,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  borderRadius: 20,
                  paddingVertical: 12,
                  paddingHorizontal: 22,
                  backgroundColor: '#4C1D95',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.18)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <Text
                  style={{
                    color: '#F9FAFB',
                    fontSize: 16,
                    fontWeight: '700',
                    marginBottom: 2,
                  }}
                >
                  BigBowl Party Box
                </Text>
                <Text style={{ color: '#E5E7EB', fontSize: 10 }}>Mix & match biryanis, curries & starters.</Text>
                <Text style={{ color: '#E5E7EB', fontSize: 10, marginTop: 2 }}>Minimum 10+ orders required.</Text>
                <Text style={{ color: '#E5E7EB', fontSize: 10, marginTop: 2 }}>Need to place order 2 days ahead.</Text>
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Image
                source={bulkBanner}
                style={{
                  width: '100%',
                  height: 120,
                  borderRadius: 12,
                }}
                resizeMode="cover"
              />
            </View>
          </TouchableOpacity>

          {/* Catering Service (tappable CTA) */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              router.push('/catering' as any);
            }}
            style={{
              borderRadius: 16,
              paddingTop: 14, // extra space so pill doesn’t cover text
              paddingHorizontal: 14,
              paddingBottom: 14,
              marginBottom: 12,
              marginTop: 8,
              backgroundColor: '#4C1D95',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.18)',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ color: '#F9FAFB', fontSize: 14, fontWeight: '700', marginBottom: 4 }}>Catering Service</Text>
              <Text style={{ color: '#E5E7EB', fontSize: 11, marginBottom: 6 }}>
                Order before 2 days for weddings, receptions & large gatherings.
              </Text>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  router.push('/catering' as any);
                }}
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: '#FBBF24',
                }}
              >
                <Text style={{ color: '#4B1F8A', fontWeight: '700', fontSize: 11 }}>See platters</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        {/* Occasions we cater */}
        <View style={{ marginTop: 8, marginBottom: 12, paddingHorizontal: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 8,
            }}
          >
            Occasions we cater
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
            {[
              { label: 'Birthdays', color: '#FFE082' },
              { label: 'Weddings', color: '#FFCDD2' },
              { label: 'Corporate Events', color: '#BBDEFB' },
              { label: 'House Parties', color: '#C8E6C9' },
            ].map((occ) => (
              <View
                key={occ.label}
                style={{
                  width: 140,
                  height: 80,
                  borderRadius: 12,
                  overflow: 'hidden',
                  marginRight: 10,
                  padding: 10,
                  justifyContent: 'space-between',
                  backgroundColor: '#F6F3FB',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}
              >
                <Image
                  source={occasionsBanner}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%',
                  }}
                  resizeMode="cover"
                />
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.35)',
                  }}
                />
                <Text style={{ fontWeight: '700', fontSize: 14, color: '#FFFFFF' }}>{occ.label}</Text>
                <Text style={{ fontSize: 11, color: '#E5E7EB' }}>Custom menus & service</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* What our customers say - testimonials */}
        <View style={{ marginBottom: 12, paddingHorizontal: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 8,
            }}
          >
            What our customers say
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
            {[
              {
                name: 'Sree, Vijayawada',
                quote: 'Perfect for our Friday office lunch, everyone loved the boxes.',
              },
              {
                name: 'Anil, Benz Circle',
                quote: 'Guests kept asking who catered the biryani and starters!',
              },
              {
                name: 'Lakshmi, Siddhartha Nagar',
                quote: 'Super convenient for our housewarming, no cooking stress.',
              },
            ].map((review) => (
              <View
                key={review.name}
                style={{
                  width: 220,
                  borderRadius: 14,
                  marginRight: 10,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  backgroundColor: '#F6F3FB',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: '#111827',
                    marginBottom: 6,
                  }}
                  numberOfLines={3}
                >
                  “{review.quote}”
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: '#6B7280',
                  }}
                >
                  {review.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={{ marginBottom: 16, paddingHorizontal: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 10,
            }}
          >
            Why choose us
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View
              style={{
                width: '32%',
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 10,
                backgroundColor: '#F6F3FB',
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 6 }}>⏱️</Text>
              <Text style={{ fontWeight: '700', fontSize: 12, marginBottom: 4 }}>On-time delivery</Text>
              <Text style={{ fontSize: 10, color: '#555555' }}>Planned for every event</Text>
            </View>

            <View
              style={{
                width: '32%',
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 10,
                backgroundColor: '#F6F3FB',
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 6 }}>🍽️</Text>
              <Text style={{ fontWeight: '700', fontSize: 12, marginBottom: 4 }}>Custom menus</Text>
              <Text style={{ fontSize: 10, color: '#555555' }}>Veg & non-veg options</Text>
            </View>

            <View
              style={{
                width: '32%',
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 10,
                backgroundColor: '#F6F3FB',
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 6 }}>🧑‍🍳</Text>
              <Text style={{ fontWeight: '700', fontSize: 12, marginBottom: 4 }}>Trusted quality</Text>
              <Text style={{ fontSize: 10, color: '#555555' }}>Freshly prepared</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {count > 0 && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            router.push('/cart' as any);
          }}
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 24 + insets.bottom,
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 18,
            backgroundColor: '#3366FF',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <View>
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>
              {count} item{count > 1 ? 's' : ''} in cart
            </Text>
            <Text style={{ color: '#E3F2FD', fontSize: 12 }}>
              Total: Rs {total.toFixed(0)}
            </Text>
          </View>
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>View Cart</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;