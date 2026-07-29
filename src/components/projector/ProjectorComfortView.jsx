import { useEffect, useRef, useState } from 'react';
import { loadComfortArtworks } from '../../services/metArt';

const SLIDE_MS = 8000;
const FADE_MS = 1600;
const LOADING_BG = '#1a2830';

/**
 * 빔 출력 — 편안함 이미지 모드
 * The Met 공개 도메인 작품을 캐시 후 크로스페이드 순환
 */
export default function ProjectorComfortView() {
  const [artworks, setArtworks] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const indexRef = useRef(0);
  const [indices, setIndices] = useState([0, 1]);
  const [showFirst, setShowFirst] = useState(true);

  useEffect(() => {
    let cancelled = false;

    loadComfortArtworks().then((list) => {
      if (cancelled) return;
      if (list.length >= 2) {
        setArtworks(list);
        setIndices([0, 1 % list.length]);
        indexRef.current = 0;
        setStatus('ready');
      } else if (list.length === 1) {
        setArtworks(list);
        setIndices([0, 0]);
        setStatus('ready');
      } else {
        setStatus('error');
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // 다음 이미지 프리로드
  useEffect(() => {
    if (status !== 'ready' || artworks.length < 2) return undefined;
    const next = artworks[(indexRef.current + 1) % artworks.length];
    if (!next?.imageUrl) return undefined;
    const img = new Image();
    img.src = next.imageUrl;
    return undefined;
  }, [status, artworks, showFirst]);

  useEffect(() => {
    if (status !== 'ready' || artworks.length < 2) return undefined;

    const id = setInterval(() => {
      const next = (indexRef.current + 1) % artworks.length;
      indexRef.current = next;

      // 다음 다음 이미지 프리로드
      const preload = artworks[(next + 1) % artworks.length];
      if (preload?.imageUrl) {
        const img = new Image();
        img.src = preload.imageUrl;
      }

      setShowFirst((visible) => {
        setIndices((prev) => {
          if (visible) return [prev[0], next];
          return [next, prev[1]];
        });
        return !visible;
      });
    }, SLIDE_MS);

    return () => clearInterval(id);
  }, [status, artworks]);

  if (status === 'loading') {
    return (
      <div className="proj-comfort proj-comfort--loading" style={{ background: LOADING_BG }}>
        <p className="proj-comfort__loading-text">작품을 불러오는 중…</p>
      </div>
    );
  }

  if (status === 'error' || !artworks.length) {
    return (
      <div className="proj-comfort proj-comfort--loading" style={{ background: LOADING_BG }}>
        <p className="proj-comfort__loading-text">잠시만 기다려 주세요</p>
      </div>
    );
  }

  const art0 = artworks[indices[0]];
  const art1 = artworks[indices[1]];
  const current = showFirst ? art0 : art1;

  return (
    <div className="proj-comfort" aria-live="polite">
      <div
        className={`proj-comfort__layer ${showFirst ? 'is-visible' : ''}`}
        style={{ transitionDuration: `${FADE_MS}ms` }}
      >
        <img
          className="proj-comfort__image"
          src={art0.imageUrl}
          alt={art0.title}
          draggable={false}
        />
      </div>
      <div
        className={`proj-comfort__layer ${!showFirst ? 'is-visible' : ''}`}
        style={{ transitionDuration: `${FADE_MS}ms` }}
      >
        <img
          className="proj-comfort__image"
          src={art1.imageUrl}
          alt={art1.title}
          draggable={false}
        />
      </div>

      <footer className="proj-comfort__caption">
        <p className="proj-comfort__title">{current.title}</p>
        <p className="proj-comfort__artist">{current.artist}</p>
        <p className="proj-comfort__credit">The Metropolitan Museum of Art</p>
      </footer>
    </div>
  );
}
