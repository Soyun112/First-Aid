import { useMemo } from 'react';
import { SOUND_OPTIONS, VOLUME_MAX } from '../data/options';

/**
 * 사운드 선택만 담당 (즉시 재생하지 않음)
 * 실제 재생은 이동 화면의 「시작」 버튼에서 수행
 */
export default function SoundControls({
  trackId,
  onTrackChange,
  soundEnabled,
  onSoundEnabledChange,
  volume,
  onVolumeChange,
}) {
  const tracks = useMemo(() => SOUND_OPTIONS, []);

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

      <div className="sound-controls__tracks" role="radiogroup" aria-label="배경음악 선택">
        {tracks.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={trackId === t.id}
            className={`chip ${trackId === t.id ? 'is-selected' : ''}`}
            onClick={() => onTrackChange?.(t.id)}
            disabled={soundEnabled === false}
          >
            {t.label}
          </button>
        ))}
      </div>

      <label className="sound-controls__volume">
        <span>음량 (최대 {Math.round(VOLUME_MAX * 100)}%)</span>
        <input
          type="range"
          min={0}
          max={VOLUME_MAX}
          step={0.01}
          value={volume}
          onChange={(e) => onVolumeChange?.(Number(e.target.value))}
          disabled={soundEnabled === false}
        />
      </label>

      <p className="sound-controls__note">
        화면 진입 시 안심 멘트가 자동 생성됩니다. 「시작」을 누르면 멘트를 먼저 읽고,
        끝나면 선택한 배경음악이 이어집니다.
      </p>
    </section>
  );
}

/** 초기 트랙 ID — 기본 음악1 */
export function getInitialTrackId(initialTrackId) {
  if (SOUND_OPTIONS.some((t) => t.id === initialTrackId)) return initialTrackId;
  return 'music1';
}
