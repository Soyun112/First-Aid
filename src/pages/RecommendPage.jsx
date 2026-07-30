import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RecommendCard from '../components/RecommendCard';
import { useTransport } from '../context/TransportContext';

/**
 * AI 추천 확인 화면
 * 추천 조합은 규칙 기반 목업(src/services/recommend.js).
 * Gemini는 이동 중 안심 멘트(messageApi)에만 사용.
 */
export default function RecommendPage() {
  const navigate = useNavigate();
  const { recommendations, runRecommend, selectPlan, selectedPlan } =
    useTransport();
  const [picked, setPicked] = useState(selectedPlan?.id ?? null);

  useEffect(() => {
    if (!recommendations.length) {
      runRecommend();
    }
  }, [recommendations.length, runRecommend]);

  const list = recommendations.length ? recommendations : [];
  const current =
    list.find((p) => p.id === picked) ?? list[0] ?? null;

  const handleStart = () => {
    if (!current) return;
    selectPlan(current);
    navigate('/playback');
  };

  return (
    <main className="page page--recommend">
      <h1 className="page__title">AI 추천 확인</h1>
      <p className="page__desc">
        입력하신 상황에 맞는 빔 콘텐츠 + 사운드 조합입니다. 카드를 고른 뒤 시작해 주세요.
      </p>
      <p className="page__hint">※ 현재는 목업 추천입니다 · 추후 LLM API 연동</p>

      <div className="recommend-list">
        {list.map((plan) => (
          <RecommendCard
            key={plan.id}
            plan={plan}
            selected={(picked ?? list[0]?.id) === plan.id}
            onSelect={(p) => setPicked(p.id)}
          />
        ))}
        {!list.length && (
          <p className="empty-state">추천 결과를 불러오는 중…</p>
        )}
      </div>

      <div className="page__footer sticky-footer sticky-footer--row">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => navigate('/input')}
        >
          다시 선택
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleStart}
          disabled={!current}
        >
          이걸로 시작
        </button>
      </div>
    </main>
  );
}
