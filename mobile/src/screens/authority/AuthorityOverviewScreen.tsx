import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useAuthorityData } from '../../hooks/useDashboardData';
import { useLocalization } from '../../hooks/useLocalization';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';

export const AuthorityOverviewScreen: React.FC = () => {
  const { t } = useLocalization();
  const { data, isLoading, isError, refetch, isRefetching } = useAuthorityData();

  if (isLoading) {
    return <LoadingSkeleton message="Loading authority overview..." />;
  }

  if (isError) {
    return (
      <ErrorState
        message="Could not load authority overview."
        onRetry={() => refetch()}
      />
    );
  }

  const { sites = [], escalations = [], alerts = [], stats = {} } = (data as any) || {};

  const safeWorkers = stats.safeWorkers ?? 0;
  const cautionWorkers = stats.cautionWorkers ?? 0;
  const dangerWorkers = stats.dangerWorkers ?? 0;
  const assessed = safeWorkers + cautionWorkers + dangerWorkers;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>District Authority Overview</Text>
        <Text style={styles.subtitle}>
          District Compliance & Heat Safety Oversight Monitor
        </Text>
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Active Sites</Text>
          <Text style={styles.kpiValue}>{stats.totalSites ?? sites.length}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Total Workers</Text>
          <Text style={styles.kpiValue}>{stats.totalWorkers ?? 0}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Elevated Risk</Text>
          <Text style={[styles.kpiValue, { color: '#ea580c' }]}>
            {stats.criticalSites ?? 0}
          </Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Escalations</Text>
          <Text style={[styles.kpiValue, { color: '#dc2626' }]}>
            {stats.pendingEscalations ?? escalations.length}
          </Text>
        </View>
      </View>

      {/* System-Wide Worker Risk Distribution */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>System-Wide Worker Risk Distribution</Text>
        {assessed > 0 ? (
          <>
            <View style={styles.distributionBar}>
              {safeWorkers > 0 && (
                <View
                  style={[
                    styles.barSegment,
                    { width: `${(safeWorkers / assessed) * 100}%`, backgroundColor: '#4ade80' },
                  ]}
                />
              )}
              {cautionWorkers > 0 && (
                <View
                  style={[
                    styles.barSegment,
                    { width: `${(cautionWorkers / assessed) * 100}%`, backgroundColor: '#facc15' },
                  ]}
                />
              )}
              {dangerWorkers > 0 && (
                <View
                  style={[
                    styles.barSegment,
                    { width: `${(dangerWorkers / assessed) * 100}%`, backgroundColor: '#f87171' },
                  ]}
                />
              )}
            </View>
            <View style={styles.distributionLegend}>
              <Text style={styles.legendItem}>🟢 Safe: {safeWorkers}</Text>
              <Text style={styles.legendItem}>🟡 Caution: {cautionWorkers}</Text>
              <Text style={styles.legendItem}>🔴 Danger: {dangerWorkers}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.emptyNotice}>No recorded assessments currently.</Text>
        )}
      </View>

      {/* Pending Escalations */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          🚨 Pending Escalations ({escalations.length})
        </Text>
        {escalations.length === 0 ? (
          <EmptyState message="No pending escalations across monitored districts." icon="✅" />
        ) : (
          escalations.map((esc: any) => (
            <View key={esc.id} style={styles.escalationItem}>
              <View style={styles.escalationHeader}>
                <Text style={styles.escalationSite}>{esc.site_name || 'Monitored Site'}</Text>
                <View style={styles.escalationBadge}>
                  <Text style={styles.escalationBadgeText}>Level {esc.level || 1}</Text>
                </View>
              </View>
              <Text style={styles.escalationReason}>{esc.reason || 'Sustained severe heat stress'}</Text>
            </View>
          ))
        )}
      </View>

      {/* Regional Active Alerts */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          📢 Active Regional Alerts ({alerts.length})
        </Text>
        {alerts.length === 0 ? (
          <EmptyState message="All district zones currently within normal parameters." icon="🛡️" />
        ) : (
          alerts.slice(0, 4).map((a: any) => (
            <View key={a.id} style={styles.alertRow}>
              <Text style={styles.alertIcon}>⚠️</Text>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{a.title || 'Regional Alert'}</Text>
                <Text style={styles.alertMsg}>{a.message || ''}</Text>
              </View>
            </View>
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
  header: {
    marginBottom: 14,
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  distributionBar: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    marginBottom: 8,
  },
  barSegment: {
    height: '100%',
  },
  distributionLegend: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  emptyNotice: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  escalationItem: {
    backgroundColor: '#fff5f5',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 8,
  },
  escalationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  escalationSite: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991b1b',
  },
  escalationBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  escalationBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b91c1c',
  },
  escalationReason: {
    fontSize: 12,
    color: '#7f1d1d',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  alertIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  alertMsg: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
});
