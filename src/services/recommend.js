/**
 * AI 추천 목업 서비스
 * 입력(상황/연령/종교/시간/불안도) → 빔+사운드 조합 1~2개
 *
 * TODO: LLM API 연동 — 이 함수 시그니처(recommend(input))는 유지하고
 *       내부 구현만 실제 API 호출로 교체하면 됨
 *
 * 참고: Gemini(Render)는 안심 멘트 생성(messageApi)에만 연결되어 있고,
 *       이 추천 조합 자체는 아직 규칙 기반 목업입니다.
 */

import { DURATIONS } from '../data/options';

/**
 * @param {object} input
 * @returns {Array<{id:string, name:string, elements:string[], reason:string, trackId:string, includeGuide:boolean, includeComfort:boolean, includeVoice:boolean}>}
 */
export function recommend(input) {
  const results = [];
  const durationLabel =
    DURATIONS.find((d) => d.id === input.duration)?.label ?? '이동';

  const situationLabel = {
    preop: '수술 전 이동',
    ward: '단순 병동 이동',
  }[input.situation] ?? '이송';

  const isHighAnxiety = input.anxiety === 'high';
  const isChild = input.ageGroup === 'child';
  const hasReligion = input.religion && input.religion !== 'none';
  const preferredTrack = hasReligion ? 'religious' : 'calm';
  const soundLabel = hasReligion ? '종교음악' : '진정음악';

  if (isChild) {
    results.push({
      id: 'child-calm',
      name: '소아 안심 케어',
      elements: ['길안내', '편안함 이미지', soundLabel, 'AI음성'],
      reason: `${situationLabel} · 소아 환자에게 짧고 부드러운 안내를 우선합니다.`,
      trackId: preferredTrack,
      includeGuide: true,
      includeComfort: true,
      includeVoice: true,
    });
  } else if (isHighAnxiety) {
    results.push({
      id: 'high-anxiety',
      name: '깊은 진정 패키지',
      elements: ['길안내', '편안함 이미지', soundLabel, 'AI음성'],
      reason: `불안도가 높아 ${durationLabel} 동안 시각·청각을 함께 안정시킵니다.`,
      trackId: preferredTrack,
      includeGuide: true,
      includeComfort: true,
      includeVoice: true,
    });
  } else if (input.situation === 'preop') {
    results.push({
      id: 'preop-soft',
      name: '수술 전 안정 루트',
      elements: ['길안내', '편안함 이미지', soundLabel, 'AI음성'],
      reason: '수술 전 이동에 맞춰 길 안내와 잔잔한 사운드·안내 멘트를 추천합니다.',
      trackId: preferredTrack,
      includeGuide: true,
      includeComfort: true,
      includeVoice: true,
    });
  } else {
    results.push({
      id: 'ward-light',
      name: '가벼운 병동 이동',
      elements: ['길안내', '편안함 이미지', soundLabel, 'AI음성'],
      reason: '단순 병동 이동에 맞춘 기본 조합입니다.',
      trackId: preferredTrack,
      includeGuide: true,
      includeComfort: true,
      includeVoice: true,
    });
  }

  // 대안 조합 (다른 조합 보기)
  if (hasReligion && results[0]?.trackId === 'religious') {
    results.push({
      id: 'alt-calm',
      name: '진정음악 중심',
      elements: ['길안내', '편안함 이미지', '진정음악', 'AI음성'],
      reason: '종교음악 대신 잔잔한 진정음악으로 같은 안내를 진행합니다.',
      trackId: 'calm',
      includeGuide: true,
      includeComfort: true,
      includeVoice: true,
    });
  } else if (!hasReligion && input.ageGroup === 'elder') {
    results.push({
      id: 'elder-soft',
      name: '고령 친화 소프트',
      elements: ['길안내', '진정음악', 'AI음성'],
      reason: '큰 글씨·낮은 음량에 맞춘 단순 조합을 추가로 제안합니다.',
      trackId: 'calm',
      includeGuide: true,
      includeComfort: false,
      includeVoice: true,
    });
  } else if (results[0]?.trackId === 'calm') {
    results.push({
      id: 'alt-comfort-first',
      name: '편안함 우선',
      elements: ['편안함 이미지', '진정음악', 'AI음성'],
      reason: '길 안내보다 명화·사운드로 안정을 먼저 돕는 조합입니다.',
      trackId: 'calm',
      includeGuide: false,
      includeComfort: true,
      includeVoice: true,
    });
  }

  return results.slice(0, 2);
}
