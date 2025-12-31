import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';

export default function BowlsAddressScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/' as any);
  }, [router]);

  return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
}
