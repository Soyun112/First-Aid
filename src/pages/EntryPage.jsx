import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function EntryPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/input" replace />;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const result = login(code);
    if (result.ok) {
      navigate('/input');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="entry">
      <div className="entry__card">
        <p className="entry__badge">First Aid</p>
        <h1 className="entry__hospital">삼성병원</h1>
        <p className="entry__subtitle">이송 케어 서비스</p>
        <p className="entry__desc">직원 전용 · 접근 코드를 입력해 주세요</p>

        <form className="entry__form" onSubmit={handleSubmit}>
          <label className="entry__label" htmlFor="access-code">
            접근 코드
          </label>
          <input
            id="access-code"
            className="entry__input"
            type="password"
            inputMode="text"
            autoComplete="off"
            placeholder="코드 입력"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          {error && (
            <p className="entry__error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn--primary btn--block">
            입장하기
          </button>
        </form>
      </div>
    </div>
  );
}
