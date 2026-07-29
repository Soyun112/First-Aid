import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { TransportProvider } from './context/TransportContext';
import EntryPage from './pages/EntryPage';
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

function ProtectedStaff({ children }) {
  return (
    <ProtectedRoute>
      <StaffLayout>{children}</StaffLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TransportProvider>
        <BrowserRouter>
          <Routes>
            {/* 입장 (코드 입력) */}
            <Route path="/" element={<EntryPage />} />

            {/* B. 빔 출력 — 별도 창, 인증 없음 */}
            <Route path="/projector" element={<ProjectorPage />} />

            {/* A. 직원 조작 — 인증 필요 */}
            <Route
              path="/input"
              element={
                <ProtectedStaff>
                  <InputPage />
                </ProtectedStaff>
              }
            />
            <Route
              path="/recommend"
              element={
                <ProtectedStaff>
                  <RecommendPage />
                </ProtectedStaff>
              }
            />
            <Route
              path="/playback"
              element={
                <ProtectedStaff>
                  <PlaybackPage />
                </ProtectedStaff>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedStaff>
                  <SettingsPage />
                </ProtectedStaff>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TransportProvider>
    </AuthProvider>
  );
}
