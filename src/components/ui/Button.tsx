import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'accent' | 'outline' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20',
    secondary: 'bg-dark-border text-slate-200 hover:bg-dark-lighter',
    danger: 'bg-accent-rose text-white hover:bg-red-600 shadow-lg shadow-accent-rose/25',
    accent: 'bg-accent-cyan text-dark-bg hover:bg-cyan-400 font-bold',
    outline: 'border border-dark-border text-slate-300 hover:bg-dark-border/40',
    glass: 'bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 backdrop-blur-sm',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-white" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
