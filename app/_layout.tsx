import { AuthProvider } from '../src/contexts/AuthContext';
import { CartProvider } from '../src/contexts/CartContext';
import { LocationProvider } from '../src/contexts/LocationContext';

import { useEffect } from 'react';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (!__DEV__) return;

    const g: any = globalThis as any;
    if (g.__bb_keepAwakeHandlerInstalled) return;

    const EU = g.ErrorUtils;
    if (!EU || typeof EU.setGlobalHandler !== 'function') return;

    const prev = typeof EU.getGlobalHandler === 'function' ? EU.getGlobalHandler() : EU._globalHandler;
    g.__bb_keepAwakeHandlerInstalled = true;

    EU.setGlobalHandler((error: any, isFatal: boolean) => {
      const msg = String(error?.message ?? error);
      if (msg.includes('Unable to activate keep awake')) {
        return;
      }
      if (typeof prev === 'function') prev(error, isFatal);
    });
  }, []);

  return (
    <LocationProvider>
      <AuthProvider>
        <CartProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="modal"
                options={{ presentation: 'modal', title: 'Modal' }}
              />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </CartProvider>
      </AuthProvider>
    </LocationProvider>
  );
}