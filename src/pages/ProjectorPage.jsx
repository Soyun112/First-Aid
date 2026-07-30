import { useEffect, useRef, useState } from 'react';
import {
  BG_MUSIC_VOLUME,
  PROJECTOR_FALLBACKS,
  PROJECTOR_MUSIC,
  PROJECTOR_SITUATIONS,
  TTS_RATE,
  TTS_VOLUME,
  buildProjectorInput,
} from '../data/projectorDemo';
import { fetchComfortMessage } from '../services/messageApi';
import { speak, stopSpeaking } from '../services/tts';

/**
 * 빔 프로젝터 데모 화면
 * 상황 선택 → Gemini 멘트 → TTS + 배경음악 + 큰 자막
 */
export default function ProjectorPage() {
  const [situation, setSituation] = useState(null);
  const [musicId, setMusicId] = useState('calm');
  const [message, setMessage] = useState('');
  const [source, setSource] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | loading | playing
  const [musicHint, setMusicHint] = useState('');

  const audioRef = useRef(null);
  const busyRef = useRef(false);

  const musicTrack =
    PROJECTOR_MUSIC.find((m) => m.id === musicId) || PROJECTOR_MUSIC[0];

  useEffect(() => {
    return () => {
      stopSpeaking();
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, []);

  const stopBgMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  };

  const playBgMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    stopBgMusic();
    audio.src = musicTrack.src;
    audio.loop = true;
    audio.volume = BG_MUSIC_VOLUME;

    try {
      await audio.play();
      setMusicHint('');
    } catch (err) {
      // 파일 미배치 또는 autoplay 제한
      console.warn('배경음악 재생 실패 (파일 확인: ', musicTrack.src, ')', err);
      setMusicHint(
        `배경음악 파일이 없거나 재생할 수 없습니다 (${musicTrack.src})`,
      );
    }
  };

  const runDemo = async (situationId) => {
    if (busyRef.current) return;
    busyRef.current = true;

    setSituation(situationId);
    setPhase('loading');
    setMessage('');
    setSource(null);
    stopSpeaking();
    stopBgMusic();

    const fallback =
      PROJECTOR_FALLBACKS[situationId] || PROJECTOR_FALLBACKS.ward;
    const input = buildProjectorInput(situationId, musicId);

    try {
      const result = await fetchComfortMessage(input, { fallback });
      setMessage(result.message);
      setSource(result.source);
      setPhase('playing');

      await playBgMusic();
      speak(result.message, {
        rate: TTS_RATE,
        volume: TTS_VOLUME,
      });
    } finally {
      busyRef.current = false;
    }
  };

  const handleReplay = async () => {
    if (!message || busyRef.current) return;
    setPhase('playing');
    await playBgMusic();
    speak(message, { rate: TTS_RATE, volume: TTS_VOLUME });
  };

  const handleStop = () => {
    stopSpeaking();
    stopBgMusic();
    setPhase(message ? 'idle' : 'idle');
  };

  return (
    <div className="projector projector--demo">
      <header className="proj-demo__brand">
        <span className="proj-demo__badge">First Aid</span>
        <span className="proj-demo__hospital">삼성병원 · 이송 케어</span>
      </header>

      <main className="proj-demo__stage" aria-live="polite">
        {phase === 'loading' && (
          <p className="proj-demo__status">안심 멘트를 생성하는 중…</p>
        )}

        {message ? (
          <p className="proj-demo__caption">{message}</p>
        ) : (
          <p className="proj-demo__prompt">
            아래 상황을 선택하면
            <br />
            안심 안내가 시작됩니다
          </p>
        )}

        {source === 'api' && phase !== 'loading' && (
          <p className="proj-demo__source">AI가 이 상황에 맞춰 생성한 멘트</p>
        )}
        {source === 'fallback' && phase !== 'loading' && (
          <p className="proj-demo__source proj-demo__source--fallback">
            기본 안내 멘트 (네트워크 대기·폴백)
          </p>
        )}
      </main>

      <footer className="proj-demo__controls">
        <div className="proj-demo__group">
          <p className="proj-demo__label">상황 선택</p>
          <div className="proj-demo__buttons">
            {PROJECTOR_SITUATIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`proj-demo__btn ${situation === s.id ? 'is-active' : ''}`}
                onClick={() => runDemo(s.id)}
                disabled={phase === 'loading'}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="proj-demo__group">
          <p className="proj-demo__label">배경 노래</p>
          <div className="proj-demo__buttons">
            {PROJECTOR_MUSIC.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`proj-demo__btn proj-demo__btn--soft ${musicId === m.id ? 'is-active' : ''}`}
                onClick={() => setMusicId(m.id)}
                disabled={phase === 'loading'}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="proj-demo__actions">
          <button
            type="button"
            className="proj-demo__btn proj-demo__btn--soft"
            onClick={handleReplay}
            disabled={!message || phase === 'loading'}
          >
            다시 듣기
          </button>
          <button
            type="button"
            className="proj-demo__btn proj-demo__btn--soft"
            onClick={handleStop}
          >
            정지
          </button>
        </div>

        {musicHint && <p className="proj-demo__hint">{musicHint}</p>}
      </footer>

      <audio ref={audioRef} preload="none" />
    </div>
  );
}
