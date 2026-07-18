import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { FiSliders } from 'react-icons/fi';

const SpeedSlider: React.FC = () => {
  const { robot, setSpeed } = useAppStore();

  return (
    <div className="space-y-3.5 bg-slate-900/40 p-5 rounded-2xl border border-white/5">
      <div className="flex justify-between items-center">
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <FiSliders className="text-sm text-primary" /> Target Speed
        </span>
        <span className="text-sm font-extrabold font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg">
          {robot.speed}%
        </span>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        value={robot.speed}
        onChange={(e) => setSpeed(parseInt(e.target.value))}
        disabled={robot.isEmergencyStopped}
        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-30 disabled:cursor-not-allowed"
      />
      <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
        <span>Slow</span>
        <span>Standard</span>
        <span>Turbo</span>
      </div>
    </div>
  );
};

export default SpeedSlider;
