import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import type { CameraResolution, RobotTheme } from '../types';
import { 
  FiSave, 
  FiCheckCircle, 
  FiZap, 
  FiRefreshCw, 
  FiUnlock 
} from 'react-icons/fi';

const SettingsPage: React.FC = () => {
  const { settings, robot, updateSettings, triggerEmergencyStop } = useAppStore();
  const [ip, setIp] = useState(settings.ip);
  const [name, setName] = useState(settings.name);
  const [resolution, setResolution] = useState<CameraResolution>(settings.resolution);
  const [theme, setTheme] = useState<RobotTheme>(settings.theme);
  const [reconnectAuto, setReconnectAuto] = useState(settings.reconnectAuto);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ip: ip.trim(),
      name: name.trim(),
      resolution,
      theme,
      reconnectAuto,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClearEStop = () => {
    // Clear e-stop by updating store state directly
    useAppStore.setState((state) => ({
      robot: {
        ...state.robot,
        isEmergencyStopped: false,
      }
    }));
  };

  const resolutionOptions: { label: string; value: CameraResolution }[] = [
    { label: 'QVGA (320x240)', value: 'qvga' },
    { label: 'CIF (400x296)', value: 'cif' },
    { label: 'VGA (640x480)', value: 'vga' },
    { label: 'SVGA (800x600)', value: 'svga' },
    { label: 'UXGA (1600x1200)', value: 'uxga' },
  ];

  const themeOptions: { label: string; value: RobotTheme; desc: string }[] = [
    { label: 'Default Charcoal', value: 'dark', desc: 'Standard slate grey palette' },
    { label: 'Neon Blue', value: 'neon-blue', desc: 'Cybernetic blue links and glows' },
    { label: 'Neon Emerald', value: 'cyberpunk', desc: 'Vibrant green highlights' },
  ];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-400">Configure connection details, camera aspect options, and terminal styling presets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Settings Form */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          <Card title="Robot Configurations">
            <div className="space-y-5">
              
              {/* Robot Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Robot Call Sign / Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                  placeholder="Rover-01"
                />
              </div>

              {/* Robot IP */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Robot Network Address IP
                </label>
                <input
                  type="text"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-all font-mono text-sm"
                  placeholder="e.g. 192.168.1.120"
                />
              </div>

              {/* Resolution Select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Camera Frame Resolution
                </label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value as CameraResolution)}
                  className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-primary/50 transition-all text-sm font-semibold"
                >
                  {resolutionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-dark-card text-slate-100">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reconnect Auto Toggle */}
              <div className="flex items-center justify-between py-2 border-t border-white/5">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    <FiRefreshCw /> Reconnect Automatically
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Attempt to re-establish WebSocket if connection drops.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reconnectAuto}
                    onChange={(e) => setReconnectAuto(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:height-5 after:h-5 after:width-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-white" />
                </label>
              </div>

            </div>
          </Card>

          {/* Theme customizer */}
          <Card title="Interface Themes">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {themeOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                    theme === opt.value
                      ? 'bg-primary/10 border-primary text-slate-100'
                      : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/10'
                  }`}
                >
                  <span className="text-xs font-bold">{opt.label}</span>
                  <span className="text-[10px] leading-relaxed text-slate-500 font-normal">{opt.desc}</span>
                </button>
              ))}
            </div>
          </Card>

          <div className="flex items-center gap-4">
            <Button type="submit" size="md" className="flex items-center gap-2">
              <FiSave /> Save System Configurations
            </Button>
            {saved && (
              <span className="text-xs font-semibold text-accent-emerald flex items-center gap-1 animate-pulse">
                <FiCheckCircle /> Settings updated in localStorage!
              </span>
            )}
          </div>
        </form>

        {/* Diagnostic Actions Column */}
        <div className="space-y-6">
          <Card title="Hardware Diagnostic Utilities">
            <div className="space-y-4">
              
              {/* E-Stop manual state */}
              <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Emergency Lock</span>
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                    robot.isEmergencyStopped 
                      ? 'bg-red-500/10 text-accent-rose' 
                      : 'bg-emerald-500/10 text-accent-emerald'
                  }`}>
                    {robot.isEmergencyStopped ? 'Locked' : 'Clear'}
                  </span>
                </div>
                
                {robot.isEmergencyStopped ? (
                  <Button 
                    variant="glass" 
                    onClick={handleClearEStop} 
                    className="w-full text-xs text-accent-emerald border-accent-emerald/20 hover:bg-accent-emerald/10 flex items-center justify-center gap-1.5"
                  >
                    <FiUnlock /> Unlock Motors
                  </Button>
                ) : (
                  <Button 
                    variant="danger" 
                    onClick={triggerEmergencyStop} 
                    className="w-full text-xs flex items-center justify-center gap-1.5"
                  >
                    <FiZap /> Lock Down Motors
                  </Button>
                )}
              </div>

              {/* CORS note */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-xs text-slate-400 leading-relaxed space-y-2">
                <h5 className="font-bold text-slate-300">ESP32 Firmware Note:</h5>
                <p>Ensure your ESP32-CAM code injects standard HTTP CORS headers to prevent cross-origin blocks:</p>
                <pre className="p-2 bg-slate-950 rounded text-[10px] font-mono text-primary-light overflow-x-auto">
                  {`httpd_resp_set_hdr(req, 
  "Access-Control-Allow-Origin", 
  "*");`}
                </pre>
              </div>

            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
