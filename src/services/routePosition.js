/**
 * 경로 위치·진행률 계산
 *
 * 프로토타입: 남은 시간 기반 진행률 + 경로 좌표 보간
 * TODO: 실내측위(Indoor Positioning) API 연동 — getPositionFromBeacon() 등으로 교체
 */

/**
 * @param {number} remainingSeconds
 * @param {number} totalSeconds
 * @returns {number} 0~1
 */
export function getRouteProgress(remainingSeconds, totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return 0;
  return Math.min(1, Math.max(0, 1 - remainingSeconds / totalSeconds));
}

/**
 * 폴리라인 경로 위의 좌표 (선형 보간)
 * @param {number} progress 0~1
 * @param {Array<{x:number,y:number}>} points
 * @returns {{ x: number, y: number, segmentIndex: number }}
 */
export function getPositionOnRoute(progress, points) {
  if (!points?.length) return { x: 0, y: 0, segmentIndex: 0 };
  if (points.length === 1) return { ...points[0], segmentIndex: 0 };

  const clamped = Math.min(1, Math.max(0, progress));
  const seg = (points.length - 1) * clamped;
  const i = Math.min(Math.floor(seg), points.length - 2);
  const t = seg - i;
  const a = points[i];
  const b = points[i + 1];

  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    segmentIndex: i,
  };
}

/**
 * @param {number} remainingSeconds
 */
export function getProjectorStatusText(remainingSeconds) {
  if (remainingSeconds <= 0) return '도착';
  if (remainingSeconds <= 30) return '곧 도착';
  if (remainingSeconds <= 60) return '거의 다 왔어요';
  return '이동 중';
}

/**
 * @param {number} remainingSeconds
 */
export function formatProjectorRemaining(remainingSeconds) {
  const sec = Math.max(0, Math.floor(remainingSeconds));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}초`;
  if (s === 0) return `${m}분`;
  return `${m}분 ${String(s).padStart(2, '0')}초`;
}

/**
 * 경로 SVG path d 문자열
 * @param {Array<{x:number,y:number}>} points
 */
export function buildPathD(points) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

/**
 * TODO: 실내측위 — 비콘/UWB 좌표 → 경로 progress 변환
 * @param {{ x: number, y: number }} _beaconPosition
 * @param {Array<{x:number,y:number}>} _routePoints
 */
export function getProgressFromIndoorPosition(_beaconPosition, _routePoints) {
  // placeholder for future indoor positioning
  return 0;
}
