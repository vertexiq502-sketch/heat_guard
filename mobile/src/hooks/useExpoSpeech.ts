import { useState, useEffect, useCallback, useRef } from 'react';
import * as Speech from 'expo-speech';
import { getSpeechLocale, type SupportedLanguage } from '../utils/voiceAlertGenerator';

export const useExpoSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceUnavailable, setVoiceUnavailable] = useState(false);
  const activeSpeakRef = useRef(false);

  // Poll speaking state to sync when audio finishes or is interrupted
  useEffect(() => {
    const checkSpeaking = async () => {
      try {
        const speaking = await Speech.isSpeakingAsync();
        if (!speaking && activeSpeakRef.current) {
          activeSpeakRef.current = false;
          setIsSpeaking(false);
        }
      } catch (e) {
        // ignore
      }
    };

    const interval = setInterval(checkSpeaking, 500);
    return () => {
      clearInterval(interval);
      Speech.stop();
    };
  }, []);

  const stop = useCallback(async () => {
    try {
      activeSpeakRef.current = false;
      setIsSpeaking(false);
      await Speech.stop();
    } catch (e) {
      console.warn('Speech.stop error:', e);
    }
  }, []);

  const speak = useCallback(
    async (text: string, language: SupportedLanguage) => {
      if (!text || text.trim().length === 0) return;

      // Stop any ongoing speech first
      await stop();

      const locale = getSpeechLocale(language);
      activeSpeakRef.current = true;
      setIsSpeaking(true);
      setVoiceUnavailable(false);

      try {
        Speech.speak(text, {
          language: locale,
          pitch: 1.0,
          rate: 0.95,
          onStart: () => {
            activeSpeakRef.current = true;
            setIsSpeaking(true);
          },
          onDone: () => {
            activeSpeakRef.current = false;
            setIsSpeaking(false);
          },
          onStopped: () => {
            activeSpeakRef.current = false;
            setIsSpeaking(false);
          },
          onError: (err) => {
            console.warn('Expo Speech error:', err);
            activeSpeakRef.current = false;
            setIsSpeaking(false);
            setVoiceUnavailable(true);
          },
        });
      } catch (err) {
        console.warn('Speech.speak invocation error:', err);
        activeSpeakRef.current = false;
        setIsSpeaking(false);
        setVoiceUnavailable(true);
      }
    },
    [stop]
  );

  return {
    isSupported: true,
    isSpeaking,
    voiceUnavailable,
    speak,
    stop,
  };
};
