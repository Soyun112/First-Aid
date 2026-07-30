import { useMemo } from 'react';
import { SOUND_OPTIONS, VOLUME_MAX } from '../data/options';

/**
 * 사운드 선택만 담당 (즉시 재생하지 않음)
 * 실제 재생은 이동 화면의 「시작」 버튼에서 수행
 */
export default function SoundControls({
  religion,
  trackId,
  onTrackChange,
  soundEnabled,
  onSoundEnabledChange,
  volume,
  onVolumeChange,
}) {
  const hasReligion = religion && religion !== 'none';
  const tracks = useMemo(
    () =>
      SOUND_OPTIONS.filter(
        (t) => t.id === 'calm' || (t.id === 'religious' && hasReligion),
      ),
    [hasReligion],
  );

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
        트랙만 선택한 뒤 아래 「시작」을 누르면 배경음악과 AI 멘트가 함께 재생됩니다.
      </p>
    </section>
  );
}

/** 초기 트랙 ID 계산용 헬퍼 */
export function getInitialTrackId(initialTrackId, religion) {
  const hasReligion = religion && religion !== 'none';
  if (initialTrackId === 'religious' && hasReligion) return 'religious';
  if (initialTrackId === 'calm') return 'calm';
  return 'calm';
}
