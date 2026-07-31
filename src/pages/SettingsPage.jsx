import { VOLUME_DEFAULT, VOLUME_MAX } from '../data/options';
import { useTransport } from '../context/TransportContext';

/**
 * 설정 · 정보
 */
export default function SettingsPage() {
  const { defaultVolume, setDefaultVolume, patient } = useTransport();

  return (
    <main className="page page--settings">
      <h1 className="page__title">설정 · 정보</h1>

      <section className="settings-block" aria-label="현재 이송 정보">
        <h2>현재 이송 정보</h2>
        {patient ? (
          <>
            <dl className="settings-info">
              <div className="settings-info__row">
                <dt>이름</dt>
                <dd>{patient.name}</dd>
              </div>
              <div className="settings-info__row">
                <dt>연령대</dt>
                <dd>{patient.ageLabel}</dd>
              </div>
              <div className="settings-info__row">
                <dt>출발지</dt>
                <dd>{patient.from}</dd>
              </div>
              <div className="settings-info__row">
                <dt>도착지</dt>
                <dd>{patient.to}</dd>
              </div>
              <div className="settings-info__row">
                <dt>배드 번호</dt>
                <dd>{patient.bed}</dd>
              </div>
            </dl>
            <p className="settings-info__note">환자 정보 확인에서 확정한 값입니다.</p>
          </>
        ) : (
          <p className="settings-info__note">아직 확정된 이송 정보가 없습니다.</p>
        )}
      </section>

      <section className="settings-block">
        <h2>음량 기본값</h2>
        <p className="page__hint">
          병원 환경을 위해 상한은 {Math.round(VOLUME_MAX * 100)}%입니다.
          (기본 {Math.round(VOLUME_DEFAULT * 100)}%)
        </p>
        <label className="sound-controls__volume">
          <span>기본 음량 {Math.round(defaultVolume * 100)}%</span>
          <input
            type="range"
            min={0}
            max={VOLUME_MAX}
            step={0.01}
            value={defaultVolume}
            onChange={(e) => setDefaultVolume(Number(e.target.value))}
          />
        </label>
      </section>

      <section className="settings-block">
        <h2>First Aid란?</h2>
        <p>
          병원 이송 중 환자에게 AI가 예상 이동시간(ETA)을 음성으로 안내하고,
          잔잔한 음악을 함께 제공해 불안과 체감 시간을 줄이는 케어 서비스입니다.
        </p>
      </section>
    </main>
  );
}
