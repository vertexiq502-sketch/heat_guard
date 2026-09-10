import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalization } from '../../hooks/useLocalization';

interface Props {
  risk: {
    risk_level?: string;
    risk_score?: number;
    effective_temp?: number;
    confidence?: string;
    explanation?: string;
    is_stale?: boolean;
    timestamp?: string;
  };
}

export const RiskCard: React.FC<Props> = ({ risk }) => {
  const { t } = useLocalization();

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

  const bgStyle = isDanger
    ? styles.dangerBg
    : isHighRisk
    ? styles.highRiskBg
    : isCaution
    ? styles.cautionBg
    : styles.safeBg;

  const textColor = isDanger
    ? '#991b1b'
    : isHighRisk
    ? '#c2410c'
    : isCaution
    ? '#854d0e'
    : '#166534';

  const icon = isDanger ? '🔴' : isHighRisk ? '🟠' : isCaution ? '🟡' : '🟢';

  const temp =
    risk?.effective_temp !== undefined && risk?.effective_temp !== null
      ? Math.round(risk.effective_temp * 10) / 10
      : 32;

  const score =
    risk?.risk_score !== undefined && risk?.risk_score !== null
      ? Math.round(risk.risk_score)
      : Math.round(temp);

  const confidence = (risk?.confidence || 'high').toUpperCase();

  return (
    <View style={[styles.card, bgStyle]}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={[styles.title, { color: textColor }]}>
            {t('current_risk')}: {riskLabel}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {t('confidence')} {confidence === 'HIGH' ? t('confidence_high') : t('confidence_low')}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>{t('effective_temp')}</Text>
          <Text style={[styles.statValue, { color: textColor }]}>{temp}°C</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>{t('risk_score')}</Text>
          <Text style={[styles.statValue, { color: textColor }]}>{score}/100</Text>
        </View>
      </View>

      {risk?.is_stale && (
        <View style={styles.staleNotice}>
          <Text style={styles.staleText}>⚠️ {t('weather_delayed_warning')}</Text>
        </View>
      )}

      {risk?.explanation && (
        <Text style={styles.explanation}>{risk.explanation}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  safeBg: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  cautionBg: {
    backgroundColor: '#fefce8',
    borderColor: '#fde047',
  },
  highRiskBg: {
    backgroundColor: '#fff7ed',
    borderColor: '#fdba74',
  },
  dangerBg: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 18,
    marginRight: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  body: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffffaa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  staleNotice: {
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  staleText: {
    fontSize: 11,
    color: '#92400e',
  },
  explanation: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
    marginTop: 6,
  },
});
