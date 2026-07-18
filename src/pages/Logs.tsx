import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { FiAlertCircle, FiInfo, FiTrash2 } from 'react-icons/fi';

const LogsPage: React.FC = () => {
  const { logs } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.type === filter;
  });

  const getLogTypeStyles = (type: 'info' | 'warn' | 'error') => {
    switch (type) {
      case 'error':
        return {
          bg: 'bg-accent-rose/10 border-accent-rose/20',
          text: 'text-accent-rose',
          icon: <FiAlertCircle />
        };
      case 'warn':
        return {
          bg: 'bg-accent-amber/10 border-accent-amber/20',
          text: 'text-accent-amber',
          icon: <FiAlertCircle />
        };
      case 'info':
      default:
        return {
          bg: 'bg-primary/10 border-primary/20',
          text: 'text-primary-light',
          icon: <FiInfo />
        };
    }
  };

  const handleClearLogs = () => {
    useAppStore.setState({ logs: [] });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">System Event Registry</h1>
          <p className="text-xs text-slate-400">Timestamped operational logs for robot diagnostics and link debugging.</p>
        </div>
        <Button variant="glass" size="sm" onClick={handleClearLogs} className="flex items-center gap-1.5 text-accent-rose border-accent-rose/20 hover:bg-accent-rose/5">
          <FiTrash2 /> Clear Logs
        </Button>
      </div>

      <Card title="Log Filter Panel">
        <div className="flex flex-wrap gap-2.5">
          {(['all', 'info', 'warn', 'error'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                filter === type
                  ? 'bg-primary border-primary text-white shadow-md shadow-primary/10'
                  : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              {type === 'all' ? 'Show All' : `${type}s`}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Operational Log Stream">
        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            No logged events match the active filter criteria.
          </div>
        ) : (
          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2 font-mono text-xs">
            {filteredLogs.slice().reverse().map((log, i) => {
              const styles = getLogTypeStyles(log.type);
              return (
                <div 
                  key={i} 
                  className={`p-3.5 rounded-xl border ${styles.bg} flex items-start justify-between gap-4`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${styles.text}`}>
                      {styles.icon}
                    </span>
                    <span className="text-slate-100 font-semibold leading-relaxed">
                      {log.message}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default LogsPage;
