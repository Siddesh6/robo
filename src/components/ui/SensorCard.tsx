import React from 'react';
import Card from './Card';

interface SensorCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  status?: 'good' | 'warning' | 'critical';
  statusText?: string;
}

const SensorCard: React.FC<SensorCardProps> = ({
  title,
  value,
  unit,
  icon,
  status = 'good',
  statusText,
}) => {
  const statusStyles = {
    good: {
      border: 'border-accent-emerald/20',
      glow: 'shadow-accent-emerald/5',
      text: 'text-accent-emerald',
      bg: 'bg-accent-emerald/5',
    },
    warning: {
      border: 'border-accent-amber/20',
      glow: 'shadow-accent-amber/5',
      text: 'text-accent-amber',
      bg: 'bg-accent-amber/5',
    },
    critical: {
      border: 'border-accent-rose/20',
      glow: 'shadow-accent-rose/5',
      text: 'text-accent-rose animate-pulse',
      bg: 'bg-accent-rose/5',
    },
  };

  const style = statusStyles[status] || statusStyles.good;

  return (
    <Card 
      className={`relative overflow-hidden border ${style.border} shadow-lg ${style.glow} transition-all duration-300 hover:scale-[1.02]`}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">
            {title}
          </span>
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-extrabold font-mono text-slate-100">{value}</span>
            <span className="text-sm font-semibold text-slate-400">{unit}</span>
          </div>
          {statusText && (
            <span className={`text-[11px] font-semibold tracking-wide uppercase ${style.text}`}>
              {statusText}
            </span>
          )}
        </div>

        <div className={`p-3.5 rounded-xl ${style.bg} ${style.text} text-xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

export default SensorCard;
