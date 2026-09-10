import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalization } from '../../hooks/useLocalization';

interface Props {
  recommendation?: {
    workStatus?: string;
    restInstruction?: string;
    hydrationInstruction?: string;
    additionalGuidance?: string;
  };
  riskLevel?: string;
}

export const RecommendationCard: React.FC<Props> = ({ recommendation, riskLevel = 'green' }) => {
  const { t } = useLocalization();

  const isDanger = riskLevel === 'red' || riskLevel === 'danger';
  const isCaution = riskLevel === 'yellow' || riskLevel === 'orange' || riskLevel === 'caution';

  const defaultStatus = isDanger
    ? t('stop_work')
    : isCaution
    ? 'Take frequent breaks & hydrate'
    : 'Standard safety protocols active';

  const status = recommendation?.workStatus || defaultStatus;
  const rest = recommendation?.restInstruction || t('rest_instruction');
  const hydration = recommendation?.hydrationInstruction || t('hydration_instruction');
  const guidance = recommendation?.additionalGuidance || t('guidance_shade');

  const cardBorderColor = isDanger ? '#fca5a5' : isCaution ? '#fde047' : '#bbf7d0';
  const cardBg = isDanger ? '#fff5f5' : isCaution ? '#fefce8' : '#f0fdf4';
  const statusColor = isDanger ? '#b91c1c' : isCaution ? '#b45309' : '#15803d';

  return (
    <View style={[styles.card, { borderColor: cardBorderColor, backgroundColor: cardBg }]}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 {t('recommendations_title')}</Text>
        <Text style={[styles.statusBadge, { color: statusColor }]}>{status}</Text>
      </View>

      <View style={styles.list}>
        <View style={styles.row}>
          <Text style={styles.bullet}>💧</Text>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Hydration</Text>
            <Text style={styles.rowDesc}>{hydration}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.bullet}>⛱️</Text>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Rest & Shade</Text>
            <Text style={styles.rowDesc}>{rest}</Text>
          </View>
        </View>

        {guidance && (
          <View style={styles.row}>
            <Text style={styles.bullet}>🛡️</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Protocol Guidance</Text>
              <Text style={styles.rowDesc}>{guidance}</Text>
            </View>
          </View>
        )}
      </View>
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
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  statusBadge: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffffcc',
    padding: 10,
    borderRadius: 10,
  },
  bullet: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 1,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  rowDesc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
});
