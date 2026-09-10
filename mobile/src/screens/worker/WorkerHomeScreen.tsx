import React, { useState, useEffect } from 'react';
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
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { RiskCard } from '../../components/worker/RiskCard';
import { WeatherCard } from '../../components/worker/WeatherCard';
import { RecommendationCard } from '../../components/worker/RecommendationCard';
import { AlertCard } from '../../components/worker/AlertCard';
import { apiClient } from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  onNavigateToAlerts?: () => void;
  onNavigateToRecommendations?: () => void;
}

export const WorkerHomeScreen: React.FC<Props> = ({ onNavigateToAlerts }) => {
  const { t } = useLocalization();
  const queryClient = useQueryClient();
  const { location, loading: locationLoading, error: locationError, permissionStatus, requestLocation } = useCurrentLocation();
  const { data, isLoading, isError, refetch, isRefetching } = useWorkerData(location || undefined);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const [selectedRiskMode, setSelectedRiskMode] = useState<'live' | 'caution' | 'danger'>('live');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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

  if (!data || !data.site) {
    return (
      <View style={styles.padding}>
        <EmptyState message={t('no_site_assigned')} icon="🏗️" />
      </View>
    );
  }

  const { site, weather, risk: liveRisk, alerts, profile } = data;

  const cautionRisk = {
    risk_level: 'yellow',
    effective_temp: 36.8,
    risk_score: 68,
    confidence: 'high',
    explanation: 'Midday Heat Index Peak: High ambient temperature with direct solar exposure. Caution adjustments active.',
    recommendation: {
      workStatus: 'CAUTION — HIGH HEAT STRESS',
      restInstruction: 'Mandatory 15-minute rest break in shade every 45 minutes.',
      hydrationInstruction: 'Drink 750ml of cool water or oral rehydration salts per hour.',
      additionalGuidance: 'Stay alert for dizziness, rapid heartbeat, or heavy sweating.',
    },
    timestamp: new Date().toISOString(),
  };

  const dangerRisk = {
    risk_level: 'red',
    effective_temp: 46.5,
    risk_score: 92,
    confidence: 'high',
    explanation: 'DANGER: Critical Heat Index Spike. Effective temperature exceeds 45°C emergency safety threshold.',
    recommendation: {
      workStatus: 'STOP WORK IMMEDIATELY',
      restInstruction: 'Immediate work stoppage mandated. Move to active cooling shelters or shaded zones.',
      hydrationInstruction: 'Drink electrolytes immediately. Cool down neck and head with cold wet towels.',
      additionalGuidance: 'Report any muscle cramps, nausea, or disorientation to supervisor immediately.',
    },
    timestamp: new Date().toISOString(),
  };

  const displayedRisk =
    selectedRiskMode === 'caution'
      ? cautionRisk
      : selectedRiskMode === 'danger'
      ? dangerRisk
      : liveRisk;

  const handleSaveRiskToSupabase = async (mode: 'caution' | 'danger') => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await apiClient.post('/dashboard/worker/record-risk', { level: mode });
      await queryClient.invalidateQueries({ queryKey: ['workerDashboard'] });
      setSaveMessage(`Stored ${mode.toUpperCase()} risk & alert in Supabase!`);
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      console.warn('Error saving risk to Supabase:', err);
    } finally {
      setIsSaving(false);
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
      {/* Site Assignment Header */}
      <View style={styles.siteHeader}>
        <View>
          <Text style={styles.siteTitle}>{site.name}</Text>
          <Text style={styles.siteSubtitle}>
            📍 {site.district || 'Hyderabad'} • {site.site_type || 'Construction'}
          </Text>
        </View>
        <View style={styles.workerBadge}>
          <Text style={styles.workerInitial}>
            {profile?.name?.charAt(0) || '👷'}
          </Text>
        </View>
      </View>

      {/* Location Status & Live Weather Source Bar */}
      <View style={styles.locationBar}>
        <View style={styles.locationInfo}>
          <View style={[styles.locationIconBox, location ? styles.locationIconGps : styles.locationIconSite]}>
            <Text style={styles.locationIcon}>{location ? '📍' : '🏢'}</Text>
          </View>
          <View style={styles.locationTexts}>
            <View style={styles.locationTitleRow}>
              <Text style={styles.locationTitle}>
                {location ? t('using_current_location') : t('assigned_site_weather')}
              </Text>
              <View style={[styles.gpsBadge, location ? styles.gpsBadgeActive : styles.gpsBadgeSite]}>
                <Text style={styles.gpsBadgeText}>
                  {location ? `GPS (${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)})` : site.name}
                </Text>
              </View>
            </View>
            <Text style={styles.locationSub}>
              Live Open-Meteo • Personalized heat-risk for your profile
            </Text>
          </View>
        </View>

        <View style={styles.locationActions}>
          {permissionStatus === 'denied' && (
            <Text style={styles.deniedBadgeText}>{t('location_permission_denied')}</Text>
          )}

          <TouchableOpacity
            style={[styles.locationRefreshBtn, (locationLoading || isRefetching) && styles.disabledBtn]}
            onPress={() => {
              requestLocation();
              refetch();
            }}
            disabled={locationLoading || isRefetching}
            activeOpacity={0.7}
          >
            {locationLoading || isRefetching ? (
              <ActivityIndicator size="small" color="#1d4ed8" />
            ) : (
              <Text style={styles.locationRefreshText}>🔄 {t('refresh_current_conditions')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Scenario Preview Toolbar */}
      <View style={styles.scenarioBar}>
        <Text style={styles.scenarioLabel}>Scenario Preview:</Text>
        <View style={styles.scenarioButtonGroup}>
          <TouchableOpacity
            onPress={() => setSelectedRiskMode('live')}
            style={[
              styles.scenarioBtn,
              selectedRiskMode === 'live' && styles.safeActiveBtn,
            ]}
          >
            <Text style={[styles.scenarioBtnText, selectedRiskMode === 'live' && styles.activeBtnText]}>
              🟢 Safe
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedRiskMode('caution')}
            style={[
              styles.scenarioBtn,
              selectedRiskMode === 'caution' && styles.cautionActiveBtn,
            ]}
          >
            <Text style={[styles.scenarioBtnText, selectedRiskMode === 'caution' && styles.activeBtnText]}>
              🟡 Caution
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedRiskMode('danger')}
            style={[
              styles.scenarioBtn,
              selectedRiskMode === 'danger' && styles.dangerActiveBtn,
            ]}
          >
            <Text style={[styles.scenarioBtnText, selectedRiskMode === 'danger' && styles.activeBtnText]}>
              🔴 Danger
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {selectedRiskMode !== 'live' && (
        <TouchableOpacity
          onPress={() => handleSaveRiskToSupabase(selectedRiskMode)}
          disabled={isSaving}
          style={styles.saveSupabaseBtn}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveSupabaseBtnText}>
              ☁️ Save {selectedRiskMode.toUpperCase()} Risk to Supabase
            </Text>
          )}
        </TouchableOpacity>
      )}

      {saveMessage && (
        <View style={styles.saveSuccessBox}>
          <Text style={styles.saveSuccessText}>✓ {saveMessage}</Text>
        </View>
      )}

      {/* Card 1: Personalized Risk */}
      <RiskCard risk={displayedRisk} />

      {/* Card 2: Actionable Recommendations */}
      <RecommendationCard
        recommendation={displayedRisk.recommendation}
        riskLevel={displayedRisk.risk_level}
      />

      {/* Card 3: Live Weather */}
      <WeatherCard weather={weather} />

      {/* Card 4: PPE Status & Personal Factors */}
      <View style={styles.ppeCard}>
        <View style={styles.ppeHeader}>
          <Text style={styles.ppeTitle}>🛡️ Work Profile & PPE Status</Text>
          <View style={styles.protectedBadge}>
            <Text style={styles.protectedBadgeText}>Protected</Text>
          </View>
        </View>

        <View style={styles.ppeGrid}>
          <View style={styles.ppeRow}>
            <Text style={styles.ppeRowLabel}>Clothing / PPE:</Text>
            <Text style={styles.ppeRowValue}>{profile?.clothing || 'Normal Cotton'}</Text>
          </View>
          <View style={styles.ppeRow}>
            <Text style={styles.ppeRowLabel}>Shift Duration:</Text>
            <Text style={styles.ppeRowValue}>{profile?.duration || 'Moderate (2-4 hrs)'}</Text>
          </View>
          <View style={styles.ppeRow}>
            <Text style={styles.ppeRowLabel}>Sun Exposure:</Text>
            <Text style={styles.ppeRowValue}>{profile?.exposure || 'Partial Shade'}</Text>
          </View>
          <View style={styles.ppeRow}>
            <Text style={styles.ppeRowLabel}>Work Intensity:</Text>
            <Text style={styles.ppeRowValue}>{profile?.intensity || 'Moderate'}</Text>
          </View>
        </View>
      </View>

      {/* Card 5: Active Alerts Preview */}
      <View style={styles.alertsPreviewCard}>
        <View style={styles.alertsHeader}>
          <Text style={styles.alertsTitle}>
            🚨 {t('active_alerts')} ({alerts?.length || 0})
          </Text>
          {onNavigateToAlerts && (
            <TouchableOpacity onPress={onNavigateToAlerts}>
              <Text style={styles.viewAllText}>View All & Voice →</Text>
            </TouchableOpacity>
          )}
        </View>

        {!alerts || alerts.length === 0 ? (
          <EmptyState message={t('no_alerts_msg')} icon="✅" />
        ) : (
          alerts.slice(0, 2).map((alert: any) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              workerLanguage={profile?.language}
              siteName={site?.name}
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
  padding: {
    padding: 24,
  },
  siteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  siteTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  siteSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  workerBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  scenarioBar: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  scenarioLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  scenarioButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  scenarioBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  scenarioBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  safeActiveBtn: {
    backgroundColor: '#16a34a',
  },
  cautionActiveBtn: {
    backgroundColor: '#eab308',
  },
  dangerActiveBtn: {
    backgroundColor: '#dc2626',
  },
  activeBtnText: {
    color: '#ffffff',
  },
  saveSupabaseBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveSupabaseBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  saveSuccessBox: {
    backgroundColor: '#dcfce7',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  saveSuccessText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  ppeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 6,
  },
  ppeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ppeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  protectedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  protectedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803d',
  },
  ppeGrid: {
    gap: 8,
  },
  ppeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  ppeRowLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  ppeRowValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
    textTransform: 'capitalize',
  },
  alertsPreviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  locationBar: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationIconGps: {
    backgroundColor: '#dcfce7',
  },
  locationIconSite: {
    backgroundColor: '#eff6ff',
  },
  locationIcon: {
    fontSize: 18,
  },
  locationTexts: {
    flex: 1,
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  gpsBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  gpsBadgeActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  gpsBadgeSite: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  gpsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803d',
  },
  locationSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  locationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  deniedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#b45309',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  locationRefreshBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  locationRefreshText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
