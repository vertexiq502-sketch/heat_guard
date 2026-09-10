import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { useLocalization } from '../../hooks/useLocalization';

interface Props {
  onNavigateToSignUp: () => void;
}

export const LoginScreen: React.FC<Props> = ({ onNavigateToSignUp }) => {
  const { t } = useLocalization();
  const setUser = useAuthStore((state) => state.setUser);

  const [tab, setTab] = useState<'otp' | 'password'>('otp');

  // OTP state
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  // Password state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Status
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick Demo Autofill Helpers
  const fillWorkerOtp = () => {
    setTab('otp');
    setPhone('9876543210');
    setOtp('1234');
    setOtpSent(true);
    setErrorMsg(null);
  };

  const fillWorkerPassword = () => {
    setTab('password');
    setIdentifier('demo.worker1@heatguard.dev');
    setPassword('Demo@1234');
    setErrorMsg(null);
  };

  const fillSupervisorPassword = () => {
    setTab('password');
    setIdentifier('demo.supervisor@heatguard.dev');
    setPassword('Demo@1234');
    setErrorMsg(null);
  };

  const fillAuthorityPassword = () => {
    setTab('password');
    setIdentifier('demo.authority@heatguard.dev');
    setPassword('Demo@1234');
    setErrorMsg(null);
  };

  // OTP Actions
  const handleSendOtp = async () => {
    if (!phone || phone.trim().length < 7) {
      setErrorMsg(t('phone_required'));
      return;
    }
    setErrorMsg(null);
    setOtpLoading(true);
    try {
      await authApi.sendDemoOtp(phone.trim());
      setOtpSent(true);
      setSuccessMsg(t('demo_otp_ready'));
      setOtp('1234');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to send OTP';
      setErrorMsg(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.trim().length !== 4) {
      setErrorMsg(t('otp_required'));
      return;
    }
    setErrorMsg(null);
    setOtpLoading(true);
    try {
      const user = await authApi.loginWithOtp(phone.trim(), otp.trim());
      setUser(user);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || t('invalid_otp');
      setErrorMsg(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  // Password Action
  const handlePasswordLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setErrorMsg('Please enter both identifier and password.');
      return;
    }
    setErrorMsg(null);
    setPasswordLoading(true);
    try {
      const user = await authApi.login(identifier.trim(), password.trim());
      setUser(user);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || t('login_failed');
      setErrorMsg(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Banner */}
        <View style={styles.header}>
          <Text style={styles.logoIcon}>🛡️</Text>
          <Text style={styles.appTitle}>Suraksha Heat Shield</Text>
          <Text style={styles.appTagline}>Personalized Outdoor Heat Risk Protection</Text>
        </View>

        {/* Auth Mode Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            onPress={() => {
              setTab('otp');
              setErrorMsg(null);
            }}
            style={[styles.tab, tab === 'otp' && styles.activeTab]}
          >
            <Text style={[styles.tabText, tab === 'otp' && styles.activeTabText]}>
              Worker OTP
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setTab('password');
              setErrorMsg(null);
            }}
            style={[styles.tab, tab === 'password' && styles.activeTab]}
          >
            <Text style={[styles.tabText, tab === 'password' && styles.activeTabText]}>
              Password Login
            </Text>
          </TouchableOpacity>
        </View>

        {/* Feedback Messages */}
        {errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        )}

        {successMsg && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>✓ {successMsg}</Text>
          </View>
        )}

        {/* Tab 1: OTP Login */}
        {tab === 'otp' && (
          <View style={styles.formContainer}>
            <View style={styles.demoBanner}>
              <Text style={styles.demoBannerText}>
                💡 {t('demo_otp_banner')}
              </Text>
            </View>

            <Text style={styles.label}>{t('phone_number')}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9876543210"
              placeholderTextColor="#94a3b8"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!otpSent}
            />

            {!otpSent ? (
              <TouchableOpacity
                onPress={handleSendOtp}
                disabled={otpLoading}
                style={styles.primaryBtn}
                activeOpacity={0.8}
              >
                {otpLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>{t('send_otp')}</Text>
                )}
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.label}>{t('enter_otp')}</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="1234"
                  placeholderTextColor="#94a3b8"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={4}
                />

                <TouchableOpacity
                  onPress={handleVerifyOtp}
                  disabled={otpLoading}
                  style={styles.primaryBtn}
                  activeOpacity={0.8}
                >
                  {otpLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>{t('verify_otp')}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setOtpSent(false)}
                  style={styles.linkBtn}
                >
                  <Text style={styles.linkText}>{t('change_phone')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Tab 2: Password Login */}
        {tab === 'password' && (
          <View style={styles.formContainer}>
            <Text style={styles.label}>{t('phone_or_email')}</Text>
            <TextInput
              style={styles.input}
              placeholder="worker@example.com or phone"
              placeholderTextColor="#94a3b8"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
            />

            <Text style={styles.label}>{t('password')}</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              onPress={handlePasswordLogin}
              disabled={passwordLoading}
              style={styles.primaryBtn}
              activeOpacity={0.8}
            >
              {passwordLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>{t('login')}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Demo Fast-Fill Bar */}
        <View style={styles.quickFillContainer}>
          <Text style={styles.quickFillTitle}>Quick Demo Logins (1-Tap):</Text>
          <View style={styles.quickFillButtons}>
            <TouchableOpacity onPress={fillWorkerOtp} style={styles.quickFillBtn}>
              <Text style={styles.quickFillBtnText}>👷 Worker (OTP 1234)</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={fillWorkerPassword} style={styles.quickFillBtn}>
              <Text style={styles.quickFillBtnText}>👷 Worker (Pass)</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={fillSupervisorPassword} style={styles.quickFillBtn}>
              <Text style={styles.quickFillBtnText}>👨‍💼 Supervisor</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={fillAuthorityPassword} style={styles.quickFillBtn}>
              <Text style={styles.quickFillBtnText}>🏛️ Authority</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Up Link */}
        <TouchableOpacity
          onPress={onNavigateToSignUp}
          style={styles.signUpRow}
        >
          <Text style={styles.signUpText}>
            {t('no_account')} <Text style={styles.signUpLink}>{t('signup')}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  appTagline: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#1e293b',
    fontWeight: '700',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  demoBanner: {
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  demoBannerText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 16,
  },
  otpInput: {
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  linkBtn: {
    alignItems: 'center',
    marginTop: 14,
  },
  linkText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#b91c1c',
  },
  successBox: {
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  successText: {
    fontSize: 13,
    color: '#15803d',
    fontWeight: '600',
  },
  quickFillContainer: {
    marginTop: 24,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickFillTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  quickFillButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickFillBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickFillBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  signUpRow: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  signUpText: {
    fontSize: 13,
    color: '#64748b',
  },
  signUpLink: {
    color: '#2563eb',
    fontWeight: '700',
  },
});
