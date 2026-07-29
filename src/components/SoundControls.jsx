import { useEffect, useMemo, useRef, useState } from 'react';
import { SOUND_TRACKS, VOLUME_MAX } from '../data/options';
import { speak, stopSpeaking } from '../services/tts';

/**
 * 사운드 컨트롤: 트랙 선택 / 재생·일시정지 / AI 음성 / 음량
 * 음악 파일이 없으면 UI만 동작 (자리 확보)
 * TODO: 실제 오디오 파일·스트리밍 API 연동
 */
export default function SoundControls({
  religion,
  initialTrackId,
  includeVoice,
  defaultVolume,
}) {
  const availableTracks = useMemo(() => {
    return SOUND_TRACKS.filter(
      (t) => t.type === 'music' || t.religion === religion,
    );
  }, [religion]);

  const [trackId, setTrackId] = useState(
    initialTrackId && availableTracks.some((t) => t.id === initialTrackId)
      ? initialTrackId
      : availableTracks[0]?.id,
  );
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(defaultVolume);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      stopSpeaking();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.min(VOLUME_MAX, volume);
    }
  }, [volume]);

  const togglePlay = () => {
    // TODO: 실제 mp3 재생 — 현재는 자리만 (파일 미포함)
    // 샘플 파일이 있다면 audioRef로 play/pause
    setPlaying((p) => !p);
  };

  const handleVoice = () => {
    speak(undefined, { volume: Math.min(1, volume + 0.3) });
  };

  return (
    <section className="sound-controls" aria-label="사운드 컨트롤">
      <h2 className="sound-controls__title">사운드</h2>

      <div className="sound-controls__tracks">
        {availableTracks.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`chip ${trackId === t.id ? 'is-selected' : ''}`}
            onClick={() => setTrackId(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="sound-controls__actions">
        <button type="button" className="btn btn--secondary" onClick={togglePlay}>
          {playing ? '일시정지' : '음악 재생'}
        </button>
        {includeVoice !== false && (
          <button type="button" className="btn btn--secondary" onClick={handleVoice}>
            AI 음성 재생
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
        />
      </label>

      <p className="sound-controls__note">
        ※ 음악 파일은 추후 연결 예정 · AI 음성은 브라우저 TTS 사용
      </p>

      {/* TODO: 실제 mp3 src 연결 */}
      <audio ref={audioRef} preload="none" />
    </section>
  );
}
