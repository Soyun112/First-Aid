/** 직원 입력 화면용 선택 옵션 (데모용: 연령대 · 이동 시간만) */

export const AGE_GROUPS = [
  { id: 'child', label: '소아' },
  { id: 'adult', label: '성인' },
];

export const DURATIONS = [
  { id: '3', label: '3분', minutes: 3 },
  { id: '5', label: '5분', minutes: 5 },
  { id: '7', label: '7분', minutes: 7 },
  { id: '10', label: '10분', minutes: 10 },
];

export const DEFAULT_INPUT = {
  ageGroup: 'adult',
  duration: '5',
};

/**
 * 백엔드/멘트 API용 기본값
 * (입력 화면에서 제거된 필드 — 데모에서 고정)
 */
export const MESSAGE_DEFAULTS = {
  situation: 'preop',
  religion: 'none',
  anxiety: 'low',
};

/** 이동 중 사운드 선택 (기본: 음악1) */
export const SOUND_OPTIONS = [
  { id: 'music1', label: '음악1', src: '/audio/calm.mp3' },
  { id: 'music2', label: '음악2', src: '/audio/catholic.mp3' },
  { id: 'music3', label: '음악3', src: '/audio/church.mp3' },
];

/** 추천 화면 없이 바로 쓰는 기본 케어 조합 */
export const DEFAULT_CARE_PLAN = {
  id: 'default',
  name: '표준 이송 케어',
  trackId: 'music1',
};

export const BG_MUSIC_VOLUME = 0.25;
export const TTS_VOLUME_BOOST = 0.3;

/** 천장 투사 시뮬레이션용 경로 좌표 (SVG viewBox 기준) */
export const MOCK_ROUTE = {
  from: '병동',
  to: '검사실',
  points: [
    { x: 40, y: 180 },
    { x: 80, y: 160 },
    { x: 120, y: 140 },
    { x: 160, y: 100 },
    { x: 200, y: 80 },
    { x: 240, y: 70 },
    { x: 280, y: 50 },
  ],
};

export const COMFORT_SLIDES = [
  { id: 1, label: '하늘', color: '#a8d4e8' },
  { id: 2, label: '숲', color: '#b8d4b8' },
  { id: 3, label: '바다', color: '#9ec5d8' },
  { id: 4, label: '노을', color: '#e8c9a8' },
];

/** 음량: 0~1, 상한 0.6 (병원 환경용) */
export const VOLUME_DEFAULT = 0.25;
export const VOLUME_MAX = 0.6;

/**
 * 트랙 ID → mp3 경로
 * @returns {{ src: string | null }}
 */
export function resolveTrackSrc(trackId) {
  const opt = SOUND_OPTIONS.find((t) => t.id === trackId);
  return { src: opt?.src ?? null };
}
