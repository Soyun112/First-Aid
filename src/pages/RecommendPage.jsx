import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransport } from '../context/TransportContext';

/**
 * AI 추천 확인 화면
 * 추천 조합은 규칙 기반 목업(src/services/recommend.js).
 * Gemini는 이동 중 안심 멘트(messageApi)에만 사용.
 */
export default function RecommendPage() {
  const navigate = useNavigate();
  const { recommendations, runRecommend, selectPlan } = useTransport();
  const [altIndex, setAltIndex] = useState(0);

  useEffect(() => {
    if (!recommendations.length) {
      runRecommend();
    }
  }, [recommendations.length, runRecommend]);

  const list = recommendations.length ? recommendations : [];
  const current = list[Math.min(altIndex, Math.max(0, list.length - 1))] ?? null;
  const hasAlt = list.length > 1;

  const handleStart = () => {
    if (!current) return;
    selectPlan(current);
    navigate('/playback');
  };

  const handleShowAlt = () => {
    setAltIndex((i) => (i + 1) % list.length);
  };

  return (
    <main className="page page--recommend">
      <h1 className="page__title">AI 추천 확인</h1>
      <p className="page__desc">
        입력하신 상황에 맞춰 아래 조합을 제안합니다. 확인 후 이동을 시작해 주세요.
      </p>
      <p className="page__hint">※ 현재는 목업 추천입니다 · 추후 LLM API 연동</p>

      <div className="recommend-confirm">
        {current ? (
          <div className="recommend-confirm__card" role="status">
            <p className="recommend-confirm__eyebrow">추천 조합</p>
            <h2 className="recommend-confirm__title">{current.name}</h2>
            <ul className="recommend-confirm__tags">
              {current.elements.map((el) => (
                <li key={el}>{el}</li>
              ))}
            </ul>
            <p className="recommend-confirm__reason">{current.reason}</p>
          </div>
        ) : (
          <p className="empty-state">추천 결과를 불러오는 중…</p>
        )}

        {hasAlt && (
          <button
            type="button"
            className="btn btn--ghost recommend-confirm__alt"
            onClick={handleShowAlt}
          >
            다른 조합 보기
          </button>
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
