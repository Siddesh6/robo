import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import CameraViewer from '../components/robot/CameraViewer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import { 
  FiGrid, 
  FiCamera, 
  FiZap, 
  FiZapOff, 
  FiDownload, 
  FiImage 
} from 'react-icons/fi';

const CameraPage: React.FC = () => {
  const { status, camera, toggleFlash, takeSnapshot } = useAppStore();
  const navigate = useNavigate();
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Camera Feed Deck</h1>
          <p className="text-xs text-slate-400">Stream MJPEG video directly from ESP32-CAM optical sensor.</p>
        </div>
        <Button variant="glass" size="sm" onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5">
          <FiGrid /> Dashboard
        </Button>
      </div>

      {/* Main Stream Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Stream Port */}
        <div className={`lg:col-span-3 ${fullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-2 md:p-6' : ''}`}>
          {fullscreen ? (
            <div className="relative w-full h-full flex flex-col">
              <CameraViewer isFullscreen={true} onToggleFullscreen={() => setFullscreen(false)} />
            </div>
          ) : (
            <CameraViewer isFullscreen={false} onToggleFullscreen={() => setFullscreen(true)} />
          )}
        </div>

        {/* Side Panel Controls */}
        <div className="space-y-6">
          <Card title="Feed Operations">
            <div className="flex flex-col gap-4">
              <Button 
                variant={camera.isFlashOn ? 'primary' : 'glass'} 
                onClick={() => toggleFlash()} 
                disabled={status !== 'connected'}
                fullWidth
                className="py-3 h-12 flex justify-center items-center gap-2"
              >
                {camera.isFlashOn ? (
                  <>
                    <FiZapOff /> Disable Flash
                  </>
                ) : (
                  <>
                    <FiZap className="text-accent-amber" /> Enable Flash
                  </>
                )}
              </Button>

              <Button 
                variant="glass" 
                onClick={() => takeSnapshot()} 
                disabled={status !== 'connected'}
                fullWidth
                className="py-3 h-12 flex justify-center items-center gap-2"
              >
                <FiCamera className="text-primary-light" /> Capture Frame
              </Button>

              <Button 
                variant="glass" 
                onClick={() => setFullscreen(!fullscreen)} 
                disabled={status !== 'connected'}
                fullWidth
                className="py-3 h-12 flex justify-center items-center gap-2"
              >
                <FiImage /> {fullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              </Button>
            </div>
          </Card>

          {/* Last Capture Box */}
          {camera.lastSnapshot && (
            <Card title="Last Snapshot">
              <div className="space-y-3">
                <img 
                  src={camera.lastSnapshot} 
                  alt="Last preview thumbnail" 
                  className="w-full rounded-xl border border-white/5 shadow-inner"
                />
                <a 
                  href={camera.lastSnapshot}
                  download={`robocore_snap_${Date.now()}.jpg`}
                  className="flex items-center justify-center gap-2 w-full py-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 text-xs font-semibold rounded-xl transition-all"
                >
                  <FiDownload /> Save to Device
                </a>
              </div>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
};

export default CameraPage;
