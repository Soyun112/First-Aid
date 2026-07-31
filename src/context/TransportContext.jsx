import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { DEMO_PATIENT } from '../data/demoRequest';
import { DEFAULT_INPUT, VOLUME_DEFAULT } from '../data/options';
import { fetchEtaPredict } from '../services/etaApi';
import { fetchComfortMessage } from '../services/messageApi';
import { speak, stopSpeaking } from '../services/tts';

const TransportContext = createContext(null);

/** destination 코드 → Gemini situation 힌트 */
const DEST_TO_SITUATION = {
  MRI: 'mri',
  CT: 'ct',
  수술실: 'preop',
  병동: 'ward',
};

export function TransportProvider({ children }) {
  const [input, setInput] = useState({ ...DEFAULT_INPUT });
  /** 환자 정보 확인에서 확정한 데모 환자 */
  const [patient, setPatient] = useState(null);
  /** 이동 중 화면 진입 여부 */
  const [sessionActive, setSessionActive] = useState(false);
  const [defaultVolume, setDefaultVolume] = useState(VOLUME_DEFAULT);
  /** AI ETA (분) — 설정·멘트 팝업·타이머에서 공유 */
  const [etaMin, setEtaMin] = useState(null);
  const [etaSource, setEtaSource] = useState(null);
  const [etaLoading, setEtaLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiMessageSource, setAiMessageSource] = useState(null);
  const [aiMessageLoading, setAiMessageLoading] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const fetchLock = useRef(false);
  const etaLock = useRef(false);
  const patientRef = useRef(null);
  const inputRef = useRef(input);
  const etaMinRef = useRef(null);

  patientRef.current = patient;
  inputRef.current = input;
  etaMinRef.current = etaMin;

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
    setEtaMin(null);
    setEtaSource(null);
    etaMinRef.current = null;
    setAiMessage('');
    setAiMessageSource(null);
    setSessionActive(true);
  }, []);

  const resetSession = useCallback(() => {
    setSessionActive(false);
    setPatient(null);
    setEtaMin(null);
    setEtaSource(null);
    etaMinRef.current = null;
    setEtaLoading(false);
    setAiMessage('');
    setAiMessageSource(null);
    setAiMessageLoading(false);
    setAiPanelOpen(false);
    stopSpeaking();
  }, []);

  /**
   * 환자 출발층·목적지·목적층으로 ETA 1회 확보 (실패 시 규칙 폴백)
   * @returns {Promise<number | null>}
   */
  const ensureEta = useCallback(async () => {
    if (etaMinRef.current != null) return etaMinRef.current;

    const p = patientRef.current;
    if (
      p == null ||
      p.startFloor == null ||
      p.destinationFloor == null ||
      !p.destination
    ) {
      return null;
    }

    if (etaLock.current) {
      // 진행 중이면 짧게 폴링
      for (let i = 0; i < 40; i += 1) {
        await new Promise((r) => setTimeout(r, 100));
        if (etaMinRef.current != null) return etaMinRef.current;
        if (!etaLock.current) break;
      }
    }

    etaLock.current = true;
    setEtaLoading(true);
    try {
      const result = await fetchEtaPredict({
        startFloor: p.startFloor,
        destination: p.destination,
        destinationFloor: p.destinationFloor,
      });
      const minutes = result.eta_min;
      setEtaMin(minutes);
      etaMinRef.current = minutes;
      setEtaSource(result.source);
      setInput((prev) => ({ ...prev, duration: String(minutes) }));
      setPatient((prev) =>
        prev
          ? { ...prev, durationMinutes: minutes, durationId: String(minutes) }
          : prev,
      );
      return minutes;
    } finally {
      setEtaLoading(false);
      etaLock.current = false;
    }
  }, []);

  /**
   * Gemini 멘트 요청 (duration = eta_min)
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

      try {
        // 멘트의 "약 O분"에 쓸 ETA 확보
        let minutes = etaMinRef.current;
        if (minutes == null) {
          minutes = await ensureEta();
        }

        const p = patientRef.current;
        const base = inputRef.current;
        const durationStr = String(
          minutes ?? p?.durationId ?? base.duration ?? '5',
        );
        const payload = {
          ...base,
          ageGroup: p?.ageGroup || base.ageGroup,
          duration: durationStr,
          destination: p?.to || '',
          origin: p?.from || '',
          situation:
            DEST_TO_SITUATION[p?.destination] || base.situation || undefined,
        };

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
    [defaultVolume, ensureEta],
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
      etaMin,
      etaSource,
      etaLoading,
      ensureEta,
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
      etaMin,
      etaSource,
      etaLoading,
      ensureEta,
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
