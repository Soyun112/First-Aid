import { useEffect, useRef, useState } from 'react';
import { useTransport } from '../context/TransportContext';
import {
  BG_MUSIC_VOLUME,
  SOUND_OPTIONS,
  VOLUME_MAX,
  resolveTrackSrc,
} from '../data/options';
import { stopSpeaking } from '../services/tts';

/**
 * 사운드 컨트롤
 * - 진정음악 / 종교음악 선택
 * - 재생 한 번으로 배경음악(낮은 볼륨) + AI 멘트 TTS 동시 재생
 */
export default function SoundControls({
  religion,
  initialTrackId,
  soundEnabled,
  onSoundEnabledChange,
  defaultVolume,
}) {
  const { requestAiMessage, aiMessageLoading, setAiPanelOpen } = useTransport();

  const hasReligion = religion && religion !== 'none';
  const tracks = SOUND_OPTIONS.filter(
    (t) => t.id === 'calm' || (t.id === 'religious' && hasReligion),
  );

  const [trackId, setTrackId] = useState(() => {
    if (initialTrackId === 'religious' && hasReligion) return 'religious';
    if (initialTrackId === 'calm') return 'calm';
    return tracks[0]?.id ?? 'calm';
  });
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(defaultVolume);
  const [hint, setHint] = useState('');
  const audioRef = useRef(null);
  const trackRef = useRef(trackId);

  useEffect(() => {
    trackRef.current = trackId;
  }, [trackId]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      const audio = audioRef.current;
      if (audio) {
        try {
          audio.pause();
          audio.removeAttribute('src');
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.min(
        VOLUME_MAX,
        Math.min(volume, BG_MUSIC_VOLUME + 0.05),
      );
    }
  }, [volume]);

  // 외부 "사운드 끄기" 토글
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
      setPlaying(false);
    }
  }, [soundEnabled]);

  const stopAll = () => {
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
    setPlaying(false);
  };

  const playBgMusic = async (nextTrackId) => {
    const audio = audioRef.current;
    if (!audio) return false;

    const resolved = resolveTrackSrc(nextTrackId, religion);
    if (resolved.needReligion) {
      setHint('종교를 환자 입력에서 선택해 주세요');
      return false;
    }
    if (!resolved.src) {
      setHint('재생할 음원을 찾을 수 없습니다');
      return false;
    }

    try {
      audio.loop = true;
      audio.src = resolved.src;
      audio.volume = Math.min(VOLUME_MAX, Math.min(volume, BG_MUSIC_VOLUME));
      audio.load();
      await audio.play();
      setHint('');
      return true;
    } catch (err) {
      console.warn('배경음악 재생 실패:', resolved.src, err);
      setHint(`재생할 수 없습니다 (${resolved.src})`);
      return false;
    }
  };

  const handlePlayTogether = async () => {
    if (aiMessageLoading) return;
    if (soundEnabled === false) {
      onSoundEnabledChange?.(true);
    }

    setAiPanelOpen(true);
    setPlaying(true);

    await playBgMusic(trackRef.current);

    await requestAiMessage({
      speak: true,
      volume,
    });
  };

  const handleStop = () => {
    stopAll();
  };

  const handleSelectTrack = async (id) => {
    setTrackId(id);
    if (playing && soundEnabled !== false) {
      await playBgMusic(id);
    }
  };

  return (
    <section className="sound-controls" aria-label="사운드 컨트롤">
      <div className="sound-controls__head">
        <h2 className="sound-controls__title">사운드</h2>
        <button
          type="button"
          className={`btn btn--sm ${soundEnabled === false ? 'btn--secondary' : 'btn--ghost'}`}
          onClick={() => onSoundEnabledChange?.(soundEnabled === false)}
        >
          {soundEnabled === false ? '사운드 켜기' : '사운드 끄기'}
        </button>
      </div>

      <div className="sound-controls__tracks">
        {tracks.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`chip ${trackId === t.id ? 'is-selected' : ''}`}
            onClick={() => handleSelectTrack(t.id)}
            disabled={soundEnabled === false}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="sound-controls__actions">
        {!playing ? (
          <button
            type="button"
            className="btn btn--primary"
            onClick={handlePlayTogether}
            disabled={aiMessageLoading || soundEnabled === false}
          >
            {aiMessageLoading ? '생성 중…' : '재생 (음악 + AI 멘트)'}
          </button>
        ) : (
          <button type="button" className="btn btn--secondary" onClick={handleStop}>
            정지
          </button>
        )}
      </div>

      <label className="sound-controls__volume">
        <span>음량 (최대 {Math.round(VOLUME_MAX * 100)}%)</span>
        <input
          type="range"
          min={0}
          max={VOLUME_MAX}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          disabled={soundEnabled === false}
        />
      </label>

      {hint && <p className="sound-controls__hint">{hint}</p>}
      <p className="sound-controls__note">
        배경음악 위에 AI 멘트가 함께 재생됩니다 · 멘트는 헤더 말풍선에서 확인
      </p>

      <audio ref={audioRef} preload="none" loop />
    </section>
  );
}
