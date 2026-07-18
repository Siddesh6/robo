export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export type CameraResolution = 'qvga' | 'cif' | 'vga' | 'svga' | 'uxga';

export type RobotTheme = 'dark' | 'neon-blue' | 'cyberpunk';

export interface Telemetry {
  battery: number;      // Voltage, e.g. 12.1
  distance: number;     // cm, e.g. 34
  temperature: number;  // Celsius, e.g. 29
  humidity: number;     // %, e.g. 45
  wifi: number;         // RSSI, e.g. -48
  soilMoisture: number; // %, e.g. 60
  arduinoConnected?: boolean;
}

export interface Settings {
  ip: string;
  name: string;
  resolution: CameraResolution;
  quality: 'low' | 'medium' | 'high';
  theme: RobotTheme;
  reconnectAuto: boolean;
}

export type Direction = 'forward' | 'backward' | 'left' | 'right' | 'stop';

export type RobotMode = 'manual' | 'autonomous' | 'line-follower';

export interface RobotState {
  direction: Direction;
  speed: number;
  isEmergencyStopped: boolean;
  mode: RobotMode;
}

export interface CameraState {
  isFlashOn: boolean;
  isStreamPlaying: boolean;
  lastSnapshot: string | null; // Base64 or object URL of last taken photo
}
