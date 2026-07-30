import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import SoundControls, { getInitialTrackId } from '../components/SoundControls';
import { useTransport } from '../context/TransportContext';
import {
  BG_MUSIC_VOLUME,
  DURATIONS,
  SITUATIONS,
  resolveTrackSrc,
} from '../data/options';
import {
  createIdleProjectorState,
  openProjectorWindow,
  publishProjectorState,
} from '../services/projectorSync';
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

/**
 * 직원 조작 화면 (리모컨)
 * 빔 콘텐츠는 /projector 창에 표시 — 여기서는 모드·사운드·이송 상태만 제어
 */
export default function PlaybackPage() {
  const navigate = useNavigate();
  const {
    input,
    selectedPlan,
    resetSession,
    defaultVolume,
    aiMessage,
    requestAiMessage,
    aiMessageLoading,
    setAiPanelOpen,
  } = useTransport();

  const initialMode =
    selectedPlan?.includeGuide === false && selectedPlan?.includeComfort
      ? 'comfort'
      : 'guide';
  const [beamMode, setBeamMode] = useState(initialMode);
  const [beamEnabled, setBeamEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [trackId, setTrackId] = useState(() =>
    getInitialTrackId(selectedPlan?.trackId, input.religion),
  );
  const [volume, setVolume] = useState(defaultVolume);
  const [startHint, setStartHint] = useState('');
  const [started, setStarted] = useState(false);

  const audioRef = useRef(null);

  const totalSeconds = useMemo(() => {
    const d = DURATIONS.find((x) => x.id === input.duration);
    return (d?.minutes ?? 5) * 60;
  }, [input.duration]);

  const [remaining, setRemaining] = useState(totalSeconds);

  const destinationLabel =
    SITUATIONS.find((s) => s.id === input.situation)?.label ?? '목적지';

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

  // 사운드 끄기 → 즉시 정지 (빔과 독립)
  useEffect(() => {
    if (soundEnabled === false) {
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
    }
  }, [soundEnabled]);

  // 직원 조작 → 빔 창 동기화
  useEffect(() => {
    if (!selectedPlan) return undefined;

    publishProjectorState({
      active: true,
      beamMode,
      beamEnabled,
      remainingSeconds: remaining,
      totalSeconds,
      destinationLabel,
      statusText: getStatusText(remaining),
      planName: selectedPlan.name,
      religion: input.religion,
      caption: aiMessage || '',
    });

    return undefined;
  }, [
    selectedPlan,
    beamMode,
    beamEnabled,
    remaining,
    totalSeconds,
    destinationLabel,
    input.religion,
    aiMessage,
  ]);

  if (!selectedPlan) {
    return <Navigate to="/" replace />;
  }

  const stopAllAudio = () => {
    stopSpeaking();
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

    const resolved = resolveTrackSrc(trackId, input.religion);
    if (resolved.needReligion) {
      setStartHint('종교를 환자 입력에서 선택해 주세요');
      return false;
    }
    if (!resolved.src) {
      setStartHint('재생할 음원을 찾을 수 없습니다');
      return false;
    }

    try {
      // 단일 <audio>만 사용 — src 교체 전 완전 정지
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        /* ignore */
      }
      audio.loop = true;
      audio.src = resolved.src;
      audio.volume = BG_MUSIC_VOLUME;
      audio.load();
      await audio.play();
      setStartHint('');
      return true;
    } catch (err) {
      console.warn('배경음악 재생 실패:', resolved.src, err);
      setStartHint(`재생할 수 없습니다 (${resolved.src})`);
      return false;
    }
  };

  const handleStart = async () => {
    if (aiMessageLoading) return;

    if (soundEnabled === false) {
      setSoundEnabled(true);
    }

    setAiPanelOpen(true);
    setStarted(true);

    // TTS·이전 음악 모두 정지 후, 선택 트랙 1개만 재생
    stopSpeaking();
    await playSelectedMusic();

    await requestAiMessage({
      speak: true,
      volume,
    });
  };

  const handleEnd = () => {
    stopAllAudio();
    publishProjectorState(createIdleProjectorState());
    resetSession();
    navigate('/input');
  };

  return (
    <main className="page page--playback">
      <div className="playback-status" aria-live="polite">
        <p className="playback-status__label">{getStatusText(remaining)}</p>
        <p className="playback-status__time">{formatTime(remaining)}</p>
        <p className="playback-status__plan">{selectedPlan.name}</p>
      </div>

      <section className="remote-panel" aria-label="빔 콘텐츠 조작">
        <div className="remote-panel__head">
          <h2 className="remote-panel__title">빔 콘텐츠</h2>
          <div className="remote-panel__head-actions">
            <button
              type="button"
              className={`btn btn--sm ${beamEnabled ? 'btn--ghost' : 'btn--secondary'}`}
              onClick={() => setBeamEnabled((v) => !v)}
            >
              {beamEnabled ? '빔 끄기' : '빔 켜기'}
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={openProjectorWindow}
            >
              빔 화면 미리보기
            </button>
          </div>
        </div>
        <p className="remote-panel__hint">
          천장 투사 화면은 별도 창(`/projector`)에서 표시됩니다. 탭에 따라 내용이 달라집니다.
        </p>

        <div className="beam-panel__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={beamMode === 'guide'}
            className={`tab ${beamMode === 'guide' ? 'is-active' : ''}`}
            onClick={() => setBeamMode('guide')}
            disabled={!beamEnabled}
          >
            길 안내
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={beamMode === 'comfort'}
            className={`tab ${beamMode === 'comfort' ? 'is-active' : ''}`}
            onClick={() => setBeamMode('comfort')}
            disabled={!beamEnabled}
          >
            편안함 이미지
          </button>
        </div>

        <div className="remote-panel__mode">
          현재 빔 모드:{' '}
          <strong>
            {!beamEnabled
              ? '꺼짐'
              : beamMode === 'guide'
                ? '길 안내'
                : '편안함 이미지 (Met 명화)'}
          </strong>
        </div>
      </section>

      <SoundControls
        religion={input.religion}
        trackId={trackId}
        onTrackChange={setTrackId}
        soundEnabled={soundEnabled}
        onSoundEnabledChange={setSoundEnabled}
        volume={volume}
        onVolumeChange={setVolume}
      />

      {startHint && <p className="playback-start-hint">{startHint}</p>}

      <div className="page__footer sticky-footer sticky-footer--playback">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={openProjectorWindow}
        >
          빔 미리보기
        </button>
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
