import React from 'react';
import { Share, Text, TouchableOpacity, View } from 'react-native';

export default function ReferTab() {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: 56, paddingHorizontal: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '800', marginBottom: 8 }}>Refer & Earn</Text>
      <Text style={{ color: '#6B7280', marginBottom: 16 }}>
        Invite friends & family and share BigBowl.
      </Text>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={async () => {
          await Share.share({
            message:
              'Try BigBowl for Party Boxes, Meal Boxes and Snack Boxes. Order now and get fresh catering in Vijayawada!',
          });
        }}
        style={{
          backgroundColor: '#4C1D95',
          paddingVertical: 14,
          borderRadius: 14,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Share on WhatsApp</Text>
      </TouchableOpacity>
    </View>
  );
}
