import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DEFAULT_INPUT, VOLUME_DEFAULT } from '../data/options';
import { recommend } from '../services/recommend';
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

  const updateInput = useCallback((key, value) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  }, []);

  const runRecommend = useCallback(() => {
    // TODO: LLM API 연동 — recommend() 내부 교체
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
    // TODO: 실제 빔 송출 종료 API
    publishProjectorState(createIdleProjectorState());
  }, []);

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
