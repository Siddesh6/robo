import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { FiGrid, FiCamera, FiSliders, FiActivity, FiSettings, FiWifiOff, FiPlayCircle, FiFileText } from 'react-icons/fi';

const Sidebar: React.FC = () => {
  const { settings, status, disconnect } = useAppStore();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <FiGrid /> },
    { name: 'Camera Feed', path: '/camera', icon: <FiCamera /> },
    { name: 'Robot Control', path: '/controls', icon: <FiSliders /> },
    { name: 'Sensors', path: '/sensors', icon: <FiActivity /> },
    { name: 'Logs', path: '/logs', icon: <FiFileText /> },
    { name: 'Settings', path: '/settings', icon: <FiSettings /> },
  ];

  return (
    <aside className="w-64 border-r border-white/5 bg-slate-950/40 backdrop-blur-md flex flex-col h-screen fixed left-0 top-0 hidden md:flex z-40">
      {/* Brand logo header */}
      <div className="h-16 flex items-center px-6 border-b border-white/5 gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-xl">
          <FiPlayCircle className="animate-pulse" />
        </div>
        <div>
          <h1 className="font-bold text-sm text-slate-100 leading-none">RoboCore</h1>
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Lite v1.0</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-md shadow-primary/5'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer / Disconnect button */}
      <div className="p-4 border-t border-white/5">
        <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Device IP</span>
            <span className="text-[11px] text-slate-400 font-mono font-bold">{settings.ip}</span>
          </div>
          {status === 'connected' && (
            <button
              onClick={() => disconnect()}
              className="mt-1 flex items-center justify-center gap-2 w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg border border-red-500/20 transition-all"
            >
              <FiWifiOff /> Disconnect
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
