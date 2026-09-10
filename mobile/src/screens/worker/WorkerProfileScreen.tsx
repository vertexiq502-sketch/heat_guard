import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useWorkerProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useLocalization } from '../../hooks/useLocalization';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import type { User } from '../../types/user';

export const WorkerProfileScreen: React.FC = () => {
  const { t } = useLocalization();
  const { data: profile, isLoading, isError, refetch } = useWorkerProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const [formData, setFormData] = useState<Partial<User>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
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
    }
  }, [profile]);

  if (isLoading) {
    return <LoadingSkeleton message={t('loading')} />;
  }

  if (isError) {
    return (
      <ErrorState
        message={t('error_loading')}
        onRetry={() => refetch()}
      />
    );
  }

  const handleSave = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    updateProfile(formData, {
      onSuccess: () => {
        setSuccessMsg(t('profile_updated'));
        setTimeout(() => setSuccessMsg(null), 4000);
      },
      onError: (err: any) => {
        const msg = err.response?.data?.error || err.message || t('error_saving_profile');
        setErrorMsg(msg);
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('nav_profile')}</Text>
        <Text style={styles.subtitle}>
          Personal factors dynamically adjust your heat risk threshold
        </Text>
      </View>

      {successMsg && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>✓ {successMsg}</Text>
        </View>
      )}

      {errorMsg && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
        </View>
      )}

      <View style={styles.formCard}>
        {/* Name */}
        <Text style={styles.label}>{t('name')}</Text>
        <TextInput
          style={styles.input}
          value={formData.name || ''}
          onChangeText={(val) => setFormData({ ...formData, name: val })}
          placeholder="e.g. Rajesh Kumar"
          placeholderTextColor="#94a3b8"
        />

        {/* Phone */}
        <Text style={styles.label}>{t('phone_number')}</Text>
        <TextInput
          style={styles.input}
          value={formData.phone || ''}
          onChangeText={(val) => setFormData({ ...formData, phone: val })}
          placeholder="e.g. 9876543210"
          placeholderTextColor="#94a3b8"
          keyboardType="phone-pad"
        />

        {/* Preferred Language */}
        <Text style={styles.label}>{t('language')}</Text>
        <View style={styles.optionRow}>
          {[
            { key: 'en', label: 'English' },
            { key: 'te', label: 'తెలుగు (Telugu)' },
            { key: 'hi', label: 'हिन्दी (Hindi)' },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => setFormData({ ...formData, language: item.key })}
              style={[
                styles.optionBtn,
                formData.language === item.key && styles.activeOptionBtn,
              ]}
            >
              <Text
                style={[
                  styles.optionBtnText,
                  formData.language === item.key && styles.activeOptionBtnText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Worker Type */}
        <Text style={styles.label}>{t('worker_type')}</Text>
        <View style={styles.optionRow}>
          {[
            { key: 'construction', label: '🏗️ Construction' },
            { key: 'delivery', label: '🛵 Delivery' },
            { key: 'farm', label: '🌾 Agriculture' },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => setFormData({ ...formData, worker_type: item.key })}
              style={[
                styles.optionBtn,
                formData.worker_type === item.key && styles.activeOptionBtn,
              ]}
            >
              <Text
                style={[
                  styles.optionBtnText,
                  formData.worker_type === item.key && styles.activeOptionBtnText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Intensity */}
        <Text style={styles.label}>{t('intensity')}</Text>
        <View style={styles.optionRow}>
          {[
            { key: 'light', label: 'Light' },
            { key: 'moderate', label: 'Moderate' },
            { key: 'heavy', label: 'Heavy' },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => setFormData({ ...formData, intensity: item.key })}
              style={[
                styles.optionBtn,
                formData.intensity === item.key && styles.activeOptionBtn,
              ]}
            >
              <Text
                style={[
                  styles.optionBtnText,
                  formData.intensity === item.key && styles.activeOptionBtnText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sun Exposure */}
        <Text style={styles.label}>{t('exposure')}</Text>
        <View style={styles.optionRow}>
          {[
            { key: 'fullSun', label: '☀️ Full Sun' },
            { key: 'partialShade', label: '⛅ Partial Shade' },
            { key: 'shade', label: '🏢 Shade' },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => setFormData({ ...formData, exposure: item.key })}
              style={[
                styles.optionBtn,
                formData.exposure === item.key && styles.activeOptionBtn,
              ]}
            >
              <Text
                style={[
                  styles.optionBtnText,
                  formData.exposure === item.key && styles.activeOptionBtnText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Clothing / PPE */}
        <Text style={styles.label}>{t('clothing')}</Text>
        <View style={styles.optionRow}>
          {[
            { key: 'normal', label: 'Light Cotton' },
            { key: 'moderatePPE', label: 'Moderate PPE' },
            { key: 'heavyPPE', label: 'Heavy Coveralls' },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => setFormData({ ...formData, clothing: item.key })}
              style={[
                styles.optionBtn,
                formData.clothing === item.key && styles.activeOptionBtn,
              ]}
            >
              <Text
                style={[
                  styles.optionBtnText,
                  formData.clothing === item.key && styles.activeOptionBtnText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={isPending}
          style={styles.saveBtn}
          activeOpacity={0.8}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>{t('save_profile')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  optionBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeOptionBtn: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  optionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  activeOptionBtnText: {
    color: '#2563eb',
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  successBox: {
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  successText: {
    color: '#15803d',
    fontSize: 13,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
  },
});
