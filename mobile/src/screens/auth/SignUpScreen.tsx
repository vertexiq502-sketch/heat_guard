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
import type { Role } from '../../types/user';

interface Props {
  onNavigateToLogin: () => void;
}

export const SignUpScreen: React.FC<Props> = ({ onNavigateToLogin }) => {
  const { t } = useLocalization();
  const setUser = useAuthStore((state) => state.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('worker');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      const user = await authApi.register(email, password, role, phone);
      setUser(user);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || t('signup_failed');
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logoIcon}>🛡️</Text>
          <Text style={styles.appTitle}>{t('create_account')}</Text>
          <Text style={styles.appTagline}>Join Suraksha Heat Shield Protection Network</Text>
        </View>

        {errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        )}

        <View style={styles.formContainer}>
          <Text style={styles.label}>{t('email')}</Text>
          <TextInput
            style={styles.input}
            placeholder="worker@example.com"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>{t('password')}</Text>
          <TextInput
            style={styles.input}
            placeholder="Min 6 characters"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.label}>{t('phone_number')}</Text>
          <TextInput
            style={styles.input}
            placeholder="9876543210"
            placeholderTextColor="#94a3b8"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>{t('select_role')}</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              onPress={() => setRole('worker')}
              style={[styles.roleCard, role === 'worker' && styles.activeRoleCard]}
            >
              <Text style={styles.roleEmoji}>👷</Text>
              <Text style={[styles.roleName, role === 'worker' && styles.activeRoleText]}>
                {t('role_worker')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRole('supervisor')}
              style={[styles.roleCard, role === 'supervisor' && styles.activeRoleCard]}
            >
              <Text style={styles.roleEmoji}>👨‍💼</Text>
              <Text style={[styles.roleName, role === 'supervisor' && styles.activeRoleText]}>
                {t('role_supervisor')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRole('authority')}
              style={[styles.roleCard, role === 'authority' && styles.activeRoleCard]}
            >
              <Text style={styles.roleEmoji}>🏛️</Text>
              <Text style={[styles.roleName, role === 'authority' && styles.activeRoleText]}>
                {t('role_authority')}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading}
            style={styles.primaryBtn}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>{t('create_account')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onNavigateToLogin} style={styles.loginRow}>
          <Text style={styles.loginText}>
            {t('already_have_account')} <Text style={styles.loginLink}>{t('login')}</Text>
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
    marginBottom: 24,
  },
  logoIcon: {
    fontSize: 44,
    marginBottom: 6,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  appTagline: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
  roleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  roleCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeRoleCard: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  roleEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  roleName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  activeRoleText: {
    color: '#2563eb',
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
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
  loginRow: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  loginText: {
    fontSize: 13,
    color: '#64748b',
  },
  loginLink: {
    color: '#2563eb',
    fontWeight: '700',
  },
});
