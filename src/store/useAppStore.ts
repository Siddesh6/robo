import { create } from 'zustand';
import type { 
  ConnectionStatus, 
  Telemetry, 
  Settings, 
  Direction, 
  RobotState, 
  CameraState, 
  RobotMode 
} from '../types';

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'warn' | 'error';
}

interface AppStore {
  // Connection state
  status: ConnectionStatus;
  isMockMode: boolean;
  errorMsg: string | null;
  wsConnected: boolean;
  
  // Settings
  settings: Settings;
  
  // Telemetry
  telemetry: Telemetry;
  
  // Robot Controls State
  robot: RobotState;
  
  // Camera State
  camera: CameraState;

  // Additional elements from mockup
  logs: LogEntry[];
  headlight: boolean;
  hornActive: boolean;
  connectTime: number | null;
  uptimeSeconds: number;

  // Actions
  updateSettings: (newSettings: Partial<Settings>) => void;
  connect: (ip?: string) => Promise<boolean>;
  disconnect: () => void;
  setSpeed: (speed: number) => void;
  setDirection: (direction: Direction) => void;
  setMode: (mode: RobotMode) => void;
  triggerEmergencyStop: () => void;
  toggleFlash: () => Promise<void>;
  takeSnapshot: () => Promise<void>;
  setError: (msg: string | null) => void;
  receiveTelemetry: (data: Partial<Telemetry>) => void;

  // New Actions for Mockup
  addLog: (message: string, type?: 'info' | 'warn' | 'error') => void;
  toggleHeadlight: () => Promise<void>;
  triggerHorn: () => Promise<void>;
  sendOLEDMessage: (text: string) => Promise<boolean>;
}

const DEFAULT_SETTINGS: Settings = {
  ip: '10.169.247.176',
  name: 'Rover-01',
  resolution: 'vga',
  quality: 'high',
  theme: 'dark',
  reconnectAuto: true,
};

const INITIAL_TELEMETRY: Telemetry = {
  battery: 12.4,
  distance: 80,
  temperature: 28,
  humidity: 42,
  wifi: -55,
  soilMoisture: 45,
  arduinoConnected: false,
};

let wsInstance: WebSocket | null = null;
let mockInterval: any = null;
let reconnectTimeout: any = null;
let uptimeInterval: any = null;
let telemetryInterval: any = null;

const isLocalDev = import.meta.env.DEV;

const getTargetUrl = (ip: string, path: string): string => {
  if (isLocalDev) {
    return `/esp32-api/${ip}${path}`;
  }
  return `http://${ip}${path}`;
};

const getWebSocketUrl = (ip: string): string => {
  if (isLocalDev) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/esp32-ws/${ip}/ws`;
  }
  return `ws://${ip}/ws`;
};

const startUptimeTick = () => {
  if (uptimeInterval) clearInterval(uptimeInterval);
  useAppStore.setState({ connectTime: Date.now(), uptimeSeconds: 0 });
  uptimeInterval = setInterval(() => {
    useAppStore.setState((state) => ({ uptimeSeconds: state.uptimeSeconds + 1 }));
  }, 1000);
};

const stopUptimeTick = () => {
  if (uptimeInterval) {
    clearInterval(uptimeInterval);
    uptimeInterval = null;
  }
};

