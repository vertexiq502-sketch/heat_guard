import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useUpdateProfile } from '../../hooks/useProfile';
import { useLocalization } from '../../hooks/useLocalization';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import type { User } from '../../types/user';

const LABEL = 'text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1 block';
const VALUE = 'text-base font-semibold text-gray-900';
const INPUT = 'w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm';

export const SupervisorProfile = () => {
  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await apiClient.get('/profile');
      return res.data as User;
    }
  });

  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { t } = useLocalization();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (isLoading) return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <LoadingSkeleton lines={5} />
    </div>
  );

  if (isError || !profile) return (
    <div className="p-6 max-w-2xl mx-auto">
      <ErrorState message={t('error_loading')} onRetry={() => refetch()} />
    </div>
  );

  const handleEditClick = () => {
    setFormData({
      name: profile.name,
      phone: profile.phone,
      language: profile.language,
    });
    setSaveError(null);
    setSaveSuccess(false);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSave = () => {
    setSaveError(null);
    setSaveSuccess(false);

    updateProfile(formData, {
      onSuccess: () => {
        setIsEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        refetch(); // refresh the local query data
      },
      onError: (err: any) => {
        setSaveError(err.response?.data?.message || err.message || t('error_saving_profile'));
      }
    });
  };

  const handleChange = (field: keyof User, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('nav_profile')}</h1>
        {!isEditing && (
          <button
            onClick={handleEditClick}
            className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100"
          >
            {t('edit_profile')}
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
          <p className="text-sm text-green-700">{t('profile_updated')}</p>
        </div>
      )}

      {saveError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-sm text-red-700">{saveError}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-800 text-2xl font-bold uppercase shadow-sm">
            {profile.name?.charAt(0) || 'S'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile.name || 'Supervisor'}</h2>
            <p className="text-gray-500 text-sm capitalize">{t('role_supervisor')}</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className={LABEL}>{t('name')}</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className={INPUT}
              />
            ) : (
              <p className={VALUE}>{profile.name || '-'}</p>
            )}
          </div>

          <div>
            <label className={LABEL}>{t('phone_number')}</label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={INPUT}
              />
            ) : (
              <p className={VALUE}>{profile.phone || '-'}</p>
            )}
          </div>

          <div>
            <label className={LABEL}>{t('language')}</label>
            {isEditing ? (
              <select
                value={formData.language || 'en'}
                onChange={(e) => handleChange('language', e.target.value)}
                className={INPUT}
              >
                <option value="en">English</option>
                <option value="te">Telugu</option>
                <option value="hi">Hindi</option>
              </select>
            ) : (
              <p className={VALUE}>{profile.language === 'te' ? 'Telugu' : profile.language === 'hi' ? 'Hindi' : 'English'}</p>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="flex gap-4 justify-end">
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="px-6 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-6 py-2 bg-green-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isPending ? t('saving') : t('save')}
          </button>
        </div>
      )}
    </div>
  );
};
