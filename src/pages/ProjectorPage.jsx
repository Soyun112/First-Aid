import { useEffect, useState } from 'react';
import ProjectorComfortView from '../components/projector/ProjectorComfortView';
import ProjectorGuideView from '../components/projector/ProjectorGuideView';
import {
  createIdleProjectorState,
  subscribeProjectorState,
} from '../services/projectorSync';

/**
 * 빔 프로젝터 출력 화면 (환자가 천장에서 보는 화면)
 * 조작 UI 없음 — BroadcastChannel/localStorage로 직원 화면과 동기화
 * TODO: 실제 빔 하드웨어 송출 연동
 */
export default function ProjectorPage() {
  const [state, setState] = useState(() => createIdleProjectorState());

  useEffect(() => subscribeProjectorState(setState), []);

  if (!state.active) {
    return (
      <div className="projector projector--idle">
        <p className="projector__idle-badge">First Aid</p>
        <p className="projector__idle-title">삼성병원</p>
        <p className="projector__idle-sub">빔 대기 중</p>
        <p className="projector__idle-hint">
          직원 화면에서 이송을 시작하면 여기로 표시됩니다
        </p>
      </div>
    );
  }

  if (state.beamMode === 'comfort') {
    return (
      <div className="projector projector--comfort">
        <ProjectorComfortView />
      </div>
    );
  }

  return (
    <div className="projector projector--guide">
      <ProjectorGuideView
        destinationLabel={state.destinationLabel || '목적지'}
        remainingSeconds={state.remainingSeconds}
        totalSeconds={state.totalSeconds}
      />
    </div>
  );
}
