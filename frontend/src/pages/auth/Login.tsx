import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useLocalization } from '../../hooks/useLocalization';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { authApi } from '../../api/auth';
import { getRoleRedirectPath } from '../../utils/roleRedirect';

type AuthMode = 'password' | 'otp';
type OtpStep = 'input_phone' | 'verify_otp';

export const Login = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore(state => state.setUser);
  const { t } = useLocalization();

  // Mode & Step state
  const [authMode, setAuthMode] = useState<AuthMode>('password');
  const [otpStep, setOtpStep] = useState<OtpStep>('input_phone');

  // Password mode form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // OTP mode form state
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Status state
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper to map backend error codes to localized strings
  const getLocalizedError = (err: any): string => {
    const code = err.response?.data?.error || err.code;
    if (code === 'WORKER_NOT_FOUND') return t('worker_not_found');
    if (code === 'WORKER_ONLY') return t('worker_only');
    if (code === 'INVALID_OTP') return t('invalid_otp');
    if (code === 'INVALID_CREDENTIALS') return t('login_failed');
    if (code === 'INVALID_PHONE') return t('phone_required');
    return err.response?.data?.message || err.message || t('login_failed');
  };

  // Password Login Handler
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!identifier.trim()) {
      setError(t('phone_required'));
      return;
    }

    setLoading(true);
    try {
      const user = await authApi.login(identifier, password);
      setUser(user);
      navigate(getRoleRedirectPath(user.role), { replace: true });
    } catch (err: any) {
      setError(getLocalizedError(err));
    } finally {
      setLoading(false);
    }
  };

  // OTP Step 1: Send OTP Handler
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const rawDigits = otpPhone.replace(/\D/g, '');
    if (rawDigits.length < 10) {
      setError(t('phone_required'));
      return;
    }

    setLoading(true);
    try {
      await authApi.sendDemoOtp(otpPhone);
      setOtpStep('verify_otp');
      setSuccessMsg(t('demo_otp_ready'));
    } catch (err: any) {
      setError(getLocalizedError(err));
    } finally {
      setLoading(false);
    }
  };

  // OTP Step 2: Verify OTP Handler
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otpCode.trim();
    if (!cleanOtp) {
      setError(t('otp_required'));
      return;
    }

    // Exact 4-digit validation
    if (!/^\d{4}$/.test(cleanOtp)) {
      setError(t('invalid_otp'));
      return;
    }

    setLoading(true);
    try {
      const user = await authApi.loginWithOtp(otpPhone, cleanOtp);
      setUser(user);
      navigate(getRoleRedirectPath(user.role), { replace: true });
    } catch (err: any) {
      setError(getLocalizedError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetOtpStep = () => {
    setOtpStep('input_phone');
    setOtpCode('');
    setError('');
    setSuccessMsg('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4 font-sans text-slate-800">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
        
        {/* Header with branding and Language Switcher */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/20 text-white font-bold text-lg">
              🛡️
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Suraksha</h1>
              <p className="text-xs text-orange-600 font-medium tracking-wide uppercase">Heat Shield</p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Authentication Method Selector */}
        <div className="bg-slate-100 p-1.5 rounded-xl flex gap-1 border border-slate-200">
          <button
            type="button"
            id="auth-mode-password"
            onClick={() => {
              setAuthMode('password');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-150 min-h-[44px] ${
              authMode === 'password'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('login_with_password')}
          </button>
          <button
            type="button"
            id="auth-mode-otp"
            onClick={() => {
              setAuthMode('otp');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-150 min-h-[44px] ${
              authMode === 'otp'
                ? 'bg-white text-orange-600 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('login_with_otp')}
          </button>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start gap-2 animate-fadeIn">
            <span className="text-red-500 font-bold">⚠️</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-start gap-2 animate-fadeIn">
            <span className="text-emerald-600 font-bold">✓</span>
            <span className="flex-1">{successMsg}</span>
          </div>
        )}

        {/* PASSWORD LOGIN FORM */}
        {authMode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('phone_or_email')}
              </label>
              <input
                type="text"
                id="login-identifier"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="9876543210 or rajesh@example.com"
                className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition min-h-[44px]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('password')}
              </label>
              <input
                type="password"
                id="login-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition min-h-[44px]"
              />
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              disabled={loading}
              className="w-full bg-slate-900 text-white font-semibold py-3 px-4 rounded-xl hover:bg-slate-800 active:scale-[0.99] transition shadow-md shadow-slate-900/10 disabled:opacity-50 min-h-[48px] flex items-center justify-center text-base"
            >
              {loading ? t('loading') : t('login')}
            </button>
          </form>
        )}

        {/* OTP LOGIN FLOW */}
        {authMode === 'otp' && (
          <div>
            {otpStep === 'input_phone' ? (
              /* STEP 1: Enter Phone Number */
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {t('phone_number')}
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      id="otp-phone-input"
                      required
                      value={otpPhone}
                      onChange={e => setOtpPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
                  <p className="font-semibold flex items-center gap-1">
                    <span>💡</span> {t('demo_hint')}
                  </p>
                </div>

                <button
                  type="submit"
                  id="send-otp-btn"
                  disabled={loading}
                  className="w-full bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-orange-700 active:scale-[0.99] transition shadow-md shadow-orange-600/20 disabled:opacity-50 min-h-[48px] flex items-center justify-center text-base"
                >
                  {loading ? t('sending_otp') : t('send_otp')}
                </button>
              </form>
            ) : (
              /* STEP 2: Verify OTP */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {/* Phone Confirmation Badge */}
                <div className="flex justify-between items-center px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                  <span className="font-medium text-slate-700">{otpPhone}</span>
                  <button
                    type="button"
                    onClick={handleResetOtpStep}
                    className="text-xs text-orange-600 hover:text-orange-700 font-semibold hover:underline"
                  >
                    {t('change_phone')}
                  </button>
                </div>

                {/* Explicit Demo OTP Banner */}
                <div className="p-3.5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl text-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider">
                    Demo Mode
                  </div>
                  <p className="text-sm font-semibold text-orange-950">
                    {t('demo_otp_banner')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 text-center">
                    {t('enter_otp')}
                  </label>
                  <input
                    type="text"
                    id="otp-code-input"
                    required
                    maxLength={4}
                    inputMode="numeric"
                    autoFocus
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234"
                    className="w-full px-4 py-3 border-2 border-orange-300 focus:border-orange-500 rounded-xl text-center text-3xl font-extrabold tracking-widest text-slate-900 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition min-h-[52px]"
                  />
                </div>

                <button
                  type="submit"
                  id="verify-otp-btn"
                  disabled={loading}
                  className="w-full bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-orange-700 active:scale-[0.99] transition shadow-md shadow-orange-600/20 disabled:opacity-50 min-h-[48px] flex items-center justify-center text-base"
                >
                  {loading ? t('verifying_otp') : t('verify_otp')}
                </button>

                <div className="flex justify-between items-center text-xs pt-1 text-slate-500">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpCode('1234');
                      setError('');
                    }}
                    className="text-orange-600 hover:text-orange-700 font-medium hover:underline"
                  >
                    Auto-fill demo OTP (1234)
                  </button>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="text-slate-600 hover:text-slate-900 font-medium hover:underline"
                  >
                    {t('resend_otp')}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Footer Navigation */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            {t('no_account')}{' '}
            <Link to="/signup" className="text-orange-600 font-semibold hover:text-orange-700 hover:underline">
              {t('signup')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};