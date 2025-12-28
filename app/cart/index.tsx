import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useCart } from '../../src/contexts/CartContext';

export default function CartScreen() {
  const router = useRouter();
  const { state, updateQuantity, clearCart, getCartTotal } = useCart();

  const items = state.items;
  const total = getCartTotal();

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: 40 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          marginBottom: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 16,
            backgroundColor: '#F0F0F0',
            marginRight: 8,
          }}
        >
          <Text style={{ fontSize: 12 }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '700' }}>Your Cart</Text>
      </View>

      {items.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
            Your cart is empty
          </Text>
          <Text style={{ color: '#666666', textAlign: 'center', marginBottom: 16 }}>
            Add some delicious items from the home screen to see them here.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 18,
              backgroundColor: '#3366FF',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          >
            {items.map((item) => (
              <View
                key={item.id}
                style={{
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: '#EEEEEE',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontWeight: '600', fontSize: 15 }}>{item.name}</Text>
                  <Text style={{ color: '#666666', fontSize: 12 }}>
                    Rs {item.price} x {item.quantity}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: '#DDDDDD',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 6,
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600' }}>-</Text>
                  </TouchableOpacity>

                  <Text style={{ minWidth: 20, textAlign: 'center' }}>{item.quantity}</Text>

                  <TouchableOpacity
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: '#DDDDDD',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: 6,
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600' }}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Summary & actions */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: '#EEEEEE',
              backgroundColor: '#FFFFFF',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700' }}>Total</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#FF6B6B' }}>
                Rs {total.toFixed(0)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={clearCart}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: '#DDDDDD',
                  marginRight: 8,
                  flex: 1,
                }}
              >
                <Text style={{ textAlign: 'center', color: '#666666', fontWeight: '600' }}>
                  Clear Cart
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/checkout' as any)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 18,
                  backgroundColor: '#3366FF',
                  flex: 1,
                }}
              >
                <Text style={{ textAlign: 'center', color: '#FFFFFF', fontWeight: '700' }}>
                  Proceed to Checkout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
}
