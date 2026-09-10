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
import { useSupervisorData } from '../../hooks/useDashboardData';
import { useLocalization } from '../../hooks/useLocalization';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { apiClient } from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';

export const SupervisorDashboardScreen: React.FC = () => {
  const { t } = useLocalization();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch, isRefetching } = useSupervisorData();

  const [isAssigning, setIsAssigning] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (isLoading) {
    return <LoadingSkeleton message="Loading supervisor dashboard..." />;
  }

  if (isError) {
    return (
      <ErrorState
        message="Could not load supervisor dashboard."
        onRetry={() => refetch()}
      />
    );
  }

  const sites: any[] = data?.sites ?? [];
  const workers: any[] = data?.workers ?? [];
  const alerts: any[] = data?.alerts ?? [];
  const stats: any = data?.stats ?? {};

  const safeWorkers = stats.safeWorkers ?? 0;
  const cautionWorkers = stats.cautionWorkers ?? 0;
  const dangerWorkers = stats.dangerWorkers ?? 0;
  const assessed = safeWorkers + cautionWorkers + dangerWorkers;

  const handleAssignSampleSites = async () => {
    setIsAssigning(true);
    setSuccessMsg(null);
    try {
      await apiClient.post('/sites/assign-samples');
      await queryClient.invalidateQueries({ queryKey: ['supervisorDashboard'] });
      setSuccessMsg('Sample sites assigned and linked in Supabase!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.warn('Failed to assign sample sites:', err);
    } finally {
      setIsAssigning(false);
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
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Supervisor Dashboard</Text>
          <Text style={styles.subtitle}>Site Safety & Fleet Monitoring</Text>
        </View>

        <TouchableOpacity
          onPress={handleAssignSampleSites}
          disabled={isAssigning}
          style={styles.actionBtn}
          activeOpacity={0.8}
        >
          {isAssigning ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.actionBtnText}>+ Assign Sample Sites</Text>
          )}
        </TouchableOpacity>
      </View>

      {successMsg && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>✓ {successMsg}</Text>
        </View>
      )}

      {/* KPI Cards */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Active Sites</Text>
          <Text style={styles.kpiValue}>{stats.totalSites ?? sites.length}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Total Workers</Text>
          <Text style={styles.kpiValue}>{stats.totalWorkers ?? workers.length}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>High Heat Sites</Text>
          <Text style={[styles.kpiValue, { color: '#d97706' }]}>{stats.criticalSites ?? 0}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Active Alerts</Text>
          <Text style={[styles.kpiValue, { color: '#dc2626' }]}>{alerts.length}</Text>
        </View>
      </View>

      {/* Worker Risk Distribution Bar */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Worker Risk Distribution</Text>
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
          <Text style={styles.emptyNotice}>No worker risk assessments yet.</Text>
        )}
      </View>

      {/* Managed Sites */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Managed Sites ({sites.length})</Text>
        {sites.length === 0 ? (
          <EmptyState message="No sites assigned yet. Tap '+ Assign Sample Sites' above." icon="🏗️" />
        ) : (
          sites.map((site) => (
            <View key={site.id} style={styles.siteItem}>
              <View>
                <Text style={styles.siteItemName}>{site.name}</Text>
                <Text style={styles.siteItemDetails}>
                  📍 {site.district || 'Hyderabad'} • {site.site_type || 'Construction'}
                </Text>
              </View>
              <View style={styles.siteBadge}>
                <Text style={styles.siteBadgeText}>
                  {(site.default_exposure || 'Full Sun').toUpperCase()}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Active Workers */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Assigned Workers ({workers.length})</Text>
        {workers.length === 0 ? (
          <EmptyState message="No workers currently assigned." icon="👷" />
        ) : (
          workers.slice(0, 5).map((w: any) => (
            <View key={w.id} style={styles.workerItem}>
              <View>
                <Text style={styles.workerItemName}>{w.name || w.email || 'Worker'}</Text>
                <Text style={styles.workerItemSub}>
                  {w.site_name || 'Assigned Site'} • {w.worker_type || 'Worker'}
                </Text>
              </View>
              <View
                style={[
                  styles.riskBadge,
                  w.risk_level === 'red'
                    ? styles.dangerBadge
                    : w.risk_level === 'yellow' || w.risk_level === 'orange'
                    ? styles.cautionBadge
                    : styles.safeBadge,
                ]}
              >
                <Text style={styles.riskBadgeText}>
                  {(w.risk_level || 'Safe').toUpperCase()}
                </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  actionBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  successBox: {
    backgroundColor: '#dcfce7',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  successText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
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
  siteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  siteItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  siteItemDetails: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  siteBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  siteBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
  },
  workerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  workerItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  workerItemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  safeBadge: {
    backgroundColor: '#dcfce7',
  },
  cautionBadge: {
    backgroundColor: '#fef3c7',
  },
  dangerBadge: {
    backgroundColor: '#fee2e2',
  },
  riskBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
  },
});