// Helper to generate custom SVG simulated stream
export const getSimulatedCameraFrame = (direction: Direction, isFlashOn: boolean, speed: number, time: number): string => {
  const angle = direction === 'left' ? -15 : direction === 'right' ? 15 : 0;
  const translationY = direction === 'forward' ? (time % 40) - 20 : direction === 'backward' ? 20 - (time % 40) : 0;
  const translationX = direction === 'left' ? (time % 40) - 20 : direction === 'right' ? 20 - (time % 40) : 0;
  const flashBg = isFlashOn ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0)';
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="100%" height="100%">
      <rect width="640" height="480" fill="#0f172a" />
      
      <!-- Horizon Grid Gridlines shifting with movement -->
      <g stroke="#1e293b" stroke-width="1">
        ${Array.from({ length: 12 }).map((_, i) => {
          const y = 240 + (i * 20) + (direction === 'forward' ? (time * (speed/30)) % 20 : direction === 'backward' ? -((time * (speed/30)) % 20) : 0);
          return `<line x1="0" y1="${y}" x2="640" y2="${y}" />`;
        }).join('')}
        ${Array.from({ length: 17 }).map((_, i) => {
          const x = (i * 40) + (direction === 'left' ? (time * (speed/30)) % 40 : direction === 'right' ? -((time * (speed/30)) % 40) : 0);
          return `<line x1="${x}" y1="240" x2="${x}" y2="480" />`;
        }).join('')}
      </g>
      
      <!-- Simulated Obstacle (Red Box) -->
      <g transform="translate(${320 + translationX * 4}, ${200 + translationY * 2}) rotate(${angle})">
        <rect x="-40" y="-40" width="80" height="80" rx="10" fill="#f87171" stroke="#f43f5e" stroke-width="4" opacity="0.8"/>
        <text x="0" y="5" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="14" text-anchor="middle">OBSTACLE</text>
      </g>
      
      <!-- Crosshairs -->
      <circle cx="320" cy="240" r="10" stroke="#0ea5e9" stroke-width="2" fill="none" opacity="0.5" />
      <line x1="300" y1="240" x2="340" y2="240" stroke="#0ea5e9" stroke-width="2" opacity="0.5" />
      <line x1="320" y1="220" x2="320" y2="260" stroke="#0ea5e9" stroke-width="2" opacity="0.5" />
      
      <!-- Overlay Flash glow -->
      <rect width="640" height="480" fill="${flashBg}" style="mix-blend-mode: overlay; pointer-events: none;" />
      
      <!-- Telemetry Overlay (Watermark style) -->
      <rect x="15" y="15" width="220" height="75" rx="6" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
      <text x="30" y="38" fill="#38bdf8" font-family="sans-serif" font-size="12" font-weight="bold">FEED: LIVE SIMULATION</text>
      <text x="30" y="58" fill="#94a3b8" font-family="sans-serif" font-size="11">DIR: ${direction.toUpperCase()} | SPD: ${speed}%</text>
      <text x="30" y="74" fill="#94a3b8" font-family="sans-serif" font-size="11">FLASH: ${isFlashOn ? 'ON' : 'OFF'}</text>
      
      <!-- Grid Border -->
      <rect x="2" y="2" width="636" height="476" fill="none" stroke="#334155" stroke-width="4" rx="8" />
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// LocalStorage helpers
const loadPersistedSettings = (): Settings => {
  try {
    const saved = localStorage.getItem('robocore_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Error loading settings', e);
  }
  return DEFAULT_SETTINGS;
};

