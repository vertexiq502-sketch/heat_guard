import en from '../locales/en.json';
import te from '../locales/te.json';
import hi from '../locales/hi.json';

export type SupportedLang = 'en' | 'te' | 'hi';

const translations: Record<SupportedLang, Record<string, string>> = { en, te, hi };

export interface VoiceAlertContext {
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
}

/**
 * Normalizes and resolves the user's active language preference.
 * Checks UI language, localStorage, worker profile, and authStore.
 */
export function resolveUserLanguage(
  profile?: { language?: string | null; preferred_language?: string | null } | null,
  authUser?: { language?: string | null; preferred_language?: string | null } | null,
  uiLanguage?: string | null
): SupportedLang {
  const normalize = (val?: string | null): SupportedLang | null => {
    if (!val) return null;
    const l = val.toLowerCase().trim();
    if (l === 'te' || l.startsWith('te-') || l.startsWith('te_') || l.includes('telugu')) return 'te';
    if (l === 'hi' || l.startsWith('hi-') || l.startsWith('hi_') || l.includes('hindi')) return 'hi';
    if (l === 'en' || l.startsWith('en-') || l.startsWith('en_') || l.includes('english')) return 'en';
    return null;
  };

  // 1. Current UI language if user explicitly selected in language switcher
  const fromUi = normalize(uiLanguage);
  if (fromUi) return fromUi;

  // 2. Saved preference in localStorage
  if (typeof window !== 'undefined') {
    try {
      const fromStorage = normalize(localStorage.getItem('heatguard_lang'));
      if (fromStorage) return fromStorage;
    } catch {
      // Ignore
    }
  }

  // 3. User profile from API
  const fromProfile = normalize(profile?.language) || normalize(profile?.preferred_language);
  if (fromProfile) return fromProfile;

  // 4. User from AuthStore
  const fromAuth = normalize(authUser?.language) || normalize(authUser?.preferred_language);
  if (fromAuth) return fromAuth;

  return 'en';
}

/**
 * Returns the standard BCP-47 speech locale for speech synthesis.
 */
export function getSpeechLocale(lang: string): string {
  const normalized = (lang || '').toLowerCase().trim();
  if (normalized.startsWith('te')) return 'te-IN';
  if (normalized.startsWith('hi')) return 'hi-IN';
  return 'en-IN';
}

/**
 * Retrieves a localized string for the specified language with fallback.
 */
export function getTranslation(lang: SupportedLang, key: string, fallback?: string): string {
  const dict = translations[lang] || translations.en;
  return dict[key] || translations.en[key] || fallback || key;
}

/**
 * Replaces {param} placeholders in localized templates with actual dynamic values.
 */
export function formatTemplate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : '';
  });
}

/**
 * Generates natural, accessible spoken text strictly in the worker's selected language.
 * Uses existing localization JSON keys and dynamic data interpolation.
 */
export function generateVoiceAlertScript(
  ctx: VoiceAlertContext,
  language: string
): string {
  const lang: SupportedLang = resolveUserLanguage(ctx.profile, null, language);
  const weather = ctx.weather;
  const risk = ctx.risk;
  const profile = ctx.profile;

  const segments: string[] = [];

  // 1. Alert Intro Header
  segments.push(getTranslation(lang, 'voice_alert_intro'));

  // 2. Telemetry: Temperature & Humidity
  const temp = weather?.temperature !== undefined ? Math.round(weather.temperature) : null;
  const humidity = weather?.humidity !== undefined ? Math.round(weather.humidity) : null;

  if (temp !== null && humidity !== null) {
    segments.push(
      formatTemplate(getTranslation(lang, 'voice_env_temp_humidity'), {
        temperature: temp,
        humidity: humidity,
      })
    );
  } else if (temp !== null) {
    segments.push(
      formatTemplate(getTranslation(lang, 'voice_env_temp_only'), {
        temperature: temp,
      })
    );
  }

  // 3. Normalized Risk Level & Risk Score
  const rawLevel = (risk?.risk_level || 'green').toLowerCase();
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

  const levelLabel = getTranslation(lang, levelKey);

  const score =
    risk?.risk_score !== undefined
      ? Math.round(risk.risk_score)
      : risk?.effective_temp !== undefined
      ? Math.round(risk.effective_temp)
      : null;

  if (score !== null) {
    segments.push(
      formatTemplate(getTranslation(lang, 'voice_risk_level_score'), {
        level: levelLabel,
        score,
      })
    );
  } else {
    segments.push(
      formatTemplate(getTranslation(lang, 'voice_risk_level_only'), {
        level: levelLabel,
      })
    );
  }

  // 4. Stale Weather / Reduced Confidence Notice
  const isStale =
    weather?.is_stale === true ||
    weather?.confidence === 'low' ||
    risk?.confidence === 'low';

  if (isStale) {
    segments.push(getTranslation(lang, 'voice_stale_warning'));
  }

  // 5. Worker-Specific Contributing Factors (Why worker has this risk)
  if (isDanger || isHighRisk || isCaution) {
    const factorList: string[] = [];

    // Environmental heat
    if (temp !== null && temp >= 37) {
      factorList.push(getTranslation(lang, 'voice_factor_high_heat'));
    }

    // Direct Sun Exposure
    if (profile?.exposure === 'fullSun') {
      factorList.push(getTranslation(lang, 'voice_factor_sun'));
    } else if (profile?.exposure === 'partialShade') {
      factorList.push(getTranslation(lang, 'voice_factor_partial_sun'));
    }

    // Workload Intensity
    if (profile?.intensity === 'heavy') {
      factorList.push(getTranslation(lang, 'voice_factor_heavy_work'));
    } else if (profile?.intensity === 'moderate') {
      factorList.push(getTranslation(lang, 'voice_factor_moderate_work'));
    }

    // Exposure Duration
    if (profile?.duration === 'prolonged') {
      factorList.push(getTranslation(lang, 'voice_factor_prolonged_exposure'));
    }

    // Clothing / PPE
    if (profile?.clothing === 'heavyPPE' || profile?.clothing === 'moderatePPE') {
      factorList.push(getTranslation(lang, 'voice_factor_ppe'));
    }

    // Unacclimatized
    if (profile?.is_unacclimatized) {
      factorList.push(getTranslation(lang, 'voice_factor_unacclimatized'));
    }

    if (factorList.length > 0) {
      const joiner = lang === 'te' ? ' మరియు ' : lang === 'hi' ? ' और ' : ', and ';
      const joinedFactors = factorList.join(joiner);
      segments.push(
        formatTemplate(getTranslation(lang, 'voice_risk_reasons'), {
          factors: joinedFactors,
        })
      );
    }
  }

  // 6. Actionable Wellness & Safety Recommendations
  if (isDanger) {
    segments.push(getTranslation(lang, 'voice_guidance_danger'));
  } else if (isHighRisk || isCaution) {
    segments.push(getTranslation(lang, 'voice_guidance_high_risk'));
  } else {
    segments.push(getTranslation(lang, 'voice_guidance_safe'));
  }

  return segments.join(' ').trim();
}
