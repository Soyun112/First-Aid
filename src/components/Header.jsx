import { Link, useLocation } from 'react-router-dom';
import { useTransport } from '../context/TransportContext';
import AiMessagePanel from './AiMessagePanel';

export default function Header() {
  const { pathname } = useLocation();
  const isPlayback = pathname.startsWith('/playback');
  const {
    aiMessage,
    aiMessageSource,
    aiMessageLoading,
    aiPanelOpen,
    setAiPanelOpen,
    requestAiMessage,
    input,
  } = useTransport();

  const handleOpenPanel = async () => {
    setAiPanelOpen(true);
    if (!aiMessageLoading) {
      await requestAiMessage({ speak: false });
    }
  };

  return (
    <>
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
          <button
            type="button"
            className={`app-header__icon-btn ${aiMessage ? 'has-message' : ''}`}
            onClick={handleOpenPanel}
            aria-label="AI 생성 멘트 확인"
            title="AI 생성 멘트 확인"
          >
            <span className="app-header__icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4 3.2V15H7.5A2.5 2.5 0 0 1 5 12.5v-7Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
          <Link
            to="/settings"
            className={`app-header__link ${pathname === '/settings' ? 'is-active' : ''}`}
          >
            설정
          </Link>
        </nav>
      </header>

      <AiMessagePanel
        open={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
        message={aiMessage}
        input={input}
        source={aiMessageSource}
        loading={aiMessageLoading}
      />
    </>
  );
}
