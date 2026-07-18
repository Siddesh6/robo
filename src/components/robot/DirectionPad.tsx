import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { Direction } from '../../types';
import { 
  FiChevronUp, 
  FiChevronDown, 
  FiChevronLeft, 
  FiChevronRight, 
  FiSquare 
} from 'react-icons/fi';

const DirectionPad: React.FC = () => {
  const { robot, setDirection } = useAppStore();

  const handlePress = (dir: Direction) => {
    if (robot.isEmergencyStopped) return;
    // Set direction. If click same active direction, stop.
    if (robot.direction === dir) {
      setDirection('stop');
    } else {
      setDirection(dir);
    }
  };

  const getBtnClass = (dir: Direction) => {
    const isActive = robot.direction === dir;
    const base = "w-14 h-14 flex items-center justify-center rounded-2xl border transition-all text-xl shadow-lg";
    if (robot.isEmergencyStopped) {
      return `${base} bg-slate-900 border-white/5 text-slate-600 cursor-not-allowed`;
    }
    if (isActive) {
      return `${base} bg-primary text-white border-primary shadow-primary/20 scale-[0.96]`;
    }
    return `${base} bg-slate-800 border-white/5 text-slate-300 hover:bg-slate-700 hover:border-white/10 hover:text-white`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Up Button */}
      <button 
        onClick={() => handlePress('forward')}
        disabled={robot.isEmergencyStopped}
        className={getBtnClass('forward')}
        aria-label="Move Forward"
      >
        <FiChevronUp />
      </button>

      {/* Middle Row */}
      <div className="flex items-center justify-center gap-3.5 my-2.5">
        <button 
          onClick={() => handlePress('left')}
          disabled={robot.isEmergencyStopped}
          className={getBtnClass('left')}
          aria-label="Move Left"
        >
          <FiChevronLeft />
        </button>

        <button 
          onClick={() => setDirection('stop')}
          className={`w-14 h-14 flex items-center justify-center rounded-2xl border transition-all text-xl shadow-lg ${
            robot.direction === 'stop'
              ? 'bg-accent-rose text-white border-accent-rose shadow-accent-rose/25 scale-[0.96]'
              : 'bg-slate-800 border-white/5 text-accent-rose hover:bg-slate-700 hover:border-white/10'
          }`}
          aria-label="Stop Robot"
        >
          <FiSquare />
        </button>

        <button 
          onClick={() => handlePress('right')}
          disabled={robot.isEmergencyStopped}
          className={getBtnClass('right')}
          aria-label="Move Right"
        >
          <FiChevronRight />
        </button>
      </div>

      {/* Down Button */}
      <button 
        onClick={() => handlePress('backward')}
        disabled={robot.isEmergencyStopped}
        className={getBtnClass('backward')}
        aria-label="Move Backward"
      >
        <FiChevronDown />
      </button>
    </div>
  );
};

export default DirectionPad;
