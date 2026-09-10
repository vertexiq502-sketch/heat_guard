import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalization, setAppLanguage } from '../../hooks/useLocalization';
import { useWorkerData } from '../../hooks/useDashboardData';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { RiskCard } from '../../components/worker/RiskCard';
import { RecommendationCard } from '../../components/worker/RecommendationCard';
import { WeatherCard } from '../../components/worker/WeatherCard';
import { AlertCard } from '../../components/worker/AlertCard';
import { apiClient } from '../../api/client';
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Cloud,
  Sparkles,
  MapPin,
  User,
  HeartPulse,
  Clock,
  Shirt
} from 'lucide-react';

export const WorkerHome = () => {
  const { t } = useLocalization();
  const { data, isLoading, isError, refetch } = useWorkerData();
  const queryClient = useQueryClient();

  // Scenario toggle: 'live' | 'caution' | 'danger'
  const [selectedRiskMode, setSelectedRiskMode] = useState<'live' | 'caution' | 'danger'>('live');
  const [isSavingToSupabase, setIsSavingToSupabase] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Sync worker's selected language from users table
  useEffect(() => {
    if (data?.profile?.language) {
      setAppLanguage(data.profile.language);
    }
  }, [data?.profile?.language]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        <LoadingSkeleton lines={2} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <LoadingSkeleton key={i} lines={4} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 max-w-6xl mx-auto h-[80vh] flex items-center justify-center">
        <ErrorState message={t('error_loading')} onRetry={() => refetch()} />
      </div>
    );
  }

  if (!data || !data.site) {
    return (
      <div className="p-4 max-w-6xl mx-auto h-[80vh] flex items-center justify-center">
        <EmptyState message={t('no_site_assigned')} icon="🏗️" />
      </div>
    );
  }

  const { site, weather, risk: liveRisk, alerts, profile } = data;

  // Caution scenario data
  const cautionRisk = {
    risk_level: 'yellow',
    effective_temp: 36.8,
    confidence: 'high',
    explanation: 'Midday Heat Index Peak: High ambient temperature with direct solar exposure. Caution adjustments active.',
    recommendation: {
      workStatus: 'CAUTION — HIGH HEAT STRESS',
      restInstruction: 'Mandatory 15-minute rest break in shade every 45 minutes.',
      hydrationInstruction: 'Drink 750ml of cool water or oral rehydration salts per hour.',
      additionalGuidance: 'Stay alert for dizziness, rapid heartbeat, or heavy sweating.'
    },
    timestamp: new Date().toISOString()
  };

  // Danger scenario data
  const dangerRisk = {
    risk_level: 'red',
    effective_temp: 46.5,
    confidence: 'high',
    explanation: 'DANGER: Critical Heat Index Spike. Effective temperature exceeds 45°C emergency safety threshold.',
    recommendation: {
      workStatus: 'STOP WORK IMMEDIATELY',
      restInstruction: 'Immediate work stoppage mandated. Move to active cooling shelters or shaded zones.',
      hydrationInstruction: 'Drink electrolytes immediately. Cool down neck and head with cold wet towels.',
      additionalGuidance: 'Report any muscle cramps, nausea, or disorientation to supervisor immediately.'
    },
    timestamp: new Date().toISOString()
  };

  // Determine active displayed risk
  const displayedRisk =
    selectedRiskMode === 'caution'
      ? cautionRisk
      : selectedRiskMode === 'danger'
      ? dangerRisk
      : liveRisk;

  // Persist selected risk and alert to Supabase
  const handleSaveRiskToSupabase = async (mode: 'caution' | 'danger') => {
    setIsSavingToSupabase(true);
    setSaveSuccessMsg(null);
    try {
      await apiClient.post('/dashboard/worker/record-risk', { level: mode });
      await queryClient.invalidateQueries({ queryKey: ['workerDashboard'] });
      setSaveSuccessMsg(`Stored ${mode.toUpperCase()} risk & alert in Supabase!`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Error saving risk to Supabase:', err);
    } finally {
      setIsSavingToSupabase(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto pb-24">
      {/* ── Top Header Bar & Scenario Toolbar ──────────────── */}
      <header className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('dashboard_title')}</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold flex items-center gap-1">
              <Cloud className="w-3 h-3 text-blue-600" />
              Supabase Live
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            {t('assigned_to')}{' '}
            <span className="font-semibold text-gray-800">{site.name}</span>
            <span className="text-gray-300">•</span>
            <span>{site.district || 'Hyderabad'}</span>
          </p>
        </div>

        {/* Risk Level Preview Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-semibold">
            <button
              onClick={() => setSelectedRiskMode('live')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                selectedRiskMode === 'live'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <span>🟢</span> Safe
            </button>
            <button
              onClick={() => setSelectedRiskMode('caution')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                selectedRiskMode === 'caution'
                  ? 'bg-yellow-500 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <span>🟡</span> Caution
            </button>
            <button
              onClick={() => setSelectedRiskMode('danger')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                selectedRiskMode === 'danger'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <span>🔴</span> Danger
            </button>
          </div>

          {selectedRiskMode !== 'live' && (
            <button
              onClick={() => handleSaveRiskToSupabase(selectedRiskMode)}
              disabled={isSavingToSupabase}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
            >
              <Cloud className="w-3.5 h-3.5" />
              {isSavingToSupabase ? 'Storing...' : 'Save to Supabase'}
            </button>
          )}

          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-800 font-bold uppercase shadow-sm border border-blue-200 shrink-0">
            {profile?.name?.charAt(0) || <User className="w-5 h-5 text-blue-700" />}
          </div>
        </div>
      </header>

      {saveSuccessMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          {saveSuccessMsg}
        </div>
      )}

      {/* ── 3 BY 2 GRID LAYOUT (6 Balanced Cards on Desktop) ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* ── CARD 1: Current Risk Level ── */}
        <div className="h-full flex flex-col">
          <RiskCard risk={displayedRisk} />
        </div>

        {/* ── CARD 2: Action Required / Recommendations ── */}
        <div className="h-full flex flex-col">
          <RecommendationCard
            recommendation={displayedRisk.recommendation}
            riskLevel={displayedRisk.risk_level}
          />
        </div>

        {/* ── CARD 3: Live Weather Conditions ── */}
        <div className="h-full flex flex-col">
          <WeatherCard weather={weather} />
        </div>

        {/* ── CARD 4: Shift Risk Scenarios (Safe, Caution, Danger) ── */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm h-full flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-blue-600" />
                Shift Risk Scenarios
              </h3>
              <span className="text-2xs text-gray-400">Click to Preview</span>
            </div>

            <div className="space-y-2">
              {/* Safe Scenario */}
              <div
                onClick={() => setSelectedRiskMode('live')}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  selectedRiskMode === 'live'
                    ? 'bg-green-50 border-green-400 shadow-xs ring-1 ring-green-300'
                    : 'bg-gray-50/70 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🟢</span>
                  <div>
                    <p className="text-xs font-bold text-gray-900">SAFE (Baseline)</p>
                    <p className="text-2xs text-gray-500">27.4°C • Standard breaks</p>
                  </div>
                </div>
                <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-800">
                  Normal
                </span>
              </div>

              {/* Caution Scenario */}
              <div
                onClick={() => setSelectedRiskMode('caution')}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  selectedRiskMode === 'caution'
                    ? 'bg-yellow-50 border-yellow-400 shadow-xs ring-1 ring-yellow-300'
                    : 'bg-gray-50/70 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🟡</span>
                  <div>
                    <p className="text-xs font-bold text-gray-900">CAUTION (Midday)</p>
                    <p className="text-2xs text-gray-500">36.8°C • 15m/hr shade rest</p>
                  </div>
                </div>
                <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-yellow-600" />
                  Caution
                </span>
              </div>

              {/* Danger Scenario */}
              <div
                onClick={() => setSelectedRiskMode('danger')}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  selectedRiskMode === 'danger'
                    ? 'bg-red-50 border-red-400 shadow-xs ring-1 ring-red-300'
                    : 'bg-gray-50/70 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🔴</span>
                  <div>
                    <p className="text-xs font-bold text-gray-900">DANGER (Heatwave)</p>
                    <p className="text-2xs text-gray-500">46.5°C • Mandatory Stop</p>
                  </div>
                </div>
                <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-800 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-red-600" />
                  Danger
                </span>
              </div>
            </div>
          </div>

          <p className="text-2xs text-gray-400 text-center pt-2 border-t border-gray-100">
            Real-time heat risk adjusts according to your personal PPE & workload.
          </p>
        </div>

        {/* ── CARD 5: Active Alerts (Caution & Danger from Supabase) ── */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm h-full flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                <span>🚨</span> {t('active_alerts')} ({alerts?.length || 0})
              </h3>
              <span className="text-2xs font-semibold text-gray-400">Live Queue</span>
            </div>

            {(!alerts || alerts.length === 0) ? (
              <div className="py-6">
                <EmptyState message={t('no_alerts_msg')} icon="✅" />
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {alerts.map((alert: any) => (
                  <AlertCard key={alert.id} alert={alert} workerLanguage={profile?.language} />
                ))}
              </div>
            )}
          </div>

          <p className="text-2xs text-gray-400 text-center pt-2 border-t border-gray-100">
            Acknowledge alerts as soon as instructions are carried out.
          </p>
        </div>

        {/* ── CARD 6: Worker PPE & Heat Shield Safety Protocol ── */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm h-full flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-green-600" />
                Work Profile & PPE Status
              </h3>
              <span className="text-2xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-semibold">
                Protected
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-gray-600">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                <span className="flex items-center gap-1.5 font-medium text-gray-700">
                  <Shirt className="w-3.5 h-3.5 text-blue-600" />
                  Clothing / PPE
                </span>
                <span className="font-semibold text-gray-900 capitalize">
                  {profile?.clothing || 'Normal Cotton'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                <span className="flex items-center gap-1.5 font-medium text-gray-700">
                  <Clock className="w-3.5 h-3.5 text-orange-600" />
                  Shift Duration
                </span>
                <span className="font-semibold text-gray-900 capitalize">
                  {profile?.duration || 'Moderate (2-4 hrs)'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                <span className="flex items-center gap-1.5 font-medium text-gray-700">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
                  Sun Exposure
                </span>
                <span className="font-semibold text-gray-900 capitalize">
                  {profile?.exposure || 'Partial Shade'}
                </span>
              </div>

              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-2xs text-blue-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <span>💡</span> Heat Emergency Tip:
                </p>
                <p className="leading-relaxed">
                  If feeling faint or lightheaded, do not wait. Notify site supervisor and drink cool electrolytes in shaded rest canopy immediately.
                </p>
              </div>
            </div>
          </div>

          <div className="text-2xs text-gray-400 text-center pt-2 border-t border-gray-100">
            Emergency Medical Contact: <span className="font-semibold text-gray-700">108</span> / Site First Aid Station
          </div>
        </div>
      </div>
    </div>
  );
};
