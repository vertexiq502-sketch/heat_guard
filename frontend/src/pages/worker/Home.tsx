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
  MapPin,
  User,
  HeartPulse,
  Clock,
  Shirt,
  Navigation,
  RefreshCw,
  Droplets,
  Leaf,
  Zap,
  UserCircle,
  Briefcase,
  Sun,
} from 'lucide-react';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';

// ── Risk level styling map ───────────────────────────────────────────────────
const RISK_STYLES: Record<string, {
  bg: string; border: string; text: string; badgeBg: string; icon: string; label: string;
}> = {
  green:  { bg: 'from-emerald-50 to-green-50',  border: 'border-green-200',  text: 'text-green-800',  badgeBg: 'bg-green-100',  icon: '🟢', label: 'SAFE'      },
  yellow: { bg: 'from-yellow-50 to-amber-50',   border: 'border-yellow-300', text: 'text-yellow-800', badgeBg: 'bg-yellow-100', icon: '🟡', label: 'CAUTION'   },
  orange: { bg: 'from-orange-50 to-amber-50',   border: 'border-orange-300', text: 'text-orange-800', badgeBg: 'bg-orange-100', icon: '🟠', label: 'HIGH RISK' },
  red:    { bg: 'from-red-50 to-rose-50',       border: 'border-red-300',    text: 'text-red-800',    badgeBg: 'bg-red-100',    icon: '🔴', label: 'DANGER'    },
};

// ── Wellness tip icons (cycle by index) ──────────────────────────────────────
const TIP_ICONS = [
  <Droplets key="d" className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />,
  <Leaf     key="l" className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />,
  <Shirt    key="s" className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />,
  <Zap      key="z" className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />,
];

// ── Human-readable labels for profile enum values ────────────────────────────
const PL: Record<string, string> = {
  normal: 'Normal Cotton', normalCotton: 'Normal Cotton',
  moderatePPE: 'Moderate PPE', heavyPPE: 'Heavy PPE',
  light: 'Light Work', moderate: 'Moderate Work', heavy: 'Heavy Work',
  shade: 'Full Shade', partialShade: 'Partial Shade', fullSun: 'Full Sun',
  short: 'Short (< 2 hrs)', prolonged: 'Prolonged (4+ hrs)',
  construction: 'Construction', farm: 'Farm', road: 'Road Work', other: 'Other',
};
const pl = (v?: string) => (v && PL[v]) || v || '—';

// ── Scenario data (caution / danger previews) ────────────────────────────────
const CAUTION_RISK = {
  risk_level: 'yellow', effective_temp: 36.8, confidence: 'high',
  explanation: 'Midday Heat Index Peak: High ambient temperature with direct solar exposure.',
  timestamp: new Date().toISOString(),
  recommendation: {
    workStatus: 'CAUTION — HIGH HEAT STRESS',
    restInstruction: 'Mandatory 15-minute rest break in shade every 45 minutes.',
    hydrationInstruction: 'Drink 750ml of cool water or oral rehydration salts per hour.',
    additionalGuidance: 'Stay alert for dizziness, rapid heartbeat, or heavy sweating.',
    wellnessTips: [
      'Drink 2 glasses (500 ml) of water every hour to prevent dehydration.',
      'Take regular 10-minute rest breaks in shaded areas when feeling fatigued.',
      'Wear loose, light-coloured cotton garments and avoid peak direct sunlight.',
      'Be aware of early fatigue symptoms and keep hydration packs nearby.',
    ],
  },
};

