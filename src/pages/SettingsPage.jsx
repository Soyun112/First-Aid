import { VOLUME_DEFAULT, VOLUME_MAX } from '../data/options';
import { useTransport } from '../context/TransportContext';

/**
 * 설정/정보 — 프로토타입용 자리
 */
export default function SettingsPage() {
  const { defaultVolume, setDefaultVolume } = useTransport();

  return (
    <main className="page page--settings">
      <h1 className="page__title">설정 · 정보</h1>

      <section className="settings-block">
        <h2>First Aid란?</h2>
        <p>
          병원 이송 중 환자가 천장만 보며 느끼는 불안을 줄이기 위해,
          천장 빔 콘텐츠와 사운드를 상황별로 맞춰 재생하는 케어 서비스입니다.
        </p>
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
        <h2>화면 구성</h2>
        <ul className="settings-list">
          <li>직원 조작: `/` → 추천 → `/playback` (리모컨)</li>
          <li>빔 출력: `/projector` (천장 투사 시뮬레이션, 별도 창)</li>
          <li>두 창은 BroadcastChannel + localStorage로 동기화됩니다.</li>
        </ul>
      </section>

      <section className="settings-block">
        <h2>프로토타입 안내</h2>
        <ul className="settings-list">
          <li>AI 추천 · 지도 · 음악은 목업/시뮬레이션입니다.</li>
          <li>AI 음성은 브라우저 Web Speech API(ko-KR)를 사용합니다.</li>
          <li>추후 실제 API 연동 자리는 코드에 TODO로 표시되어 있습니다.</li>
        </ul>
      </section>
    </main>
  );
}
