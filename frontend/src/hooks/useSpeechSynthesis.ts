import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseSpeechSynthesisReturn {
  isSupported: boolean;
  isSpeaking: boolean;
  voiceUnavailable: boolean;
  speak: (text: string, lang: string, onEndCallback?: () => void) => void;
  stop: () => void;
}

/**
 * Custom hook to manage Web Speech API SpeechSynthesis cleanly and safely.
 * Handles language voice selection, duplicate speech prevention, component cleanup,
 * and graceful fallback for unsupported devices or missing regional voices.
 */
export const useSpeechSynthesis = (): UseSpeechSynthesisReturn => {
  const [isSupported, setIsSupported] = useState<boolean>(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window
  );
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voiceUnavailable, setVoiceUnavailable] = useState<boolean>(false);
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

    // Cleanup speech on unmount to prevent speech continuing across page navigation
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

  const selectVoice = useCallback((lang: string): SpeechSynthesisVoice | null => {
    const voices = voicesRef.current.length > 0
      ? voicesRef.current
      : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : []);

    const targetLang = (lang || 'en').toLowerCase().trim();

    if (targetLang === 'te') {
      // 1. Exact te-IN or te_IN
      // 2. Starts with te-
      // 3. Name contains telugu
      return (
        voices.find((v) => v.lang.toLowerCase() === 'te-in' || v.lang.toLowerCase() === 'te_in') ||
        voices.find((v) => v.lang.toLowerCase().startsWith('te-') || v.lang.toLowerCase() === 'te') ||
        voices.find((v) => v.name.toLowerCase().includes('telugu')) ||
        null
      );
    }

    if (targetLang === 'hi') {
      // 1. Exact hi-IN or hi_IN
      // 2. Starts with hi-
      // 3. Name contains hindi
      return (
        voices.find((v) => v.lang.toLowerCase() === 'hi-in' || v.lang.toLowerCase() === 'hi_in') ||
        voices.find((v) => v.lang.toLowerCase().startsWith('hi-') || v.lang.toLowerCase() === 'hi') ||
        voices.find((v) => v.name.toLowerCase().includes('hindi')) ||
        null
      );
    }

    // English: prefer en-IN, then Indian accents, then en-GB / en-US, then any English
    return (
      voices.find((v) => v.lang.toLowerCase() === 'en-in' || v.lang.toLowerCase() === 'en_in') ||
      voices.find((v) => v.name.toLowerCase().includes('india') && v.lang.toLowerCase().startsWith('en')) ||
      voices.find((v) => v.lang.toLowerCase() === 'en-gb' || v.lang.toLowerCase() === 'en-us') ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
      null
    );
  }, []);

  const speak = useCallback(
    (text: string, lang: string, onEndCallback?: () => void) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setIsSupported(false);
        setVoiceUnavailable(true);
        return;
      }

      // 1. Stop any ongoing speech immediately to prevent duplicate or overlapping playback
      window.speechSynthesis.cancel();
      setVoiceUnavailable(false);
      onEndCallbackRef.current = onEndCallback;

      // 2. Clean text of special symbols or non-speech emojis
      const cleaned = text.replace(/[^\p{L}\p{N}\s,.:!?-]/gu, '').trim();
      if (!cleaned) {
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleaned);

      // 3. Set standard BCP-47 language codes
      const targetLang = (lang || 'en').toLowerCase().trim();
      if (targetLang === 'te') {
        utterance.lang = 'te-IN';
      } else if (targetLang === 'hi') {
        utterance.lang = 'hi-IN';
      } else {
        utterance.lang = 'en-IN';
      }

      // 4. Select regional voice if installed
      const matchedVoice = selectVoice(targetLang);
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      } else if (targetLang === 'te' || targetLang === 'hi') {
        // If neither specific voice nor OS synthesis is ready for the Indic language,
        // we check if browser is able to handle it without voice assignment or warn
        const hasAnyIndicSupport = voicesRef.current.some((v) =>
          v.lang.toLowerCase().startsWith(targetLang)
        );
        if (!hasAnyIndicSupport && voicesRef.current.length > 0) {
          // Device has voices loaded, but no Telugu/Hindi voice pack is installed
          console.warn(`[SpeechSynthesis] No voice installed for language: ${targetLang}`);
        }
      }

      utterance.rate = 0.93; // slightly deliberate for emergency clarity in outdoor noisy environments
      utterance.pitch = 1.02;

      if (import.meta.env.DEV) {
        console.log('[SpeechSynthesis Debug]', {
          selectedLanguage: targetLang,
          speechLocale: utterance.lang,
          spokenText: cleaned,
          selectedVoice: matchedVoice ? `${matchedVoice.name} (${matchedVoice.lang})` : 'System Default / Unassigned',
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
        // 'canceled' or 'interrupted' errors happen naturally on user manual stop
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          console.error('[SpeechSynthesis] Error during speech synthesis:', event.error);
          setVoiceUnavailable(true);
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
    speak,
    stop,
  };
};
