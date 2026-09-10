import { useLocalization } from '../../hooks/useLocalization';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLocalization();
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();

  const handleLanguageChange = (newLang: string) => {
    // 1. Immediately switch UI localization and persist to localStorage
    setLanguage(newLang);

    // 2. If user is authenticated, sync authStore & TanStack Query cache
    if (user) {
      setUser({ ...user, language: newLang });

      queryClient.setQueryData(['profile'], (old: any) =>
        old ? { ...old, language: newLang } : old
      );

      queryClient.setQueryData(['workerDashboard'], (old: any) =>
        old ? { ...old, profile: { ...old.profile, language: newLang } } : old
      );

      // 3. Persist to Supabase users table via backend /profile PATCH
      apiClient.patch('/profile', { language: newLang }).catch((err) => {
        console.warn('[LanguageSwitcher] Could not persist language to backend:', err);
      });
    }
  };

  return (
    <select
      value={language}
      onChange={(e) => handleLanguageChange(e.target.value)}
      className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
      aria-label="Select language"
    >
      <option value="en">English</option>
      <option value="te">తెలుగు (Telugu)</option>
      <option value="hi">हिंदी (Hindi)</option>
    </select>
  );
};
