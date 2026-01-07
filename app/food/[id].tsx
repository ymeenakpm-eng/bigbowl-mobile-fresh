import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { useCart } from '../../src/contexts/CartContext';
import { popularItems } from '../../src/data/food';

export default function FoodDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addToCart } = useCart();

  const item = popularItems.find((f) => f.id === id);

  if (!item) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
        }}
      >
        <Text>Item not found.</Text>
      </View>
    );
  }

  let servesLine: string | undefined;
  if (item.category === 'Party Boxes') {
    servesLine = 'Ideal for ~10–12 guests';
  } else if (item.category === 'Meal Boxes') {
    servesLine = 'Packed meal boxes for teams & daily meals';
  } else if (item.category === 'Snack Boxes') {
    servesLine = 'Perfect for evening snacks & starters';
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      contentContainerStyle={{ padding: 16 }}
    >
      {/* Category tag / pill */}
      <View style={{ marginBottom: 8 }}>
        <View
          style={{
            alignSelf: 'flex-start',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor:
              item.category === 'Party Boxes'
                ? '#C026D3'
                : item.category === 'Meal Boxes'
                ? '#0EA5E9'
                : item.category === 'Snack Boxes'
                ? '#F97316'
                : '#E5E7EB',
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color:
                item.category === 'Party Boxes' ||
                item.category === 'Meal Boxes' ||
                item.category === 'Snack Boxes'
                  ? '#FFFFFF'
                  : '#111827',
            }}
          >
            {item.category}
          </Text>
        </View>
      </View>

      <Image
        source={{ uri: item.image }}
        style={{ width: '100%', height: 220, borderRadius: 12, marginBottom: 16 }}
      />
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 4 }}>
        {item.name}
      </Text>
      <Text style={{ color: '#666666', marginBottom: servesLine ? 4 : 8 }}>
        {item.category} · {item.prepTime}
      </Text>
      {servesLine && (
        <Text style={{ color: '#4B5563', fontSize: 13, marginBottom: 8 }}>{servesLine}</Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 20, color: '#FF6B6B', fontWeight: '700' }}>Rs {item.price}</Text>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: item.isVeg ? '#16A34A' : '#DC2626',
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: '#FFFFFF',
            }}
          >
            {item.isVeg ? 'VEG' : 'NON-VEG'}
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 14, color: '#444444', marginBottom: 24 }}>
        {item.description}
      </Text>

      <Text
        style={{
          backgroundColor: '#FF6B6B',
          color: '#FFFFFF',
          textAlign: 'center',
          paddingVertical: 12,
          borderRadius: 8,
          fontWeight: '600',
        }}
        onPress={() => addToCart({ name: item.name, price: item.price })}
      >
        Add to Cart
      </Text>
    </ScrollView>
  );
}
