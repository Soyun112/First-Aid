import { useEffect, useMemo, useState } from 'react';
import { FLOOR_PLAN } from '../../data/floorPlan';
import {
  buildPathD,
  formatProjectorRemaining,
  getPositionOnRoute,
  getProjectorStatusText,
  getRouteProgress,
} from '../../services/routePosition';

/**
 * 빔 출력 — 길 안내 모드
 * 병원 도면 + 경로 + 현재 위치 점 (시간 기반 시뮬레이션)
 */
export default function ProjectorGuideView({
  destinationLabel,
  remainingSeconds,
  totalSeconds,
}) {
  const { viewBox, zones, routePoints, origin } = FLOOR_PLAN;
  const progress = getRouteProgress(remainingSeconds, totalSeconds);
  const position = getPositionOnRoute(progress, routePoints);
  const pathD = useMemo(() => buildPathD(routePoints), [routePoints]);
  const traveledD = useMemo(
    () => buildPathD(routePoints.slice(0, position.segmentIndex + 2)),
    [routePoints, position.segmentIndex],
  );

  const statusText = getProjectorStatusText(remainingSeconds);
  const remainingLabel = formatProjectorRemaining(remainingSeconds);
  const isArriving = remainingSeconds <= 30;

  const [pulse, setPulse] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setPulse((v) => !v), 800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="proj-guide">
      <header className="proj-guide__header">
        <p className={`proj-guide__status ${isArriving ? 'is-arriving' : ''}`}>
          {statusText}
        </p>
        <p className="proj-guide__line">
          <span className="proj-guide__dest">{destinationLabel}</span>
          <span className="proj-guide__sep">로 이동 중</span>
        </p>
        <p className="proj-guide__remaining">남은 시간 {remainingLabel}</p>
      </header>

      <div className="proj-guide__map-wrap">
        <svg
          className="proj-guide__map"
          viewBox={`0 0 ${viewBox.w} ${viewBox.h}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`${origin.label}에서 ${destinationLabel}로 이동 중`}
        >
          {/* 그리드 */}
          <defs>
            <pattern
              id="floor-grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#1a2828"
                strokeWidth="0.8"
              />
            </pattern>
            <radialGradient id="dot-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4ec4c4" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#4ec4c4" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width={viewBox.w} height={viewBox.h} fill="#0a1010" />
          <rect width={viewBox.w} height={viewBox.h} fill="url(#floor-grid)" />

          {/* 구역 */}
          {zones.map((z) => (
            <g key={z.id}>
              <rect
                x={z.x}
                y={z.y}
                width={z.w}
                height={z.h}
                rx="8"
                fill={z.fill}
                stroke="#2a4040"
                strokeWidth="1.5"
              />
              <text
                x={z.x + z.w / 2}
                y={z.y + z.h / 2 + 5}
                textAnchor="middle"
                fontSize="18"
                fill="#7a9a9a"
                fontWeight="500"
              >
                {z.label}
              </text>
            </g>
          ))}

          {/* 전체 경로 (잔여) */}
          <path
            d={pathD}
            fill="none"
            stroke="#2a4848"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="10 8"
          />

          {/* 지나온 경로 */}
          {progress > 0 && (
            <path
              d={traveledD}
              fill="none"
              stroke="#4ec4c4"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
          )}

          {/* 출발지 */}
          <circle cx={routePoints[0].x} cy={routePoints[0].y} r="10" fill="#3a5858" />
          <circle cx={routePoints[0].x} cy={routePoints[0].y} r="5" fill="#8ab0b0" />

          {/* 목적지 */}
          <circle
            cx={routePoints[routePoints.length - 1].x}
            cy={routePoints[routePoints.length - 1].y}
            r="14"
            fill="none"
            stroke="#4ec4c4"
            strokeWidth="2"
            opacity="0.6"
          />
          <circle
            cx={routePoints[routePoints.length - 1].x}
            cy={routePoints[routePoints.length - 1].y}
            r="8"
            fill="#4ec4c4"
          />

          {/* 현재 위치 */}
          <circle
            cx={position.x}
            cy={position.y}
            r={pulse ? 28 : 22}
            fill="url(#dot-glow)"
          />
          <circle
            cx={position.x}
            cy={position.y}
            r={pulse ? 14 : 11}
            fill="#4ec4c4"
          />
          <circle cx={position.x} cy={position.y} r="5" fill="#fff" />
        </svg>
      </div>

      <p className="proj-guide__from">
        {origin.label} → {destinationLabel}
      </p>
    </div>
  );
}
