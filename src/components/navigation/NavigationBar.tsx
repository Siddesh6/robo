import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiGrid, FiCamera, FiSliders, FiActivity, FiSettings, FiFileText } from 'react-icons/fi';

const NavigationBar: React.FC = () => {
  const tabs = [
    { name: 'Dashboard', path: '/dashboard', icon: <FiGrid /> },
    { name: 'Camera', path: '/camera', icon: <FiCamera /> },
    { name: 'Controls', path: '/controls', icon: <FiSliders /> },
    { name: 'Sensors', path: '/sensors', icon: <FiActivity /> },
    { name: 'Logs', path: '/logs', icon: <FiFileText /> },
    { name: 'Settings', path: '/settings', icon: <FiSettings /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-950/80 backdrop-blur-lg border-t border-white/5 flex md:hidden items-center justify-around px-4 z-40 pb-safe shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.5)]">
      {tabs.map((tab) => (
        <NavLink
          key={tab.name}
          to={tab.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${
              isActive
                ? 'text-primary'
                : 'text-slate-500 hover:text-slate-300'
            }`
          }
        >
          <span className="text-xl mb-0.5">{tab.icon}</span>
          <span className="text-[10px] font-medium tracking-tight">{tab.name}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default NavigationBar;
