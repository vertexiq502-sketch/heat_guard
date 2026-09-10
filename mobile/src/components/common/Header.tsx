import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalization } from '../../hooks/useLocalization';
import { useAuthStore } from '../../store/authStore';

interface Props {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<Props> = ({ title = 'Suraksha Heat Shield', subtitle }) => {
  const { language, setLanguage } = useLocalization();
  const { user, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandIcon}>🛡️</Text>
          <View>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? (
              <Text style={styles.subtitle}>{subtitle}</Text>
            ) : user?.role ? (
              <Text style={styles.roleBadge}>Role: {user.role.toUpperCase()}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.actionsContainer}>
          {/* Language Switcher */}
          <View style={styles.langGroup}>
            <TouchableOpacity
              onPress={() => setLanguage('en')}
              style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
            >
              <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>
                EN
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setLanguage('te')}
              style={[styles.langBtn, language === 'te' && styles.langBtnActive]}
            >
              <Text style={[styles.langText, language === 'te' && styles.langTextActive]}>
                తె
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setLanguage('hi')}
              style={[styles.langBtn, language === 'hi' && styles.langBtnActive]}
            >
              <Text style={[styles.langText, language === 'hi' && styles.langTextActive]}>
                हि
              </Text>
            </TouchableOpacity>
          </View>

          {/* Logout Button if authenticated */}
          {user && (
            <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.7}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  roleBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563eb',
    marginTop: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langGroup: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
  },
  langBtn: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  langBtnActive: {
    backgroundColor: '#2563eb',
  },
  langText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  langTextActive: {
    color: '#ffffff',
  },
  logoutBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
  },
  logoutText: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '600',
  },
});
