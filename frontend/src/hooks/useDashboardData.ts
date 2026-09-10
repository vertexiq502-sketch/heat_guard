import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '../api/client';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { setAppLanguage } from './useLocalization';

// ─── Worker Dashboard ──────────────────────────────────────────────────────────
export const useWorkerData = () => {
  const queryClient = useQueryClient();

  // Supabase Realtime: invalidate on new risk assessments or alerts for this worker
  useEffect(() => {
    const channel = supabase
      .channel('worker-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'risk_assessments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['workerDashboard'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['workerDashboard'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['workerDashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/worker');
      const profile = response.data?.profile;
      if (profile?.language) {
        setAppLanguage(profile.language);
        const currentAuth = useAuthStore.getState().user;
        if (currentAuth) {
          useAuthStore.getState().setUser({ ...currentAuth, ...profile });
        }
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000,   // 5 minutes — weather service caches for 5 min
    refetchInterval: 5 * 60 * 1000, // auto-refetch every 5 min
    retry: 1,
    refetchOnWindowFocus: true,
  });
};

// ─── Supervisor Dashboard ──────────────────────────────────────────────────────
export const useSupervisorData = () => {
  const queryClient = useQueryClient();

  // Realtime: invalidate on any risk, alert, or assignment changes
  useEffect(() => {
    const channel = supabase
      .channel('supervisor-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'risk_assessments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['supervisorDashboard'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['supervisorDashboard'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'worker_assignments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['supervisorDashboard'] });
      })
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
    staleTime: 2 * 60 * 1000,      // 2 minutes
    refetchInterval: 2 * 60 * 1000, // auto-refetch every 2 min
    retry: 1,
    refetchOnWindowFocus: true,
  });
};

// ─── Authority Dashboard ───────────────────────────────────────────────────────
export const useAuthorityData = () => {
  const queryClient = useQueryClient();

  // Realtime: invalidate on any escalation, alert, or risk changes
  useEffect(() => {
    const channel = supabase
      .channel('authority-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'escalation_events' }, () => {
        queryClient.invalidateQueries({ queryKey: ['authorityDashboard'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['authorityDashboard'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'risk_assessments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['authorityDashboard'] });
      })
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
    refetchOnWindowFocus: true,
  });
};
