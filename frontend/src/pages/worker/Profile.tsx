import { useState } from 'react';
import { useWorkerProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useLocalization } from '../../hooks/useLocalization';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { UserCheck, AlertCircle, Edit3, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { User } from '../../types/user';

const LABEL = 'text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1 block';
const VALUE = 'text-base font-semibold text-gray-900';
const INPUT = 'w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white';

const WORKER_TYPES: Record<string, string> = {
  construction: '🏗️ Construction',
  delivery: '🛵 Delivery / Logistics',
  farm: '🌾 Agricultural / Farm',
};

const INTENSITIES: Record<string, string> = {
  light: 'Light (Supervisory / Minimal physical exertion)',
  moderate: 'Moderate (Walking, carrying light tools)',
  heavy: 'Heavy (Digging, scaffolding, heavy lifting)',
};

const EXPOSURES: Record<string, string> = {
  fullSun: '☀️ Full Sun (Direct overhead sunlight)',
  partialShade: '⛅ Partial Shade (Intermittent shade)',
  shade: '🏢 Shade (Covered area / Indoors)',
};

const DURATIONS: Record<string, string> = {
  short: 'Short (< 2 hours continuous)',
  moderate: 'Moderate (2–4 hours continuous)',
  prolonged: 'Prolonged (4+ hours continuous)',
};

const CLOTHINGS: Record<string, string> = {
  normal: 'Normal Clothing (Light, breathable cotton)',
  moderatePPE: 'Moderate PPE (Safety vest, boots, hard hat)',
  heavyPPE: 'Heavy PPE (Full coveralls, heavy gear, rubber boots)',
};

export const Profile = () => {
  const { data: profile, isLoading, isError, refetch } = useWorkerProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { t } = useLocalization();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (isLoading) {
    return (
      <div className="p-4 max-w-md mx-auto space-y-4">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 max-w-md mx-auto h-[60vh] flex items-center">
        <ErrorState message={t('error_loading')} onRetry={() => refetch()} />
      </div>
    );
  }

  if (!profile) return null;

  // Check if profile is missing worker details
  const isProfileIncomplete =
    !profile.name ||
    !profile.phone ||
    !profile.worker_type ||
    !profile.intensity ||
    !profile.exposure ||
    !profile.duration ||
    !profile.clothing;

  const handleEditClick = () => {
    setFormData({
      name: profile.name || '',
      phone: profile.phone || '',
      language: profile.language || 'en',
      worker_type: profile.worker_type || 'construction',
      intensity: profile.intensity || 'moderate',
      exposure: profile.exposure || 'partialShade',
      duration: profile.duration || 'moderate',
      clothing: profile.clothing || 'normal',
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

    // Validate phone number if user provided one
    const rawPhone = formData.phone ? formData.phone.trim() : '';
    if (rawPhone && !/^\+?[\d\s\-()+]{7,20}$/.test(rawPhone)) {
      setSaveError('Please enter a valid phone number (at least 7 digits) or leave it blank.');
      return;
    }

    const payload: Partial<User> = {
      name: formData.name ? formData.name.trim() : undefined,
      phone: rawPhone.length > 0 ? rawPhone : null,
      language: formData.language || 'en',
      worker_type: formData.worker_type || 'construction',
      intensity: formData.intensity || 'moderate',
      exposure: formData.exposure || 'partialShade',
      duration: formData.duration || 'moderate',
      clothing: formData.clothing || 'normal',
    };

    updateProfile(payload, {
      onSuccess: () => {
        setIsEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.message || t('error_saving_profile');
        setSaveError(msg);
      },
    });
  };

  const handleChange = (field: keyof User, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-13 h-13 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-800 text-xl font-bold uppercase shadow-sm border border-blue-200">
            {profile.name?.charAt(0) || <UserCheck className="w-6 h-6 text-blue-600" />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">
              {profile.name || profile.email?.split('@')[0] || 'Worker'}
            </h1>
            <p className="text-gray-500 text-xs capitalize flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
              {t('role_worker')} • {profile.email}
            </p>
          </div>
        </div>

        {!isEditing && (
          <button
            onClick={handleEditClick}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm ${isProfileIncomplete
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isProfileIncomplete ? 'Fill Worker Details' : t('edit_profile')}
          </button>
        )}
      </div>

      {/* Incomplete profile banner */}
      {!isEditing && isProfileIncomplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
              Worker Details Incomplete
            </h4>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Please fill your work type, shift intensity, and exposure to activate personalized heat risk calculations and safety alerts in Supabase.
            </p>
            <button
              onClick={handleEditClick}
              className="mt-2.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-md shadow-xs transition"
            >
              Fill Details Now
            </button>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 p-3 rounded-xl flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <p className="text-xs font-medium text-green-800">
            {t('profile_updated')} Details saved to Supabase.
          </p>
        </div>
      )}

      {/* Error Banner */}
      {saveError && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-start gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-red-800">{saveError}</p>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
        {/* Basic Info */}
        <div className="p-4">
          <label className={LABEL}>{t('name')}</label>
          {isEditing ? (
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar"
              value={formData.name ?? ''}
              onChange={(e) => handleChange('name', e.target.value)}
              className={INPUT}
            />
          ) : (
            <p className={VALUE}>
              {profile.name || <span className="text-gray-400 italic text-sm">Not set</span>}
            </p>
          )}
        </div>

        <div className="p-4">
          <label className={LABEL}>{t('phone_number')}</label>
          {isEditing ? (
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={formData.phone ?? ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={INPUT}
            />
          ) : (
            <p className={VALUE}>
              {profile.phone || <span className="text-gray-400 italic text-sm">Not set</span>}
            </p>
          )}
        </div>

        <div className="p-4">
          <label className={LABEL}>{t('language')}</label>
          {isEditing ? (
            <select
              value={formData.language || 'en'}
              onChange={(e) => handleChange('language', e.target.value)}
              className={INPUT}
            >
              <option value="en">English</option>
              <option value="te">Telugu (తెలుగు)</option>
              <option value="hi">Hindi (हिन्दी)</option>
            </select>
          ) : (
            <p className={VALUE}>
              {profile.language === 'te'
                ? 'Telugu (తెలుగు)'
                : profile.language === 'hi'
                  ? 'Hindi (हिन्दी)'
                  : 'English'}
            </p>
          )}
        </div>

        {/* Work Profile Section */}
        <div className="p-4 bg-gray-50/70">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Work & Heat Risk Profile
            </p>
          </div>

          <div className="space-y-4">
            {/* Worker Type */}
            <div>
              <label className={LABEL}>{t('worker_type')}</label>
              {isEditing ? (
                <select
                  value={formData.worker_type || 'construction'}
                  onChange={(e) => handleChange('worker_type', e.target.value)}
                  className={INPUT}
                >
                  <option value="construction">🏗️ Construction</option>
                  <option value="delivery">🛵 Delivery / Logistics</option>
                  <option value="farm">🌾 Agricultural / Farm</option>
                </select>
              ) : (
                <p className={VALUE}>
                  {profile.worker_type ? (
                    WORKER_TYPES[profile.worker_type] || profile.worker_type
                  ) : (
                    <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs font-medium">
                      Not set (Click Fill Details)
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Intensity */}
            <div>
              <label className={LABEL}>{t('intensity')}</label>
              {isEditing ? (
                <select
                  value={formData.intensity || 'moderate'}
                  onChange={(e) => handleChange('intensity', e.target.value)}
                  className={INPUT}
                >
                  <option value="light">Light (Supervisory / Minimal physical exertion)</option>
                  <option value="moderate">Moderate (Walking, light tools)</option>
                  <option value="heavy">Heavy (Digging, scaffolding, heavy lifting)</option>
                </select>
              ) : (
                <p className={VALUE}>
                  {profile.intensity ? (
                    INTENSITIES[profile.intensity] || profile.intensity
                  ) : (
                    <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs font-medium">
                      Not set
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Sun Exposure */}
            <div>
              <label className={LABEL}>{t('exposure')}</label>
              {isEditing ? (
                <select
                  value={formData.exposure || 'partialShade'}
                  onChange={(e) => handleChange('exposure', e.target.value)}
                  className={INPUT}
                >
                  <option value="fullSun">☀️ Full Sun (Direct overhead sunlight)</option>
                  <option value="partialShade">⛅ Partial Shade (Intermittent shade)</option>
                  <option value="shade">🏢 Shade (Indoor / Covered area)</option>
                </select>
              ) : (
                <p className={VALUE}>
                  {profile.exposure ? (
                    EXPOSURES[profile.exposure] || profile.exposure
                  ) : (
                    <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs font-medium">
                      Not set
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Exposure Duration */}
            <div>
              <label className={LABEL}>{t('duration')}</label>
              {isEditing ? (
                <select
                  value={formData.duration || 'moderate'}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  className={INPUT}
                >
                  <option value="short">Short (&lt; 2 hours continuous)</option>
                  <option value="moderate">Moderate (2–4 hours continuous)</option>
                  <option value="prolonged">Prolonged (4+ hours continuous)</option>
                </select>
              ) : (
                <p className={VALUE}>
                  {profile.duration ? (
                    DURATIONS[profile.duration] || profile.duration
                  ) : (
                    <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs font-medium">
                      Not set
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Clothing / PPE */}
            <div>
              <label className={LABEL}>{t('clothing')}</label>
              {isEditing ? (
                <select
                  value={formData.clothing || 'normal'}
                  onChange={(e) => handleChange('clothing', e.target.value)}
                  className={INPUT}
                >
                  <option value="normal">Normal Clothing (Light, breathable cotton)</option>
                  <option value="moderatePPE">Moderate PPE (Safety vest, boots, hard hat)</option>
                  <option value="heavyPPE">Heavy PPE (Full coveralls, heavy gear)</option>
                </select>
              ) : (
                <p className={VALUE}>
                  {profile.clothing ? (
                    CLOTHINGS[profile.clothing] || profile.clothing
                  ) : (
                    <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs font-medium">
                      Not set
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {isEditing ? (
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl shadow-sm text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 bg-blue-600 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {isPending ? t('saving') : t('save')}
          </button>
        </div>
      ) : (
        <p className="text-xs text-center text-gray-400 mt-2">
          Profile data is stored in Supabase to calculate your personalized heat risk.
        </p>
      )}
    </div>
  );
};
