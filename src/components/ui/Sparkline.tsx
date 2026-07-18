import React, { useEffect, useRef } from 'react';

interface SparklineProps {
  data: number[];
  color?: string; // e.g. '#22D3EE'
  height?: number;
}

const Sparkline: React.FC<SparklineProps> = ({ 
  data, 
  color = '#0ea5e9', 
  height = 50 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = height;

    ctx.clearRect(0, 0, w, h);

    if (data.length < 2) return;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min === 0 ? 1 : max - min;

    // Padding
    const padY = 5;
    const graphH = h - padY * 2;

    ctx.beginPath();
    
    // Draw line
    data.forEach((val, index) => {
      const x = (index / (data.length - 1)) * w;
      const y = h - padY - ((val - min) / range) * graphH;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Draw gradient fill under the sparkline
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, `${color}25`); // 15% opacity
    gradient.addColorStop(1, `${color}00`); // 0% opacity
    ctx.fillStyle = gradient;
    ctx.fill();

  }, [data, color, height]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full" 
      style={{ height: `${height}px` }} 
    />
  );
};

export default Sparkline;
