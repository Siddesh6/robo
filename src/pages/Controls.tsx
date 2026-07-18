import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Joystick from '../components/robot/Joystick';
import DirectionPad from '../components/robot/DirectionPad';
import SpeedSlider from '../components/robot/SpeedSlider';
import CameraViewer from '../components/robot/CameraViewer';
import type { RobotMode } from '../types';
import { 
  FiAlertOctagon, 
  FiHelpCircle 
} from 'react-icons/fi';

const RobotControlPage: React.FC = () => {
  const { robot, setMode, triggerEmergencyStop } = useAppStore();
  const keysPressed = useKeyboardControls();

  const handleModeChange = (mode: RobotMode) => {
    setMode(mode);
  };

  const modeButtons: { name: string; value: RobotMode; desc: string }[] = [
    { name: 'Manual', value: 'manual', desc: 'Direct joystick / keyboard control' },
    { name: 'Autonomous', value: 'autonomous', desc: 'Auto pathfinding using distance sensor' },
  ];

  const getKeyboardKeyClass = (pressed: boolean) => {
    return `w-12 h-12 rounded-xl flex items-center justify-center font-bold font-mono border transition-all text-sm shadow-md ${
      pressed 
        ? 'bg-primary text-white border-primary shadow-primary/20 scale-[0.95]' 
        : 'bg-slate-800 border-white/5 text-slate-400'
    }`;
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Robot Driving Deck</h1>
        <p className="text-xs text-slate-400">Control the drive wheels and set autonomous parameters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Driving Controls Box */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Camera Feed */}
          <Card title="Driver Perspective (Live Feed)">
            <CameraViewer />
          </Card>

          <Card title="Motor Drive steering">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-6">
              
              {/* Virtual Joystick (Visible on both, perfect for mobile touch) */}
              <div className="flex flex-col items-center border-b md:border-b-0 md:border-r border-white/5 pb-8 md:pb-0">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">
                  Virtual Joystick
                </span>
                <Joystick />
              </div>

              {/* Clickable Direction Pad (Perfect for Desktop) */}
              <div className="flex flex-col items-center">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">
                  Manual Direction Pad
                </span>
                <DirectionPad />
              </div>

            </div>
          </Card>

          {/* Speed settings slider */}
          <SpeedSlider />
        </div>

        {/* Operating parameters panel */}
        <div className="space-y-6">
          
          {/* Drive Mode Selector Card */}
          <Card title="Drive Mode Profile">
            <div className="space-y-4">
              {modeButtons.map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => handleModeChange(btn.value)}
                  disabled={robot.isEmergencyStopped}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                    robot.mode === btn.value
                      ? 'bg-primary/10 border-primary text-slate-100 shadow-md shadow-primary/5'
                      : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="text-sm font-bold">{btn.name}</span>
                  <span className="text-[11px] font-normal leading-relaxed">{btn.desc}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Keyboard Controls visualizer */}
          <Card title="Keyboard Visualizer">
            <div className="flex flex-col items-center py-2 space-y-4">
              {/* Row 1: W */}
              <div className={getKeyboardKeyClass(keysPressed.w)}>W</div>
              
              {/* Row 2: A S D */}
              <div className="flex gap-2">
                <div className={getKeyboardKeyClass(keysPressed.a)}>A</div>
                <div className={getKeyboardKeyClass(keysPressed.s)}>S</div>
                <div className={getKeyboardKeyClass(keysPressed.d)}>D</div>
              </div>
              
              {/* Row 3: Spacebar */}
              <div className={`w-40 h-10 rounded-xl flex items-center justify-center font-bold font-mono border transition-all text-xs shadow-md ${
                keysPressed.space 
                  ? 'bg-accent-rose text-white border-accent-rose shadow-accent-rose/25 scale-[0.95]' 
                  : 'bg-slate-800 border-white/5 text-slate-400'
              }`}>
                SPACE (STOP)
              </div>
              
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 mt-1 text-center">
                <FiHelpCircle /> Press WASD keys to drive, Space to stop.
              </div>
            </div>
          </Card>

          {/* Emergency Stop Card */}
          <Card className="border border-accent-rose/10 bg-accent-rose/5 p-6 flex flex-col gap-4 text-center">
            <div>
              <h4 className="text-sm font-bold text-accent-rose flex items-center justify-center gap-2">
                <FiAlertOctagon className="text-lg" /> Drive Disabler
              </h4>
              <p className="text-xs text-slate-400 mt-1">Kill robot power immediately in case of collision threat.</p>
            </div>
            <Button variant="danger" size="lg" onClick={triggerEmergencyStop} fullWidth>
              EMERGENCY STOP
            </Button>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default RobotControlPage;
