/**
 * 브라우저 Web Speech API (ko-KR) 래퍼
 * TODO: 실제 AI 음성(TTS) API 연동 시 speak() 내부만 교체
 */

const DEFAULT_MESSAGE =
  '곧 도착해요. 무서워하지 않으셔도 괜찮아요. 천천히 이동하고 있습니다.';

export function speak(text = DEFAULT_MESSAGE, { rate = 0.9, volume = 0.8 } = {}) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Web Speech API를 지원하지 않는 브라우저입니다.');
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ko-KR';
  utterance.rate = rate;
  utterance.volume = Math.min(1, Math.max(0, volume));

  const voices = window.speechSynthesis.getVoices();
  const ko = voices.find((v) => v.lang.startsWith('ko'));
  if (ko) utterance.voice = ko;

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
