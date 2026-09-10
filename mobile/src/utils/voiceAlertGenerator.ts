import en from '../locales/en.json';
import te from '../locales/te.json';
import hi from '../locales/hi.json';

export type SupportedLanguage = 'en' | 'te' | 'hi';
export type SupportedLang = SupportedLanguage;

const translations: Record<SupportedLanguage, Record<string, string>> = { en, te, hi };

export interface VoiceAlertInput {
  temperature?: number | null;
  humidity?: number | null;
  windSpeed?: number | null;
  uvIndex?: number | null;
  riskScore?: number | null;
  riskCategory?: string | null;
  confidence?: string | null;
  isStale?: boolean | null;
  factors?: {
    exposure?: string | null;
    intensity?: string | null;
    duration?: string | null;
    clothing?: string | null;
    isUnacclimatized?: boolean | null;
  } | null;
  recommendations?: {
    workStatus?: string;
    restInstruction?: string;
    hydrationInstruction?: string;
    additionalGuidance?: string;
  } | null;
  weather?: {
    temperature?: number;
    humidity?: number;
    uv_index?: number;
    confidence?: string;
    is_stale?: boolean;
  } | null;
  risk?: {
    risk_level?: string;
    risk_score?: number;
    effective_temp?: number;
    confidence?: string;
    explanation?: string;
    recommendation?: {
      workStatus?: string;
      restInstruction?: string;
      hydrationInstruction?: string;
      additionalGuidance?: string;
    };
  } | null;
  profile?: {
    worker_type?: string | null;
    intensity?: string | null;
    exposure?: string | null;
    clothing?: string | null;
    duration?: string | null;
    language?: string | null;
    preferred_language?: string | null;
    is_unacclimatized?: boolean | null;
  } | null;
  alert?: {
    title?: string;
    message?: string;
    title_te?: string;
    message_te?: string;
    title_hi?: string;
    message_hi?: string;
  } | null;
  workerLanguage?: string | null;
}

export type VoiceAlertContext = VoiceAlertInput;

export function resolveWorkerLanguage(input?: any): SupportedLanguage {
  const normalize = (val?: any): SupportedLanguage | null => {
    if (!val) return null;
    const str = String(val).toLowerCase().trim();
    if (str === 'te' || str.startsWith('te-') || str.startsWith('te_') || str.includes('telugu')) {
      return 'te';
    }
    if (str === 'hi' || str.startsWith('hi-') || str.startsWith('hi_') || str.includes('hindi')) {
      return 'hi';
    }
    if (str === 'en' || str.startsWith('en-') || str.startsWith('en_') || str.includes('english')) {
      return 'en';
    }
    return null;
  };

  let candidate = input;
  if (input && typeof input === 'object') {
    candidate = input.language || input.preferred_language || input.preferredLanguage || input.lang;
  }

  const normalized = normalize(candidate);
  if (normalized) return normalized;

  return 'en';
}

export const resolveUserLanguage = resolveWorkerLanguage;

export function getSpeechLocale(lang: string): string {
  const normalized = resolveWorkerLanguage(lang);
  switch (normalized) {
    case 'te': return 'te-IN';
    case 'hi': return 'hi-IN';
    case 'en': return 'en-IN';
  }
}

export function getTranslation(lang: SupportedLanguage, key: string, fallback?: string): string {
  const dict = translations[lang] || translations.en;
  return dict[key] || translations.en[key] || fallback || key;
}

export function formatTemplate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : '';
  });
}

