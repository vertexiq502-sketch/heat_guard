import { useState } from 'react';
import { useWorkerData } from '../../hooks/useDashboardData';
import { useLocalization } from '../../hooks/useLocalization';
import { AlertCard } from '../../components/worker/AlertCard';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { apiClient } from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';
import { Radio, Volume2, CheckCircle2 } from 'lucide-react';

export const Alerts = () => {
  const { t } = useLocalization();
  const { data, isLoading, isError, refetch } = useWorkerData();
  const queryClient = useQueryClient();

  const [isTriggeringVoice, setIsTriggeringVoice] = useState(false);
  const [voiceSuccessMsg, setVoiceSuccessMsg] = useState<string | null>(null);

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

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 pb-24">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('active_alerts')}</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold flex items-center gap-1">
              <Radio className="w-3 h-3 text-purple-600 animate-pulse" />
              Voice Enabled
            </span>
          </div>
          {site?.name && (
            <p className="text-xs text-gray-500 mt-1">
              {t('assigned_to')} <span className="font-semibold text-gray-800">{site.name}</span>
            </p>
          )}
        </div>

        <button
          onClick={handleTriggerSampleVoiceAlert}
          disabled={isTriggeringVoice}
          className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 shrink-0"
        >
          <Volume2 className="w-4 h-4" />
          {isTriggeringVoice ? 'Adding to Supabase...' : '+ Add Sample Voice Alert'}
        </button>
      </header>

      {/* Voice Information Banner */}
      <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 flex items-start gap-3 shadow-xs">
        <Volume2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="text-xs text-purple-900 leading-relaxed">
          <span className="font-bold">Multilingual Voice Alerts:</span> Voice alerts can be played aloud directly in your browser. Audio broadcasts automatically match your preferred language (English, Telugu, or Hindi). Click <span className="font-semibold">Play Voice Alert</span> on any card below to listen.
        </div>
      </div>

      {voiceSuccessMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          {voiceSuccessMsg}
        </div>
      )}

      {/* ── Alerts List ────────────────────────────────────── */}
      {alerts.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center shadow-sm">
          <EmptyState message={t('no_alerts_msg')} icon="✅" />
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert: any) => (
            <AlertCard key={alert.id} alert={alert} siteName={site?.name} />
          ))}
        </div>
      )}
    </div>
  );
};
