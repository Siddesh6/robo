import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import { FiCpu, FiWifi, FiGlobe, FiAlertCircle } from 'react-icons/fi';

const ConnectionDialog: React.FC = () => {
  const { settings, status, errorMsg, connect } = useAppStore();
  const [ip, setIp] = useState(settings.ip);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateIp = (value: string): boolean => {
    if (value.toLowerCase() === 'mock' || value.toLowerCase() === 'simulator') {
      return true;
    }
    // Simple IP validation regex
    const pattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    return pattern.test(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanIp = ip.trim();
    if (!cleanIp) {
      setError('IP address cannot be empty');
      return;
    }

    if (!validateIp(cleanIp)) {
      setError('Please enter a valid IP (e.g., 192.168.1.120) or "mock"');
      return;
    }

    setLoading(true);
    const success = await connect(cleanIp);
    setLoading(false);
    if (!success) {
      setError('Could not connect. Ensure ESP32-CAM is on and IP is correct.');
    }
  };

  const handleStartMock = () => {
    connect('mock');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4">
      <div className="w-full max-w-md glass rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/20 blur-3xl pointer-events-none rounded-full" />
        
        <div className="p-8 relative">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-3xl animate-pulse-slow">
              <FiCpu />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            RoboCore Lite
          </h2>
          <p className="text-slate-400 text-sm text-center mb-8">
            Connect to your ESP32-CAM Robot Controller over Wi-Fi
          </p>

          {status === 'connecting' || loading ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <LoadingSpinner size="lg" />
              <p className="text-sm font-medium text-slate-300">Establishing connection to {ip}...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Robot IP Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <FiGlobe />
                  </div>
                  <input
                    type="text"
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    placeholder="e.g. 192.168.1.120"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-mono"
                  />
                </div>
                <p className="text-slate-500 text-[11px] mt-1.5 flex items-center gap-1">
                  <FiWifi /> Make sure your device is on the same local network.
                </p>
              </div>

              {(error || errorMsg) && (
                <div className="flex items-center space-x-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                  <FiAlertCircle className="flex-shrink-0 text-base" />
                  <span>{error || errorMsg}</span>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button type="submit" size="lg" fullWidth>
                  Connect Controller
                </Button>
                
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/5"></div>
                  <span className="flex-shrink mx-4 text-slate-500 text-xs font-semibold uppercase tracking-wider">or</span>
                  <div className="flex-grow border-t border-white/5"></div>
                </div>

                <Button 
                  type="button" 
                  variant="glass" 
                  onClick={handleStartMock} 
                  fullWidth
                >
                  Launch Simulator Mode
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionDialog;
