/**
 * The Met Collection API — 편안함 이미지용
 * https://collectionapi.metmuseum.org/public/collection/v1
 *
 * 첫 로드 시 10~20점을 받아 캐싱하고, 이후 순환 표시.
 * TODO: 백엔드 프록시/캐시로 이전 (CORS·쿼터 안정화)
 */

const BASE_URL = 'https://collectionapi.metmuseum.org/public/collection/v1';
const CACHE_KEY = 'first-aid-met-comfort';
const TARGET_COUNT = 16;
const SEARCH_QUERIES = ['landscape', 'sea', 'garden', 'lake', 'forest', 'sunset'];

/** @typedef {{ id: number, title: string, artist: string, imageUrl: string, objectURL: string }} MetArtwork */

/** @type {MetArtwork[] | null} */
let memoryCache = null;

/** @type {Promise<MetArtwork[]> | null} */
let loadPromise = null;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function readSessionCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length >= 4) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function writeSessionCache(list) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

async function searchObjectIds(query) {
  const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}&hasImages=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Met search failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.objectIDs) ? data.objectIDs : [];
}

/**
 * @param {number} objectId
 * @returns {Promise<MetArtwork | null>}
 */
async function fetchArtwork(objectId) {
  const res = await fetch(`${BASE_URL}/objects/${objectId}`);
  if (!res.ok) return null;
  const obj = await res.json();

  if (!obj?.isPublicDomain) return null;
  const imageUrl = obj.primaryImageSmall || obj.primaryImage;
  if (!imageUrl) return null;

  return {
    id: obj.objectID,
    title: obj.title || 'Untitled',
    artist: obj.artistDisplayName || 'Unknown',
    imageUrl,
    objectURL: obj.objectURL || '',
  };
}

/**
 * 여러 주제 검색 → 공개 도메인 이미지 작품 캐시
 * @returns {Promise<MetArtwork[]>}
 */
async function fetchComfortArtworks() {
  const idSets = await Promise.allSettled(
    SEARCH_QUERIES.map((q) => searchObjectIds(q)),
  );

  const idPool = new Set();
  for (const result of idSets) {
    if (result.status === 'fulfilled') {
      for (const id of result.value.slice(0, 80)) idPool.add(id);
    }
  }

  const shuffled = shuffle([...idPool]);
  /** @type {MetArtwork[]} */
  const artworks = [];
  const concurrency = 6;

  for (let i = 0; i < shuffled.length && artworks.length < TARGET_COUNT; i += concurrency) {
    const batch = shuffled.slice(i, i + concurrency);
    const results = await Promise.all(batch.map((id) => fetchArtwork(id)));
    for (const art of results) {
      if (art && !artworks.some((a) => a.id === art.id)) {
        artworks.push(art);
        if (artworks.length >= TARGET_COUNT) break;
      }
    }
  }

  return artworks;
}

/**
 * 캐시된 목록 반환 (없으면 API 호출)
 * @returns {Promise<MetArtwork[]>}
 */
export function loadComfortArtworks() {
  if (memoryCache?.length) return Promise.resolve(memoryCache);

  const session = readSessionCache();
  if (session?.length) {
    memoryCache = session;
    return Promise.resolve(session);
  }

  if (loadPromise) return loadPromise;

  loadPromise = fetchComfortArtworks()
    .then((list) => {
      memoryCache = list;
      if (list.length) writeSessionCache(list);
      loadPromise = null;
      return list;
    })
    .catch((err) => {
      console.warn('Met API load failed', err);
      loadPromise = null;
      return [];
    });

  return loadPromise;
}

/** 테스트·리셋용 */
export function clearComfortArtCache() {
  memoryCache = null;
  loadPromise = null;
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}
