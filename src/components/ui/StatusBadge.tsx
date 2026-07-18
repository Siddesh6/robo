import React from 'react';
import type { ConnectionStatus } from '../../types';

interface StatusBadgeProps {
  status: ConnectionStatus;
  isMockMode?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isMockMode = false }) => {
  const configs = {
    disconnected: {
      text: 'Offline',
      bg: 'bg-red-500/10 text-red-400 border-red-500/20',
      dot: 'bg-red-400',
    },
    connecting: {
      text: 'Connecting',
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse',
      dot: 'bg-amber-400 animate-ping',
    },
    connected: {
      text: isMockMode ? 'Simulated' : 'Connected',
      bg: isMockMode ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-lg shadow-cyan-500/5' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-lg shadow-emerald-500/5',
      dot: isMockMode ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400 animate-pulse',
    },
    reconnecting: {
      text: 'Reconnecting',
      bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse',
      dot: 'bg-orange-400 animate-ping',
    },
  };

  const config = configs[status] || configs.disconnected;

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 text-xs font-semibold rounded-full border ${config.bg}`}>
      <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
      <span>{config.text}</span>
    </div>
  );
};

export default StatusBadge;
