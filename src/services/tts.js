/**
 * 브라우저 Web Speech API (ko-KR) 래퍼
 * TODO: 실제 AI 음성(TTS) API 연동 시 speak() 내부만 교체
 */

const DEFAULT_MESSAGE =
  '곧 도착해요. 무서워하지 않으셔도 괜찮아요. 천천히 이동하고 있습니다.';

function pickKoreanVoice() {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === 'ko-KR') ||
    voices.find((v) => v.lang.startsWith('ko')) ||
    null
  );
}

/**
 * @param {string} text
 * @param {{ rate?: number, volume?: number, onEnd?: () => void }} [opts]
 */
export function speak(
  text = DEFAULT_MESSAGE,
  { rate = 0.9, volume = 0.85, onEnd } = {},
) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Web Speech API를 지원하지 않는 브라우저입니다.');
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();

  const run = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = Math.min(1, Math.max(0, volume));

    const ko = pickKoreanVoice();
    if (ko) utterance.voice = ko;

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    window.speechSynthesis.speak(utterance);
  };

  // 일부 브라우저는 voices가 비동기로 로드됨
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      run();
    };
    // 그래도 비어 있으면 바로 시도
    setTimeout(run, 120);
  } else {
    run();
  }
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
