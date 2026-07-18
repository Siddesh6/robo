import React, { useState, useEffect, useRef } from 'react';
import { useAppStore, getSimulatedCameraFrame } from '../../store/useAppStore';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { CameraResolution } from '../../types';
import { 
  FiCamera, 
  FiCameraOff, 
  FiMaximize, 
  FiMinimize, 
  FiZap, 
  FiZapOff, 
  FiVideo 
} from 'react-icons/fi';

interface CameraViewerProps {
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const CameraViewer: React.FC<CameraViewerProps> = ({ 
  isFullscreen = false, 
  onToggleFullscreen 
}) => {
  const { 
    status, 
    isMockMode, 
    camera, 
    robot, 
    settings, 
    toggleFlash, 
    takeSnapshot, 
    updateSettings 
  } = useAppStore();
  
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [mockFrame, setMockFrame] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);

  // Simulated MJPEG stream logic for Mock Mode
  useEffect(() => {
    if (!isMockMode || status !== 'connected') return;
    
    setLoading(false);
    setHasError(false);
    
    const interval = setInterval(() => {
      const frame = getSimulatedCameraFrame(
        robot.direction, 
        camera.isFlashOn, 
        robot.speed, 
        Date.now() / 150
      );
      setMockFrame(frame);
    }, 150);

    return () => clearInterval(interval);
  }, [isMockMode, status, robot.direction, robot.speed, camera.isFlashOn]);

  const handleImageLoad = () => {
    setLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setLoading(false);
    setHasError(true);
  };

  const handleResolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSettings({ resolution: e.target.value as CameraResolution });
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSettings({ quality: e.target.value as ('low' | 'medium' | 'high') });
  };

  // Real ESP32 CAM Stream URL
  const isLocalDev = import.meta.env.DEV;
  const streamUrl = isLocalDev
    ? `/esp32-stream/${settings.ip}/stream`
    : `http://${settings.ip}:81/stream`;
  const showStream = status === 'connected' && !hasError;

  const resolutionOptions: { label: string; value: CameraResolution }[] = [
    { label: '320x240 (QVGA)', value: 'qvga' },
    { label: '400x296 (CIF)', value: 'cif' },
    { label: '640x480 (VGA)', value: 'vga' },
    { label: '800x600 (SVGA)', value: 'svga' },
    { label: '1600x1200 (UXGA)', value: 'uxga' },
  ];

  return (
    <div className={`relative bg-slate-950 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center ${
      isFullscreen ? 'w-full h-full' : 'aspect-video w-full'
    }`}>
      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

      {/* Stream Render */}
      {showStream && (
        isMockMode ? (
          <img
            src={mockFrame}
            alt="Simulated Camera Stream"
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            ref={imgRef}
            src={streamUrl}
            onLoad={handleImageLoad}
            onError={handleImageError}
            alt="ESP32 Live Feed"
            className="w-full h-full object-cover"
          />
        )
      )}

      {/* Loading state indicator */}
      {status === 'connected' && loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm z-10">
          <LoadingSpinner label="Acquiring camera stream..." />
        </div>
      )}

      {/* Offline/Error State overlay */}
      {(!showStream || status !== 'connected') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 text-center z-10">
          <FiCameraOff className="text-slate-600 text-4xl mb-3 animate-pulse" />
          <h4 className="text-sm font-bold text-slate-300">Camera Feed Offline</h4>
          <p className="text-xs text-slate-500 max-w-xs mt-1">
            {status !== 'connected' 
              ? 'Connect the robot to start the camera stream.' 
              : 'Unable to stream MJPEG feed. Verify camera hardware.'}
          </p>
        </div>
      )}

      {/* Futuristic HUD overlay */}
      {status === 'connected' && (
        <>
          {/* Top-Left: Live indicator & FPS */}
          <div className="absolute top-4 left-4 flex items-center space-x-2 bg-slate-950/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5 text-[10px] font-bold tracking-widest uppercase">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <FiVideo className="text-emerald-400" />
            <span className="text-emerald-400 font-extrabold">Live</span>
            <span className="w-1.5 h-3 border-r border-white/10" />
            <span className="text-slate-400 font-mono">FPS: 18</span>
          </div>

          {/* Top-Right: Camera Actions (Snap, Flash, Fullscreen) */}
          <div className="absolute top-4 right-4 flex items-center space-x-1.5 bg-slate-950/75 backdrop-blur-md p-1.5 rounded-xl border border-white/5">
            {/* Snapshot */}
            <button
              onClick={() => takeSnapshot()}
              className="p-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
              title="Capture Snapshot"
            >
              <FiCamera />
            </button>
            
            {/* Flash toggle */}
            <button
              onClick={() => toggleFlash()}
              className={`p-2 rounded-lg text-sm transition-all ${
                camera.isFlashOn 
                  ? 'bg-accent-amber/20 text-accent-amber border border-accent-amber/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              title="Toggle Flash"
            >
              {camera.isFlashOn ? <FiZap className="text-accent-amber" /> : <FiZapOff />}
            </button>

            {/* Fullscreen toggle */}
            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className="p-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
                title="Fullscreen Toggle"
              >
                {isFullscreen ? <FiMinimize /> : <FiMaximize />}
              </button>
            )}
          </div>

          {/* Bottom-Left: Resolution Overlay */}
          <div className="absolute bottom-4 left-4 flex flex-col bg-slate-950/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5">
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Resolution</span>
            <select
              value={settings.resolution}
              onChange={handleResolutionChange}
              className="bg-transparent text-xs font-mono font-bold text-slate-200 focus:outline-none cursor-pointer"
            >
              {resolutionOptions.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
                  {opt.value === 'vga' ? '640x480' : opt.value === 'qvga' ? '320x240' : opt.value === 'cif' ? '400x296' : opt.value === 'svga' ? '800x600' : '1600x1200'}
                </option>
              ))}
            </select>
          </div>

          {/* Bottom-Right: Quality Overlay */}
          <div className="absolute bottom-4 right-4 flex flex-col bg-slate-950/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5 text-right">
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Quality</span>
            <select
              value={settings.quality}
              onChange={handleQualityChange}
              className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer text-right"
            >
              <option value="low" className="bg-slate-900 text-slate-200">Low</option>
              <option value="medium" className="bg-slate-900 text-slate-200">Medium</option>
              <option value="high" className="bg-slate-900 text-slate-200">High</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
};

export default CameraViewer;
