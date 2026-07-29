/** 직원 입력 화면용 선택 옵션 (목업) */

export const SITUATIONS = [
  { id: 'mri', label: 'MRI' },
  { id: 'ct', label: 'CT' },
  { id: 'preop', label: '수술 전' },
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
  situation: 'mri',
  ageGroup: 'adult',
  religion: 'none',
  duration: '5',
  anxiety: 'low',
};

export const SOUND_TRACKS = [
  { id: 'calm', label: '진정음악', type: 'music' },
  { id: 'nature', label: '자연음', type: 'music' },
  { id: 'christian', label: '찬송/기도', type: 'religion', religion: 'christian' },
  { id: 'catholic', label: '성가', type: 'religion', religion: 'catholic' },
  { id: 'buddhist', label: '명상음', type: 'religion', religion: 'buddhist' },
];

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
