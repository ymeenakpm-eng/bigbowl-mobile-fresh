import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Image, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useLocation } from '../contexts/LocationContext';

const vijayawadaHero = require('../../assets/images/vijayawada-hero.jpg');
const bulkBanner = require('../../assets/images/banners/bulk-banner.png');
const occasionsBanner = require('../../assets/images/banners/occasions.jpg');
const foodAnim1 = require('../../assets/images/animated/food-1.png');
const foodAnim2 = require('../../assets/images/animated/food-2.png');
const foodAnim3 = require('../../assets/images/animated/food-3.png');
const foodAnim4 = require('../../assets/images/animated/food-4.png');

const HomeScreen = () => {
  const { getCartItemCount, getCartTotal, addToCart } = useCart();
  const { state: locationState } = useLocation();
  const { state: authState } = useAuth();

  const insets = useSafeAreaInsets();

  const count = getCartItemCount();
  const total = getCartTotal();

  const isLoggedIn = Boolean(authState.token);

  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const scrollRef = useRef<ScrollView | null>(null);

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
    <View
      style={{
        flex: 1,
        paddingTop: 0,
        paddingHorizontal: 0,
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Top brand header on same light yellow as hero */}
      <SafeAreaView style={{ backgroundColor: '#FEF3C7' }} edges={['top']}>
        <View
          style={{
            height: 56,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: '#F97316',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              <Text style={{ color: '#FFF7ED', fontWeight: '700', fontSize: 13 }}>BB</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push('/location' as any)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: '#FED7AA',
                flexShrink: 1,
              }}
            >
              <Text style={{ fontSize: 14 }}>📍</Text>
              <Text
                numberOfLines={1}
                style={{
                  marginLeft: 6,
                  fontSize: 13,
                  fontWeight: '700',
                  color: '#7C2D12',
                  flexShrink: 1,
                }}
              >
                {locationState.city} – {locationState.pincode}
              </Text>
              <Text style={{ marginLeft: 6, fontSize: 12, color: '#7C2D12' }}>▾</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/cart' as any)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: '#FDE68A',
              }}
            >
              <Text style={{ fontSize: 14, marginRight: 6 }}>🛒</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#7C2D12' }}>
                {count} item{count === 1 ? '' : 's'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        ref={scrollRef}
        key={selectedCategory}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: count > 0 ? 64 : 16 }}
      >
        {/* Hero banner - flat light yellow CraftMyPlate-style hero (true full width) */}
        <View
          style={{
            borderRadius: 0,
            marginBottom: 12,
            backgroundColor: '#FEF3C7', // light yellow
            paddingVertical: 6,
            paddingHorizontal: 20,
          }}
        >
          {/* Top greeting + rider */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
              position: 'relative',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '800',
                  color: '#7C2D12',
                }}
              >
                Big Bowl
              </Text>
            </View>

            <Text
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: 20,
                fontWeight: '700',
                color: '#7C2D12',
              }}
              numberOfLines={1}
            >
              Hello, Vijayawada!
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/account' as any)}
              style={{
                zIndex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: '#FED7AA',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#7C2D12' }}>
                {isLoggedIn ? 'Account' : 'Login'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 4 }}>
            {[
              { label: 'Party Box', emoji: '🎉', onPress: () => router.push('/party-box/details' as any) },
              { label: 'Individual Meal Box', emoji: '🍱', onPress: () => router.push('/meal-box/schedule' as any) },
              { label: 'Snack Box', emoji: '🍟', onPress: () => router.push('/snack-box/occasion' as any) },
              { label: 'Catering', emoji: '🍽️', onPress: () => router.push('/catering' as any) },
            ].map((box) => (
              <TouchableOpacity
                key={box.label}
                activeOpacity={0.85}
                onPress={box.onPress}
                style={{
                  width: '48%',
                  height: 78,
                  borderRadius: 16,
                  marginBottom: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  backgroundColor: '#4C1D95',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 20, marginBottom: 4 }}>{box.emoji}</Text>

                <Text
                  style={{
                    color: '#FDE68A',
                    fontWeight: '700',
                    fontSize: 13,
                    marginBottom: 2,
                    textAlign: 'center',
                  }}
                >
                  {box.label}
                </Text>
                <Text style={{ color: '#EDE9FE', fontSize: 10, textAlign: 'center' }}>
                  View {box.label === 'Individual Meal Box' ? 'meal box' : box.label.toLowerCase()} options
                </Text>
                <Text style={{ color: '#EDE9FE', fontSize: 9, textAlign: 'center', marginTop: 2 }}>
                  Minimum 10+ orders required.
                </Text>
              </TouchableOpacity>
            ))}
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
                    Alert.alert(
                      'How BigBowl works',
                      '1. Choose your box\n2. Customise menu\n3. We deliver & you enjoy',
                    );
                    return;
                  }

                  if (card.title === 'Call & customise') {
                    const phone = 'tel:+919999999999';
                    const can = await Linking.canOpenURL(phone);
                    if (!can) {
                      Alert.alert('Call not available', 'This device cannot open the dialer.');
                      return;
                    }
                    await Linking.openURL(phone);
                    return;
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
                    borderRadius: 16,
                    marginRight: index < 1 ? 10 : 0,
                    backgroundColor: '#3B0764',

                    paddingHorizontal: 8,
                    paddingVertical: 6,
                    justifyContent: 'space-between',
                    alignItems: 'center',
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
                        <Text
                          style={{ fontSize: 10, color: '#E5E7EB', textAlign: 'center' }}
                        >
                          {card.subtitle}
                        </Text>
                      </View>
                    </>
                  )}
                </Container>
              );
            })}
          </View>
        </View>

        {/* NEW Parallax food image strip (background slower, foreground step-by-step) */}
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
                    backgroundColor: '#111827',
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
                    ? 'Breakfast Box'
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
                      backgroundColor: '#FFFFFF',
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
                backgroundColor: '#5B21B6',
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
                  color: '#FDE68A',
                  fontSize: 16,
                  fontWeight: '700',
                  marginBottom: 2,
                }}
              >
                BigBowl Party Box
              </Text>
              <Text style={{ color: '#EDE9FE', fontSize: 10 }}>
                Mix & match biryanis, curries & starters.
              </Text>
              <Text style={{ color: '#EDE9FE', fontSize: 10, marginTop: 2 }}>
                Minimum 10+ orders required.
              </Text>
              <Text style={{ color: '#EDE9FE', fontSize: 10, marginTop: 2 }}>
                Need to place order 2 days ahead.
              </Text>
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
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={{ color: '#FFE082', fontSize: 14, fontWeight: '700', marginBottom: 4 }}>
              Catering Service
            </Text>
            <Text style={{ color: '#EDE9FE', fontSize: 11, marginBottom: 6 }}>
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 4 }}
          >
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
                  backgroundColor: '#111827',
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 4 }}
          >
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
                  backgroundColor: '#F3E8FF',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: '#4B1F8A',
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
                    color: '#7C2D12',
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
                backgroundColor: '#FEF3C7',
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
                backgroundColor: '#EDE9FE',
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
                backgroundColor: '#CFFAFE',
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 6 }}>🧑‍🍳</Text>
              <Text style={{ fontWeight: '700', fontSize: 12, marginBottom: 4 }}>Trusted quality</Text>
              <Text style={{ fontSize: 10, color: '#555555' }}>Freshly prepared</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Floating cart summary strip */}
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
    </View>
  );
};

export default HomeScreen;