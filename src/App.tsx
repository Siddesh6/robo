import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ConnectionDialog from './components/ui/ConnectionDialog';
import LoadingSpinner from './components/ui/LoadingSpinner';
import { useAppStore } from './store/useAppStore';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CameraPage = lazy(() => import('./pages/Camera'));
const RobotControlPage = lazy(() => import('./pages/Controls'));
const SensorsPage = lazy(() => import('./pages/Sensors'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const LogsPage = lazy(() => import('./pages/Logs'));

const App: React.FC = () => {
  const { status, settings, connect } = useAppStore();

  // Try auto-reconnect on boot
  useEffect(() => {
    if (settings.reconnectAuto && settings.ip) {
      connect();
    }
  }, []);

  // Update theme class on mount/theme-change
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('cyberpunk', 'neon-blue');
    if (settings.theme === 'cyberpunk') {
      root.classList.add('cyberpunk');
    } else if (settings.theme === 'neon-blue') {
      root.classList.add('neon-blue');
    }
  }, [settings.theme]);

  return (
    <Router>
      <div className="min-h-screen text-slate-100 flex flex-col">
        {/* Connection overlay when disconnected */}
        {status === 'disconnected' && <ConnectionDialog />}

        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center bg-dark-bg min-h-screen">
            <LoadingSpinner size="lg" label="Loading RoboCore Lite..." />
          </div>
        }>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="camera" element={<CameraPage />} />
              <Route path="controls" element={<RobotControlPage />} />
              <Route path="sensors" element={<SensorsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="logs" element={<LogsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
};

export default App;
