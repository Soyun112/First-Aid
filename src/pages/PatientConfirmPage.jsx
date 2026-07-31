import { useNavigate } from 'react-router-dom';
import { useTransport } from '../context/TransportContext';
import { DEMO_PATIENT } from '../data/demoRequest';

/**
 * 환자 정보 확인 — 데모용 하드코딩 값 (자동으로 뜬 것처럼 표시)
 */
export default function PatientConfirmPage() {
  const navigate = useNavigate();
  const { confirmPatientAndStart } = useTransport();
  const p = DEMO_PATIENT;

  const handleConfirm = () => {
    confirmPatientAndStart(p);
    navigate('/playback');
  };

  return (
    <main className="page page--patient">
      <h1 className="page__title">
        환자 정보 확인
        <span className="page__demo-badge">데모용</span>
      </h1>
      <p className="page__desc">이송 요청과 함께 받은 환자 정보입니다. 확인해 주세요.</p>

      <section className="settings-block" aria-label="환자 정보">
        <dl className="settings-info">
          <div className="settings-info__row">
            <dt>이름</dt>
            <dd>{p.name}</dd>
          </div>
          <div className="settings-info__row">
            <dt>연령대</dt>
            <dd>{p.ageLabel}</dd>
          </div>
          <div className="settings-info__row">
            <dt>출발지</dt>
            <dd>{p.from}</dd>
          </div>
          <div className="settings-info__row">
            <dt>도착지</dt>
            <dd>{p.to}</dd>
          </div>
          <div className="settings-info__row">
            <dt>배드 번호</dt>
            <dd>{p.bed}</dd>
          </div>
        </dl>
        <p className="settings-info__note">데모용 자동 수신 정보입니다. 수정할 수 없습니다.</p>
      </section>

      <div className="page__footer sticky-footer">
        <button type="button" className="btn btn--primary btn--block" onClick={handleConfirm}>
          확인
        </button>
      </div>
    </main>
  );
}
