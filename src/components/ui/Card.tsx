import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({ children, title, className = '', hoverable = false }) => {
  return (
    <div className={`glass rounded-2xl p-5 ${hoverable ? 'glass-hover' : ''} ${className}`}>
      {title && (
        <h3 className="text-slate-400 font-semibold text-xs tracking-wider uppercase mb-4 border-b border-white/5 pb-2">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export default Card;
