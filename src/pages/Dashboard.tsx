import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import CameraViewer from '../components/robot/CameraViewer';
import Sparkline from '../components/ui/Sparkline';
import Joystick from '../components/robot/Joystick';
import type { Direction, RobotMode } from '../types';
import { 
  FiBattery, 
  FiRadio, 
  FiVolume2, 
  FiZap, 
  FiCamera, 
  FiAlertOctagon,
  FiChevronUp,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';

const Dashboard: React.FC = () => {
  const { 
    status, 
    telemetry, 
    robot, 
    headlight,
    logs,
    setSpeed,
    setDirection,
    setMode, 
    takeSnapshot, 
    triggerEmergencyStop,
    toggleHeadlight,
    triggerHorn,
    sendOLEDMessage
  } = useAppStore();

  const keysPressed = useKeyboardControls();

  // History states for live sparklines
  const [distanceHistory, setDistanceHistory] = useState<number[]>([]);
  const [tempHistory, setTempHistory] = useState<number[]>([]);
  const [speedHistory, setSpeedHistory] = useState<number[]>([]);
  const [humidityHistory, setHumidityHistory] = useState<number[]>([]);
  const [soilHistory, setSoilHistory] = useState<number[]>([]);

  // Append new telemetry readings to history
  useEffect(() => {
    if (status !== 'connected') return;

    const append = (history: number[], val: number) => {
      const updated = [...history, val];
      if (updated.length > 15) {
        updated.shift();
      }
      return updated;
    };

    setDistanceHistory(prev => append(prev, telemetry.distance));
    setTempHistory(prev => append(prev, telemetry.temperature));
    setSpeedHistory(prev => append(prev, (robot.speed / 100) * 0.9));
    setHumidityHistory(prev => append(prev, telemetry.humidity));
    setSoilHistory(prev => append(prev, telemetry.soilMoisture || 0));
  }, [telemetry, robot.speed, status]);

  // Seed initial values
  useEffect(() => {
    setDistanceHistory(Array(12).fill(telemetry.distance));
    setTempHistory(Array(12).fill(telemetry.temperature));
    setSpeedHistory(Array(12).fill((robot.speed / 100) * 0.9));
    setHumidityHistory(Array(12).fill(telemetry.humidity));
    setSoilHistory(Array(12).fill(telemetry.soilMoisture || 0));
  }, []);

  const batteryPercent = Math.min(100, Math.max(0, Math.round(((telemetry.battery - 11.0) / 1.6) * 100)));
  const currentSpeedMs = (robot.speed / 100) * 0.9;

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMode(e.target.value as RobotMode);
  };

  const [oledText, setOledText] = useState('');

  const handleSendOLED = async () => {
    if (!oledText.trim()) return;
    const success = await sendOLEDMessage(oledText.trim());
    if (success) {
      setOledText('');
    }
  };

  const handleQuickOLED = async (msg: string) => {
    await sendOLEDMessage(msg === 'CLEAR' ? ' ' : msg);
  };

  const getDpadBtnClass = (dir: Direction, isActiveByKeyboard: boolean) => {
    const isActive = robot.direction === dir || isActiveByKeyboard;
    const base = "w-11 h-11 flex flex-col items-center justify-center rounded-xl border font-bold text-xs transition-all shadow-md select-none relative";
    if (robot.isEmergencyStopped) {
      return `${base} bg-slate-900 border-white/5 text-slate-600 cursor-not-allowed`;
    }
    if (isActive) {
      return `${base} bg-primary text-white border-primary shadow-primary/20 scale-[0.96]`;
    }
    return `${base} bg-slate-800/80 border-white/5 text-slate-300 hover:bg-slate-700/60 hover:text-white`;
  };

  return (
    <div className="space-y-5">
      {/* Primary Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left Column (Live Feed & Telemetry Dashboard) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Live Camera Feed Card */}
          <Card 
            title="Live Camera" 
            className="overflow-hidden border border-white/5 shadow-2xl relative"
          >
            <CameraViewer />
            {/* Carousel dots indicator to mimic mockup view */}
            <div className="flex justify-center items-center gap-1.5 mt-3">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            </div>
          </Card>

          {/* Telemetry Panel row (7 cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5">
            {/* Battery */}
            <div className="glass rounded-2xl p-3 border border-white/5 text-left relative overflow-hidden flex flex-col justify-between h-28">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Battery</span>
                <div className="text-lg font-extrabold font-mono text-slate-200">
                  {telemetry.battery.toFixed(1)} V
                </div>
              </div>
              <div className="w-full space-y-1">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold leading-none">
                  <span>{batteryPercent}%</span>
                  <FiBattery className={`${telemetry.battery >= 12.0 ? 'text-accent-emerald' : telemetry.battery >= 11.4 ? 'text-accent-amber' : 'text-accent-rose'}`} />
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      telemetry.battery >= 12.0 ? 'bg-accent-emerald' : telemetry.battery >= 11.4 ? 'bg-accent-amber' : 'bg-accent-rose'
                    }`}
                    style={{ width: `${batteryPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Distance */}
            <div className="glass rounded-2xl p-3 border border-white/5 text-left relative overflow-hidden flex flex-col justify-between h-28">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Distance</span>
                <div className="text-lg font-extrabold font-mono text-slate-200 flex items-baseline gap-0.5">
                  {telemetry.distance} <span className="text-[10px] text-slate-500">cm</span>
                </div>
              </div>
              <div className="w-full">
                <Sparkline 
                  data={distanceHistory} 
                  color={telemetry.distance <= 15 ? '#F87171' : telemetry.distance <= 35 ? '#FBBF24' : '#34D399'} 
                  height={24} 
                />
              </div>
            </div>

            {/* Temperature */}
            <div className="glass rounded-2xl p-3 border border-white/5 text-left relative overflow-hidden flex flex-col justify-between h-28">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Temperature</span>
                <div className="text-lg font-extrabold font-mono text-slate-200 flex items-baseline gap-0.5">
                  {telemetry.temperature.toFixed(1)} <span className="text-[10px] text-slate-500">°C</span>
                </div>
              </div>
              <div className="w-full">
                <Sparkline data={tempHistory} color="#FBBF24" height={24} />
              </div>
            </div>

            {/* Humidity */}
            <div className="glass rounded-2xl p-3 border border-white/5 text-left relative overflow-hidden flex flex-col justify-between h-28">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Humidity</span>
                <div className="text-lg font-extrabold font-mono text-slate-200 flex items-baseline gap-0.5">
                  {telemetry.humidity.toFixed(1)} <span className="text-[10px] text-slate-500">%</span>
                </div>
              </div>
              <div className="w-full">
                <Sparkline data={humidityHistory} color="#38bdf8" height={24} />
              </div>
            </div>

            {/* Soil Moisture */}
            <div className="glass rounded-2xl p-3 border border-white/5 text-left relative overflow-hidden flex flex-col justify-between h-28">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Soil Moisture</span>
                <div className="text-lg font-extrabold font-mono text-slate-200 flex items-baseline gap-0.5">
                  {telemetry.soilMoisture || 0} <span className="text-[10px] text-slate-500">%</span>
                </div>
              </div>
              <div className="w-full">
                <Sparkline data={soilHistory} color={(telemetry.soilMoisture || 0) < 30 ? '#FBBF24' : '#34D399'} height={24} />
              </div>
            </div>

            {/* WiFi Signal */}
            <div className="glass rounded-2xl p-3 border border-white/5 text-left relative overflow-hidden flex flex-col justify-between h-28">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">WiFi Signal</span>
                <div className="text-lg font-extrabold font-mono text-slate-200">
                  {telemetry.wifi} <span className="text-[10px] text-slate-500 font-normal">dBm</span>
                </div>
              </div>
              <div className="w-full space-y-1">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold leading-none">
                  <span>Signal</span>
                  <FiRadio className="text-primary-light" />
                </div>
                {/* Horizontal bars representation */}
                <div className="flex gap-0.5 items-end h-2 w-16 mb-0.5">
                  <div className="w-1.5 h-1 bg-primary-light rounded-full" />
                  <div className={`w-1.5 h-1.5 rounded-full ${telemetry.wifi >= -75 ? 'bg-primary-light' : 'bg-slate-800'}`} />
                  <div className={`w-1.5 h-2 rounded-full ${telemetry.wifi >= -65 ? 'bg-primary-light' : 'bg-slate-800'}`} />
                  <div className={`w-1.5 h-2.5 rounded-full ${telemetry.wifi >= -50 ? 'bg-primary-light' : 'bg-slate-800'}`} />
                </div>
              </div>
            </div>

            {/* Speed */}
            <div className="glass rounded-2xl p-3 border border-white/5 text-left relative overflow-hidden flex flex-col justify-between h-28">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Speed</span>
                <div className="text-lg font-extrabold font-mono text-slate-200 flex items-baseline gap-0.5">
                  {currentSpeedMs.toFixed(2)} <span className="text-[10px] text-slate-500">m/s</span>
                </div>
              </div>
              <div className="w-full">
                <Sparkline data={speedHistory} color="#34D399" height={24} />
              </div>
            </div>
          </div>

          {/* OLED Message Board Card */}
          <Card 
            title="OLED Display Board" 
            className="border border-white/5 shadow-2xl mt-5"
          >
            <div className="p-4 space-y-4">
              <p className="text-xs text-slate-400">
                Send a text message to display on the physical ESP32 OLED screen (SSD1306).
              </p>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={oledText}
                  onChange={(e) => setOledText(e.target.value)}
                  placeholder="Type a message to show on ESP32..."
                  disabled={status !== 'connected'}
                  className="flex-1 px-4 py-2 bg-slate-900/60 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-xs font-semibold"
                />
                <Button 
                  onClick={handleSendOLED} 
                  disabled={status !== 'connected' || !oledText.trim()}
                  className="text-xs px-4 py-2"
                >
                  Send
                </Button>
              </div>

              {/* Quick Messages */}
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Quick Presets</span>
                <div className="flex flex-wrap gap-1.5">
                  {['HELLO', 'ROBOT CAR', 'STOPPED', 'HAPPY', 'BEEP BEEP', 'CLEAR'].map((msg) => (
                    <button
                      key={msg}
                      onClick={() => handleQuickOLED(msg)}
                      disabled={status !== 'connected'}
                      className="px-2.5 py-1.5 bg-slate-900 border border-white/5 rounded-lg text-slate-300 hover:bg-slate-800 transition-all text-[10px] font-bold"
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (Control Panel) */}
        <div>
          <Card 
            title="Control Panel" 
            className="border border-white/5 shadow-2xl relative h-full flex flex-col justify-between"
          >
            {/* Header select Mode inside card title bar */}
            <div className="absolute top-4 right-5 flex items-center space-x-2 text-xs">
              <span className="text-slate-500 font-bold uppercase tracking-wider">Mode:</span>
              <select
                value={robot.mode}
                onChange={handleModeChange}
                disabled={robot.isEmergencyStopped}
                className="bg-slate-900 border border-white/5 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none font-bold"
              >
                <option value="manual">Manual</option>
                <option value="autonomous">Auto-Drive</option>
              </select>
            </div>

            <div className="space-y-6 flex-1 py-1">
              {/* Target Speed slider */}
              <div className="space-y-2 mt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Speed</span>
                  <span className="px-2 py-0.5 bg-slate-900 border border-white/5 rounded font-mono font-bold text-primary-light">
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
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* D-Pad controls & Quick Actions */}
              <div className="grid grid-cols-2 gap-4 items-center">
                
                {/* 5-way D-Pad */}
                <div className="flex flex-col items-center justify-center py-2 relative">
                  {/* Up */}
                  <button
                    onClick={() => setDirection('forward')}
                    className={getDpadBtnClass('forward', keysPressed.w)}
                    title="Forward (W)"
                  >
                    <FiChevronUp className="text-base" />
                    <span className="text-[9px] text-slate-500 font-semibold absolute bottom-0.5">W</span>
                  </button>

                  <div className="flex items-center gap-3.5 my-2">
                    {/* Left */}
                    <button
                      onClick={() => setDirection('left')}
                      className={getDpadBtnClass('left', keysPressed.a)}
                      title="Left (A)"
                    >
                      <FiChevronLeft className="text-base" />
                      <span className="text-[9px] text-slate-500 font-semibold absolute bottom-0.5">A</span>
                    </button>

                    {/* STOP Center circle */}
                    <button
                      onClick={() => setDirection('stop')}
                      className="w-14 h-14 bg-accent-rose hover:bg-red-600 text-white font-extrabold text-[10px] rounded-full border border-accent-rose shadow-lg shadow-accent-rose/25 flex items-center justify-center transition-all duration-150 active:scale-95"
                      title="Stop (Space)"
                    >
                      STOP
                    </button>

                    {/* Right */}
                    <button
                      onClick={() => setDirection('right')}
                      className={getDpadBtnClass('right', keysPressed.d)}
                      title="Right (D)"
                    >
                      <FiChevronRight className="text-base" />
                      <span className="text-[9px] text-slate-500 font-semibold absolute bottom-0.5">D</span>
                    </button>
                  </div>

                  {/* Down */}
                  <button
                    onClick={() => setDirection('backward')}
                    className={getDpadBtnClass('backward', keysPressed.s)}
                    title="Reverse (S)"
                  >
                    <FiChevronDown className="text-base" />
                    <span className="text-[9px] text-slate-500 font-semibold absolute bottom-0.5">S</span>
                  </button>
                </div>

                {/* Quick Actions Panel */}
                <div className="space-y-2.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Quick Actions</span>
                  
                  {/* Headlight */}
                  <Button 
                    variant={headlight ? 'primary' : 'glass'} 
                    onClick={toggleHeadlight} 
                    disabled={status !== 'connected'}
                    fullWidth
                    className="py-2.5 h-10 flex items-center justify-start gap-2.5 text-xs text-left"
                  >
                    <FiZap className={`text-base ${headlight ? 'text-white' : 'text-slate-400'}`} />
                    <span>Headlight</span>
                  </Button>

                  {/* Horn */}
                  <Button 
                    variant="glass" 
                    onClick={triggerHorn} 
                    disabled={status !== 'connected'}
                    fullWidth
                    className="py-2.5 h-10 flex items-center justify-start gap-2.5 text-xs text-left"
                  >
                    <FiVolume2 className="text-base text-slate-400" />
                    <span>Horn</span>
                  </Button>

                  {/* Take Photo */}
                  <Button 
                    variant="glass" 
                    onClick={takeSnapshot} 
                    disabled={status !== 'connected'}
                    fullWidth
                    className="py-2.5 h-10 flex items-center justify-start gap-2.5 text-xs text-left"
                  >
                    <FiCamera className="text-base text-slate-400" />
                    <span>Take Photo</span>
                  </Button>
                </div>

              </div>

              {/* Joystick base & Presets grid */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 items-center">
                {/* Steering Movement Joystick wrapper */}
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Steering / Movement</span>
                  {/* Render Joystick handles inside the Card */}
                  <Joystick />
                </div>

                {/* Presets */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Presets</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDirection('forward')}
                      disabled={robot.isEmergencyStopped}
                      className="py-2 bg-slate-900 border border-white/5 rounded-xl text-center text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all"
                    >
                      Forward
                    </button>
                    <button
                      onClick={() => setDirection('backward')}
                      disabled={robot.isEmergencyStopped}
                      className="py-2 bg-slate-900 border border-white/5 rounded-xl text-center text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all"
                    >
                      Backward
                    </button>
                    <button
                      onClick={() => setDirection('left')}
                      disabled={robot.isEmergencyStopped}
                      className="py-2 bg-slate-900 border border-white/5 rounded-xl text-center text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all"
                    >
                      Left
                    </button>
                    <button
                      onClick={() => setDirection('right')}
                      disabled={robot.isEmergencyStopped}
                      className="py-2 bg-slate-900 border border-white/5 rounded-xl text-center text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all"
                    >
                      Right
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Giant Emergency Stop Button */}
            <button
              onClick={triggerEmergencyStop}
              className="w-full py-4 mt-6 bg-accent-rose hover:bg-red-600 text-white font-extrabold text-sm tracking-wider uppercase rounded-2xl shadow-lg shadow-accent-rose/25 transition-all flex items-center justify-center gap-2"
            >
              <FiAlertOctagon className="text-lg animate-bounce" /> Emergency Stop
            </button>
          </Card>
        </div>

      </div>

      {/* System Status Event Logs Footer (Pulsing list logs scrolling) */}
      <div className="w-full glass rounded-2xl border border-white/5 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 relative overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
          <div className="flex items-center space-x-2 text-primary">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="uppercase tracking-widest text-[10px]">System Status</span>
          </div>
          {status === 'connected' && (
            <div className={`flex items-center space-x-1.5 px-2 py-0.5 text-[9px] uppercase tracking-wider font-extrabold rounded-md border ${
              telemetry.arduinoConnected 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${telemetry.arduinoConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span>Arduino Uno: {telemetry.arduinoConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          )}
        </div>
        
        {/* Horizontal scroll logs list */}
        <div className="flex-1 overflow-x-auto scrollbar-none py-1 md:px-6">
          <div className="flex items-center space-x-6 whitespace-nowrap text-[11px] font-mono font-semibold">
            {logs.slice(-4).map((log, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-slate-500">{log.timestamp}</span>
                <span className="text-slate-300">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
