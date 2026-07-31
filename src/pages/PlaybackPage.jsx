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
import { speak, stopSpeaking } from '../services/tts';

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
 * 이동 중 화면
 * - 진입 시 Gemini 멘트 자동 생성
 * - 「시작」: TTS → 배경음악 (생성 지연 시 음악 선재생 후 멘트)
 */
export default function PlaybackPage() {
  const navigate = useNavigate();
  const {
    input,
    patient,
    sessionActive,
    resetSession,
    defaultVolume,
    aiMessage,
    aiMessageLoading,
    requestAiMessage,
    setAiPanelOpen,
  } = useTransport();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [trackId, setTrackId] = useState(() =>
    getInitialTrackId(DEFAULT_CARE_PLAN.trackId),
  );
  const [volume, setVolume] = useState(() => clampVolume(defaultVolume));
  const [startHint, setStartHint] = useState('');
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | waiting | speaking | music

  const audioRef = useRef(null);
  const volumeRef = useRef(volume);
  const soundEnabledRef = useRef(soundEnabled);
  const trackIdRef = useRef(trackId);
  const playSessionRef = useRef(0);
  /** Start 눌렀는데 멘트가 아직 없을 때 — 음악 선재생 후 멘트 대기 */
  const pendingSpeakSessionRef = useRef(null);
  const prefetchDoneRef = useRef(false);

  const totalSeconds = useMemo(() => {
    if (patient?.durationMinutes) return patient.durationMinutes * 60;
    const d = DURATIONS.find((x) => x.id === input.duration);
    return (d?.minutes ?? 5) * 60;
  }, [patient, input.duration]);

  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    trackIdRef.current = trackId;
  }, [trackId]);

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

  // 진입 시 멘트 자동 생성 (버튼 없이)
  useEffect(() => {
    if (!sessionActive || prefetchDoneRef.current) return undefined;
    prefetchDoneRef.current = true;
    void requestAiMessage({ speak: false });
    return undefined;
  }, [sessionActive, requestAiMessage]);

  useEffect(() => {
    return () => {
      playSessionRef.current += 1;
      pendingSpeakSessionRef.current = null;
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
      pendingSpeakSessionRef.current = null;
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

  const pauseMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.pause();
    } catch {
      /* ignore */
    }
  };

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

  const playSelectedMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return false;

    const resolved = resolveTrackSrc(trackIdRef.current);
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

  const speakThenMusic = (text, session) => {
    pauseMusic();
    setPhase('speaking');
    speak(text, {
      volume: Math.min(1, Math.max(0, volumeRef.current)),
      onEnd: () => {
        if (playSessionRef.current !== session) return;
        if (soundEnabledRef.current === false) return;
        void playSelectedMusic();
      },
    });
  };

  // 생성 지연으로 음악 선재생 중 → 멘트 준비되면 TTS 후 음악 이어가기
  useEffect(() => {
    const session = pendingSpeakSessionRef.current;
    if (session == null) return;
    if (!aiMessage || aiMessageLoading) return;
    if (playSessionRef.current !== session) return;
    if (soundEnabledRef.current === false) return;

    pendingSpeakSessionRef.current = null;
    speakThenMusic(aiMessage, session);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to message readiness
  }, [aiMessage, aiMessageLoading]);

  if (!sessionActive) {
    return <Navigate to="/alert" replace />;
  }

  const stopAllAudio = () => {
    playSessionRef.current += 1;
    pendingSpeakSessionRef.current = null;
    stopSpeaking();
    stopMusic();
    setPhase('idle');
  };

  const handleStart = async () => {
    if (soundEnabled === false) {
      setSoundEnabled(true);
      soundEnabledRef.current = true;
    }

    setAiPanelOpen(true);
    setStarted(true);
    setStartHint('');

    const session = playSessionRef.current + 1;
    playSessionRef.current = session;
    pendingSpeakSessionRef.current = null;
    stopSpeaking();
    stopMusic();

    // 멘트가 이미 있으면 TTS → 음악
    if (aiMessage && !aiMessageLoading) {
      speakThenMusic(aiMessage, session);
      return;
    }

    // 생성 중이면 음악 선재생, 준비되면 멘트 이어서
    if (aiMessageLoading) {
      setPhase('waiting');
      pendingSpeakSessionRef.current = session;
      await playSelectedMusic();
      if (playSessionRef.current === session) {
        setPhase('waiting');
      }
      return;
    }

    // 멘트 없음 · 로딩도 아님 → 다시 생성하며 TTS
    setPhase('speaking');
    const result = await requestAiMessage({
      speak: true,
      volume: clampVolume(volumeRef.current),
      onSpeakEnd: () => {
        if (playSessionRef.current !== session) return;
        if (soundEnabledRef.current === false) return;
        void playSelectedMusic();
      },
    });

    // fetchLock 등으로 null이면 음악만이라도
    if (!result && playSessionRef.current === session) {
      setPhase('waiting');
      pendingSpeakSessionRef.current = session;
      await playSelectedMusic();
    }
  };

  const handleEnd = () => {
    stopAllAudio();
    resetSession();
    navigate('/alert');
  };

  const statusHint =
    phase === 'waiting'
      ? '멘트를 준비하는 동안 배경음악을 재생합니다…'
      : phase === 'speaking'
        ? 'AI 멘트 재생 중… 끝나면 배경음악이 이어집니다'
        : aiMessageLoading && !started
          ? '안심 멘트를 생성하는 중…'
          : '';

  return (
    <main className="page page--playback">
      <div className="playback-status" aria-live="polite">
        <p className="playback-status__label">{getStatusText(remaining)}</p>
        <p className="playback-status__time">{formatTime(remaining)}</p>
        {patient && (
          <p className="playback-status__plan">
            {patient.name} · {patient.from} → {patient.to}
          </p>
        )}
      </div>

      <SoundControls
        trackId={trackId}
        onTrackChange={setTrackId}
        soundEnabled={soundEnabled}
        onSoundEnabledChange={setSoundEnabled}
        volume={volume}
        onVolumeChange={setVolume}
      />

      {statusHint && (
        <p className="playback-start-hint playback-start-hint--info">{statusHint}</p>
      )}
      {startHint && <p className="playback-start-hint">{startHint}</p>}

      <div className="page__footer sticky-footer sticky-footer--playback">
        <button
          type="button"
          className="btn btn--primary btn--sm playback-start-btn"
          onClick={handleStart}
        >
          {started ? '다시 시작' : '시작'}
        </button>
        <button type="button" className="btn btn--danger" onClick={handleEnd}>
          이송 종료
        </button>
      </div>

      <audio ref={audioRef} preload="none" loop />
    </main>
  );
}
