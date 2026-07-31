/**
 * AI 생성 멘트 확인 패널 — 멘트 텍스트만 표시
 */
export default function AiMessagePanel({ open, onClose, message, loading }) {
  if (!open) return null;

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

        {!loading && message && (
          <p className="ai-panel__badge">
            AI가 이 상황에 맞춰 실시간 생성한 멘트입니다
          </p>
        )}

        <div className="ai-panel__message" aria-live="polite">
          {loading ? (
            <div className="ai-panel__loading">
              <p className="ai-panel__placeholder">멘트를 생성하는 중…</p>
            </div>
          ) : message ? (
            <p className="ai-panel__text">{message}</p>
          ) : (
            <p className="ai-panel__placeholder">
              생성된 멘트가 여기에 표시됩니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
