import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '../api/client';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import { setAppLanguage } from './useLocalization';

// ─── Worker Dashboard ──────────────────────────────────────────────────────────
export const useWorkerData = (explicitCoords?: { latitude: number; longitude: number } | null) => {
  const queryClient = useQueryClient();
  const storedLocation = useLocationStore((state) => state.location);
  const coords = explicitCoords || storedLocation;

  useEffect(() => {
    const channel = supabase
      .channel('worker-mobile-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'risk_assessments' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['workerDashboard'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['workerDashboard'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['workerDashboard', coords?.latitude, coords?.longitude],
    queryFn: async () => {
      const params: Record<string, number> = {};
      if (coords?.latitude !== undefined && coords?.longitude !== undefined) {
        params.latitude = coords.latitude;
        params.longitude = coords.longitude;
      }
      const response = await apiClient.get('/dashboard/worker', { params });
      const profile = response.data?.profile;
      const profileLang = profile?.language || profile?.preferred_language;
      if (profileLang) {
        setAppLanguage(profileLang);
      }
      const currentAuth = useAuthStore.getState().user;
      if (currentAuth && profile) {
        useAuthStore.getState().setUser({ ...currentAuth, ...profile });
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
  });
};

// ─── Supervisor Dashboard ──────────────────────────────────────────────────────
export const useSupervisorData = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('supervisor-mobile-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'risk_assessments' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['supervisorDashboard'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['supervisorDashboard'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'worker_assignments' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['supervisorDashboard'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['supervisorDashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/supervisor');
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
    retry: 1,
  });
};

// ─── Authority Dashboard ───────────────────────────────────────────────────────
export const useAuthorityData = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('authority-mobile-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'escalation_events' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['authorityDashboard'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['authorityDashboard'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'risk_assessments' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['authorityDashboard'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['authorityDashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/authority');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
  });
};
