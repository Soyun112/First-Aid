/**
 * AI 추천 목업 서비스
 * 입력(상황/연령/종교/시간/불안도) → 빔+사운드 조합 1~2개
 *
 * TODO: LLM API 연동 — 이 함수 시그니처(recommend(input))는 유지하고
 *       내부 구현만 실제 API 호출로 교체하면 됨
 */

import { DURATIONS } from '../data/options';

/**
 * @param {object} input
 * @param {string} input.situation
 * @param {string} input.ageGroup
 * @param {string} input.religion
 * @param {string} input.duration
 * @param {string} input.anxiety
 * @returns {Array<{id:string, name:string, elements:string[], reason:string, trackId:string, includeGuide:boolean, includeComfort:boolean, includeVoice:boolean}>}
 */
export function recommend(input) {
  // TODO: LLM API 연동
  const results = [];
  const durationLabel =
    DURATIONS.find((d) => d.id === input.duration)?.label ?? '이동';

  const situationLabel = {
    mri: 'MRI',
    ct: 'CT',
    preop: '수술 전',
    ward: '병동 이동',
  }[input.situation] ?? '이송';

  const isHighAnxiety = input.anxiety === 'high';
  const isChild = input.ageGroup === 'child';
  const hasReligion = input.religion && input.religion !== 'none';

  // 1순위: 상황·불안도 기반 기본 조합
  if (isChild) {
    results.push({
      id: 'child-calm',
      name: '소아 안심 케어',
      elements: ['길안내', '편안함 이미지', '자연음', 'AI음성'],
      reason: `${situationLabel} 이동 · 소아 환자에게 짧고 부드러운 안내를 우선합니다.`,
      trackId: 'nature',
      includeGuide: true,
      includeComfort: true,
      includeVoice: true,
    });
  } else if (isHighAnxiety) {
    results.push({
      id: 'high-anxiety',
      name: '깊은 진정 패키지',
      elements: ['길안내', '편안함 이미지', '진정음악', 'AI음성'],
      reason: `불안도가 높아 ${durationLabel} 동안 시각·청각을 함께 안정시킵니다.`,
      trackId: 'calm',
      includeGuide: true,
      includeComfort: true,
      includeVoice: true,
    });
  } else if (input.situation === 'preop') {
    results.push({
      id: 'preop-soft',
      name: '수술 전 안정 루트',
      elements: ['길안내', '진정음악', 'AI음성'],
      reason: '수술 전 이동에 맞춰 짧고 명확한 안내와 잔잔한 음악을 추천합니다.',
      trackId: 'calm',
      includeGuide: true,
      includeComfort: false,
      includeVoice: true,
    });
  } else if (input.situation === 'ward') {
    results.push({
      id: 'ward-light',
      name: '가벼운 병동 이동',
      elements: ['길안내', '자연음'],
      reason: '단순 병동 이동이라 길안내와 자연음만으로 충분합니다.',
      trackId: 'nature',
      includeGuide: true,
      includeComfort: false,
      includeVoice: false,
    });
  } else {
    // MRI / CT 기본
    results.push({
      id: 'exam-standard',
      name: `${situationLabel} 표준 케어`,
      elements: ['길안내', '편안함 이미지', '진정음악', 'AI음성'],
      reason: `${situationLabel} 검사실로 이동하는 ${durationLabel} 구간에 맞춘 기본 조합입니다.`,
      trackId: 'calm',
      includeGuide: true,
      includeComfort: true,
      includeVoice: true,
    });
  }

  // 2순위: 종교 선택 시 추가 카드
  if (hasReligion) {
    const religionMap = {
      christian: {
        name: '신앙 위로 패키지',
        trackId: 'christian',
        elements: ['길안내', '편안함 이미지', '찬송/기도', 'AI음성'],
        reason: '선택하신 신앙에 맞춰 익숙한 사운드로 안심을 돕습니다.',
      },
      catholic: {
        name: '성가 위로 패키지',
        trackId: 'catholic',
        elements: ['길안내', '편안함 이미지', '성가', 'AI음성'],
        reason: '천주교 성가로 이동 중 마음의 안정을 돕습니다.',
      },
      buddhist: {
        name: '명상 안정 패키지',
        trackId: 'buddhist',
        elements: ['길안내', '편안함 이미지', '명상음', 'AI음성'],
        reason: '잔잔한 명상음으로 이동 구간을 차분하게 채웁니다.',
      },
    };
    const r = religionMap[input.religion];
    if (r) {
      results.push({
        id: `religion-${input.religion}`,
        name: r.name,
        elements: r.elements,
        reason: r.reason,
        trackId: r.trackId,
        includeGuide: true,
        includeComfort: true,
        includeVoice: true,
      });
    }
  } else if (results.length === 1 && input.ageGroup === 'elder') {
    // 종교 없을 때 고령이면 대안 카드 하나 더
    results.push({
      id: 'elder-soft',
      name: '고령 친화 소프트',
      elements: ['길안내', '자연음', 'AI음성'],
      reason: '큰 글씨·낮은 음량에 맞춘 단순 조합을 추가로 제안합니다.',
      trackId: 'nature',
      includeGuide: true,
      includeComfort: false,
      includeVoice: true,
    });
  }

  return results.slice(0, 2);
}
