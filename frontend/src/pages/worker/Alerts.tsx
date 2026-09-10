import { useState, useEffect } from 'react';
import { useWorkerData } from '../../hooks/useDashboardData';
import { useLocalization, setAppLanguage } from '../../hooks/useLocalization';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { AlertCard } from '../../components/worker/AlertCard';
import { CurrentHeatAlertVoiceCard } from '../../components/worker/CurrentHeatAlertVoiceCard';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { apiClient } from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';
import { Radio, Volume2, CheckCircle2, Navigation, RefreshCw } from 'lucide-react';

export const Alerts = () => {
  const { t } = useLocalization();
  const queryClient = useQueryClient();

  // ── Unified GPS location from global locationStore ──────────────────────────
  // Shares identical state and TanStack Query cache key with Home.tsx:
  //   ['workerDashboard', latitude, longitude]
  const { location, loading: locationLoading, requestLocation } = useCurrentLocation();
  const { data, isLoading, isError, refetch, isRefetching } = useWorkerData(location);

  // Proactively request / refresh location on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const [isTriggeringVoice, setIsTriggeringVoice] = useState(false);
  const [voiceSuccessMsg, setVoiceSuccessMsg] = useState<string | null>(null);

  // Sync worker's selected language from users table only if no local preference is stored
  useEffect(() => {
    const profileLang = data?.profile?.language || data?.profile?.preferred_language;
    const storedLang = typeof window !== 'undefined' ? localStorage.getItem('heatguard_lang') : null;
    if (profileLang && !storedLang) {
      setAppLanguage(profileLang);
    }
  }, [data?.profile?.language, data?.profile?.preferred_language]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        <LoadingSkeleton lines={2} />
        <LoadingSkeleton lines={4} />
        <LoadingSkeleton lines={4} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 max-w-4xl mx-auto h-[60vh] flex items-center justify-center">
        <ErrorState message={t('error_loading')} onRetry={() => refetch()} />
      </div>
    );
  }

  const alerts: any[] = data?.alerts ?? [];
  const site = data?.site;

  // Trigger a fresh sample voice alert stored in Supabase
  const handleTriggerSampleVoiceAlert = async () => {
    setIsTriggeringVoice(true);
    setVoiceSuccessMsg(null);
    try {
      await apiClient.post('/dashboard/worker/record-risk', { level: 'danger' });
      await queryClient.invalidateQueries({ queryKey: ['workerDashboard'] });
      setVoiceSuccessMsg('Sample Voice Alert stored in Supabase and broadcasted!');
      setTimeout(() => setVoiceSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Error triggering voice alert:', err);
    } finally {
      setIsTriggeringVoice(false);
    }
  };

  const isGpsActive = Boolean(location || site?.isCurrentLocation);
  const activeLat = location?.latitude ?? site?.lat;
  const activeLon = location?.longitude ?? site?.lon;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 pb-24">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('active_alerts')}</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold flex items-center gap-1">
              <Radio className="w-3 h-3 text-purple-600 animate-pulse" />
              Voice Enabled
            </span>
            {/* GPS source badge — confirms same data as dashboard */}
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              {isGpsActive && activeLat !== undefined && activeLon !== undefined
                ? `GPS (${activeLat.toFixed(3)}, ${activeLon.toFixed(3)})`
                : site?.name ?? 'Site Weather'}
            </span>
          </div>
          {site?.name && (
            <p className="text-xs text-gray-500 mt-1">
              {isGpsActive ? (
                <>
                  <span className="text-emerald-700 font-medium">📍 Live GPS conditions</span>
                  <span className="text-gray-400 ml-1">— identical to worker dashboard</span>
                </>
              ) : (
                <>
                  {t('assigned_to')} <span className="font-semibold text-gray-800">{site.name}</span>
                </>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { requestLocation(); refetch(); }}
            disabled={locationLoading || isRefetching}
            className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
            title="Refresh conditions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${locationLoading || isRefetching ? 'animate-spin' : ''}`} />
            {locationLoading ? 'Locating…' : 'Refresh'}
          </button>

          <button
            onClick={handleTriggerSampleVoiceAlert}
            disabled={isTriggeringVoice}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 shrink-0"
          >
            <Volume2 className="w-4 h-4" />
            {isTriggeringVoice ? 'Adding to Supabase...' : '+ Add Sample Voice Alert'}
          </button>
        </div>
      </header>

      {/* ── Live Contextual Heat Voice Alert Component ──────────────────── */}
      <CurrentHeatAlertVoiceCard
        weather={data?.weather}
        risk={data?.risk}
        profile={data?.profile}
        alert={alerts[0] || null}
        workerLanguage={data?.profile?.language}
        siteName={isGpsActive && activeLat !== undefined && activeLon !== undefined
          ? `GPS (${activeLat.toFixed(3)}, ${activeLon.toFixed(3)})`
          : site?.name}
      />

      {voiceSuccessMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          {voiceSuccessMsg}
        </div>
      )}

      {/* ── Alerts Feed ────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
          {t('active_alerts')} ({alerts.length})
        </h2>
        {alerts.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center shadow-sm">
            <EmptyState message={t('no_alerts_msg')} icon="✅" />
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert: any) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                siteName={site?.name}
                workerLanguage={data?.profile?.language}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
