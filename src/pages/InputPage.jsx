import { useNavigate } from 'react-router-dom';
import OptionGroup from '../components/OptionGroup';
import { useTransport } from '../context/TransportContext';
import { AGE_GROUPS, DURATIONS } from '../data/options';

export default function InputPage() {
  const navigate = useNavigate();
  const { input, updateInput, startTransport } = useTransport();

  const handleStart = () => {
    startTransport();
    navigate('/playback');
  };

  return (
    <main className="page page--input">
      <h1 className="page__title">
        환자 상황 입력
        <span className="page__demo-badge">데모용</span>
      </h1>
      <p className="page__desc">담당자가 이동 전 환자 상황을 선택해 주세요.</p>

      <OptionGroup
        label="연령대"
        options={AGE_GROUPS}
        value={input.ageGroup}
        onChange={(v) => updateInput('ageGroup', v)}
      />
      <OptionGroup
        label="이동 시간"
        options={DURATIONS}
        value={input.duration}
        onChange={(v) => updateInput('duration', v)}
      />

      <div className="page__footer sticky-footer">
        <button type="button" className="btn btn--primary btn--block" onClick={handleStart}>
          이동 시작
        </button>
      </div>
    </main>
  );
}
