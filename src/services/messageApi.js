/**
 * FastAPI 백엔드 — Gemini 안심 멘트 생성
 * TODO: 배포 URL은 VITE_API_URL 환경변수로 설정
 */

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:8000';

const LOCAL_FALLBACK =
  '곧 도착해요. 무서워하지 않으셔도 괜찮아요. 천천히 이동하고 있습니다.';

/**
 * @param {object} input — TransportContext input
 * @returns {Promise<{ message: string, source: 'api' | 'fallback' }>}
 */
export async function fetchComfortMessage(input) {
  try {
    const res = await fetch(`${API_BASE}/generate-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        situation: input.situation,
        age: input.ageGroup,
        religion: input.religion,
        duration: input.duration,
        anxiety: input.anxiety,
      }),
    });

    if (!res.ok) {
      throw new Error(`API ${res.status}`);
    }

    const data = await res.json();
    const message = typeof data?.message === 'string' ? data.message.trim() : '';
    if (!message) throw new Error('empty message');

    return { message, source: 'api' };
  } catch (err) {
    console.warn('fetchComfortMessage failed — using fallback', err);
    return { message: LOCAL_FALLBACK, source: 'fallback' };
  }
}
