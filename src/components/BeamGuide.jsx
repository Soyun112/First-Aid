import { useEffect, useMemo, useState } from 'react';
import { MOCK_ROUTE } from '../data/options';

/**
 * 길 안내 맵 애니메이션
 * variant: "staff" (조작 미리보기) | "projector" (천장 투사)
 * TODO: 실제 GPS/지도 API 연동
 */
export default function BeamGuide({
  destinationLabel,
  remainingLabel,
  progress,
  variant = 'staff',
}) {
  const isProjector = variant === 'projector';
  const points = MOCK_ROUTE.points;
  const pathD = useMemo(
    () =>
      points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
        .join(' '),
    [points],
  );

  const clamped = Math.min(1, Math.max(0, progress));
  const seg = (points.length - 1) * clamped;
  const i = Math.min(Math.floor(seg), points.length - 2);
  const t = seg - i;
  const a = points[i];
  const b = points[i + 1] ?? points[i];
  const cx = a.x + (b.x - a.x) * t;
  const cy = a.y + (b.y - a.y) * t;

  const [blink, setBlink] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setBlink((v) => !v), 700);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`beam-guide ${isProjector ? 'beam-guide--projector' : ''}`}>
      <p className="beam-guide__status">
        {destinationLabel}로 이동 중 · {remainingLabel}
      </p>
      <svg
        className="beam-guide__map"
        viewBox="0 0 320 220"
        role="img"
        aria-label="병원 내 이동 경로 시뮬레이션"
      >
        <rect
          x="16"
          y="16"
          width="288"
          height="188"
          rx="12"
          fill={isProjector ? '#1a2424' : '#eef5f5'}
        />
        <rect
          x="30"
          y="40"
          width="70"
          height="50"
          rx="6"
          fill={isProjector ? '#243333' : '#d5e8e8'}
        />
        <text
          x="45"
          y="70"
          fontSize={isProjector ? 13 : 11}
          fill={isProjector ? '#9ab5b5' : '#4a6b6b'}
        >
          {MOCK_ROUTE.from}
        </text>
        <rect
          x="220"
          y="30"
          width="70"
          height="50"
          rx="6"
          fill={isProjector ? '#2a4040' : '#c8e0e0'}
        />
        <text
          x="232"
          y="60"
          fontSize={isProjector ? 13 : 11}
          fill={isProjector ? '#c5e0e0' : '#2a5a5a'}
        >
          {MOCK_ROUTE.to}
        </text>
        <path
          d={pathD}
          fill="none"
          stroke={isProjector ? '#5a9a9a' : '#7ab0b0'}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="6 6"
        />
        <circle
          cx={cx}
          cy={cy}
          r={blink ? 12 : 9}
          fill={isProjector ? '#4ec4c4' : '#2a7a7a'}
          opacity={0.95}
        />
        <circle cx={cx} cy={cy} r="4" fill="#fff" />
      </svg>
      {!isProjector && (
        <p className="beam-guide__hint">※ 지도·GPS는 시뮬레이션입니다</p>
      )}
    </div>
  );
}
