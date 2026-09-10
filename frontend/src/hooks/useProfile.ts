import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { setAppLanguage } from './useLocalization';
import type { User } from '../types/user';

// ─── Fetch the authenticated user's own profile ───────────────────────────────
// Used by Worker Profile page — avoids calling the heavier /dashboard/worker endpoint.
// This mirrors the same pattern used by Supervisor and Authority profile pages.
export const useWorkerProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await apiClient.get('/profile');
      return res.data as User;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (profileData: Partial<User>) => {
      const response = await apiClient.patch('/profile', profileData);
      return response.data.profile as User;
    },
    onSuccess: (updatedProfile) => {
      // If language changed, update the app localization
      if (updatedProfile.language && (!user || updatedProfile.language !== user.language)) {
        setAppLanguage(updatedProfile.language);
      }

      // Update the user in our Zustand store so the nav bar / layout reflects changes
      setUser({ ...user, ...updatedProfile } as User);

      // Immediately sync TanStack Query profile cache
      queryClient.setQueryData(['profile'], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      // Invalidate relevant queries so the dashboard picks up the new data
      if (updatedProfile.role === 'worker') {
        queryClient.invalidateQueries({ queryKey: ['workerDashboard'] });
      }
    },
  });
};
