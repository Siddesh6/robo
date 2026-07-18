import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', label }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div 
        className={`${sizeClasses[size]} border-slate-700 border-t-primary rounded-full animate-spin`}
      />
      {label && <p className="text-slate-400 text-sm font-medium animate-pulse">{label}</p>}
    </div>
  );
};

export default LoadingSpinner;
