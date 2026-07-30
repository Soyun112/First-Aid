import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import SoundControls, { getInitialTrackId } from '../components/SoundControls';
import { useTransport } from '../context/TransportContext';
import {
  DEFAULT_CARE_PLAN,
  DURATIONS,
  VOLUME_MAX,
  resolveTrackSrc,
} from '../data/options';
import { stopSpeaking } from '../services/tts';

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}분 ${String(s).padStart(2, '0')}초`;
}

function getStatusText(remaining) {
  if (remaining <= 30) return '곧 도착';
  if (remaining <= 60) return '거의 다 왔어요';
  return '이동 중';
}

function clampVolume(v) {
  return Math.min(VOLUME_MAX, Math.max(0, v));
}

/**
 * 이동 중 화면 — 타이머 + 사운드 제어
 */
export default function PlaybackPage() {
  const navigate = useNavigate();
  const {
    input,
    sessionActive,
    resetSession,
    defaultVolume,
    requestAiMessage,
    aiMessageLoading,
    setAiPanelOpen,
  } = useTransport();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [trackId, setTrackId] = useState(() =>
    getInitialTrackId(DEFAULT_CARE_PLAN.trackId),
  );
  const [volume, setVolume] = useState(() => clampVolume(defaultVolume));
  const [startHint, setStartHint] = useState('');
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState('idle');

  const audioRef = useRef(null);
  const volumeRef = useRef(volume);
  const soundEnabledRef = useRef(soundEnabled);
  const playSessionRef = useRef(0);

  const totalSeconds = useMemo(() => {
    const d = DURATIONS.find((x) => x.id === input.duration);
    return (d?.minutes ?? 5) * 60;
  }, [input.duration]);

  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = clampVolume(volume);
    }
  }, [volume]);

  useEffect(() => {
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => (r <= 0 ? 0 : r - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    return () => {
      playSessionRef.current += 1;
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

  useEffect(() => {
    if (soundEnabled === false) {
      playSessionRef.current += 1;
      stopSpeaking();
      const audio = audioRef.current;
      if (audio) {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch {
          /* ignore */
        }
      }
      setStarted(false);
      setPhase('idle');
    }
  }, [soundEnabled]);

  if (!sessionActive) {
    return <Navigate to="/input" replace />;
  }

  const stopMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.removeAttribute('src');
      audio.load();
    } catch {
      /* ignore */
    }
  };

  const stopAllAudio = () => {
    playSessionRef.current += 1;
    stopSpeaking();
    stopMusic();
    setPhase('idle');
  };

  const playSelectedMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return false;

    const resolved = resolveTrackSrc(trackId);
    if (!resolved.src) {
      setStartHint('재생할 음원을 찾을 수 없습니다');
      return false;
    }

    try {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        /* ignore */
      }
      audio.loop = true;
      audio.src = resolved.src;
      audio.volume = clampVolume(volumeRef.current);
      audio.load();
      await audio.play();
      setPhase('music');
      setStartHint('');
      return true;
    } catch (err) {
      console.warn('배경음악 재생 실패:', resolved.src, err);
      setStartHint(`재생할 수 없습니다 (${resolved.src})`);
      setPhase('idle');
      return false;
    }
  };

  const handleStart = async () => {
    if (aiMessageLoading) return;

    if (soundEnabled === false) {
      setSoundEnabled(true);
      soundEnabledRef.current = true;
    }

    setAiPanelOpen(true);
    setStarted(true);
    setStartHint('');

    const session = playSessionRef.current + 1;
    playSessionRef.current = session;
    stopSpeaking();
    stopMusic();
    setPhase('speaking');

    await requestAiMessage({
      speak: true,
      volume: clampVolume(volumeRef.current),
      onSpeakEnd: () => {
        if (playSessionRef.current !== session) return;
        if (soundEnabledRef.current === false) return;
        void playSelectedMusic();
      },
    });
  };

  const handleEnd = () => {
    stopAllAudio();
    resetSession();
    navigate('/input');
  };

  return (
    <main className="page page--playback">
      <div className="playback-status" aria-live="polite">
        <p className="playback-status__label">{getStatusText(remaining)}</p>
        <p className="playback-status__time">{formatTime(remaining)}</p>
      </div>

      <SoundControls
        trackId={trackId}
        onTrackChange={setTrackId}
        soundEnabled={soundEnabled}
        onSoundEnabledChange={setSoundEnabled}
        volume={volume}
        onVolumeChange={setVolume}
      />

      {phase === 'speaking' && (
        <p className="playback-start-hint playback-start-hint--info">
          AI 멘트 재생 중… 끝나면 배경음악이 이어집니다
        </p>
      )}
      {startHint && <p className="playback-start-hint">{startHint}</p>}

      <div className="page__footer sticky-footer sticky-footer--playback">
        <button
          type="button"
          className="btn btn--primary btn--sm playback-start-btn"
          onClick={handleStart}
          disabled={aiMessageLoading}
        >
          {aiMessageLoading ? '생성 중…' : started ? '다시 시작' : '시작'}
        </button>
        <button type="button" className="btn btn--danger" onClick={handleEnd}>
          이송 종료
        </button>
      </div>

      <audio ref={audioRef} preload="none" loop />
    </main>
  );
}
