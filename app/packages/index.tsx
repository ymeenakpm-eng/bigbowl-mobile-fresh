import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { useLocation } from '@/src/contexts/LocationContext';

import { apiJson } from '@/src/utils/api';

type PackageItem = {
  id: string;
  title: string;
  cuisine: string;
  minPax: number;
  basePrice: number;
  perPax: number;
  isVeg: boolean;
};

export default function PackagesScreen() {
  const router = useRouter();
  const location = useLocation();

  const [items, setItems] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const city = location.state.city;

  const fetchPackages = async () => {
    const data = await apiJson('/api/catalog/packages');
    const next = Array.isArray((data as any)?.items) ? ((data as any).items as PackageItem[]) : [];
    setItems(next);
  };

  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        setLoading(true);
        await fetchPackages();
      } catch (e: any) {
        setErr(String(e?.message ?? e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const subtitle = useMemo(() => {
    return city ? `Showing packages for ${city}` : 'Browse packages';
  }, [city]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            try {
              setRefreshing(true);
              setErr(null);
              await fetchPackages();
            } catch (e: any) {
              setErr(String(e?.message ?? e));
            } finally {
              setRefreshing(false);
            }
          }}
        />
      }
    >
      {/* Header with back button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
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
        <Text style={{ fontSize: 24, fontWeight: '700' }}>Packages</Text>
      </View>

      <Text style={{ color: '#666666', marginBottom: 16 }}>{subtitle}</Text>

      {loading ? (
        <View style={{ paddingVertical: 20 }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 10, color: '#666666' }}>Loading packages...</Text>
        </View>
      ) : null}

      {err ? (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#D11', marginBottom: 10 }}>{err}</Text>
          <TouchableOpacity
            onPress={async () => {
              try {
                setErr(null);
                setLoading(true);
                await fetchPackages();
              } catch (e: any) {
                Alert.alert('Failed', String(e?.message ?? e));
              } finally {
                setLoading(false);
              }
            }}
            style={{
              backgroundColor: '#111',
              paddingVertical: 10,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {items.map((pkg) => {
        return (
          <TouchableOpacity
            key={pkg.id}
            activeOpacity={0.9}
            onPress={() => {
              router.push({ pathname: '/quote', params: { packageId: pkg.id } } as any);
            }}
            style={{
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#eeeeee',
              padding: 14,
              marginBottom: 12,
              backgroundColor: '#FFFFFF',
            }}
          >
            <Text style={{ fontWeight: '700', fontSize: 16, color: '#333333' }}>{pkg.title}</Text>
            <Text style={{ marginTop: 4, color: '#666666' }}>
              {pkg.cuisine} • Min {pkg.minPax} • {pkg.isVeg ? 'Veg' : 'Non-veg'}
            </Text>
            <Text style={{ marginTop: 6, color: '#333333' }}>
              Base ₹{(Number(pkg.basePrice) / 100).toFixed(0)} • Per pax ₹{(Number(pkg.perPax) / 100).toFixed(0)}
            </Text>
            <View style={{ marginTop: 10 }}>
              <View
                style={{
                  backgroundColor: '#3366FF',
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Get Quote</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      {!loading && !err && items.length === 0 ? (
        <Text style={{ color: '#666666' }}>No packages found.</Text>
      ) : null}
    </ScrollView>
  );
}