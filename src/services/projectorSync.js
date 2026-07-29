/**
 * 직원 창 ↔ 빔(프로젝터) 창 상태 동기화
 *
 * 프로토타입: BroadcastChannel + localStorage
 * TODO: 실제 빔 송출 / WebSocket·시그널링 서버로 교체
 */

export const PROJECTOR_STORAGE_KEY = 'first-aid-projector-state';
export const PROJECTOR_CHANNEL = 'first-aid-projector';

/** @typedef {'guide' | 'comfort'} BeamMode */

/**
 * @typedef {object} ProjectorState
 * @property {boolean} active
 * @property {BeamMode} beamMode
 * @property {number} remainingSeconds
 * @property {number} totalSeconds
 * @property {string} destinationLabel
 * @property {string} statusText
 * @property {string} planName
 * @property {number} updatedAt
 */

/** @returns {ProjectorState} */
export function createIdleProjectorState() {
  return {
    active: false,
    beamMode: 'guide',
    remainingSeconds: 0,
    totalSeconds: 0,
    destinationLabel: '',
    statusText: '대기 중',
    planName: '',
    updatedAt: Date.now(),
  };
}

/** @returns {ProjectorState} */
export function readProjectorState() {
  try {
    const raw = localStorage.getItem(PROJECTOR_STORAGE_KEY);
    if (!raw) return createIdleProjectorState();
    return { ...createIdleProjectorState(), ...JSON.parse(raw) };
  } catch {
    return createIdleProjectorState();
  }
}

/**
 * 직원(메인) 창에서 호출 — 빔 화면에 상태 반영
 * @param {Partial<ProjectorState>} patch
 */
export function publishProjectorState(patch) {
  const next = {
    ...readProjectorState(),
    ...patch,
    updatedAt: Date.now(),
  };

  try {
    localStorage.setItem(PROJECTOR_STORAGE_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn('projector localStorage write failed', err);
  }

  try {
    const channel = new BroadcastChannel(PROJECTOR_CHANNEL);
    channel.postMessage(next);
    channel.close();
  } catch (err) {
    console.warn('projector BroadcastChannel post failed', err);
  }

  return next;
}

/**
 * 빔 창에서 구독
 * @param {(state: ProjectorState) => void} onChange
 * @returns {() => void} unsubscribe
 */
export function subscribeProjectorState(onChange) {
  onChange(readProjectorState());

  let channel;
  try {
    channel = new BroadcastChannel(PROJECTOR_CHANNEL);
    channel.onmessage = (event) => {
      if (event?.data) onChange(event.data);
    };
  } catch {
    channel = null;
  }

  const onStorage = (event) => {
    if (event.key !== PROJECTOR_STORAGE_KEY) return;
    onChange(readProjectorState());
  };
  window.addEventListener('storage', onStorage);

  return () => {
    window.removeEventListener('storage', onStorage);
    if (channel) channel.close();
  };
}

/** 새 창으로 빔 미리보기 열기 */
export function openProjectorWindow() {
  const url = `${window.location.origin}/projector`;
  window.open(url, 'first-aid-projector', 'noopener,noreferrer,width=1280,height=720');
}
