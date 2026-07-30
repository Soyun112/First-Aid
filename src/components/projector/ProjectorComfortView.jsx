import { useEffect, useRef, useState } from 'react';
import { loadComfortArtworks } from '../../services/metArt';

const SLIDE_MS = 8000;
const FADE_MS = 1600;
const LOADING_BG = '#1a2830';

/**
 * The Met 명화 크로스페이드
 * variant:
 *  - "fullscreen" — 단독 편안함 모드 (기존)
 *  - "background" — /projector 데모 배경 (커버 + 어두운 오버레이 + 구석 출처)
 */
export default function ProjectorComfortView({ variant = 'fullscreen' }) {
  const isBackground = variant === 'background';
  const [artworks, setArtworks] = useState([]);
  const [status, setStatus] = useState('loading');
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

  const rootClass = [
    'proj-comfort',
    isBackground ? 'proj-comfort--background' : '',
    status === 'loading' || status === 'error' ? 'proj-comfort--loading' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (status === 'loading') {
    return (
      <div className={rootClass} style={{ background: LOADING_BG }} aria-hidden={isBackground}>
        {!isBackground && (
          <p className="proj-comfort__loading-text">작품을 불러오는 중…</p>
        )}
      </div>
    );
  }

  if (status === 'error' || !artworks.length) {
    return (
      <div className={rootClass} style={{ background: LOADING_BG }} aria-hidden={isBackground}>
        {!isBackground && (
          <p className="proj-comfort__loading-text">잠시만 기다려 주세요</p>
        )}
      </div>
    );
  }

  const art0 = artworks[indices[0]];
  const art1 = artworks[indices[1]];
  const current = showFirst ? art0 : art1;

  return (
    <div className={rootClass} aria-hidden={isBackground}>
      <div
        className={`proj-comfort__layer ${showFirst ? 'is-visible' : ''}`}
        style={{ transitionDuration: `${FADE_MS}ms` }}
      >
        <img
          className="proj-comfort__image"
          src={art0.imageUrl}
          alt={isBackground ? '' : art0.title}
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
          alt={isBackground ? '' : art1.title}
          draggable={false}
        />
      </div>

      {isBackground ? (
        <>
          <div className="proj-comfort__dim" />
          <p className="proj-comfort__credit-corner">
            {current.title}
            {current.artist ? ` · ${current.artist}` : ''}
            <span> · The Metropolitan Museum of Art</span>
          </p>
        </>
      ) : (
        <footer className="proj-comfort__caption">
          <p className="proj-comfort__title">{current.title}</p>
          <p className="proj-comfort__artist">{current.artist}</p>
          <p className="proj-comfort__credit">The Metropolitan Museum of Art</p>
        </footer>
      )}
    </div>
  );
}
