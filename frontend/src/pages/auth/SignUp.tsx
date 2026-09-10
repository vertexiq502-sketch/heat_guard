import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useLocalization } from '../../hooks/useLocalization';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { authApi } from '../../api/auth';
import { getRoleRedirectPath } from '../../utils/roleRedirect';

export const SignUp = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore(state => state.setUser);
  const { t } = useLocalization();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'worker' | 'supervisor' | 'authority'>('worker');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await authApi.register(email, password, role, phone);
      setUser(user);
      
      if (role === 'worker') {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(getRoleRedirectPath(role), { replace: true });
      }
    } catch (err: any) {
      setError(err.message || t('signup_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">{t('create_account')}</h1>
          <LanguageSwitcher />
        </div>

        {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('email')}</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('phone_number')}</label>
            <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('password')}</label>
            <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('select_role')}</label>
            <div className="space-y-2">
              <label className={`block p-3 border rounded cursor-pointer ${role === 'worker' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <input type="radio" name="role" value="worker" checked={role === 'worker'} onChange={() => setRole('worker')} className="sr-only" />
                <div className="font-medium">Worker</div>
                <div className="text-xs text-slate-500">{t('worker_desc')}</div>
              </label>
              <label className={`block p-3 border rounded cursor-pointer ${role === 'supervisor' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                <input type="radio" name="role" value="supervisor" checked={role === 'supervisor'} onChange={() => setRole('supervisor')} className="sr-only" />
                <div className="font-medium">Supervisor</div>
                <div className="text-xs text-slate-500">{t('supervisor_desc')}</div>
              </label>
              <label className={`block p-3 border rounded cursor-pointer ${role === 'authority' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                <input type="radio" name="role" value="authority" checked={role === 'authority'} onChange={() => setRole('authority')} className="sr-only" />
                <div className="font-medium">Authority</div>
                <div className="text-xs text-slate-500">{t('authority_desc')}</div>
              </label>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-medium p-3 rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? t('loading') : t('signup')}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600">
          {t('already_have_account')} <Link to="/login" className="text-blue-600 hover:underline">{t('login')}</Link>
        </p>
      </div>
    </div>
  );
};