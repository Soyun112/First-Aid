import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { TransportProvider } from './context/TransportContext';
import EntryPage from './pages/EntryPage';
import InputPage from './pages/InputPage';
import PlaybackPage from './pages/PlaybackPage';
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
            <Route path="/" element={<EntryPage />} />
            <Route
              path="/input"
              element={
                <ProtectedStaff>
                  <InputPage />
                </ProtectedStaff>
              }
            />
            <Route path="/recommend" element={<Navigate to="/input" replace />} />
            <Route path="/projector" element={<Navigate to="/" replace />} />
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