export const useAppStore = create<AppStore>((set, get) => {
  // Initialize settings from localStorage
  const initialSettings = loadPersistedSettings();

  const startSimulator = () => {
    if (mockInterval) clearInterval(mockInterval);
    let tick = 0;
    
    set({ 
      status: 'connected', 
      isMockMode: true, 
      wsConnected: true,
      errorMsg: null 
    });

    get().addLog('Connected to Rover-01 (Simulator Mode)', 'info');
    get().addLog('Camera stream started', 'info');
    get().addLog('Motors ready', 'info');
    get().addLog('All systems normal', 'info');

    startUptimeTick();

    mockInterval = setInterval(() => {
      const { robot, telemetry } = get();
      tick++;

      // Drift battery slowly, fluctuate sensors
      const batteryDrift = Math.max(10.5, telemetry.battery - 0.001);
      
      // Calculate obstacle distance based on simulated movements
      let distanceDelta = 0;
      if (robot.direction === 'forward') {
        distanceDelta = -Math.round(robot.speed * 0.15);
      } else if (robot.direction === 'backward') {
        distanceDelta = Math.round(robot.speed * 0.1);
      }
      
      let distance = Math.max(8, Math.min(250, telemetry.distance + distanceDelta));
      
      // Auto obstacle avoidance in autonomous modes
      if (robot.mode === 'autonomous' && distance < 20) {
        get().addLog(`Obstacle detected at ${distance}cm. Executing avoidance maneuver.`, 'warn');
        set({
          robot: {
            ...robot,
            direction: 'backward',
            speed: 50
          }
        });
        distance = 25;
      }
      
      // Random sensor variations
      const tempVariation = (Math.random() - 0.5) * 0.4;
      const humVariation = (Math.random() - 0.5) * 0.5;
      const wifiVariation = Math.random() > 0.7 ? (Math.random() - 0.5) * 4 : 0;

      set({
        telemetry: {
          battery: parseFloat(batteryDrift.toFixed(2)),
          distance: distance,
          temperature: parseFloat((29 + Math.sin(tick / 50) + tempVariation).toFixed(1)),
          humidity: parseFloat((42 + Math.cos(tick / 40) + humVariation).toFixed(1)),
          wifi: Math.max(-85, Math.min(-30, Math.round(telemetry.wifi + wifiVariation))),
          soilMoisture: Math.round(50 + Math.sin(tick / 30) * 15),
          arduinoConnected: true,
        }
      });
    }, 1000);
  };

  const stopSimulator = () => {
    if (mockInterval) {
      clearInterval(mockInterval);
      mockInterval = null;
    }
    stopUptimeTick();
  };

  return {
    status: 'disconnected',
    isMockMode: false,
    errorMsg: null,
    wsConnected: false,
    settings: initialSettings,
    telemetry: INITIAL_TELEMETRY,
    robot: {
      direction: 'stop',
      speed: 80,
      isEmergencyStopped: false,
      mode: 'manual',
    },
    camera: {
      isFlashOn: false,
      isStreamPlaying: false,
      lastSnapshot: null,
    },

    logs: [
      { timestamp: new Date().toLocaleTimeString(), message: 'RoboCore controller initialized', type: 'info' }
    ],
    headlight: false,
    hornActive: false,
    connectTime: null,
    uptimeSeconds: 0,

    addLog: (message, type = 'info') => {
      const entry: LogEntry = {
        timestamp: new Date().toLocaleTimeString(),
        message,
        type
      };
      set((state) => ({ logs: [...state.logs.slice(-49), entry] }));
    },

    updateSettings: (newSettings) => {
      set((state) => {
        const updated = { ...state.settings, ...newSettings };
        localStorage.setItem('robocore_settings', JSON.stringify(updated));
        
        // Dynamically update document layout settings if theme changes
        if (newSettings.theme) {
          const root = document.documentElement;
          if (newSettings.theme === 'cyberpunk') {
            root.classList.add('cyberpunk');
            root.classList.remove('neon-blue');
          } else if (newSettings.theme === 'neon-blue') {
            root.classList.add('neon-blue');
            root.classList.remove('cyberpunk');
          } else {
            root.classList.remove('cyberpunk', 'neon-blue');
          }
        }
        
        return { settings: updated };
      });
      get().addLog('System settings updated', 'info');
    },

    setError: (msg) => set({ errorMsg: msg }),
    
    receiveTelemetry: (data) => set((state) => ({
      telemetry: { ...state.telemetry, ...data }
    })),

    connect: async (ip) => {
      const targetIp = ip || get().settings.ip;
      
      // Update settings with the current IP
      if (ip) {
        get().updateSettings({ ip });
      }

      set({ status: 'connecting', errorMsg: null });
      get().addLog(`Attempting connection to robot IP: ${targetIp}...`, 'info');

      // Simulator Mode trigger
      if (targetIp.toLowerCase() === 'mock' || targetIp.toLowerCase() === 'simulator') {
        startSimulator();
        return true;
      }

      stopSimulator();
      stopTelemetryPolling();

      return new Promise<boolean>((resolve) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        fetch(getTargetUrl(targetIp, '/status'), { 
          method: 'GET',
          mode: 'cors',
          signal: controller.signal 
        })
          .then(async (res) => {
            clearTimeout(timeoutId);
            if (res.ok) {
              const data = await res.json();
              set({ 
                status: 'connected', 
                wsConnected: true, 
                errorMsg: null,
                isMockMode: false
              });
              get().receiveTelemetry(data);
              get().addLog('Connected to physical robot controller (HTTP Mode)', 'info');
              get().addLog('Motors ready', 'info');
              get().addLog('All systems normal', 'info');
              
              startUptimeTick();
              startTelemetryPolling(targetIp);
              resolve(true);
            } else {
              throw new Error(`HTTP status check returned code ${res.status}`);
            }
          })
          .catch((err) => {
            clearTimeout(timeoutId);
            console.error('Connection handshake failed:', err);
            set({ status: 'disconnected', errorMsg: 'Connection Failed' });
            get().addLog('Connection handshake failed', 'error');
            resolve(false);
          });
      });
    },

    disconnect: () => {
      get().addLog('Robot connection manually closed', 'warn');
      set({ status: 'disconnected', wsConnected: false, isMockMode: false });
      stopSimulator();
      stopTelemetryPolling();
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
    },

    setSpeed: async (speed) => {
      set((state) => ({ robot: { ...state.robot, speed } }));
      get().addLog(`Target motor speed throttled to ${speed}%`, 'info');
      if (get().isMockMode) return;
      try {
        await fetch(getTargetUrl(get().settings.ip, `/speed?val=${speed}`), {
          method: 'GET',
          mode: 'cors'
        });
      } catch (err) {
        console.error('Failed to send speed command:', err);
      }
    },

    setDirection: async (direction) => {
      let currentSpeed = 80;
      set((state) => {
        if (state.robot.isEmergencyStopped && direction !== 'stop') {
          return state;
        }
        currentSpeed = state.robot.speed;
        return { robot: { ...state.robot, direction } };
      });
      if (get().robot.isEmergencyStopped && direction !== 'stop') return;
      
      if (direction !== 'stop') {
        get().addLog(`Driving movement command: ${direction.toUpperCase()}`, 'info');
      } else {
        get().addLog('Robot drive brakes engaged', 'info');
      }

      if (get().isMockMode) return;
      try {
        await fetch(getTargetUrl(get().settings.ip, `/move?dir=${direction}&speed=${currentSpeed}`), {
          method: 'GET',
          mode: 'cors'
        });
      } catch (err) {
        console.error('Failed to send move command:', err);
      }
    },

    setMode: async (mode) => {
      set((state) => ({ robot: { ...state.robot, mode } }));
      get().addLog(`Navigation profile changed to: ${mode.toUpperCase()}`, 'info');
      if (get().isMockMode) return;
      try {
        await fetch(getTargetUrl(get().settings.ip, `/mode?val=${mode}`), {
          method: 'GET',
          mode: 'cors'
        });
      } catch (err) {
        console.error('Failed to send mode command:', err);
      }
    },

    triggerEmergencyStop: async () => {
      set((state) => ({ 
        robot: { 
          ...state.robot, 
          isEmergencyStopped: true,
          direction: 'stop' as Direction
        } 
      }));
      get().addLog('EMERGENCY STOP TRIGGERED - DRIVE TRAIN DISENGAGED', 'error');
      if (get().isMockMode) return;
      try {
        await fetch(getTargetUrl(get().settings.ip, `/estop`), {
          method: 'GET',
          mode: 'cors'
        });
      } catch (err) {
        console.error('Failed to send estop command:', err);
      }
    },

    toggleFlash: async () => {
      const { settings, camera, isMockMode } = get();
      const nextFlashState = !camera.isFlashOn;
      
      set((state) => ({ camera: { ...state.camera, isFlashOn: nextFlashState } }));
      get().addLog(`Camera flash triggered ${nextFlashState ? 'ON' : 'OFF'}`, 'info');
      
      if (isMockMode) return;

      try {
        await fetch(getTargetUrl(settings.ip, `/flash?val=${nextFlashState ? 1 : 0}`), { 
          method: 'GET',
          mode: 'cors' 
        });
      } catch (err) {
        console.error('Failed to toggle physical flash:', err);
      }
    },

    takeSnapshot: async () => {
      const { settings, isMockMode } = get();
      get().addLog('Taking snapshot capture...', 'info');
      
      if (isMockMode) {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, 640, 480);
          ctx.fillStyle = '#38bdf8';
          ctx.font = '20px sans-serif';
          ctx.fillText('RoboCore Snapshot', 50, 80);
          ctx.font = '14px sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(`Timestamp: ${new Date().toLocaleTimeString()}`, 50, 120);
          ctx.fillText(`Mode: ${get().robot.mode}`, 50, 150);
          ctx.fillText(`Battery: ${get().telemetry.battery} V`, 50, 180);
          
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(320, 240, 60, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        set((state) => ({ 
          camera: { ...state.camera, lastSnapshot: canvas.toDataURL('image/jpeg') } 
        }));
        get().addLog('Snapshot frame captured (Simulator)', 'info');
        return;
      }

      try {
        const res = await fetch(getTargetUrl(settings.ip, '/capture'), { mode: 'cors' });
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        set((state) => ({ 
          camera: { ...state.camera, lastSnapshot: objectUrl } 
        }));
        get().addLog('Snapshot frame captured successfully', 'info');
      } catch (err) {
        console.error('Failed to capture snapshot:', err);
        set({ errorMsg: 'Snapshot Capture Failed' });
        get().addLog('Snapshot capture failed', 'error');
      }
    },

    toggleHeadlight: async () => {
      const nextState = !get().headlight;
      set({ headlight: nextState });
      get().addLog(`Headlights toggled ${nextState ? 'ON' : 'OFF'}`, 'info');
      
      if (get().isMockMode) return;
      try {
        await fetch(getTargetUrl(get().settings.ip, `/headlight?val=${nextState ? 1 : 0}`), { 
          method: 'GET',
          mode: 'cors' 
        });
      } catch (err) {
        console.error('Failed to toggle physical headlight:', err);
      }
    },

    triggerHorn: async () => {
      set({ hornActive: true });
      get().addLog('Horn activated', 'info');
      setTimeout(() => set({ hornActive: false }), 400);

      if (get().isMockMode) return;
      try {
        await fetch(getTargetUrl(get().settings.ip, '/horn'), { 
          method: 'GET',
          mode: 'cors' 
        });
      } catch (err) {
        console.error('Failed to sound horn:', err);
      }
    },

    sendOLEDMessage: async (text: string) => {
      get().addLog(`OLED message sent: "${text}"`, 'info');
      if (get().isMockMode) return true;
      try {
        const res = await fetch(getTargetUrl(get().settings.ip, `/display?text=${encodeURIComponent(text)}`), {
          method: 'GET',
          mode: 'cors'
        });
        return res.ok;
      } catch (err) {
        console.error('Failed to send OLED message:', err);
        return false;
      }
    }
  };
});

// Helper to configure telemetry polling connection
const startTelemetryPolling = (ip: string) => {
  if (telemetryInterval) clearInterval(telemetryInterval);
  const store = useAppStore.getState();
  
  telemetryInterval = setInterval(async () => {
    // Only poll if connected and not in mock/simulator mode
    if (useAppStore.getState().status !== 'connected' || useAppStore.getState().isMockMode) {
      clearInterval(telemetryInterval);
      telemetryInterval = null;
      return;
    }
    
    try {
      const res = await fetch(getTargetUrl(ip, '/status'), {
        method: 'GET',
        mode: 'cors'
      });
      if (res.ok) {
        const data = await res.json();
        useAppStore.setState({ wsConnected: true, errorMsg: null });
        useAppStore.getState().receiveTelemetry(data);
      } else {
        useAppStore.setState({ wsConnected: false });
      }
    } catch (e) {
      console.warn('Telemetry poll failed:', e);
      useAppStore.setState({ wsConnected: false });
    }
  }, 1500);
};

const stopTelemetryPolling = () => {
  if (telemetryInterval) {
    clearInterval(telemetryInterval);
    telemetryInterval = null;
  }
};