export function buildLocalizedVoiceAlert(
  data: VoiceAlertInput,
  language?: string
): { text: string; language: SupportedLanguage } {
  const targetLang = resolveWorkerLanguage(
    language || data.workerLanguage || data.profile?.language || data.profile?.preferred_language
  );

  const weather = data.weather;
  const tempRaw = data.temperature !== undefined && data.temperature !== null ? data.temperature : weather?.temperature;
  const humidityRaw = data.humidity !== undefined && data.humidity !== null ? data.humidity : weather?.humidity;

  const temp = tempRaw !== undefined && tempRaw !== null && !isNaN(tempRaw) ? Math.round(tempRaw) : null;
  const humidity = humidityRaw !== undefined && humidityRaw !== null && !isNaN(humidityRaw) ? Math.round(humidityRaw) : null;

  const risk = data.risk;
  const rawLevel = (data.riskCategory || risk?.risk_level || 'green').toLowerCase();
  const isDanger = rawLevel === 'red' || rawLevel === 'danger';
  const isHighRisk = rawLevel === 'orange' || rawLevel === 'high_risk';
  const isCaution = rawLevel === 'yellow' || rawLevel === 'caution';

  const levelKey = isDanger
    ? 'danger'
    : isHighRisk
    ? 'high_risk'
    : isCaution
    ? 'caution'
    : 'safe';

  const levelLabel = getTranslation(targetLang, levelKey);

  const rawScore = data.riskScore !== undefined && data.riskScore !== null
    ? data.riskScore
    : risk?.risk_score !== undefined && risk?.risk_score !== null
    ? risk.risk_score
    : risk?.effective_temp !== undefined && risk?.effective_temp !== null
    ? risk.effective_temp
    : null;

  const score = rawScore !== null && !isNaN(rawScore) ? Math.round(rawScore) : null;

  const isStale =
    data.isStale === true ||
    weather?.is_stale === true ||
    data.confidence === 'low' ||
    weather?.confidence === 'low' ||
    risk?.confidence === 'low';

  const profile = data.profile;
  const factors = data.factors;
  const exposure = factors?.exposure || profile?.exposure;
  const intensity = factors?.intensity || profile?.intensity;
  const duration = factors?.duration || profile?.duration;
  const clothing = factors?.clothing || profile?.clothing;
  const isUnacclimatized = factors?.isUnacclimatized ?? profile?.is_unacclimatized;

  const segments: string[] = [];

  // 1. Alert Intro Header
  segments.push(getTranslation(targetLang, 'voice_alert_intro'));

  // 2. Telemetry
  if (temp !== null && humidity !== null) {
    segments.push(
      formatTemplate(getTranslation(targetLang, 'voice_env_temp_humidity'), {
        temperature: temp,
        humidity: humidity,
      })
    );
  } else if (temp !== null) {
    segments.push(
      formatTemplate(getTranslation(targetLang, 'voice_env_temp_only'), {
        temperature: temp,
      })
    );
  }

  // 3. Personalized Heat-Risk Level & Score
  if (score !== null) {
    segments.push(
      formatTemplate(getTranslation(targetLang, 'voice_risk_level_score'), {
        level: levelLabel,
        score,
      })
    );
  } else {
    segments.push(
      formatTemplate(getTranslation(targetLang, 'voice_risk_level_only'), {
        level: levelLabel,
      })
    );
  }

  // 4. Stale Weather Notice
  if (isStale) {
    segments.push(getTranslation(targetLang, 'voice_stale_warning'));
  }

  // 5. Contributing factors
  if (isDanger || isHighRisk || isCaution) {
    const factorList: string[] = [];

    if (temp !== null && temp >= 37) {
      factorList.push(getTranslation(targetLang, 'voice_factor_high_heat'));
    }
    if (exposure === 'fullSun') {
      factorList.push(getTranslation(targetLang, 'voice_factor_sun'));
    } else if (exposure === 'partialShade') {
      factorList.push(getTranslation(targetLang, 'voice_factor_partial_sun'));
    }
    if (intensity === 'heavy') {
      factorList.push(getTranslation(targetLang, 'voice_factor_heavy_work'));
    } else if (intensity === 'moderate') {
      factorList.push(getTranslation(targetLang, 'voice_factor_moderate_work'));
    }
    if (duration === 'prolonged') {
      factorList.push(getTranslation(targetLang, 'voice_factor_prolonged_exposure'));
    }
    if (clothing === 'heavyPPE' || clothing === 'moderatePPE') {
      factorList.push(getTranslation(targetLang, 'voice_factor_ppe'));
    }
    if (isUnacclimatized) {
      factorList.push(getTranslation(targetLang, 'voice_factor_unacclimatized'));
    }

    if (factorList.length > 0) {
      const joiner = targetLang === 'te' ? ' మరియు ' : targetLang === 'hi' ? ' और ' : ', and ';
      const joinedFactors = factorList.join(joiner);
      segments.push(
        formatTemplate(getTranslation(targetLang, 'voice_risk_reasons'), {
          factors: joinedFactors,
        })
      );
    }
  }

  // 6. Actionable guidance
  if (isDanger) {
    segments.push(getTranslation(targetLang, 'voice_guidance_danger'));
  } else if (isHighRisk || isCaution) {
    segments.push(getTranslation(targetLang, 'voice_guidance_high_risk'));
  } else {
    segments.push(getTranslation(targetLang, 'voice_guidance_safe'));
  }

  return {
    text: segments.join(' ').trim(),
    language: targetLang,
  };
}
