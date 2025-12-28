import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/src/contexts/AuthContext';

import { apiJson, getApiBaseUrl, setApiBaseUrl } from '@/src/utils/api';

export default function AccountScreen() {
  const { state, signIn, signOut } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState<'otp' | 'verify' | null>(null);

  const [apiBaseUrl, setApiBaseUrlState] = useState<string>('');

  React.useEffect(() => {
    (async () => {
      const v = await getApiBaseUrl();
      setApiBaseUrlState(v);
    })();
  }, []);

  const isLoggedIn = Boolean(state.token);

  const maskedToken = useMemo(() => {
    if (!state.token) return '';
    const t = state.token;
    if (t.length <= 18) return t;
    return `${t.slice(0, 10)}...${t.slice(-8)}`;
  }, [state.token]);

  async function sendOtp() {
    try {
      setLoading('otp');
      const p = phone.trim();
      if (!p) {
        Alert.alert('Missing phone', 'Enter your phone number (e.g. +917893017124)');
        return;
      }

      await apiJson('/api/auth/otp', {
        method: 'POST',
        body: JSON.stringify({ phone: p }),
      });

      Alert.alert('OTP sent', 'If using Supabase test numbers, use the fixed OTP you configured.');
    } catch (e) {
      Alert.alert('OTP failed', String(e));
    } finally {
      setLoading(null);
    }
  }

  async function verifyOtp() {
    try {
      setLoading('verify');
      const p = phone.trim();
      const code = otp.trim();
      if (!p) {
        Alert.alert('Missing phone', 'Enter your phone number first.');
        return;
      }
      if (!code) {
        Alert.alert('Missing OTP', 'Enter the OTP you received (or the test OTP).');
        return;
      }

      const data = await apiJson('/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ phone: p, token: code }),
      });

      const token = String((data as any)?.token ?? '');
      const user = (data as any)?.user ?? null;
      if (!token || !user?.id) {
        throw new Error('Server did not return a token/user.');
      }

      await signIn({ token, user: { id: String(user.id), phone: String(user.phone ?? p) } });
      Alert.alert('Logged in', 'JWT saved on this device for demo use.');
    } catch (e) {
      Alert.alert('Verify failed', String(e));
    } finally {
      setLoading(null);
    }
  }

  async function demoLogin() {
    try {
      setLoading('verify');
      const data = await apiJson('/api/auth/demo', { method: 'POST' });
      const token = String((data as any)?.token ?? '');
      const user = (data as any)?.user ?? null;
      if (!token || !user?.id) throw new Error('Server did not return demo token/user.');
      await signIn({ token, user: { id: String(user.id), phone: String(user.phone ?? 'demo') } });
      Alert.alert('Demo login', 'Logged in using demo mode.');
    } catch (e: any) {
      Alert.alert('Demo login failed', String(e?.message ?? e));
    } finally {
      setLoading(null);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 8 }}>Account</Text>
        <Text style={{ color: '#666', marginBottom: 16 }}>Test phone OTP login against your backend.</Text>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: '#333', marginBottom: 6 }}>API Base URL</Text>
          <TextInput
            value={apiBaseUrl}
            onChangeText={setApiBaseUrlState}
            placeholder="https://xxxx.ngrok-free.dev"
            autoCapitalize="none"
            style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 12 }}
          />
          <TouchableOpacity
            onPress={async () => {
              try {
                await setApiBaseUrl(apiBaseUrl);
                const v = await getApiBaseUrl();
                setApiBaseUrlState(v);
                Alert.alert('Saved', 'API base URL saved on this phone.');
              } catch (e: any) {
                Alert.alert('Save failed', String(e?.message ?? e));
              }
            }}
            disabled={loading !== null}
            style={{ marginTop: 10, backgroundColor: '#111', padding: 12, borderRadius: 12, opacity: loading ? 0.6 : 1 }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', textAlign: 'center' }}>Save API URL</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 8 }}>
          <Text style={{ fontSize: 12, color: '#333', marginBottom: 6 }}>Phone</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+917893017124"
            autoCapitalize="none"
            keyboardType="phone-pad"
            style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 }}
          />
        </View>

        <View style={{ marginTop: 12 }}>
          <TouchableOpacity
            onPress={sendOtp}
            disabled={loading !== null}
            style={{ backgroundColor: '#111', padding: 14, borderRadius: 12, opacity: loading ? 0.6 : 1 }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', textAlign: 'center' }}>
              {loading === 'otp' ? 'Sending OTP...' : 'Send OTP'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 12, color: '#333', marginBottom: 6 }}>OTP</Text>
          <TextInput
            value={otp}
            onChangeText={setOtp}
            placeholder="123456"
            keyboardType="number-pad"
            style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 }}
          />
        </View>

        <View style={{ marginTop: 12 }}>
          <TouchableOpacity
            onPress={verifyOtp}
            disabled={loading !== null}
            style={{ backgroundColor: '#3366FF', padding: 14, borderRadius: 12, opacity: loading ? 0.6 : 1 }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', textAlign: 'center' }}>
              {loading === 'verify' ? 'Verifying...' : 'Verify OTP & Login'}
            </Text>
          </TouchableOpacity>
        </View>

        {!isLoggedIn ? (
          <View style={{ marginTop: 12 }}>
            <TouchableOpacity
              onPress={demoLogin}
              disabled={loading !== null}
              style={{ backgroundColor: '#111', padding: 14, borderRadius: 12, opacity: loading ? 0.6 : 1 }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', textAlign: 'center' }}>
                {loading === 'verify' ? 'Please wait...' : 'Demo Login (No OTP)'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={{ marginTop: 20, padding: 14, borderRadius: 12, backgroundColor: '#F7F7F7' }}>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Session</Text>
          <Text style={{ color: '#333' }}>Logged in: {isLoggedIn ? 'Yes' : 'No'}</Text>
          {state.user?.id ? <Text style={{ color: '#333', marginTop: 4 }}>User ID: {state.user.id}</Text> : null}
          {state.user?.phone ? <Text style={{ color: '#333', marginTop: 4 }}>Phone: {state.user.phone}</Text> : null}
          {state.token ? <Text style={{ color: '#333', marginTop: 4 }}>Token: {maskedToken}</Text> : null}

          {isLoggedIn ? (
            <TouchableOpacity
              onPress={() => {
                void signOut();
              }}
              style={{ marginTop: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 12 }}
            >
              <Text style={{ textAlign: 'center', fontWeight: '600' }}>Sign out</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
