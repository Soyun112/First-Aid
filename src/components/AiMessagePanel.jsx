import { summarizeInput } from '../utils/inputLabels';

/**
 * AI 생성 멘트 확인 패널 (발표 데모용)
 */
export default function AiMessagePanel({ open, onClose, message, input, source, loading }) {
  if (!open) return null;

  const summary = input ? summarizeInput(input) : null;

  return (
    <div className="ai-panel-backdrop" role="presentation" onClick={onClose}>
      <div
        className="ai-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-panel-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ai-panel__head">
          <h2 id="ai-panel-title" className="ai-panel__title">
            AI 생성 멘트
          </h2>
          <button
            type="button"
            className="ai-panel__close"
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </header>

        {source === 'api' && message && !loading && (
          <p className="ai-panel__badge">
            AI가 이 상황에 맞춰 실시간 생성한 멘트입니다
          </p>
        )}

        <div className="ai-panel__message" aria-live="polite">
          {loading ? (
            <div className="ai-panel__loading">
              <p className="ai-panel__placeholder">Gemini가 멘트를 생성하는 중…</p>
              <p className="ai-panel__loading-sub">
                서버가 잠들어 있었다면 30초~1분 정도 걸릴 수 있어요
              </p>
            </div>
          ) : message ? (
            <p className="ai-panel__text">{message}</p>
          ) : (
            <p className="ai-panel__placeholder">
              「AI 음성 재생」을 누르면 생성된 멘트가 여기에 표시됩니다.
            </p>
          )}
        </div>

        {summary && (
          <dl className="ai-panel__meta">
            <div>
              <dt>연령</dt>
              <dd>{summary.age}</dd>
            </div>
            <div>
              <dt>이동 시간</dt>
              <dd>{summary.duration}</dd>
            </div>
          </dl>
        )}

        {source === 'fallback' && message && !loading && (
          <p className="ai-panel__note">
            ※ API 연결이 안 되어 기본 멘트를 표시 중입니다. VITE_API_URL과
            Render CORS 설정을 확인해 주세요.
          </p>
        )}
      </div>
    </div>
  );
}
