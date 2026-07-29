import { useEffect, useRef, useState } from 'react';
import { COMFORT_SCENES } from '../../data/floorPlan';

const SLIDE_MS = 7000;
const FADE_MS = 1400;

/**
 * 빔 출력 — 편안함 이미지 모드
 * 풀스크린 크로스페이드 (플레이스홀더 그라데이션)
 * TODO: 실제 빔 콘텐츠/이미지·영상 에셋 연동
 */
export default function ProjectorComfortView() {
  const indexRef = useRef(0);
  const [indices, setIndices] = useState([0, 1]);
  const [showFirst, setShowFirst] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      const next = (indexRef.current + 1) % COMFORT_SCENES.length;
      indexRef.current = next;

      setShowFirst((visible) => {
        setIndices((prev) => {
          if (visible) return [prev[0], next];
          return [next, prev[1]];
        });
        return !visible;
      });
    }, SLIDE_MS);

    return () => clearInterval(id);
  }, []);

  const scene0 = COMFORT_SCENES[indices[0]];
  const scene1 = COMFORT_SCENES[indices[1]];

  return (
    <div className="proj-comfort" aria-live="polite">
      <div
        className={`proj-comfort__layer ${showFirst ? 'is-visible' : ''}`}
        style={{
          background: scene0.gradient,
          transitionDuration: `${FADE_MS}ms`,
        }}
      >
        <div className="proj-comfort__glow" />
        <p className="proj-comfort__label">{scene0.label}</p>
      </div>
      <div
        className={`proj-comfort__layer ${!showFirst ? 'is-visible' : ''}`}
        style={{
          background: scene1.gradient,
          transitionDuration: `${FADE_MS}ms`,
        }}
      >
        <div className="proj-comfort__glow" />
        <p className="proj-comfort__label">{scene1.label}</p>
      </div>
    </div>
  );
}
