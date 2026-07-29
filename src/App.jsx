import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import { TransportProvider } from './context/TransportContext';
import InputPage from './pages/InputPage';
import PlaybackPage from './pages/PlaybackPage';
import ProjectorPage from './pages/ProjectorPage';
import RecommendPage from './pages/RecommendPage';
import SettingsPage from './pages/SettingsPage';

function StaffLayout({ children }) {
  return (
    <div className="app-shell">
      <Header />
      <div className="app-shell__content">{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <TransportProvider>
      <BrowserRouter>
        <Routes>
          {/* B. 빔 출력 화면 — 헤더/조작 UI 없음 */}
          <Route path="/projector" element={<ProjectorPage />} />

          {/* A. 직원 조작 화면 */}
          <Route
            path="/"
            element={
              <StaffLayout>
                <InputPage />
              </StaffLayout>
            }
          />
          <Route
            path="/recommend"
            element={
              <StaffLayout>
                <RecommendPage />
              </StaffLayout>
            }
          />
          <Route
            path="/playback"
            element={
              <StaffLayout>
                <PlaybackPage />
              </StaffLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <StaffLayout>
                <SettingsPage />
              </StaffLayout>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TransportProvider>
  );
}
