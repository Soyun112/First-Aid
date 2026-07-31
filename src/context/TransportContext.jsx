import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { DEMO_PATIENT } from '../data/demoRequest';
import { DEFAULT_INPUT, VOLUME_DEFAULT } from '../data/options';
import { fetchComfortMessage } from '../services/messageApi';
import { speak, stopSpeaking } from '../services/tts';

const TransportContext = createContext(null);

export function TransportProvider({ children }) {
  const [input, setInput] = useState({ ...DEFAULT_INPUT });
  /** 환자 정보 확인에서 확정한 데모 환자 */
  const [patient, setPatient] = useState(null);
  /** 이동 중 화면 진입 여부 */
  const [sessionActive, setSessionActive] = useState(false);
  const [defaultVolume, setDefaultVolume] = useState(VOLUME_DEFAULT);
  const [aiMessage, setAiMessage] = useState('');
  const [aiMessageSource, setAiMessageSource] = useState(null);
  const [aiMessageLoading, setAiMessageLoading] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const fetchLock = useRef(false);
  const patientRef = useRef(null);
  const inputRef = useRef(input);

  patientRef.current = patient;
  inputRef.current = input;

  const updateInput = useCallback((key, value) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** 환자 정보 확인 → 이동 중 시작 */
  const confirmPatientAndStart = useCallback((patientData = DEMO_PATIENT) => {
    setPatient({ ...patientData });
    setInput({
      ageGroup: patientData.ageGroup || 'adult',
      duration: patientData.durationId || '5',
    });
    setAiMessage('');
    setAiMessageSource(null);
    setSessionActive(true);
  }, []);

  const resetSession = useCallback(() => {
    setSessionActive(false);
    setPatient(null);
    setAiMessage('');
    setAiMessageSource(null);
    setAiMessageLoading(false);
    setAiPanelOpen(false);
    stopSpeaking();
  }, []);

  /**
   * Gemini 멘트 요청
   * @param {{ speak?: boolean, volume?: number, onSpeakEnd?: () => void, force?: boolean }} options
   */
  const requestAiMessage = useCallback(
    async (options = {}) => {
      const {
        speak: shouldSpeak = false,
        volume = defaultVolume,
        onSpeakEnd,
        force = false,
      } = options;

      if (fetchLock.current && !force) return null;
      fetchLock.current = true;
      setAiMessageLoading(true);

      const p = patientRef.current;
      const base = inputRef.current;
      const payload = {
        ...base,
        ageGroup: p?.ageGroup || base.ageGroup,
        duration: p?.durationId || base.duration,
        destination: p?.to || '',
        origin: p?.from || '',
      };

      try {
        const result = await fetchComfortMessage(payload);
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
    [defaultVolume],
  );

  const value = useMemo(
    () => ({
      input,
      updateInput,
      setInput,
      patient,
      confirmPatientAndStart,
      sessionActive,
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
      patient,
      confirmPatientAndStart,
      sessionActive,
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
