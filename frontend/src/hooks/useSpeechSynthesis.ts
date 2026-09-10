import { useState, useEffect, useRef, useCallback } from 'react';
import { resolveWorkerLanguage, getSpeechLocale, type SupportedLanguage } from '../utils/voiceAlertGenerator';

export interface UseSpeechSynthesisReturn {
  isSupported: boolean;
  isSpeaking: boolean;
  voiceUnavailable: boolean;
  unavailableLanguage: string | null;
  speak: (text: string, lang: string, onEndCallback?: () => void) => void;
  stop: () => void;
}

/**
 * Dumb Speech Synthesis Output Layer.
 *
 * Responsibilities:
 *  - Accepts pre-translated text and resolved target language.
 *  - Maps language to standard BCP-47 locale (te-IN, hi-IN, en-IN).
 *  - Selects matching installed voice for that language.
 *  - NEVER translates or alters the text.
 *  - NEVER falls back to an English voice for Telugu or Hindi text.
 *  - If device lacks a voice for Telugu or Hindi, sets voiceUnavailable and stops immediately.
 *  - Cleans non-speech punctuation without stripping Indic diacritics/matras (\p{M}).
 */
export const useSpeechSynthesis = (): UseSpeechSynthesisReturn => {
  const [isSupported] = useState<boolean>(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window
  );
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voiceUnavailable, setVoiceUnavailable] = useState<boolean>(false);
  const [unavailableLanguage, setUnavailableLanguage] = useState<string | null>(null);

  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const onEndCallbackRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const available = window.speechSynthesis.getVoices();
        voicesRef.current = available;
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    if (onEndCallbackRef.current) {
      onEndCallbackRef.current();
      onEndCallbackRef.current = undefined;
    }
  }, []);

  /**
   * Discovers and selects the best matching voice for the target language.
   * Priority:
   *   1. Exact regional locale match (e.g. te-IN, hi-IN, en-IN)
   *   2. Base language prefix match (e.g. te-, hi-, en-)
   *   3. Name contains language identifier (e.g. "telugu", "hindi")
   */
  const selectVoice = useCallback((lang: SupportedLanguage): SpeechSynthesisVoice | null => {
    const voices = voicesRef.current.length > 0
      ? voicesRef.current
      : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : []);

    if (lang === 'te') {
      return (
        voices.find((v) => v.lang.toLowerCase() === 'te-in' || v.lang.toLowerCase() === 'te_in') ||
        voices.find((v) => v.lang.toLowerCase().startsWith('te-') || v.lang.toLowerCase() === 'te') ||
        voices.find((v) => v.name.toLowerCase().includes('telugu')) ||
        null
      );
    }

    if (lang === 'hi') {
      return (
        voices.find((v) => v.lang.toLowerCase() === 'hi-in' || v.lang.toLowerCase() === 'hi_in') ||
        voices.find((v) => v.lang.toLowerCase().startsWith('hi-') || v.lang.toLowerCase() === 'hi') ||
        voices.find((v) => v.name.toLowerCase().includes('hindi')) ||
        null
      );
    }

    // English: prefer Indian English (en-IN), then any English voice
    return (
      voices.find((v) => v.lang.toLowerCase() === 'en-in' || v.lang.toLowerCase() === 'en_in') ||
      voices.find((v) => v.name.toLowerCase().includes('india') && v.lang.toLowerCase().startsWith('en')) ||
      voices.find((v) => v.lang.toLowerCase() === 'en-gb' || v.lang.toLowerCase() === 'en-us') ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
      null
    );
  }, []);

  const speak = useCallback(
    (text: string, rawLang: string, onEndCallback?: () => void) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setVoiceUnavailable(true);
        setUnavailableLanguage(rawLang);
        return;
      }

      // 1. Prevent duplicate or overlapping speech by cancelling any existing utterance
      window.speechSynthesis.cancel();
      setVoiceUnavailable(false);
      setUnavailableLanguage(null);
      onEndCallbackRef.current = onEndCallback;

      // 2. Normalize target language
      const targetLang: SupportedLanguage = resolveWorkerLanguage(rawLang);

      // 3. Clean non-speech characters while preserving Indic letters (\p{L}),
      //    combining matras/diacritics/halants (\p{M}), numbers (\p{N}), and punctuation (।).
      const cleaned = text.replace(/[^\p{L}\p{M}\p{N}\s,.:!?।-]/gu, '').trim();
      if (!cleaned) {
        setIsSpeaking(false);
        return;
      }

      // 4. Select regional voice
      const matchedVoice = selectVoice(targetLang);

      // CRITICAL DEVICE/VOICE FALLBACK CHECK:
      // If worker selected Telugu or Hindi, but this device has NO installed voice for that language:
      // DO NOT use an English voice to speak Telugu or Hindi!
      // In Chromium/Edge on Windows, calling speak() without a matching voice causes the default English voice
      // to attempt to pronounce Telugu/Hindi or fall back to English!
      if ((targetLang === 'te' || targetLang === 'hi') && !matchedVoice) {
        // Verify if browser has any voice for this language
        const allVoices = window.speechSynthesis.getVoices();
        const hasAnyVoice = allVoices.some((v) =>
          v.lang.toLowerCase().startsWith(targetLang) ||
          v.name.toLowerCase().includes(targetLang === 'te' ? 'telugu' : 'hindi')
        );

        if (!hasAnyVoice) {
          if (import.meta.env.DEV) {
            console.warn('VOICE DEBUG', {
              language: targetLang,
              locale: getSpeechLocale(targetLang),
              text: cleaned,
              voice: `UNAVAILABLE: Device has no installed ${targetLang === 'te' ? 'Telugu' : 'Hindi'} voice. Suppressing English fallback voice.`,
            });
          }
          setVoiceUnavailable(true);
          setUnavailableLanguage(targetLang);
          setIsSpeaking(false);
          return;
        }
      }

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = getSpeechLocale(targetLang);

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.rate = 0.92; // deliberate speed for outdoor clarity
      utterance.pitch = 1.0;

      // Runtime Debug Logging in DEV mode as required by prompt
      if (import.meta.env.DEV) {
        console.log('VOICE DEBUG', {
          language: targetLang,
          locale: utterance.lang,
          text: cleaned,
          voice: matchedVoice ? `${matchedVoice.name} (${matchedVoice.lang})` : 'System Default',
        });
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setVoiceUnavailable(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        if (onEndCallbackRef.current) {
          onEndCallbackRef.current();
          onEndCallbackRef.current = undefined;
        }
      };

      utterance.onerror = (event) => {
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          console.error('[SpeechSynthesis Error]:', event.error);
          setVoiceUnavailable(true);
          setUnavailableLanguage(targetLang);
        }
        setIsSpeaking(false);
        if (onEndCallbackRef.current) {
          onEndCallbackRef.current();
          onEndCallbackRef.current = undefined;
        }
      };

      window.speechSynthesis.speak(utterance);
    },
    [selectVoice]
  );

  return {
    isSupported,
    isSpeaking,
    voiceUnavailable,
    unavailableLanguage,
    speak,
    stop,
  };
};
