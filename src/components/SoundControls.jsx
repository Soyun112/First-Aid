import { useEffect, useMemo, useRef, useState } from 'react';
import { useTransport } from '../context/TransportContext';
import { SOUND_TRACKS, VOLUME_MAX } from '../data/options';

/**
 * 사운드 컨트롤 — AI 음성 재생 시 Render 백엔드 → TTS
 */
export default function SoundControls({
  religion,
  initialTrackId,
  includeVoice,
  defaultVolume,
}) {
  const {
    requestAiMessage,
    aiMessageLoading,
    setAiPanelOpen,
  } = useTransport();

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
    setPlaying((p) => !p);
  };

  const handleVoice = async () => {
    if (aiMessageLoading) return;
    setAiPanelOpen(true);
    await requestAiMessage({ speak: true, volume });
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
          <button
            type="button"
            className="btn btn--secondary"
            onClick={handleVoice}
            disabled={aiMessageLoading}
          >
            {aiMessageLoading ? '생성 중…' : 'AI 음성 재생'}
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
        ※ AI 음성 = Render API(Gemini) + 브라우저 TTS · 헤더 말풍선에서 텍스트 확인
      </p>

      <audio ref={audioRef} preload="none" />
    </section>
  );
}
