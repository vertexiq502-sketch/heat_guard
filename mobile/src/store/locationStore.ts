import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'unavailable';

interface LocationState {
  location: LocationCoords | null;
  loading: boolean;
  error: string | null;
  permissionStatus: PermissionStatus;
  setLocation: (location: LocationCoords | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPermissionStatus: (permissionStatus: PermissionStatus) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      location: null,
      loading: false,
      error: null,
      permissionStatus: 'prompt',
      setLocation: (location) => set({ location, error: null }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setPermissionStatus: (permissionStatus) => set({ permissionStatus }),
    }),
    {
      name: 'heatguard-mobile-location',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        location: state.location,
        permissionStatus: state.permissionStatus,
      }),
    }
  )
);
