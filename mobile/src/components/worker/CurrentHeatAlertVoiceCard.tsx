import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalization } from '../../hooks/useLocalization';
import { useExpoSpeech } from '../../hooks/useExpoSpeech';
import { useAuthStore } from '../../store/authStore';
import {
  buildLocalizedVoiceAlert,
  resolveWorkerLanguage,
  type VoiceAlertContext,
} from '../../utils/voiceAlertGenerator';

interface Props {
  weather?: VoiceAlertContext['weather'];
  risk?: VoiceAlertContext['risk'];
  profile?: VoiceAlertContext['profile'];
  alert?: VoiceAlertContext['alert'];
  workerLanguage?: string;
  siteName?: string;
}

export const CurrentHeatAlertVoiceCard: React.FC<Props> = ({
  weather,
  risk,
  profile,
  alert,
  workerLanguage,
  siteName,
}) => {
  const { t, language: uiLanguage } = useLocalization();
  const { isSpeaking, voiceUnavailable, speak, stop } = useExpoSpeech();
  const authUser = useAuthStore((state) => state.user);

  const effectiveLanguage = resolveWorkerLanguage(
    uiLanguage || workerLanguage || profile?.language || (profile as any)?.preferred_language || authUser?.language
  );

  const rawLevel = (risk?.risk_level || 'green').toLowerCase();
  const isDanger = rawLevel === 'red' || rawLevel === 'danger';
  const isHighRisk = rawLevel === 'orange' || rawLevel === 'high_risk';
  const isCaution = rawLevel === 'yellow' || rawLevel === 'caution';

  const riskLabel = isDanger
    ? t('danger')
    : isHighRisk
    ? t('high_risk')
    : isCaution
    ? t('caution')
    : t('safe');

  const score =
    risk?.risk_score !== undefined
      ? Math.round(risk.risk_score)
      : risk?.effective_temp !== undefined
      ? Math.round(risk.effective_temp)
      : null;

  const temp = weather?.temperature !== undefined ? Math.round(weather.temperature) : null;
  const humidity = weather?.humidity !== undefined ? Math.round(weather.humidity) : null;

  const handleToggleVoice = () => {
    if (isSpeaking) {
      stop();
    } else {
      const alertData = buildLocalizedVoiceAlert(
        { weather, risk, profile, alert },
        effectiveLanguage
      );
      speak(alertData.text, alertData.language);
    }
  };

  const bgStyle = isDanger
    ? styles.dangerBg
    : isHighRisk || isCaution
    ? styles.cautionBg
    : styles.safeBg;

  const btnBg = isDanger
    ? styles.dangerBtn
    : isHighRisk || isCaution
    ? styles.cautionBtn
    : styles.safeBtn;

  const titleColor = isDanger
    ? '#991b1b'
    : isHighRisk || isCaution
    ? '#854d0e'
    : '#166534';

  return (
    <View style={[styles.card, bgStyle]}>
      <View style={styles.topRow}>
        <View style={styles.titleArea}>
          <Text style={styles.icon}>{isDanger ? '🔥' : isCaution || isHighRisk ? '⚠️' : '🛡️'}</Text>
          <View>
            <Text style={[styles.title, { color: titleColor }]}>{t('current_heat_alert')}</Text>
            {siteName && <Text style={styles.siteText}>📍 {siteName}</Text>}
          </View>
        </View>

        <View style={styles.badge}>
          <Text style={[styles.badgeText, { color: titleColor }]}>
            {riskLabel.toUpperCase()} {score !== null ? `(${score})` : ''}
          </Text>
        </View>
      </View>

      {/* Weather telemetry quick row */}
      {(temp !== null || humidity !== null) && (
        <View style={styles.telemetryRow}>
          {temp !== null && (
            <Text style={styles.telemetryText}>
              🌡️ {temp}°C {t('temperature')}
            </Text>
          )}
          {humidity !== null && (
            <Text style={styles.telemetryText}>
              💧 {humidity}% {t('humidity')}
            </Text>
          )}
        </View>
      )}

      {/* Main Voice Alert Action Button */}
      <TouchableOpacity
        onPress={handleToggleVoice}
        style={[styles.voiceBtn, isSpeaking ? styles.speakingBtn : btnBg]}
        activeOpacity={0.8}
      >
        <Text style={styles.voiceBtnIcon}>{isSpeaking ? '⏹️' : '🔊'}</Text>
        <Text style={styles.voiceBtnText}>
          {isSpeaking
            ? `${t('stop_listening')} (${effectiveLanguage.toUpperCase()})`
            : `${t('listen_to_safety_alert')} (${effectiveLanguage.toUpperCase()})`}
        </Text>
        {isSpeaking && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 6 }} />}
      </TouchableOpacity>

      {voiceUnavailable && (
        <View style={styles.unavailableNotice}>
          <Text style={styles.unavailableText}>
            ⚠️ {t('voice_unavailable')}
          </Text>
        </View>
      )}

      {/* Spoken content preview / guidance */}
      <View style={styles.guidanceBox}>
        <Text style={styles.guidanceLabel}>📢 {t('safety_guidance')}:</Text>
        <Text style={styles.guidanceText}>
          {isDanger
            ? t('voice_guidance_danger')
            : isHighRisk || isCaution
            ? t('voice_guidance_high_risk')
            : t('voice_guidance_safe')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  safeBg: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  cautionBg: {
    backgroundColor: '#fefce8',
    borderColor: '#fde047',
  },
  dangerBg: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  siteText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  badge: {
    backgroundColor: '#ffffffdd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  telemetryRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#ffffffaa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  telemetryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  safeBtn: {
    backgroundColor: '#16a34a',
  },
  cautionBtn: {
    backgroundColor: '#d97706',
  },
  dangerBtn: {
    backgroundColor: '#dc2626',
  },
  speakingBtn: {
    backgroundColor: '#475569',
  },
  voiceBtnIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  voiceBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  unavailableNotice: {
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  unavailableText: {
    fontSize: 11,
    color: '#92400e',
    lineHeight: 16,
  },
  guidanceBox: {
    backgroundColor: '#ffffffbb',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0000000a',
  },
  guidanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  guidanceText: {
    fontSize: 12,
    color: '#1e293b',
    lineHeight: 18,
  },
});
