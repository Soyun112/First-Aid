import { useEffect, useRef, useState } from 'react';
import ProjectorComfortView from '../components/projector/ProjectorComfortView';
import {
  BG_MUSIC_VOLUME,
  PROJECTOR_FALLBACKS,
  PROJECTOR_RELIGIONS,
  PROJECTOR_SOUNDS,
  PROJECTOR_SITUATIONS,
  TTS_RATE,
  TTS_VOLUME,
  buildProjectorInput,
  resolveSoundSrc,
} from '../data/projectorDemo';
import { fetchComfortMessage } from '../services/messageApi';
import { speak, stopSpeaking } from '../services/tts';

/**
 * 빔 프로젝터 데모
 * Met 배경 + 상황 → Gemini 멘트/TTS + 배경음악(동시·루프)
 */
export default function ProjectorPage() {
  const [situation, setSituation] = useState(null);
  const [religionId, setReligionId] = useState(null);
  const [soundId, setSoundId] = useState('off');
  const [message, setMessage] = useState('');
  const [source, setSource] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [musicHint, setMusicHint] = useState('');

  const audioRef = useRef(null);
  const busyRef = useRef(false);
  const religionRef = useRef(null);
  const soundRef = useRef('off');

  useEffect(() => {
    religionRef.current = religionId;
  }, [religionId]);

  useEffect(() => {
    soundRef.current = soundId;
  }, [soundId]);

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

  /**
   * 클릭 시에만 재생. loop=true, 이전 트랙 정지 후 교체.
   */
  const playSoundOption = async (nextSoundId, nextReligionId = religionRef.current) => {
    setSoundId(nextSoundId);
    setMusicHint('');

    const audio = audioRef.current;
    if (!audio) return;

    // 겹침 방지: 항상 이전 재생 중지
    stopBgMusic();

    if (nextSoundId === 'off') {
      return;
    }

    const resolved = resolveSoundSrc(nextSoundId, nextReligionId);

    if (resolved.needReligion) {
      setMusicHint(resolved.missingHint || '종교를 먼저 선택해 주세요');
      return;
    }

    if (!resolved.src) {
      if (resolved.missingHint) setMusicHint(resolved.missingHint);
      return;
    }

    try {
      audio.loop = true;
      audio.src = resolved.src;
      audio.volume = BG_MUSIC_VOLUME;
      // 로드 후 재생 (짧은 파일도 loop로 유지)
      audio.load();
      await audio.play();
      setMusicHint('');
    } catch (err) {
      // 파일 없음·재생 실패 → 앱은 계속, 힌트만
      console.warn('배경음악 재생 실패:', resolved.src, err);
      setMusicHint(
        resolved.missingHint ||
          `재생할 수 없습니다 (${resolved.src}). 파일을 public/audio에 넣어 주세요.`,
      );
    }
  };

  const selectReligion = async (nextReligionId) => {
    setReligionId(nextReligionId);
    // 이미 종교음악이 선택된 상태면 바로 해당 곡으로 전환 재생
    if (soundRef.current === 'religious') {
      await playSoundOption('religious', nextReligionId);
    }
  };

  /** TTS는 배경음악을 멈추지 않고 동시에 재생 */
  const speakWithMusic = (text) => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      audio.volume = BG_MUSIC_VOLUME;
      audio.loop = true;
    }

    speak(text, {
      rate: TTS_RATE,
      volume: TTS_VOLUME,
      onEnd: () => {
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
    // 멘트만 갱신 — 배경음악은 그대로 유지(동시 재생)
    stopSpeaking();

    const fallback =
      PROJECTOR_FALLBACKS[situationId] || PROJECTOR_FALLBACKS.ward;
    const input = buildProjectorInput(
      situationId,
      religionRef.current || 'none',
    );

    try {
      const result = await fetchComfortMessage(input, { fallback });
      setMessage(result.message);
      setSource(result.source);
      setPhase('playing');
      speakWithMusic(result.message);
    } finally {
      busyRef.current = false;
    }
  };

  const handleReplay = () => {
    if (!message || busyRef.current) return;
    setPhase('playing');
    stopSpeaking();
    speakWithMusic(message);
  };

  const handleStopSpeech = () => {
    stopSpeaking();
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
            <p className="proj-demo__label">종교 (종교음악용)</p>
            <div className="proj-demo__buttons">
              {PROJECTOR_RELIGIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`proj-demo__btn proj-demo__btn--soft ${religionId === r.id ? 'is-active' : ''}`}
                  onClick={() => selectReligion(r.id)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="proj-demo__group">
            <p className="proj-demo__label">배경 사운드</p>
            <div className="proj-demo__buttons">
              {PROJECTOR_SOUNDS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`proj-demo__btn proj-demo__btn--soft ${soundId === s.id ? 'is-active' : ''}`}
                  onClick={() => playSoundOption(s.id)}
                >
                  {s.label}
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
              onClick={handleStopSpeech}
            >
              멘트 정지
            </button>
          </div>

          {musicHint && <p className="proj-demo__hint">{musicHint}</p>}
        </footer>
      </div>

      <audio ref={audioRef} preload="none" loop />
    </div>
  );
}
