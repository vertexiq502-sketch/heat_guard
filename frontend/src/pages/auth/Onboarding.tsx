import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { useLocalization } from '../../hooks/useLocalization';

export const Onboarding = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const { t } = useLocalization();

  const [workerType, setWorkerType] = useState('construction');
  const [intensity, setIntensity] = useState('moderate');
  const [exposure, setExposure] = useState('fullSun');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const profileUpdates = { worker_type: workerType, intensity, exposure };
      await authApi.updateProfile(user.id, profileUpdates);
      setUser({ ...user, ...profileUpdates });
      navigate('/worker/home', { replace: true });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-6">
        <h1 className="text-2xl font-bold text-slate-800 text-center">{t('setup_profile')}</h1>
        <p className="text-slate-600 text-center">{t('onboarding_desc')}</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Worker Type</label>
            <select value={workerType} onChange={e => setWorkerType(e.target.value)} className="w-full p-2 border rounded">
              <option value="construction">Construction</option>
              <option value="delivery">Delivery</option>
              <option value="farm">Farm</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Work Intensity</label>
            <select value={intensity} onChange={e => setIntensity(e.target.value)} className="w-full p-2 border rounded">
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="heavy">Heavy</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sun Exposure</label>
            <select value={exposure} onChange={e => setExposure(e.target.value)} className="w-full p-2 border rounded">
              <option value="fullSun">Full Sun</option>
              <option value="partialShade">Partial Shade</option>
              <option value="shade">Shade</option>
            </select>
          </div>
        </div>

        <button onClick={handleSave} disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? t('loading') : t('save_profile')}
        </button>
      </div>
    </div>
  );
};