/** 직원 입력 화면용 선택 옵션 */

export const SITUATIONS = [
  { id: 'preop', label: '수술 전 이동' },
  { id: 'ward', label: '단순 병동 이동' },
];

export const AGE_GROUPS = [
  { id: 'child', label: '소아' },
  { id: 'adult', label: '성인' },
  { id: 'elder', label: '고령' },
];

export const RELIGIONS = [
  { id: 'none', label: '없음' },
  { id: 'christian', label: '기독교' },
  { id: 'catholic', label: '천주교' },
  { id: 'buddhist', label: '불교' },
];

/** 종교 → 배경음악 파일 */
export const RELIGION_AUDIO = {
  christian: '/audio/church.mp3',
  catholic: '/audio/catholic.mp3',
  buddhist: '/audio/buddhist.mp3',
};

export const DURATIONS = [
  { id: '2', label: '2분', minutes: 2 },
  { id: '5', label: '5분', minutes: 5 },
  { id: '10', label: '10분 이상', minutes: 10 },
];

export const ANXIETY_LEVELS = [
  { id: 'low', label: '낮음' },
  { id: 'high', label: '높음' },
];

export const DEFAULT_INPUT = {
  situation: 'preop',
  ageGroup: 'adult',
  religion: 'none',
  duration: '5',
  anxiety: 'low',
};

/** 이동 중 사운드 선택 (진정 / 종교) */
export const SOUND_OPTIONS = [
  { id: 'calm', label: '진정음악', src: '/audio/calm.mp3' },
  { id: 'religious', label: '종교음악', src: null },
];

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
 * 트랙 ID + 종교 → mp3 경로
 * @returns {{ src: string | null, needReligion?: boolean }}
 */
export function resolveTrackSrc(trackId, religion) {
  if (trackId === 'calm') {
    return { src: '/audio/calm.mp3' };
  }
  if (trackId === 'religious') {
    const src = RELIGION_AUDIO[religion] ?? null;
    if (!src) {
      return { src: null, needReligion: true };
    }
    return { src };
  }
  return { src: null };
}
