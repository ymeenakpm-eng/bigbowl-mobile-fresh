import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export function BlackBackHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string | null;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: Math.max(insets.top, 12),
        paddingHorizontal: 16,
        paddingBottom: 10,
        backgroundColor: '#111827',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: subtitle ? 'flex-start' : 'center' }}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.85}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.12)',
            marginRight: 12,
          }}
        >
          <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={{ flex: 1, paddingTop: subtitle ? 2 : 0 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFFFFF' }}>{title}</Text>
          {subtitle ? (
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
