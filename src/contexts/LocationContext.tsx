import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type LocationState = {
  city: string;
  pincode: string;
  serviceAvailable: boolean;
};

type LocationContextValue = {
  state: LocationState;
  setLocation: (next: { city: string; pincode: string }) => void;
};

const LocationContext = createContext<LocationContextValue | null>(null);

function isServiceablePincode(pincode: string): boolean {
  return /^520\d{3}$/.test(pincode);
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [city, setCity] = useState('Vijayawada');
  const [pincode, setPincode] = useState('520001');

  const value = useMemo<LocationContextValue>(() => {
    const serviceAvailable = isServiceablePincode(pincode);
    return {
      state: { city, pincode, serviceAvailable },
      setLocation: (next) => {
        setCity(next.city);
        setPincode(next.pincode);
      },
    };
  }, [city, pincode]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within a LocationProvider');
  return ctx;
}
