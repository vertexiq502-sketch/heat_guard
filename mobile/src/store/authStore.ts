import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import type { User } from '../types/user';

interface AuthState {
  user: User | null;
  isLoadingSession: boolean;
  setUser: (user: User | null) => void;
  setLoadingSession: (isLoading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoadingSession: true,
      setUser: (user) => set({ user }),
      setLoadingSession: (isLoadingSession) => set({ isLoadingSession }),
      logout: async () => {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.warn('SignOut error:', e);
        }
        set({ user: null });
      },
    }),
    {
      name: 'heatguard-mobile-auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
