import { useNavigate } from 'react-router-dom';
import OptionGroup from '../components/OptionGroup';
import { useTransport } from '../context/TransportContext';
import {
  AGE_GROUPS,
  ANXIETY_LEVELS,
  DURATIONS,
  RELIGIONS,
  SITUATIONS,
} from '../data/options';

export default function InputPage() {
  const navigate = useNavigate();
  const { input, updateInput, runRecommend } = useTransport();

  const handleRecommend = () => {
    runRecommend();
    navigate('/recommend');
  };

  return (
    <main className="page page--input">
      <h1 className="page__title">환자 상황 입력</h1>
      <p className="page__desc">담당자가 이동 전 환자 상황을 선택해 주세요.</p>

      <OptionGroup
        label="상황"
        options={SITUATIONS}
        value={input.situation}
        onChange={(v) => updateInput('situation', v)}
      />
      <OptionGroup
        label="연령대"
        options={AGE_GROUPS}
        value={input.ageGroup}
        onChange={(v) => updateInput('ageGroup', v)}
      />
      <OptionGroup
        label="종교"
        options={RELIGIONS}
        value={input.religion}
        onChange={(v) => updateInput('religion', v)}
        optional
      />
      <OptionGroup
        label="이동 시간"
        options={DURATIONS}
        value={input.duration}
        onChange={(v) => updateInput('duration', v)}
      />
      <OptionGroup
        label="불안도"
        options={ANXIETY_LEVELS}
        value={input.anxiety}
        onChange={(v) => updateInput('anxiety', v)}
        optional
      />

      <div className="page__footer sticky-footer">
        <button type="button" className="btn btn--primary btn--block" onClick={handleRecommend}>
          AI 추천 받기
        </button>
      </div>
    </main>
  );
}
