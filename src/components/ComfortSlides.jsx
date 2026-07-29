import { useEffect, useState } from 'react';
import { COMFORT_SLIDES } from '../data/options';

/**
 * 편안함 이미지 슬라이드
 * variant: "staff" | "projector"
 * TODO: 실제 빔 콘텐츠/이미지 에셋 연동
 */
export default function ComfortSlides({ variant = 'staff' }) {
  const isProjector = variant === 'projector';
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % COMFORT_SLIDES.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const slide = COMFORT_SLIDES[index];

  return (
    <div
      className={`comfort-slides ${isProjector ? 'comfort-slides--projector' : ''}`}
    >
      <div
        className="comfort-slides__canvas"
        style={{ background: slide.color }}
        aria-live="polite"
      >
        <p className="comfort-slides__label">{slide.label}</p>
        {!isProjector && (
          <p className="comfort-slides__sub">편안함 이미지 · 플레이스홀더</p>
        )}
      </div>
      {!isProjector && (
        <div className="comfort-slides__dots" role="tablist" aria-label="슬라이드">
          {COMFORT_SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`comfort-slides__dot ${i === index ? 'is-active' : ''}`}
              aria-label={`${s.label} 보기`}
              aria-selected={i === index}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
