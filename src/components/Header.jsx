import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const { pathname } = useLocation();
  const isPlayback = pathname.startsWith('/playback');

  return (
    <header className={`app-header ${isPlayback ? 'app-header--compact' : ''}`}>
      <div className="app-header__brand">
        <Link to="/" className="app-header__logo">
          First Aid
        </Link>
        {!isPlayback && (
          <p className="app-header__slogan">문제 해결의 응급처치</p>
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
