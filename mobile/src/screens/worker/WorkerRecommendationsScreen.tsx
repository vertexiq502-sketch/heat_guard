import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useWorkerData } from '../../hooks/useDashboardData';
import { useLocalization } from '../../hooks/useLocalization';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { RecommendationCard } from '../../components/worker/RecommendationCard';

export const WorkerRecommendationsScreen: React.FC = () => {
  const { t } = useLocalization();
  const { data, isLoading, isError, refetch, isRefetching } = useWorkerData();

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

  const risk = data?.risk;

  if (!risk) {
    return (
      <View style={styles.padding}>
        <EmptyState message="No risk assessment available yet." icon="📋" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('recommendations_title')}</Text>
        <Text style={styles.subtitle}>
          Personalized guidance based on your current telemetry and risk level
        </Text>
      </View>

      <RecommendationCard
        recommendation={risk.recommendation}
        riskLevel={risk.risk_level}
      />

      {risk.explanation && (
        <View style={styles.explanationCard}>
          <Text style={styles.explanationTitle}>💡 Why this risk level?</Text>
          <Text style={styles.explanationBody}>{risk.explanation}</Text>
        </View>
      )}

      {/* Wellness & Emergency Guidelines */}
      <View style={styles.wellnessCard}>
        <Text style={styles.wellnessTitle}>🏥 Heat Shield Emergency Protocols</Text>

        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>💧</Text>
          <View style={styles.tipContent}>
            <Text style={styles.tipLabel}>Drink Electrolytes Regularly</Text>
            <Text style={styles.tipDesc}>
              Do not wait until you are thirsty. Drink small amounts of cool water or ORS every 15-20 minutes.
            </Text>
          </View>
        </View>

        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>⛱️</Text>
          <View style={styles.tipContent}>
            <Text style={styles.tipLabel}>Take Mandatory Shade Breaks</Text>
            <Text style={styles.tipDesc}>
              Rest under cooling canopies or designated shade zones to allow your core body temperature to reset.
            </Text>
          </View>
        </View>

        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>🚨</Text>
          <View style={styles.tipContent}>
            <Text style={styles.tipLabel}>Report Symptoms Immediately</Text>
            <Text style={styles.tipDesc}>
              If experiencing nausea, dizziness, muscle cramps, or confusion, notify your supervisor immediately or call 108.
            </Text>
          </View>
        </View>
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
    paddingBottom: 32,
  },
  padding: {
    padding: 24,
  },
  header: {
    marginBottom: 12,
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
  explanationCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginVertical: 10,
  },
  explanationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  explanationBody: {
    fontSize: 13,
    color: '#1e3a8a',
    lineHeight: 19,
  },
  wellnessCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
  },
  wellnessTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 10,
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  tipDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
    marginTop: 2,
  },
});
