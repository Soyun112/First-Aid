import { useEffect, useState } from 'react';
import BeamGuide from '../components/BeamGuide';
import ComfortSlides from '../components/ComfortSlides';
import {
  createIdleProjectorState,
  subscribeProjectorState,
} from '../services/projectorSync';

function formatTime(totalSeconds) {
  const m = Math.floor(Math.max(0, totalSeconds) / 60);
  const s = Math.max(0, totalSeconds) % 60;
  return `${m}분 ${String(s).padStart(2, '0')}초`;
}

/**
 * 빔 프로젝터 출력 화면 (환자가 천장에서 보는 화면)
 * 조작 UI 없음 — 직원 화면에서 publish한 상태만 표시
 * TODO: 실제 빔 하드웨어 송출 연동
 */
export default function ProjectorPage() {
  const [state, setState] = useState(() => createIdleProjectorState());

  useEffect(() => subscribeProjectorState(setState), []);

  const remainingLabel = formatTime(state.remainingSeconds);
  const progress =
    state.totalSeconds > 0
      ? 1 - state.remainingSeconds / state.totalSeconds
      : 0;

  if (!state.active) {
    return (
      <div className="projector projector--idle">
        <p className="projector__idle-title">First Aid</p>
        <p className="projector__idle-sub">빔 대기 중</p>
        <p className="projector__idle-hint">직원 화면에서 이송을 시작하면 여기로 표시됩니다</p>
      </div>
    );
  }

  return (
    <div className="projector" aria-live="polite">
      <header className="projector__header">
        <p className="projector__status">{state.statusText}</p>
        <p className="projector__time">{remainingLabel}</p>
      </header>

      <div className="projector__stage">
        {state.beamMode === 'comfort' ? (
          <ComfortSlides variant="projector" />
        ) : (
          <BeamGuide
            variant="projector"
            destinationLabel={state.destinationLabel || '목적지'}
            remainingLabel={remainingLabel}
            progress={progress}
          />
        )}
      </div>
    </div>
  );
}
