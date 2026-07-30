import { useEffect, useState } from 'react';
import ProjectorComfortView from '../components/projector/ProjectorComfortView';
import ProjectorGuideView from '../components/projector/ProjectorGuideView';
import {
  createIdleProjectorState,
  subscribeProjectorState,
} from '../services/projectorSync';

/**
 * 빔 미리보기 — 직원 화면에서 고른 모드·타이머·멘트를 결과만 표시
 * (상황/종교/사운드 재선택 UI 없음)
 */
export default function ProjectorPage() {
  const [state, setState] = useState(() => createIdleProjectorState());

  useEffect(() => {
    return subscribeProjectorState(setState);
  }, []);

  const active = state.active && state.beamEnabled;
  const isGuide = state.beamMode === 'guide';
  const isComfort = state.beamMode === 'comfort';

  if (!active) {
    return (
      <div className="projector projector--idle">
        <p className="projector__idle-text">
          {state.active && !state.beamEnabled
            ? '빔이 꺼져 있습니다'
            : '이송이 시작되면 이 화면에 표시됩니다'}
        </p>
        <p className="projector__idle-sub">직원 화면에서 「빔 미리보기」로 열어 두세요</p>
      </div>
    );
  }

  if (isGuide) {
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

  if (isComfort) {
    return (
      <div className="projector projector--comfort-result">
        <ProjectorComfortView variant="background" />
        {state.caption ? (
          <p className="proj-result__caption" aria-live="polite">
            {state.caption}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="projector projector--idle">
      <p className="projector__idle-text">대기 중</p>
    </div>
  );
}
