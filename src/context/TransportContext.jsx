import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { DEFAULT_INPUT, VOLUME_DEFAULT } from '../data/options';
import { fetchComfortMessage } from '../services/messageApi';
import { recommend } from '../services/recommend';
import { speak, stopSpeaking } from '../services/tts';
import {
  createIdleProjectorState,
  publishProjectorState,
} from '../services/projectorSync';

const TransportContext = createContext(null);

export function TransportProvider({ children }) {
  const [input, setInput] = useState({ ...DEFAULT_INPUT });
  const [recommendations, setRecommendations] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [defaultVolume, setDefaultVolume] = useState(VOLUME_DEFAULT);
  const [aiMessage, setAiMessage] = useState('');
  const [aiMessageSource, setAiMessageSource] = useState(null);
  const [aiMessageLoading, setAiMessageLoading] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const fetchLock = useRef(false);

  const updateInput = useCallback((key, value) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  }, []);

  const runRecommend = useCallback(() => {
    const results = recommend(input);
    setRecommendations(results);
    return results;
  }, [input]);

  const selectPlan = useCallback((plan) => {
    setSelectedPlan(plan);
  }, []);

  const resetSession = useCallback(() => {
    setSelectedPlan(null);
    setRecommendations([]);
    setAiMessage('');
    setAiMessageSource(null);
    setAiMessageLoading(false);
    setAiPanelOpen(false);
    stopSpeaking();
    publishProjectorState(createIdleProjectorState());
  }, []);

  /**
   * Gemini 멘트 요청 (공통)
   * @param {{ speak?: boolean, volume?: number, onSpeakEnd?: () => void }} options
   */
  const requestAiMessage = useCallback(
    async (options = {}) => {
      const {
        speak: shouldSpeak = false,
        volume = defaultVolume,
        onSpeakEnd,
      } = options;

      if (fetchLock.current) return null;
      fetchLock.current = true;
      setAiMessageLoading(true);

      try {
        const result = await fetchComfortMessage(input);
        setAiMessage(result.message);
        setAiMessageSource(result.source);

        if (shouldSpeak) {
          speak(result.message, {
            volume: Math.min(1, Math.max(0, volume)),
            onEnd: onSpeakEnd,
          });
        } else {
          onSpeakEnd?.();
        }

        return result;
      } finally {
        setAiMessageLoading(false);
        fetchLock.current = false;
      }
    },
    [input, defaultVolume],
  );

  const value = useMemo(
    () => ({
      input,
      updateInput,
      setInput,
      recommendations,
      runRecommend,
      selectedPlan,
      selectPlan,
      resetSession,
      defaultVolume,
      setDefaultVolume,
      aiMessage,
      aiMessageSource,
      aiMessageLoading,
      requestAiMessage,
      aiPanelOpen,
      setAiPanelOpen,
    }),
    [
      input,
      updateInput,
      recommendations,
      runRecommend,
      selectedPlan,
      selectPlan,
      resetSession,
      defaultVolume,
      aiMessage,
      aiMessageSource,
      aiMessageLoading,
      requestAiMessage,
      aiPanelOpen,
    ],
  );

  return (
    <TransportContext.Provider value={value}>
      {children}
    </TransportContext.Provider>
  );
}

export function useTransport() {
  const ctx = useContext(TransportContext);
  if (!ctx) {
    throw new Error('useTransport must be used within TransportProvider');
  }
  return ctx;
}
