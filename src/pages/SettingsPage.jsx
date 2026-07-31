import { useEffect, useMemo, useState } from 'react';
import { VOLUME_DEFAULT, VOLUME_MAX } from '../data/options';
import { useTransport } from '../context/TransportContext';
import { fetchEtaHourly } from '../services/etaApi';

const HOURLY_ERROR = '예측 데이터를 불러올 수 없습니다';

/**
 * 설정 · 정보
 */
export default function SettingsPage() {
  const {
    defaultVolume,
    setDefaultVolume,
    patient,
    etaMin,
    etaSource,
  } = useTransport();

  const [hourlyItems, setHourlyItems] = useState(null);
  const [hourlyStatus, setHourlyStatus] = useState('idle'); // idle | loading | ready | error | empty

  useEffect(() => {
    if (
      !patient ||
      patient.startFloor == null ||
      patient.destinationFloor == null ||
      !patient.destination
    ) {
      setHourlyItems(null);
      setHourlyStatus('empty');
      return undefined;
    }

    let cancelled = false;
    setHourlyStatus('loading');
    setHourlyItems(null);

    void (async () => {
      try {
        const items = await fetchEtaHourly({
          startFloor: patient.startFloor,
          destination: patient.destination,
          destinationFloor: patient.destinationFloor,
        });
        if (cancelled) return;
        setHourlyItems(items);
        setHourlyStatus('ready');
      } catch (err) {
        console.warn('predict_hourly failed', err);
        if (cancelled) return;
        setHourlyItems(null);
        setHourlyStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [patient]);

  const maxEta = useMemo(() => {
    if (!hourlyItems?.length) return 1;
    return Math.max(...hourlyItems.map((r) => r.eta_min), 1);
  }, [hourlyItems]);

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
              <div className="settings-info__row">
                <dt>예상 이동시간</dt>
                <dd>
                  {etaMin != null
                    ? `약 ${etaMin}분${
                        etaSource === 'fallback' ? ' (추정)' : ''
                      }`
                    : '확인 중…'}
                </dd>
              </div>
            </dl>
            <p className="settings-info__note">
              환자 정보 확인에서 확정한 값이며, ETA는 이동 중 화면 진입 시 AI가
              예측합니다.
            </p>
          </>
        ) : (
          <p className="settings-info__note">아직 확정된 이송 정보가 없습니다.</p>
        )}
      </section>

      <section className="settings-block" aria-label="예측 데이터 보기">
        <h2>예측 데이터 보기</h2>

        {hourlyStatus === 'empty' && (
          <p className="settings-info__note">
            이송 정보가 확정되면 시간대별 예상 이동시간을 볼 수 있습니다.
          </p>
        )}

        {hourlyStatus === 'loading' && (
          <p className="settings-info__note">시간대별 예측을 불러오는 중…</p>
        )}

        {hourlyStatus === 'error' && (
          <p className="eta-hourly__error">{HOURLY_ERROR}</p>
        )}

        {hourlyStatus === 'ready' && hourlyItems && (
          <>
            <p className="eta-hourly__caption">
              가로축 시간대 · 세로축 ETA(분) — 붐비는 시간대일수록 막대가 길어집니다
            </p>
            <div
              className="eta-hourly-chart"
              role="img"
              aria-label="시간대별 예상 이동시간 막대그래프"
            >
              {hourlyItems.map((row) => {
                const heightPct = Math.round((row.eta_min / maxEta) * 100);
                const busy = row.eta_min >= maxEta - 1;
                return (
                  <div key={row.hour} className="eta-hourly-chart__col">
                    <span className="eta-hourly-chart__value">{row.eta_min}</span>
                    <div className="eta-hourly-chart__track">
                      <div
                        className={`eta-hourly-chart__bar${
                          busy ? ' eta-hourly-chart__bar--busy' : ''
                        }`}
                        style={{ height: `${Math.max(heightPct, 8)}%` }}
                        title={`${row.hour}시 · ${row.eta_min}분`}
                      />
                    </div>
                    <span className="eta-hourly-chart__hour">{row.hour}</span>
                  </div>
                );
              })}
            </div>

            <div className="eta-hourly-table-wrap">
              <table className="eta-hourly-table">
                <caption className="visually-hidden">
                  시간대별 예상 이동시간
                </caption>
                <thead>
                  <tr>
                    <th scope="col">시간</th>
                    <th scope="col">ETA(분)</th>
                    <th scope="col">혼잡(건)</th>
                  </tr>
                </thead>
                <tbody>
                  {hourlyItems.map((row) => (
                    <tr key={`t-${row.hour}`}>
                      <td>{row.hour}시</td>
                      <td>{row.eta_min}</td>
                      <td>{row.transport_count_now}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="eta-hourly__note">
              채혈실 시간대별 환자 분포를 참고해 생성한 데이터로 학습한 예측
              결과입니다. 현재는 개념 증명(합성 데이터) 단계이며, 실제 이송
              로그가 쌓이면 재학습됩니다.
            </p>
          </>
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
