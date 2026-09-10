import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useWorkerData } from '../../hooks/useDashboardData';
import { useLocalization } from '../../hooks/useLocalization';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { CurrentHeatAlertVoiceCard } from '../../components/worker/CurrentHeatAlertVoiceCard';
import { AlertCard } from '../../components/worker/AlertCard';
import { apiClient } from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';

export const WorkerAlertsScreen: React.FC = () => {
  const { t } = useLocalization();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch, isRefetching } = useWorkerData();

  const [isTriggering, setIsTriggering] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  const alerts: any[] = data?.alerts ?? [];
  const site = data?.site;

  const handleTriggerSampleVoiceAlert = async () => {
    setIsTriggering(true);
    setSuccessMsg(null);
    try {
      await apiClient.post('/dashboard/worker/record-risk', { level: 'danger' });
      await queryClient.invalidateQueries({ queryKey: ['workerDashboard'] });
      setSuccessMsg('Sample Voice Alert stored in Supabase & updated!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.warn('Error triggering voice alert:', err);
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
      }
    >
      <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>{t('active_alerts')}</Text>
          <Text style={styles.subtitle}>
            Voice enabled in English, Telugu & Hindi
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleTriggerSampleVoiceAlert}
          disabled={isTriggering}
          style={styles.sampleBtn}
          activeOpacity={0.8}
        >
          {isTriggering ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sampleBtnText}>+ Sample Alert</Text>
          )}
        </TouchableOpacity>
      </View>

      {successMsg && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>✓ {successMsg}</Text>
        </View>
      )}

      {/* Primary Voice Guidance & Current Heat Alert Card */}
      <CurrentHeatAlertVoiceCard
        weather={data?.weather}
        risk={data?.risk}
        profile={data?.profile}
        alert={alerts[0] || null}
        workerLanguage={data?.profile?.language}
        siteName={site?.name}
      />

      {/* Alerts Feed */}
      <View style={styles.feedSection}>
        <Text style={styles.feedHeader}>
          {t('active_alerts')} ({alerts.length})
        </Text>

        {alerts.length === 0 ? (
          <EmptyState message={t('no_alerts_msg')} icon="✅" />
        ) : (
          alerts.map((alert: any) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              siteName={site?.name}
              workerLanguage={data?.profile?.language}
            />
          ))
        )}
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  sampleBtn: {
    backgroundColor: '#9333ea',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  sampleBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  successBox: {
    backgroundColor: '#dcfce7',
    padding: 10,
    borderRadius: 10,
    marginVertical: 6,
  },
  successText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  feedSection: {
    marginTop: 14,
  },
  feedHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
});
