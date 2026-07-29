/**
 * 병원 도면 + 이동 경로 (빔 투사용)
 * TODO: 실제 병원 CAD/도면 이미지·실내측위 좌표계로 교체
 */

export const FLOOR_PLAN = {
  viewBox: { w: 800, h: 480 },
  origin: { id: 'ward', label: '병동' },
  destination: { id: 'exam', label: '검사실' },
  /** 복도·구역 (단순 도면) */
  zones: [
    { id: 'ward', label: '병동', x: 48, y: 300, w: 140, h: 120, fill: '#1e2e2e' },
    { id: 'lift', label: 'EV', x: 220, y: 280, w: 72, h: 72, fill: '#243838' },
    { id: 'corridor-a', label: '복도 A', x: 320, y: 260, w: 180, h: 56, fill: '#1a2828' },
    { id: 'corridor-b', label: '복도 B', x: 520, y: 200, w: 56, h: 120, fill: '#1a2828' },
    { id: 'waiting', label: '대기실', x: 600, y: 160, w: 100, h: 80, fill: '#243838' },
    { id: 'exam', label: '검사실', x: 620, y: 60, w: 120, h: 88, fill: '#2a4545' },
  ],
  /** 경로 좌표 (viewBox 기준) — 이동 시뮬레이션 */
  routePoints: [
    { x: 118, y: 360 },
    { x: 200, y: 340 },
    { x: 256, y: 316 },
    { x: 360, y: 288 },
    { x: 480, y: 288 },
    { x: 548, y: 260 },
    { x: 620, y: 220 },
    { x: 680, y: 160 },
    { x: 680, y: 104 },
  ],
};
