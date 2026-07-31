/**
 * FastAPI 백엔드 — Gemini 안심 멘트 생성
 *
 * API 키는 프론트에 두지 않음.
 * → Render 서버(GEMINI_API_KEY)만 사용
 * → 프론트는 VITE_API_URL 로 백엔드 주소만 지정
 */

import { MESSAGE_DEFAULTS } from '../data/options';

export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:8000';

/** Render cold start 대비 (최대 90초) */
const REQUEST_TIMEOUT_MS = 90_000;

function buildPatientFallback(input = {}) {
  const dest = input.destination || '목적지';
  const durationLabel =
    input.duration === '3'
      ? '3분'
      : input.duration === '7'
        ? '7분'
        : input.duration === '10'
          ? '10분'
          : '5분';

  if (input.ageGroup === 'child') {
    return (
      `지금 ${dest} 쪽으로 천천히 가고 있어요. ` +
      `약 ${durationLabel} 정도면 도착할 거예요. ` +
      '옆에 선생님들이 함께 계시니까 무섭지 않아도 괜찮아요.'
    );
  }

  return (
    `지금은 ${dest}로 이동하고 있어요. ` +
    `약 ${durationLabel} 정도 남았고, 천천히 안전하게 가고 있습니다. ` +
    '곧 도착하니 마음 편히 계셔도 괜찮아요.'
  );
}

/**
 * @param {object} input — ageGroup, duration, destination?, origin?, …
 * @param {{ fallback?: string }} [options]
 * @returns {Promise<{ message: string, source: 'api' | 'fallback', error?: string }>}
 */
export async function fetchComfortMessage(input, options = {}) {
  const fallback = options.fallback || buildPatientFallback(input);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}/generate-message`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        situation: input.situation ?? MESSAGE_DEFAULTS.situation,
        age: input.ageGroup,
        religion: input.religion ?? MESSAGE_DEFAULTS.religion,
        duration: input.duration,
        anxiety: input.anxiety ?? MESSAGE_DEFAULTS.anxiety,
        destination: input.destination || '',
        origin: input.origin || '',
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`API ${res.status}`);
    }

    const data = await res.json();
    const message = typeof data?.message === 'string' ? data.message.trim() : '';
    if (!message) throw new Error('empty message');

    return { message, source: 'api' };
  } catch (err) {
    const reason =
      err?.name === 'AbortError'
        ? 'timeout'
        : err?.message?.includes('Failed to fetch')
          ? 'network'
          : 'error';
    console.warn(`fetchComfortMessage failed (${reason}) — using fallback`, err);
    return { message: fallback, source: 'fallback', error: reason };
  } finally {
    clearTimeout(timer);
  }
}

/** 연결 확인 (선택) */
export async function pingBackend() {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