const DANGER_RISK = {
  risk_level: 'red', effective_temp: 46.5, confidence: 'high',
  explanation: 'DANGER: Critical Heat Index Spike. Effective temperature exceeds 45 °C emergency threshold.',
  timestamp: new Date().toISOString(),
  recommendation: {
    workStatus: 'STOP WORK IMMEDIATELY',
    restInstruction: 'Immediate work stoppage mandated. Move to active cooling shelters.',
    hydrationInstruction: 'Drink electrolytes immediately. Cool neck and head with cold wet towels.',
    additionalGuidance: 'Report any muscle cramps, nausea, or disorientation immediately.',
    wellnessTips: [
      'Drink 1 litre of cool water per hour with ORS electrolytes. Do not wait until thirsty.',
      'Mandatory work stoppage: Rest immediately in shaded cooling canopy or air-conditioned shelter.',
      'Loosen heavy PPE, wet your skin/cloth on neck, and use active fan cooling.',
      'Watch for heat stroke signs (confusion, dizziness, nausea, no sweating); notify supervisor immediately.',
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
export const WorkerHome = () => {
  const { t } = useLocalization();
  const queryClient = useQueryClient();

  const {
    location, loading: locationLoading,
    permissionStatus, requestLocation,
  } = useCurrentLocation();

  const { data, isLoading, isError, refetch, isRefetching } = useWorkerData(location);

  const [mode, setMode] = useState<'live' | 'caution' | 'danger'>('live');
  const [isSaving, setIsSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Auto-request GPS on load
  useEffect(() => { requestLocation(); }, [requestLocation]);

  // Sync worker language to i18n
  useEffect(() => {
    if (data?.profile?.language) setAppLanguage(data.profile.language);
  }, [data?.profile?.language]);

  // ── Loading / Error / Empty guards ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        <LoadingSkeleton lines={2} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => <LoadingSkeleton key={i} lines={4} />)}
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

  // Active risk object depending on selected mode
  const displayedRisk = mode === 'caution' ? CAUTION_RISK : mode === 'danger' ? DANGER_RISK : liveRisk;
  const rs = RISK_STYLES[displayedRisk?.risk_level || 'green'] ?? RISK_STYLES.green;
  const wellnessTips: string[] = displayedRisk?.recommendation?.wellnessTips ?? [];

  const handleSave = async (m: 'caution' | 'danger') => {
    setIsSaving(true);
    setSavedMsg(null);
    try {
      await apiClient.post('/dashboard/worker/record-risk', { level: m });
      await queryClient.invalidateQueries({ queryKey: ['workerDashboard'] });
      setSavedMsg(`Stored ${m.toUpperCase()} risk & alert in Supabase!`);
      setTimeout(() => setSavedMsg(null), 4000);
    } catch (err: any) {
      console.error('Error saving risk:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto pb-24">

      {/* ── 1. WORKER PROFILE HERO ────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-800 to-blue-900 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-extrabold border border-white/30 shrink-0">
            {profile?.name?.charAt(0)?.toUpperCase() || <UserCircle className="w-8 h-8 opacity-80" />}
          </div>
          <div>
            <p className="text-2xs text-blue-200 font-semibold uppercase tracking-wider mb-0.5">Outdoor Worker Profile</p>
            <h1 className="text-xl font-extrabold tracking-tight">{profile?.name || 'Worker'}</h1>
            <p className="text-blue-200 text-xs mt-0.5 flex items-center gap-1.5 flex-wrap">
              <User className="w-3 h-3" /> {profile?.email || ''}
              {profile?.worker_type && (
                <><span className="text-white/30">•</span><Briefcase className="w-3 h-3" /> {pl(profile.worker_type)}</>
              )}
            </p>
          </div>
        </div>

        {/* Profile stat pills */}
        <div className="flex flex-wrap gap-2 sm:gap-3 sm:justify-end">
          {[
            { label: 'Intensity',    val: pl(profile?.intensity) },
            { label: 'Sun Exposure', val: pl(profile?.exposure)  },
            { label: 'PPE / Clothing', val: pl(profile?.clothing) },
            { label: 'Shift',        val: pl(profile?.duration)  },
          ].map(({ label, val }) => (
            <div key={label} className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-center min-w-[78px]">
              <p className="text-2xs text-blue-200 uppercase tracking-wider mb-0.5">{label}</p>
              <p className="text-xs font-bold">{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. GPS / SITE LOCATION BAR ────────────────────────────────────── */}
      <div className="bg-white px-5 py-3.5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${location ? 'bg-emerald-100' : 'bg-blue-100'}`}>
            <Navigation className={`w-4 h-4 ${location ? 'text-emerald-700' : 'text-blue-700'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-900">
                {location ? 'Using your current GPS location' : 'Using assigned site weather'}
              </span>
              <span className="text-2xs px-2 py-0.5 rounded-md font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {location ? `GPS (${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)})` : site.name}
              </span>
            </div>
            <p className="text-2xs text-gray-500 mt-0.5">
              <MapPin className="inline w-2.5 h-2.5 mr-0.5" />
              {site.name} • {site.district || 'Hyderabad'} • Live Open-Meteo weather
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {permissionStatus === 'denied' && (
            <span className="text-2xs text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
              Location denied — using site coordinates
            </span>
          )}
          <button
            onClick={() => { requestLocation(); refetch(); }}
            disabled={locationLoading || isRefetching}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${locationLoading || isRefetching ? 'animate-spin' : ''}`} />
            {locationLoading ? 'Getting location…' : 'Refresh Conditions'}
          </button>
        </div>
      </div>

      {/* ── 3. SCENARIO SWITCHER ──────────────────────────────────────────── */}
      <div className="bg-white px-5 py-3 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center gap-3 justify-between">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Preview Scenario:</p>
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-semibold">
          {([['live','🟢','Live','bg-green-600'],['caution','🟡','Caution','bg-yellow-500'],['danger','🔴','Danger','bg-red-600']] as const).map(([m, emoji, label, active]) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${mode === m ? `${active} text-white shadow-sm` : 'text-gray-700 hover:bg-gray-200/60'}`}>
              {emoji} {label}
            </button>
          ))}
        </div>
        {mode !== 'live' && (
          <button onClick={() => handleSave(mode)} disabled={isSaving}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition disabled:opacity-50">
            <Cloud className="w-3.5 h-3.5" />
            {isSaving ? 'Storing…' : 'Save to Supabase'}
          </button>
        )}
      </div>

      {savedMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /> {savedMsg}
        </div>
      )}

      {/* ── 4. LIVE CURRENT RISK HERO ─────────────────────────────────────── */}
      <div className={`bg-gradient-to-br ${rs.bg} border ${rs.border} rounded-2xl p-5 shadow-sm`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5" />
              Current Heat Risk — {location ? 'Your GPS Location' : site.name}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-5xl">{rs.icon}</span>
              <div>
                <p className={`text-4xl font-extrabold tracking-tight ${rs.text}`}>{rs.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Personalized for {profile?.name || 'you'} • {pl(profile?.worker_type)}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-1">Effective Temp</p>
            <p className={`text-3xl font-extrabold ${rs.text}`}>{displayedRisk?.effective_temp?.toFixed(1)}°C</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rs.badgeBg} ${rs.text} mt-1 inline-block`}>
              {displayedRisk?.confidence === 'high' ? '✓ High Confidence' : '~ Low Confidence'}
            </span>
          </div>
        </div>

        {displayedRisk?.recommendation?.workStatus && (
          <div className={`${rs.badgeBg} border ${rs.border} rounded-xl px-4 py-2.5 mb-3`}>
            <p className={`text-sm font-extrabold ${rs.text}`}>⚡ {displayedRisk.recommendation.workStatus}</p>
          </div>
        )}
        {displayedRisk?.explanation && (
          <p className="text-xs text-gray-500 leading-relaxed">{displayedRisk.explanation}</p>
        )}
      </div>

      {/* ── 5. WELLNESS & SAFETY TIPS CARD ───────────────────────────────── */}
      {wellnessTips.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
              <HeartPulse className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">💚 Wellness & Safety Tips</h3>
              <p className="text-2xs text-gray-400">Based on your current heat risk level and profile</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {wellnessTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                {TIP_ICONS[i % TIP_ICONS.length]}
                <p className="text-xs text-gray-700 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. 3-COLUMN DETAIL GRID ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* Card A: Risk Summary */}
        <div className="h-full flex flex-col"><RiskCard risk={displayedRisk} /></div>

        {/* Card B: Recommendations */}
        <div className="h-full flex flex-col">
          <RecommendationCard recommendation={displayedRisk.recommendation} riskLevel={displayedRisk.risk_level} />
        </div>

        {/* Card C: Live Weather */}
        <div className="h-full flex flex-col"><WeatherCard weather={weather} /></div>

        {/* Card D: Shift Risk Scenarios */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm h-full flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-blue-600" /> Shift Risk Scenarios
              </h3>
              <span className="text-2xs text-gray-400">Click to Preview</span>
            </div>
            <div className="space-y-2">
              {([
                { m: 'live',    emoji: '🟢', name: 'SAFE (Live)',       sub: `${liveRisk?.effective_temp?.toFixed(1) ?? '—'}°C • Current conditions`, active: 'bg-green-50 border-green-400 ring-1 ring-green-300',  badge: 'bg-green-100 text-green-800',  icon: null },
                { m: 'caution', emoji: '🟡', name: 'CAUTION (Midday)',  sub: '36.8°C • 15 min/hr shade rest',                                          active: 'bg-yellow-50 border-yellow-400 ring-1 ring-yellow-300', badge: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle className="w-3 h-3 text-yellow-600" /> },
                { m: 'danger',  emoji: '🔴', name: 'DANGER (Heatwave)', sub: '46.5°C • Mandatory Stop',                                                active: 'bg-red-50 border-red-400 ring-1 ring-red-300',          badge: 'bg-red-100 text-red-800',      icon: <Flame className="w-3 h-3 text-red-600" /> },
              ] as const).map(({ m, emoji, name, sub, active, badge, icon }) => (
                <div key={m} onClick={() => setMode(m)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${mode === m ? active : 'bg-gray-50/70 border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{emoji}</span>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{name}</p>
                      <p className="text-2xs text-gray-500">{sub}</p>
                    </div>
                  </div>
                  <span className={`text-2xs font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${badge}`}>
                    {icon} {m === 'live' ? 'Live' : m === 'caution' ? 'Caution' : 'Danger'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-2xs text-gray-400 text-center pt-2 border-t border-gray-100">
            Real-time heat risk adjusts according to your personal PPE & workload.
          </p>
        </div>

        {/* Card E: Active Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm h-full flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                🚨 {t('active_alerts')} ({alerts?.length ?? 0})
              </h3>
              <span className="text-2xs font-semibold text-gray-400">Live Queue</span>
            </div>
            {(!alerts || alerts.length === 0) ? (
              <div className="py-6"><EmptyState message={t('no_alerts_msg')} icon="✅" /></div>
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

        {/* Card F: Work Profile & PPE */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm h-full flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-green-600" /> Work Profile & PPE
              </h3>
              <span className="text-2xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-semibold">Protected</span>
            </div>
            <div className="space-y-2 text-xs text-gray-600">
              {([
                { icon: <Shirt className="w-3.5 h-3.5 text-blue-600" />,   label: 'Clothing / PPE',  val: pl(profile?.clothing)  },
                { icon: <Clock className="w-3.5 h-3.5 text-orange-600" />, label: 'Shift Duration',  val: pl(profile?.duration)  },
                { icon: <Sun   className="w-3.5 h-3.5 text-yellow-600" />, label: 'Sun Exposure',    val: pl(profile?.exposure)  },
                { icon: <Zap   className="w-3.5 h-3.5 text-purple-600" />, label: 'Work Intensity',  val: pl(profile?.intensity) },
              ]).map(({ icon, label, val }) => (
                <div key={label} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="flex items-center gap-1.5 font-medium text-gray-700">{icon} {label}</span>
                  <span className="font-semibold text-gray-900 capitalize">{val}</span>
                </div>
              ))}
              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-2xs text-blue-900 space-y-1">
                <p className="font-bold">💡 Heat Emergency Tip:</p>
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
