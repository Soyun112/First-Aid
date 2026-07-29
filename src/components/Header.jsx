import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const { pathname } = useLocation();
  const isPlayback = pathname.startsWith('/playback');

  return (
    <header className={`app-header ${isPlayback ? 'app-header--compact' : ''}`}>
      <div className="app-header__brand">
        <Link to="/input" className="app-header__logo">
          삼성병원
        </Link>
        {!isPlayback && (
          <p className="app-header__slogan">First Aid · 이송 케어</p>
        )}
      </div>
      <nav className="app-header__nav" aria-label="주요 메뉴">
        <Link
          to="/settings"
          className={`app-header__link ${pathname === '/settings' ? 'is-active' : ''}`}
        >
          설정
        </Link>
      </nav>
    </header>
  );
}
