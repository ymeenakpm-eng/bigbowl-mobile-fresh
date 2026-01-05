import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import * as Location from 'expo-location';

import { getStoredItem, setStoredItem } from '../utils/storage';

type LocationState = {
  city: string;
  pincode: string;
  area: string;
  serviceAvailable: boolean;
};

type LocationContextValue = {
  state: LocationState;
  setLocation: (next: { city: string; pincode: string; area?: string }) => void;
};

const LocationContext = createContext<LocationContextValue | null>(null);

function isServiceablePincode(pincode: string): boolean {
  return /^520\d{3}$/.test(pincode);
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [area, setArea] = useState('');

  useEffect(() => {
    let cancelled = false;
    const LOCATION_KEY = 'bb_location_v1';
    const ASKED_KEY = 'bb_location_permission_asked_v1';

    (async () => {
      try {
        const saved = await getStoredItem(LOCATION_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const savedCity = String(parsed?.city ?? '').trim();
            const savedPincode = String(parsed?.pincode ?? '').trim();
            const savedArea = String(parsed?.area ?? '').trim();
            if (!cancelled && savedCity && savedPincode) {
              setCity(savedCity);
              setPincode(savedPincode);
              setArea(savedArea);
            }
          } catch {
            // ignore
          }
          return;
        }

        const asked = await getStoredItem(ASKED_KEY);
        if (asked === '1') return;
        await setStoredItem(ASKED_KEY, '1');

        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== 'granted') return;

        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 8000 });

        const lat = Number(pos?.coords?.latitude);
        const lon = Number(pos?.coords?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}&addressdetails=1`,
          {
            headers: {
              Accept: 'application/json',
              'Accept-Language': 'en',
            },
          }
        );
        if (!resp.ok) return;
        const json: any = await resp.json();
        const a: any = json?.address;
        const detectedCity = String(a?.city ?? a?.town ?? a?.village ?? a?.suburb ?? a?.state_district ?? '').trim();
        const detectedPincode = String(a?.postcode ?? '').trim();
        const detectedArea = String(
          a?.neighbourhood ?? a?.suburb ?? a?.residential ?? a?.quarter ?? a?.city_district ?? a?.county ?? ''
        ).trim();
        if (!detectedCity || !/^\d{6}$/.test(detectedPincode)) return;

        if (!cancelled) {
          setCity(detectedCity);
          setPincode(detectedPincode);
          setArea(detectedArea);
        }
        await setStoredItem(LOCATION_KEY, JSON.stringify({ city: detectedCity, pincode: detectedPincode, area: detectedArea }));
      } catch {
        return;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<LocationContextValue>(() => {
    const serviceAvailable = isServiceablePincode(pincode);
    return {
      state: { city, pincode, area, serviceAvailable },
      setLocation: (next) => {
        const nextCity = String(next.city ?? '').trim();
        const nextPincode = String(next.pincode ?? '').trim();
        const nextArea = String(next.area ?? '').trim();
        setCity(nextCity);
        setPincode(nextPincode);
        setArea(nextArea);
        setStoredItem('bb_location_v1', JSON.stringify({ city: nextCity, pincode: nextPincode, area: nextArea }));
      },
    };
  }, [area, city, pincode]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within a LocationProvider');
  return ctx;
}
