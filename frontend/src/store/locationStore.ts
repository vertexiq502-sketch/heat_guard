import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'unavailable';

interface LocationStoreState {
  location: LocationCoords | null;
  loading: boolean;
  error: string | null;
  permissionStatus: PermissionStatus;
  setLocation: (location: LocationCoords | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPermissionStatus: (permissionStatus: PermissionStatus) => void;
}

export const useLocationStore = create<LocationStoreState>()(
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
      name: 'heatguard-worker-location',
      partialize: (state) => ({
        location: state.location,
        permissionStatus: state.permissionStatus,
      }),
    }
  )
);
