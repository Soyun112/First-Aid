import { useNavigate } from 'react-router-dom';
import { DEMO_TRANSPORT_REQUEST } from '../data/demoRequest';

/**
 * 이송 요청 알림 — 데모용 더미 알림 1건
 */
export default function TransportAlertPage() {
  const navigate = useNavigate();
  const req = DEMO_TRANSPORT_REQUEST;

  return (
    <main className="page page--alert">
      <h1 className="page__title">
        이송 요청 알림
        <span className="page__demo-badge">데모용</span>
      </h1>
      <p className="page__desc">수락할 이송 요청을 확인해 주세요.</p>

      <article className="alert-card" aria-label="이송 요청">
        <p className="alert-card__eyebrow">{req.title}</p>
        <h2 className="alert-card__route">
          <span>{req.from}</span>
          <span className="alert-card__arrow" aria-hidden="true">
            →
          </span>
          <span>{req.to}</span>
        </h2>
        <p className="alert-card__summary">
          {req.summary} / {req.title}
        </p>
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={() => navigate('/patient')}
        >
          수락
        </button>
      </article>
    </main>
  );
}
