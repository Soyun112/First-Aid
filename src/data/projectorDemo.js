/**
 * 프로젝터 데모용 — 상황·종교·배경음악·폴백 멘트
 */

export const PROJECTOR_SITUATIONS = [
  { id: 'preop', label: '수술 전 이동' },
  { id: 'ward', label: '단순 병동 이동' },
];

/** 종교 선택 (종교음악 파일 매핑용) */
export const PROJECTOR_RELIGIONS = [
  { id: 'christian', label: '기독교', audioSrc: '/audio/church.mp3' },
  { id: 'catholic', label: '천주교', audioSrc: '/audio/catholic.mp3' },
  { id: 'buddhist', label: '불교', audioSrc: '/audio/buddhist.mp3' },
];

/**
 * 배경 사운드 옵션
 * - calm → /audio/calm.mp3 (있음)
 * - religious → 선택한 종교의 church/catholic/buddhist
 * - nature → /audio/nature.mp3 (파일 추가 예정)
 * - meditation → /audio/meditation.mp3 (파일 추가 예정)
 */
export const PROJECTOR_SOUNDS = [
  { id: 'calm', label: '진정음악', src: '/audio/calm.mp3' },
  { id: 'religious', label: '종교음악', src: null },
  { id: 'nature', label: '자연음', src: '/audio/nature.mp3' },
  { id: 'meditation', label: '명상음', src: '/audio/meditation.mp3' },
  { id: 'off', label: '끄기', src: null },
];

/** 배경음악 볼륨 (멘트 TTS와 동시 재생) */
export const BG_MUSIC_VOLUME = 0.25;

/** TTS 볼륨 */
export const TTS_VOLUME = 0.95;

/** TTS 속도 */
export const TTS_RATE = 0.9;

export const PROJECTOR_FALLBACKS = {
  preop:
    '지금은 수술 전 검사실로 천천히 이동하고 있어요. 잠시만 편안하게 계시면 됩니다. 곧 도착하니 걱정하지 않으셔도 괜찮아요.',
  ward:
    '병동으로 안전하게 이동 중입니다. 천천히 가고 있으니 마음 편히 누르고 계시면 됩니다. 곧 도착할 예정이니 안심하세요.',
};

/**
 * 사운드 옵션 + 종교 → 실제 mp3 경로
 * @returns {{ src: string | null, missingHint?: string, needReligion?: boolean }}
 */
export function resolveSoundSrc(soundId, religionId) {
  if (soundId === 'off') {
    return { src: null };
  }

  if (soundId === 'calm') {
    return { src: '/audio/calm.mp3' };
  }

  if (soundId === 'nature') {
    return {
      src: '/audio/nature.mp3',
      missingHint: '자연음 파일: /audio/nature.mp3 (public/audio/nature.mp3)',
    };
  }

  if (soundId === 'meditation') {
    return {
      src: '/audio/meditation.mp3',
      missingHint: '명상음 파일: /audio/meditation.mp3 (public/audio/meditation.mp3)',
    };
  }

  if (soundId === 'religious') {
    const religion = PROJECTOR_RELIGIONS.find((r) => r.id === religionId);
    if (!religion) {
      return {
        src: null,
        needReligion: true,
        missingHint: '종교를 먼저 선택해 주세요 (기독교/천주교/불교)',
      };
    }
    return { src: religion.audioSrc };
  }

  return { src: null };
}

/** Gemini 요청용 입력 */
export function buildProjectorInput(situationId, religionId = 'none') {
  return {
    situation: situationId,
    ageGroup: 'adult',
    religion: religionId || 'none',
    duration: '5',
    anxiety: 'low',
  };
}
