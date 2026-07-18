import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import Card from '../components/ui/Card';
import SensorCard from '../components/ui/SensorCard';
import Sparkline from '../components/ui/Sparkline';
import { 
  FiBattery, 
  FiCompass, 
  FiThermometer, 
  FiDroplet, 
  FiRadio 
} from 'react-icons/fi';

const SensorsPage: React.FC = () => {
  const { telemetry, status } = useAppStore();
  
  // Local history buffers (keep up to 20 data points)
  const [distanceHistory, setDistanceHistory] = useState<number[]>([]);
  const [batteryHistory, setBatteryHistory] = useState<number[]>([]);
  const [tempHistory, setTempHistory] = useState<number[]>([]);
  const [humidityHistory, setHumidityHistory] = useState<number[]>([]);
  const [wifiHistory, setWifiHistory] = useState<number[]>([]);
  const [soilHistory, setSoilHistory] = useState<number[]>([]);

  // Append new telemetry readings to history
  useEffect(() => {
    if (status !== 'connected') return;

    const append = (history: number[], val: number) => {
      const updated = [...history, val];
      if (updated.length > 20) {
        updated.shift();
      }
      return updated;
    };

    setDistanceHistory(prev => append(prev, telemetry.distance));
    setBatteryHistory(prev => append(prev, telemetry.battery));
    setTempHistory(prev => append(prev, telemetry.temperature));
    setHumidityHistory(prev => append(prev, telemetry.humidity));
    setWifiHistory(prev => append(prev, telemetry.wifi));
    setSoilHistory(prev => append(prev, telemetry.soilMoisture || 0));

  }, [telemetry, status]);

  // Safeguard: seed initial historical data for styling when mock or first loading
  useEffect(() => {
    if (distanceHistory.length === 0) {
      setDistanceHistory(Array(15).fill(telemetry.distance));
      setBatteryHistory(Array(15).fill(telemetry.battery));
      setTempHistory(Array(15).fill(telemetry.temperature));
      setHumidityHistory(Array(15).fill(telemetry.humidity));
      setWifiHistory(Array(15).fill(telemetry.wifi));
      setSoilHistory(Array(15).fill(telemetry.soilMoisture || 0));
    }
  }, []);

  // Threshold checkers
  const getDistanceMeta = (cm: number) => {
    if (cm <= 15) return { status: 'critical' as const, text: 'COLLISION ALERT', color: '#f87171' };
    if (cm <= 35) return { status: 'warning' as const, text: 'OBSTACLE DETECTED', color: '#fbbf24' };
    return { status: 'good' as const, text: 'PATH SECURE', color: '#34d399' };
  };

  const getBatteryMeta = (v: number) => {
    if (v < 11.2) return { status: 'critical' as const, text: 'CRITICAL LOW BATTERY', color: '#f87171' };
    if (v < 11.8) return { status: 'warning' as const, text: 'BATTERY DEGRADED', color: '#fbbf24' };
    return { status: 'good' as const, text: 'VOLTAGE OK', color: '#34d399' };
  };

  const getTempMeta = (c: number) => {
    if (c >= 45) return { status: 'critical' as const, text: 'SYSTEM OVERHEATING', color: '#f87171' };
    if (c >= 38) return { status: 'warning' as const, text: 'HIGH TEMPERATURE', color: '#fbbf24' };
    return { status: 'good' as const, text: 'THERMAL OK', color: '#34d399' };
  };

  const getHumidityMeta = (h: number) => {
    if (h < 15 || h > 80) return { status: 'warning' as const, text: 'HUMIDITY WARN', color: '#fbbf24' };
    return { status: 'good' as const, text: 'ATMOSPHERE NORMAL', color: '#34d399' };
  };

  const getWifiMeta = (rssi: number) => {
    if (rssi <= -80) return { status: 'critical' as const, text: 'LINK UNSTABLE', color: '#f87171' };
    if (rssi <= -68) return { status: 'warning' as const, text: 'RSSI WEAK', color: '#fbbf24' };
    return { status: 'good' as const, text: 'LINK STABLE', color: '#38bdf8' }; // cyan
  };

  const distMeta = getDistanceMeta(telemetry.distance);
  const battMeta = getBatteryMeta(telemetry.battery);
  const tempMeta = getTempMeta(telemetry.temperature);
  const humMeta = getHumidityMeta(telemetry.humidity);
  const wifiMeta = getWifiMeta(telemetry.wifi);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Telemetry Deck</h1>
        <p className="text-xs text-slate-400">Real-time status indicators fetched from ESP32 on-board transducers.</p>
      </div>

      {status !== 'connected' && (
        <div className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl text-center text-slate-400 text-sm">
          Telemetry is currently offline. Connect to a robot to stream real-time sensor updates.
        </div>
      )}

      {/* Grid of Sensors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Distance Sensor Card */}
        <div className="space-y-3">
          <SensorCard
            title="Ultrasonic Rangefinder"
            value={telemetry.distance}
            unit="cm"
            icon={<FiCompass />}
            status={distMeta.status}
            statusText={distMeta.text}
          />
          <Card className="py-3 px-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Distance Waveform</span>
            <Sparkline data={distanceHistory} color={distMeta.color} />
          </Card>
        </div>

        {/* Battery Card */}
        <div className="space-y-3">
          <SensorCard
            title="DC Bus Voltage"
            value={telemetry.battery.toFixed(1)}
            unit="V"
            icon={<FiBattery />}
            status={battMeta.status}
            statusText={battMeta.text}
          />
          <Card className="py-3 px-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Voltage History</span>
            <Sparkline data={batteryHistory} color={battMeta.color} />
          </Card>
        </div>

        {/* Temperature Card */}
        <div className="space-y-3">
          <SensorCard
            title="Core Temperature"
            value={telemetry.temperature.toFixed(1)}
            unit="°C"
            icon={<FiThermometer />}
            status={tempMeta.status}
            statusText={tempMeta.text}
          />
          <Card className="py-3 px-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Temperature Waveform</span>
            <Sparkline data={tempHistory} color={tempMeta.color} />
          </Card>
        </div>

        {/* Humidity Card */}
        <div className="space-y-3">
          <SensorCard
            title="Relative Humidity"
            value={telemetry.humidity.toFixed(1)}
            unit="%"
            icon={<FiDroplet />}
            status={humMeta.status}
            statusText={humMeta.text}
          />
          <Card className="py-3 px-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Humidity History</span>
            <Sparkline data={humidityHistory} color={humMeta.color} />
          </Card>
        </div>

        {/* Wifi RSSI Card */}
        <div className="space-y-3">
          <SensorCard
            title="Wi-Fi Signal Strength"
            value={telemetry.wifi}
            unit="dBm"
            icon={<FiRadio />}
            status={wifiMeta.status}
            statusText={wifiMeta.text}
          />
          <Card className="py-3 px-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Link Waveform</span>
            <Sparkline data={wifiHistory} color={wifiMeta.color} />
          </Card>
        </div>

        {/* Soil Moisture Card */}
        <div className="space-y-3">
          <SensorCard
            title="Soil Moisture"
            value={telemetry.soilMoisture || 0}
            unit="%"
            icon={<FiDroplet className="text-emerald-400" />}
            status={(telemetry.soilMoisture || 0) < 30 ? 'warning' : 'good'}
            statusText={(telemetry.soilMoisture || 0) < 30 ? 'DRY SOIL - WATER REQUIRED' : 'SOIL MOISTURE OK'}
          />
          <Card className="py-3 px-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Moisture History</span>
            <Sparkline data={soilHistory} color={(telemetry.soilMoisture || 0) < 30 ? '#fbbf24' : '#34d399'} />
          </Card>
        </div>

      </div>
    </div>
  );
};

export default SensorsPage;
