/**
 * 프로젝터 데모용 — 상황·배경음악·폴백 멘트
 */

export const PROJECTOR_SITUATIONS = [
  { id: 'preop', label: '수술 전 이동' },
  { id: 'ward', label: '단순 병동 이동' },
];

export const PROJECTOR_MUSIC = [
  {
    id: 'calm',
    label: '진정음악',
    src: '/audio/calm.mp3',
  },
  {
    id: 'religious',
    label: '종교음악',
    src: '/audio/religious.mp3',
  },
];

/** 배경음악 볼륨 (멘트보다 낮게) */
export const BG_MUSIC_VOLUME = 0.25;

/** TTS 볼륨 (또렷하게) */
export const TTS_VOLUME = 0.9;

/** TTS 속도 */
export const TTS_RATE = 0.9;

/** 상황별 기본 멘트 (Gemini 실패·지연 시) */
export const PROJECTOR_FALLBACKS = {
  preop:
    '지금은 수술 전 검사실로 천천히 이동하고 있어요. 잠시만 편안하게 계시면 됩니다. 곧 도착하니 걱정하지 않으셔도 괜찮아요.',
  ward:
    '병동으로 안전하게 이동 중입니다. 천천히 가고 있으니 마음 편히 누르고 계시면 됩니다. 곧 도착할 예정이니 안심하세요.',
};

/** Gemini 요청용 기본 입력값 */
export function buildProjectorInput(situationId, musicId = 'calm') {
  return {
    situation: situationId,
    ageGroup: 'adult',
    religion: musicId === 'religious' ? 'christian' : 'none',
    duration: '5',
    anxiety: 'low',
  };
}
