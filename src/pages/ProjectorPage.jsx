import { useEffect, useRef, useState } from 'react';
import ProjectorComfortView from '../components/projector/ProjectorComfortView';
import {
  BG_MUSIC_DUCK_VOLUME,
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
 * Met 명화 배경 + 상황 선택 → Gemini 멘트 → TTS + 배경음악
 */
export default function ProjectorPage() {
  const [situation, setSituation] = useState(null);
  const [musicId, setMusicId] = useState('off');
  const [message, setMessage] = useState('');
  const [source, setSource] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [musicHint, setMusicHint] = useState('');

  const audioRef = useRef(null);
  const busyRef = useRef(false);
  const musicIdRef = useRef('off');

  useEffect(() => {
    musicIdRef.current = musicId;
  }, [musicId]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      const audio = audioRef.current;
      if (audio) {
        try {
          audio.pause();
          audio.removeAttribute('src');
          audio.load();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const setBgVolume = (volume) => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.volume = Math.min(1, Math.max(0, volume));
    } catch {
      /* ignore */
    }
  };

  const stopBgMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      /* ignore */
    }
  };

  const selectMusic = async (nextId) => {
    setMusicId(nextId);
    setMusicHint('');

    const track = PROJECTOR_MUSIC.find((m) => m.id === nextId);
    const audio = audioRef.current;
    if (!audio || !track) return;

    stopBgMusic();

    if (nextId === 'off' || !track.src) {
      return;
    }

    try {
      audio.loop = true;
      audio.src = track.src;
      audio.volume = BG_MUSIC_VOLUME;
      await audio.play();
    } catch (err) {
      console.warn('배경음악 재생 실패:', track.src, err);
      setMusicHint(`재생할 수 없습니다 (${track.label})`);
    }
  };

  const duckDuringSpeech = (text) => {
    setBgVolume(BG_MUSIC_DUCK_VOLUME);
    speak(text, {
      rate: TTS_RATE,
      volume: TTS_VOLUME,
      onEnd: () => {
        if (musicIdRef.current !== 'off') {
          setBgVolume(BG_MUSIC_VOLUME);
        }
        setPhase((p) => (p === 'loading' ? p : 'idle'));
      },
    });
  };

  const runDemo = async (situationId) => {
    if (busyRef.current) return;
    busyRef.current = true;

    setSituation(situationId);
    setPhase('loading');
    setMessage('');
    setSource(null);
    stopSpeaking();

    const fallback =
      PROJECTOR_FALLBACKS[situationId] || PROJECTOR_FALLBACKS.ward;
    const input = buildProjectorInput(situationId, musicIdRef.current);

    try {
      const result = await fetchComfortMessage(input, { fallback });
      setMessage(result.message);
      setSource(result.source);
      setPhase('playing');
      duckDuringSpeech(result.message);
    } finally {
      busyRef.current = false;
    }
  };

  const handleReplay = () => {
    if (!message || busyRef.current) return;
    setPhase('playing');
    stopSpeaking();
    duckDuringSpeech(message);
  };

  const handleStop = () => {
    stopSpeaking();
    setBgVolume(BG_MUSIC_VOLUME);
    setPhase('idle');
  };

  return (
    <div className="projector projector--demo">
      <div className="proj-demo__bg" aria-hidden="true">
        <ProjectorComfortView variant="background" />
      </div>

      <div className="proj-demo__foreground">
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
                  onClick={() => selectMusic(m.id)}
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
              멘트 정지
            </button>
          </div>

          {musicHint && <p className="proj-demo__hint">{musicHint}</p>}
        </footer>
      </div>

      <audio ref={audioRef} preload="none" />
    </div>
  );
}
