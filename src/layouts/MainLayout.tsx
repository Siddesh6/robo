import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import NavigationBar from '../components/navigation/NavigationBar';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import { useAppStore } from '../store/useAppStore';
import { 
  FiBattery, 
  FiWifi, 
  FiAlertOctagon, 
  FiZapOff,
  FiClock,
  FiSettings,
  FiActivity,
  FiPlayCircle
} from 'react-icons/fi';

const MainLayout: React.FC = () => {
  const { status, isMockMode, telemetry, robot, settings, uptimeSeconds, triggerEmergencyStop } = useAppStore();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper for battery status color/icon
  const getBatteryColor = (voltage: number) => {
    if (voltage >= 12.0) return 'text-accent-emerald';
    if (voltage >= 11.4) return 'text-accent-amber';
    return 'text-accent-rose animate-pulse';
  };

  // Helper to map Wi-Fi RSSI to signal bars/color
  const getWifiSignal = (rssi: number) => {
    if (rssi >= -50) return { label: 'Excellent', color: 'text-accent-emerald' };
    if (rssi >= -65) return { label: 'Good', color: 'text-primary-light' };
    if (rssi >= -75) return { label: 'Fair', color: 'text-accent-amber' };
    return { label: 'Poor', color: 'text-accent-rose animate-pulse' };
  };

  const wifiInfo = getWifiSignal(telemetry.wifi);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const batteryPercent = Math.min(100, Math.max(0, Math.round(((telemetry.battery - 11.0) / 1.6) * 100)));

  return (
    <div className="min-h-screen flex bg-dark-bg text-slate-100">
      {/* Sidebar for desktop */}
      <Sidebar />

      {/* Main viewport */}
      <div className="flex-1 flex flex-col md:pl-64 pb-16 md:pb-0">
        
        {/* Top Header */}
        <header className="h-16 px-4 md:px-6 border-b border-white/5 bg-slate-900/40 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 gap-4">
          
          {/* Logo & Connection Info */}
          <div className="flex items-center space-x-3.5">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-xl">
                <FiPlayCircle className="animate-pulse" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-extrabold text-sm text-slate-100 leading-none">RoboCore</h1>
                <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">ESP32-CAM Robot</span>
              </div>
            </div>

            {/* Connection Capsule Badge */}
            <div className="flex items-center space-x-2 bg-slate-900/60 p-1 rounded-xl border border-white/5">
              <StatusBadge status={status} isMockMode={isMockMode} />
              {status === 'connected' && (
                <div className="text-left px-2 border-l border-white/10 hidden lg:block">
                  <div className="text-[10px] font-extrabold text-slate-200 leading-none">{settings.name}</div>
                  <div className="text-[8px] font-mono text-slate-500 mt-0.5">{settings.ip}</div>
                </div>
              )}
            </div>
          </div>

          {/* Quick status bar metrics */}
          <div className="flex items-center space-x-2.5 md:space-x-3.5">
            
            {/* Battery Indicator */}
            {status === 'connected' && (
              <div className="flex items-center space-x-2 bg-slate-900/40 border border-white/5 p-1.5 px-2 rounded-xl text-xs font-semibold">
                <FiBattery className={`text-base ${getBatteryColor(telemetry.battery)}`} />
                <div className="text-left leading-none">
                  <div className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold">Battery</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-xs font-extrabold">{telemetry.battery.toFixed(1)}V</span>
                    <span className="px-1 text-[8px] bg-accent-emerald/10 text-accent-emerald rounded font-bold border border-accent-emerald/15">{batteryPercent}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* WiFi Indicator */}
            {status === 'connected' && (
              <div className="flex items-center space-x-2 bg-slate-900/40 border border-white/5 p-1.5 px-2 rounded-xl text-xs font-semibold">
                <FiWifi className={`text-base ${wifiInfo.color}`} />
                <div className="text-left leading-none">
                  <div className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold">WiFi</div>
                  <div className="font-mono text-xs font-extrabold mt-0.5">{telemetry.wifi} dBm</div>
                </div>
              </div>
            )}

            {/* Speed indicator */}
            {status === 'connected' && (
              <div className="flex items-center space-x-2 bg-slate-900/40 border border-white/5 p-1.5 px-2 rounded-xl text-xs font-semibold">
                <FiActivity className="text-base text-primary-light animate-pulse" />
                <div className="text-left leading-none">
                  <div className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold">Speed</div>
                  <div className="font-mono text-xs font-extrabold mt-0.5">{((robot.speed / 100) * 0.9).toFixed(2)} m/s</div>
                </div>
              </div>
            )}

            {/* Time / Uptime Clock */}
            <div className="flex items-center space-x-2 bg-slate-900/40 border border-white/5 p-1.5 px-2 rounded-xl text-xs font-semibold hidden md:flex">
              <FiClock className="text-base text-slate-400" />
              <div className="text-left leading-none">
                <div className="font-mono text-xs font-extrabold text-slate-300">{currentTime}</div>
                <div className="text-[8px] text-slate-500 mt-0.5 font-bold uppercase">Uptime: {formatUptime(uptimeSeconds)}</div>
              </div>
            </div>

            {/* Quick Actions (Emergency Lock & Settings Gear) */}
            {status === 'connected' && (
              <Button
                variant={robot.isEmergencyStopped ? 'secondary' : 'danger'}
                size="sm"
                onClick={triggerEmergencyStop}
                className={`flex items-center space-x-1.5 h-8 font-bold ${
                  robot.isEmergencyStopped 
                    ? 'border-accent-rose/40 text-accent-rose animate-pulse' 
                    : ''
                }`}
              >
                {robot.isEmergencyStopped ? (
                  <>
                    <FiZapOff className="text-sm" />
                    <span>LOCKED</span>
                  </>
                ) : (
                  <>
                    <FiAlertOctagon className="text-sm animate-bounce" />
                    <span>ESTOP</span>
                  </>
                )}
              </Button>
            )}

            <button 
              onClick={() => navigate('/settings')}
              className="p-2 bg-slate-900/60 border border-white/5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all flex items-center justify-center"
              aria-label="Settings"
            >
              <FiSettings className="text-sm" />
            </button>
          </div>
        </header>

        {/* Dashboard/Page content */}
        <main className="flex-grow p-4 md:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {robot.isEmergencyStopped && (
            <div className="mb-6 p-4 bg-accent-rose/10 border border-accent-rose/20 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3 text-accent-rose">
                <FiAlertOctagon className="text-2xl flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Emergency Stop Active</h4>
                  <p className="text-xs text-slate-400">All drive motors are disabled. Clear the lock in settings or reconnect the controller.</p>
                </div>
              </div>
            </div>
          )}
          
          <Outlet />
        </main>

        {/* Navigation bottom bar for mobile */}
        <NavigationBar />
      </div>
    </div>
  );
};

export default MainLayout;
