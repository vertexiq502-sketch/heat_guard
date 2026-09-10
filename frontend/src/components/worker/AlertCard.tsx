import { useState, useEffect } from 'react';
import { useLocalization } from '../../hooks/useLocalization';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';
import { Volume2, VolumeX, Radio, Check } from 'lucide-react';

export interface AlertCardProps {
  alert: {
    id: string;
    title: string;
    message: string;
    title_te?: string;
    message_te?: string;
    title_hi?: string;
    message_hi?: string;
    type?: string;
    severity?: string;
    status?: string;
    created_at: string;
    acknowledged_at?: string;
    site_id?: string;
    site_name?: string;
    delivery_channel?: string;
    sites?: { name?: string };
  };
  siteName?: string;
  allowAcknowledge?: boolean;
  workerLanguage?: string;
}

export const AlertCard = ({
  alert,
  siteName,
  allowAcknowledge = true,
  workerLanguage
}: AlertCardProps) => {
  const { t, language: uiLanguage } = useLocalization();
  const authUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [isAcknowledgedLocally, setIsAcknowledgedLocally] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  // The worker's selected language fetched from the users table (fallback to authStore, then uiLanguage)
  const effectiveLanguage = (workerLanguage || authUser?.language || uiLanguage || 'en').toLowerCase().trim();

  // Consistent Severity Terminology: SAFE, CAUTION, DANGER
  const normType = (alert.type || '').toLowerCase();
  const normSev = (alert.severity || '').toLowerCase();

  // Localized content strictly bound to the worker's selected language from users table
  let title = alert.title;
  let message = alert.message;

  if (effectiveLanguage === 'te') {
    title = alert.title_te || alert.title;
    if (alert.message_te && /[\u0C00-\u0C7F]/.test(alert.message_te)) {
      message = alert.message_te;
    } else if (normType === 'danger' || normSev === 'critical') {
      message = 'ఉష్ణోగ్రత 45 డిగ్రీలు దాటింది. వెంటనే బయట పని ఆపి నీడ ప్రదేశానికి వెళ్ళండి. పుష్కలంగా నీరు మరియు ఓఆర్ఎస్ త్రాగండి.';
    } else if (normType === 'high_risk' || normType === 'caution' || normSev === 'warning') {
      message = 'ఉష్ణోగ్రత మరియు వేడి సూచిక హెచ్చరిక స్థాయికి చేరుకున్నాయి. ప్రతి గంటకు నీరు త్రాగండి మరియు నీడలో విశ్రాంతి తీసుకోండి.';
    } else {
      message = alert.message_te || alert.message;
    }
  } else if (effectiveLanguage === 'hi') {
    title = alert.title_hi || alert.title;
    if (alert.message_hi && /[\u0900-\u097F]/.test(alert.message_hi)) {
      message = alert.message_hi;
    } else if (normType === 'danger' || normSev === 'critical') {
      message = 'प्रभावी तापमान 45 डिग्री से अधिक हो गया है। तुरंत काम रोकें और छायादार आश्रय में जाएं। ओआरएस और पानी पिएं।';
    } else if (normType === 'high_risk' || normType === 'caution' || normSev === 'warning') {
      message = 'तापमान और हीट इंडेक्स चेतावनी स्तर पर पहुंच गया है। पर्याप्त पानी पिएं और छाया में नियमित विश्राम लें।';
    } else {
      message = alert.message_hi || alert.message;
    }
  }

  let severityLabel = t('safe');
  let borderClass = 'border-l-emerald-500';
  let bgClass = 'bg-emerald-50';
  let titleColor = 'text-emerald-950';
  let messageColor = 'text-emerald-800';
  let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  let icon = '✅';

  if (normType === 'danger' || normSev === 'critical') {
    severityLabel = t('danger');
    borderClass = 'border-l-red-500';
    bgClass = 'bg-red-50';
    titleColor = 'text-red-950';
    messageColor = 'text-red-800';
    badgeClass = 'bg-red-100 text-red-800 border-red-200';
    icon = '🚨';
  } else if (normType === 'high_risk' || normType === 'caution' || normSev === 'warning') {
    severityLabel = t('caution');
    borderClass = 'border-l-amber-500';
    bgClass = 'bg-amber-50';
    titleColor = 'text-amber-950';
    messageColor = 'text-amber-800';
    badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
    icon = '⚠️';
  }

  // Detect if this is a voice alert
  const isVoiceAlert =
    alert.delivery_channel === 'voice' ||
    (alert.title && alert.title.toLowerCase().includes('voice')) ||
    (alert.message && alert.message.toLowerCase().includes('voice'));

  // Clean up any ongoing speech synthesis on unmount and ensure browser voices are loaded
  useEffect(() => {
    const handleVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
      }
    };
    handleVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = handleVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Web Speech API handler for voice alert playback in worker's selected language
  const handleToggleVoice = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis audio is not supported in this browser.');
      return;
    }

    if (isPlayingVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
      return;
    }

    window.speechSynthesis.cancel(); // cancel any active speech

    // Clean title and message of emojis and non-speech symbols before speaking
    const cleanTitle = title.replace(/[^\p{L}\p{N}\s,.:-]/gu, '').trim();
    const cleanMessage = message.replace(/[^\p{L}\p{N}\s,.:-]/gu, '').trim();
    const speechText = `${cleanTitle}. ${cleanMessage}`;

    const utterance = new SpeechSynthesisUtterance(speechText);

    // Set voice language matching the worker's selected language from users table
    if (effectiveLanguage === 'te') {
      utterance.lang = 'te-IN';
    } else if (effectiveLanguage === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    // Select the best matching voice engine from available browser voices
    const voices = window.speechSynthesis.getVoices();
    let matchedVoice: SpeechSynthesisVoice | undefined;

    if (effectiveLanguage === 'te') {
      matchedVoice = voices.find(
        (v) =>
          v.lang === 'te-IN' ||
          v.lang === 'te' ||
          v.lang.toLowerCase().startsWith('te-') ||
          v.name.toLowerCase().includes('telugu')
      );
    } else if (effectiveLanguage === 'hi') {
      matchedVoice = voices.find(
        (v) =>
          v.lang === 'hi-IN' ||
          v.lang === 'hi' ||
          v.lang.toLowerCase().startsWith('hi-') ||
          v.name.toLowerCase().includes('hindi')
      );
    } else {
      matchedVoice = voices.find(
        (v) =>
          v.lang === 'en-IN' ||
          v.name.toLowerCase().includes('india') ||
          v.lang === 'en-US' ||
          v.lang.startsWith('en')
      );
    }

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.rate = 0.95; // slightly slower for emergency clarity
    utterance.pitch = 1.05;

    utterance.onstart = () => setIsPlayingVoice(true);
    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);

    window.speechSynthesis.speak(utterance);
  };

  // Site name resolution
  const resolvedSite = siteName || alert.site_name || alert.sites?.name;

  // Timestamp formatting
  const date = new Date(alert.created_at);
  const formattedTime = !isNaN(date.getTime())
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  const formattedDate = !isNaN(date.getTime())
    ? date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    : '';

  const isAcknowledged = isAcknowledgedLocally || alert.status === 'acknowledged';

  const handleAcknowledge = async () => {
    if (isAcknowledged || isAcknowledging) return;
    setIsAcknowledging(true);
    try {
      await apiClient.post(`/alerts/${alert.id}/acknowledge`);
      setIsAcknowledgedLocally(true);
      queryClient.invalidateQueries({ queryKey: ['workerDashboard'] });
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    } finally {
      setIsAcknowledging(false);
    }
  };

  return (
    <div className={`${bgClass} border-l-4 ${borderClass} p-4 rounded-2xl shadow-sm mb-3 border border-gray-200/70 transition-all space-y-2.5`}>
      {/* Header: Severity Badge, Voice Badge, Status Badge & Timestamp */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${badgeClass}`}
            aria-label={`Severity: ${severityLabel}`}
          >
            <span aria-hidden="true">{icon}</span>
            <span>{severityLabel}</span>
          </span>

          {/* Voice Alert Indicator Badge */}
          {isVoiceAlert && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
              <Radio className="w-3 h-3 text-purple-600 animate-pulse" />
              Voice Alert • {effectiveLanguage === 'te' ? 'తెలుగు' : effectiveLanguage === 'hi' ? 'हिंदी' : 'English'}
            </span>
          )}

          {isAcknowledged ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
              <Check className="w-3 h-3 text-green-600" /> {t('acknowledged')}
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
              {t('pending')}
            </span>
          )}
        </div>

        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
          {formattedDate} {formattedTime}
        </span>
      </div>

      {/* Alert Title */}
      <h3 className={`text-base font-bold ${titleColor} leading-snug`}>
        {title}
      </h3>

      {/* Alert Message */}
      <p className={`text-xs sm:text-sm ${messageColor} leading-relaxed`}>
        {message}
      </p>

      {/* Spoken Voice Broadcast Waveform Banner (When playing) */}
      {isPlayingVoice && (
        <div className="flex items-center gap-2 py-1.5 px-3 bg-purple-100/90 border border-purple-300 rounded-xl text-xs text-purple-950 font-semibold animate-pulse">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-3.5 bg-purple-600 rounded-full animate-bounce"></span>
            <span className="w-1.5 h-5 bg-purple-600 rounded-full animate-bounce [animation-delay:0.15s]"></span>
            <span className="w-1.5 h-3 bg-purple-600 rounded-full animate-bounce [animation-delay:0.3s]"></span>
          </div>
          <span>
            Playing audio broadcast in{' '}
            {effectiveLanguage === 'te'
              ? 'Telugu (తెలుగు)'
              : effectiveLanguage === 'hi'
              ? 'Hindi (हिंदी)'
              : 'English'}
            ...
          </span>
        </div>
      )}

      {/* Footer: Site Info & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/5 text-xs text-gray-600">
        <div>
          {resolvedSite && (
            <span className="inline-flex items-center gap-1 font-medium text-gray-700">
              <span aria-hidden="true">📍</span>
              <span>{t('site')}: {resolvedSite}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Voice Playback Button */}
          <button
            onClick={handleToggleVoice}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition active:scale-95 ${
              isPlayingVoice
                ? 'bg-purple-600 text-white hover:bg-purple-700 ring-2 ring-purple-300'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
            }`}
            title={`Listen to voice alert in ${
              effectiveLanguage === 'te' ? 'Telugu' : effectiveLanguage === 'hi' ? 'Hindi' : 'English'
            }`}
          >
            {isPlayingVoice ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Stop Audio</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-purple-700" />
                <span>
                  Play Voice Alert ({effectiveLanguage === 'te' ? 'తెలుగు' : effectiveLanguage === 'hi' ? 'हिंदी' : 'English'})
                </span>
              </>
            )}
          </button>

          {/* Acknowledge Button */}
          {allowAcknowledge && !isAcknowledged && (
            <button
              onClick={handleAcknowledge}
              disabled={isAcknowledging}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 hover:text-gray-900 active:scale-95 shadow-sm transition disabled:opacity-50"
              aria-label={t('acknowledge')}
            >
              {isAcknowledging ? (
                <>
                  <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>{t('loading')}</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>{t('acknowledge')}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
