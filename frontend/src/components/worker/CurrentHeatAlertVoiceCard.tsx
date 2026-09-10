import React from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useAuthStore } from '../../store/authStore';
import {
  generateVoiceAlertScript,
  resolveUserLanguage,
  type VoiceAlertContext,
} from '../../utils/voiceAlertGenerator';
import {
  Volume2,
  Square,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Droplets,
  Thermometer,
  Sun,
  AlertCircle,
  Radio
} from 'lucide-react';

interface CurrentHeatAlertVoiceCardProps {
  weather?: VoiceAlertContext['weather'];
  risk?: VoiceAlertContext['risk'];
  profile?: VoiceAlertContext['profile'];
  alert?: VoiceAlertContext['alert'];
  workerLanguage?: string;
  siteName?: string;
}

export const CurrentHeatAlertVoiceCard: React.FC<CurrentHeatAlertVoiceCardProps> = ({
  weather,
  risk,
  profile,
  alert,
  workerLanguage,
  siteName,
}) => {
  const { t, language: uiLanguage } = useLocalization();
  const { isSupported, isSpeaking, voiceUnavailable, speak, stop } = useSpeechSynthesis();
  const authUser = useAuthStore((state) => state.user);

  // Authoritative language resolution: checks active UI selection, localStorage, worker profile, and authStore
  const effectiveLanguage = resolveUserLanguage(
    { ...profile, language: workerLanguage || profile?.language },
    authUser,
    uiLanguage
  );

  // Normalize risk data
  const rawLevel = (risk?.risk_level || 'green').toLowerCase();
  const isDanger = rawLevel === 'red' || rawLevel === 'danger';
  const isHighRisk = rawLevel === 'orange' || rawLevel === 'high_risk';
  const isCaution = rawLevel === 'yellow' || rawLevel === 'caution';

  const riskLevelLabel = isDanger
    ? t('danger') || 'Danger'
    : isHighRisk
    ? t('high_risk') || 'High Risk'
    : isCaution
    ? t('caution') || 'Caution'
    : t('safe') || 'Safe';

  const score =
    risk?.risk_score !== undefined
      ? Math.round(risk.risk_score)
      : risk?.effective_temp !== undefined
      ? Math.round(risk.effective_temp)
      : null;

  const temp = weather?.temperature !== undefined ? Math.round(weather.temperature) : null;
  const humidity = weather?.humidity !== undefined ? Math.round(weather.humidity) : null;
  const uvIndex = weather?.uv_index !== undefined ? Math.round(weather.uv_index) : null;

  const isStale =
    weather?.is_stale === true ||
    weather?.confidence === 'low' ||
    risk?.confidence === 'low';

  // Styling based on risk level
  let theme = {
    cardBg: 'bg-gradient-to-br from-emerald-50 to-teal-50/40 border-emerald-300',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    textHighlight: 'text-emerald-900',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
    buttonBg: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white',
    buttonRing: 'focus:ring-emerald-500',
  };

  if (isDanger) {
    theme = {
      cardBg: 'bg-gradient-to-br from-red-50 via-rose-50/60 to-orange-50/40 border-red-300',
      badgeBg: 'bg-red-100 text-red-900 border-red-300',
      textHighlight: 'text-red-900',
      icon: <Flame className="w-5 h-5 text-red-600" />,
      buttonBg: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-red-200',
      buttonRing: 'focus:ring-red-500',
    };
  } else if (isHighRisk || isCaution) {
    theme = {
      cardBg: 'bg-gradient-to-br from-amber-50 via-yellow-50/60 to-orange-50/40 border-amber-300',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      textHighlight: 'text-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      buttonBg: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-amber-200',
      buttonRing: 'focus:ring-amber-500',
    };
  }

  // Handle Speech Toggle
  const handleToggleVoice = () => {
    if (isSpeaking) {
      stop();
    } else {
      const script = generateVoiceAlertScript(
        { weather, risk, profile, alert },
        effectiveLanguage
      );
      speak(script, effectiveLanguage);
    }
  };

  // Human-readable contributing factors
  const contributingFactors: string[] = [];
  if (profile?.exposure === 'fullSun') {
    contributingFactors.push(
      effectiveLanguage === 'te'
        ? 'నేరుగా ఎండ'
        : effectiveLanguage === 'hi'
        ? 'सीधी धूप'
        : 'Direct sun exposure'
    );
  }
  if (profile?.intensity === 'heavy') {
    contributingFactors.push(
      effectiveLanguage === 'te'
        ? 'భారీ శ్రమ'
        : effectiveLanguage === 'hi'
        ? 'भारी कार्य'
        : 'Heavy workload'
    );
  } else if (profile?.intensity === 'moderate') {
    contributingFactors.push(
      effectiveLanguage === 'te'
        ? 'మధ్యస్థ శ్రమ'
        : effectiveLanguage === 'hi'
        ? 'मध्यम कार्य'
        : 'Moderate workload'
    );
  }
  if (profile?.clothing === 'heavyPPE' || profile?.clothing === 'moderatePPE') {
    contributingFactors.push(
      effectiveLanguage === 'te'
        ? 'రక్షక దుస్తుల భారం'
        : effectiveLanguage === 'hi'
        ? 'पीपीई का दबाव'
        : 'Protective gear burden'
    );
  }

  const factorText =
    contributingFactors.length > 0
      ? contributingFactors.join(' • ')
      : effectiveLanguage === 'te'
      ? 'సాధారణ పని పరిస్థితులు'
      : effectiveLanguage === 'hi'
      ? 'सामान्य कार्य स्थितियां'
      : 'Standard operating conditions';

  const langTag =
    effectiveLanguage === 'te'
      ? 'తెలుగు'
      : effectiveLanguage === 'hi'
      ? 'हिंदी'
      : 'English';

  return (
    <section
      aria-labelledby="current-alert-title"
      className={`relative overflow-hidden rounded-3xl border-2 p-5 sm:p-6 shadow-sm transition-all ${theme.cardBg}`}
    >
      {/* ── Top Bar: Badge & Metadata ── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-black/5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            id="current-alert-title"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-black/5 text-gray-900 border border-black/10"
          >
            <Radio className="w-3.5 h-3.5 text-red-600 animate-pulse" />
            {t('current_heat_alert') || 'Current Heat Alert'}
          </span>

          {siteName && (
            <span className="text-xs font-medium text-gray-600">
              📍 {siteName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-2xs font-semibold">
          <span className="px-2 py-0.5 rounded-full bg-white/80 border border-gray-200 text-gray-700">
            Voice: {langTag}
          </span>
          {risk?.confidence && (
            <span
              className={`px-2 py-0.5 rounded-full border ${
                risk.confidence === 'high' && !isStale
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-yellow-100 text-yellow-800 border-yellow-200'
              }`}
            >
              {isStale
                ? t('confidence_low') || 'Delayed Weather'
                : `${t('confidence') || 'Confidence'}: ${risk.confidence.toUpperCase()}`}
            </span>
          )}
        </div>
      </div>

      {/* ── Main Risk & Environment Display ── */}
      <div className="py-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Risk Level & Score */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-white/90 shadow-xs border border-black/5">
              {theme.icon}
            </span>
            <div>
              <div className="flex items-baseline gap-2">
                <h2 className={`text-2xl sm:text-3xl font-black uppercase tracking-tight ${theme.textHighlight}`}>
                  {riskLevelLabel}
                </h2>
                {score !== null && (
                  <span className="text-xs sm:text-sm font-bold text-gray-600">
                    ({t('risk_score') || 'Risk Score'}: {score})
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-0.5 font-medium">
                {t('why_receiving_risk') || 'Contributing Factors'}:{' '}
                <span className="font-bold text-gray-800">{factorText}</span>
              </p>
            </div>
          </div>

          {/* Stale Warning If Applicable */}
          {isStale && (
            <div className="flex items-center gap-2 p-2 bg-amber-100/90 border border-amber-300 rounded-xl text-2xs text-amber-950 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>{t('stale_weather_warning') || 'Weather data is currently delayed; confidence is reduced.'}</span>
            </div>
          )}
        </div>

        {/* Environmental Telemetry Pills */}
        <div className="lg:col-span-5 flex flex-wrap lg:justify-end gap-2 text-xs">
          {temp !== null && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/90 border border-gray-200/80 shadow-xs">
              <Thermometer className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-2xs text-gray-400 font-semibold">{t('temperature') || 'Temp'}</p>
                <p className="font-bold text-gray-900">{temp}°C</p>
              </div>
            </div>
          )}

          {humidity !== null && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/90 border border-gray-200/80 shadow-xs">
              <Droplets className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-2xs text-gray-400 font-semibold">{t('humidity') || 'Humidity'}</p>
                <p className="font-bold text-gray-900">{humidity}%</p>
              </div>
            </div>
          )}

          {uvIndex !== null && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/90 border border-gray-200/80 shadow-xs">
              <Sun className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-2xs text-gray-400 font-semibold">{t('uv_index') || 'UV'}</p>
                <p className="font-bold text-gray-900">{uvIndex}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Primary Voice Action Button ── */}
      <div className="pt-2 pb-4">
        <button
          type="button"
          onClick={handleToggleVoice}
          aria-label={
            isSpeaking
              ? t('stop_listening') || 'Stop safety alert voice'
              : `${t('listen_to_safety_alert') || 'Listen to safety alert'} (${langTag})`
          }
          className={`w-full sm:w-auto min-h-[50px] px-6 py-3 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all transform active:scale-98 shadow-md focus:outline-hidden focus:ring-3 ${theme.buttonRing} ${
            isSpeaking
              ? 'bg-gray-900 hover:bg-black text-white ring-2 ring-red-400'
              : theme.buttonBg
          }`}
        >
          {isSpeaking ? (
            <>
              <Square className="w-5 h-5 fill-current text-red-400" />
              <span>{t('stop_listening') || 'Stop'}</span>
              <div className="flex items-center gap-1 ml-1" aria-hidden="true">
                <span className="w-1.5 h-4 bg-red-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-6 bg-red-400 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                <span className="w-1.5 h-4 bg-red-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
              </div>
            </>
          ) : (
            <>
              <Volume2 className="w-5 h-5 text-white" />
              <span>{t('listen_to_safety_alert') || 'Listen to safety alert'}</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                {langTag}
              </span>
            </>
          )}
        </button>

        {/* Device Voice Support Notice if speech synthesis is not supported */}
        {(!isSupported || voiceUnavailable) && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-700 shrink-0 mt-0.5" />
            <p>
              {t('voice_unavailable') ||
                'Voice guidance is not available on this device. Please read the safety guidance below.'}
            </p>
          </div>
        )}
      </div>

      {/* ── Structured Safety & Wellness Guidance Checklist ── */}
      <div className="pt-4 border-t border-black/5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 flex items-center gap-1.5">
          <span>🛡️</span> {t('safety_guidance') || 'Safety Guidance'}:
        </h3>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-800">
          <li className="flex items-center gap-2 p-2 bg-white/80 rounded-xl border border-black/5 font-medium">
            <span className="text-sm">☂️</span>
            <span>{t('guidance_shade') || 'Move to shade or cooler area when possible'}</span>
          </li>
          <li className="flex items-center gap-2 p-2 bg-white/80 rounded-xl border border-black/5 font-medium">
            <span className="text-sm">⏱️</span>
            <span>{t('guidance_rest') || 'Take appropriate scheduled rest breaks'}</span>
          </li>
          <li className="flex items-center gap-2 p-2 bg-white/80 rounded-xl border border-black/5 font-medium">
            <span className="text-sm">💧</span>
            <span>{t('guidance_hydrate') || 'Drink cool water or ORS regularly'}</span>
          </li>
          <li className="flex items-center gap-2 p-2 bg-white/80 rounded-xl border border-black/5 font-medium">
            <span className="text-sm">🩺</span>
            <span>{t('guidance_supervisor') || 'Inform your supervisor immediately if you feel unwell'}</span>
          </li>
        </ul>
      </div>
    </section>
  );
};
