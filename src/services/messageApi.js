/**
 * FastAPI 백엔드 — Gemini 안심 멘트 생성
 * 환경변수: VITE_API_URL
 * 배포: https://first-aid-77zc.onrender.com
 */

export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:8000';

/** Render cold start 대비 (최대 90초) */
const REQUEST_TIMEOUT_MS = 90_000;

const LOCAL_FALLBACK =
  '곧 도착해요. 무서워하지 않으셔도 괜찮아요. 천천히 이동하고 있습니다.';

/**
 * @param {object} input — TransportContext input
 * @returns {Promise<{ message: string, source: 'api' | 'fallback', error?: string }>}
 */
export async function fetchComfortMessage(input) {
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
        situation: input.situation,
        age: input.ageGroup,
        religion: input.religion,
        duration: input.duration,
        anxiety: input.anxiety,
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
    return { message: LOCAL_FALLBACK, source: 'fallback', error: reason };
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
