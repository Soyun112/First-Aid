/**
 * ETA 예측 API (LightGBM FastAPI — main.py)
 *
 * hour/weekday는 서버가 datetime.now()로 처리하므로 보내지 않음.
 */

export const ETA_API_BASE =
  import.meta.env.VITE_ETA_API_URL?.replace(/\/$/, '') || 'http://localhost:8001';

/** 데모가 끊기지 않도록 짧게 타임아웃 후 폴백 */
const REQUEST_TIMEOUT_MS = 8_000;

const DEST_BONUS = {
  CT: 0.5,
  수술실: 1.0,
  MRI: 1.5,
  병동: 0,
};

/**
 * 규칙 기반 ETA (분, 올림)
 * 혼잡 가정 +1 (transport_count 6~10 구간과 동일)
 */
export function computeFallbackEta({
  startFloor,
  destination,
  destinationFloor,
}) {
  const floorDiff = Math.abs(Number(startFloor) - Number(destinationFloor));
  const destBonus = DEST_BONUS[destination] ?? 0;
  const raw = 2 + floorDiff * 0.4 + destBonus + 1;
  return Math.ceil(raw);
}

/**
 * @param {{ startFloor: number, destination: string, destinationFloor: number, transportCountNow?: number }} params
 * @returns {Promise<{ eta_min: number, hour: number | null, source: 'api' | 'fallback', error?: string }>}
 */
export async function fetchEtaPredict(params) {
  const {
    startFloor,
    destination,
    destinationFloor,
    transportCountNow,
  } = params;

  const fallbackMin = computeFallbackEta({
    startFloor,
    destination,
    destinationFloor,
  });

  if (
    startFloor == null ||
    destinationFloor == null ||
    !destination
  ) {
    return {
      eta_min: fallbackMin,
      hour: null,
      source: 'fallback',
      error: 'missing_fields',
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const body = {
      start_floor: Number(startFloor),
      destination: String(destination),
      destination_floor: Number(destinationFloor),
    };
    if (transportCountNow != null) {
      body.transport_count_now = Number(transportCountNow);
    }

    const res = await fetch(`${ETA_API_BASE}/predict`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`ETA API ${res.status}`);
    }

    const data = await res.json();
    const eta = Number(data?.eta_min);
    if (!Number.isFinite(eta) || eta <= 0) {
      throw new Error('invalid eta_min');
    }

    return {
      eta_min: Math.ceil(eta),
      hour: data?.hour ?? null,
      source: 'api',
    };
  } catch (err) {
    const reason =
      err?.name === 'AbortError'
        ? 'timeout'
        : err?.message?.includes('Failed to fetch')
          ? 'network'
          : 'error';
    console.warn(`fetchEtaPredict failed (${reason}) — using fallback`, err);
    return {
      eta_min: fallbackMin,
      hour: null,
      source: 'fallback',
      error: reason,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 6~21시 시간대별 ETA (설정 화면 표/그래프용)
 * 실패 시 throw — 호출부에서 섹션만 에러 표시
 *
 * @param {{ startFloor: number, destination: string, destinationFloor: number }} params
 * @returns {Promise<Array<{ hour: number, eta_min: number, transport_count_now: number }>>}
 */
export async function fetchEtaHourly(params) {
  const { startFloor, destination, destinationFloor } = params;

  if (
    startFloor == null ||
    destinationFloor == null ||
    !destination
  ) {
    throw new Error('missing_fields');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${ETA_API_BASE}/predict_hourly`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start_floor: Number(startFloor),
        destination: String(destination),
        destination_floor: Number(destinationFloor),
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`ETA hourly API ${res.status}`);
    }

    const data = await res.json();
    const items = Array.isArray(data?.items) ? data.items : null;
    if (!items || items.length === 0) {
      throw new Error('empty hourly items');
    }

    return items.map((row) => ({
      hour: Number(row.hour),
      eta_min: Math.ceil(Number(row.eta_min)),
      transport_count_now: Number(row.transport_count_now ?? 0),
    }));
  } finally {
    clearTimeout(timer);
  }
}
