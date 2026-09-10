import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { setAppLanguage } from './useLocalization';
import type { User } from '../types/user';

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
      if (updatedProfile.language && (!user || updatedProfile.language !== user.language)) {
        setAppLanguage(updatedProfile.language);
      }

      setUser({ ...user, ...updatedProfile } as User);
      queryClient.setQueryData(['profile'], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      if (updatedProfile.role === 'worker') {
        queryClient.invalidateQueries({ queryKey: ['workerDashboard'] });
      }
    },
  });
};
