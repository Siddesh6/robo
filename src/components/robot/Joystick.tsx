import React, { useRef, useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { Direction } from '../../types';

const Joystick: React.FC = () => {
  const { robot, setDirection } = useAppStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const maxRadius = 60; // Max pixels handle can move

  const handleStart = (clientX: number, clientY: number) => {
    if (robot.isEmergencyStopped) return;
    setIsDragging(true);
    updatePosition(clientX, clientY);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || robot.isEmergencyStopped) return;
    updatePosition(clientX, clientY);
  };

  const handleEnd = () => {
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    setDirection('stop');
  };

  const updatePosition = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Clamp to max radius
    if (distance > maxRadius) {
      dx = (dx / distance) * maxRadius;
      dy = (dy / distance) * maxRadius;
    }
    
    setPosition({ x: dx, y: dy });
    
    // Convert coordinate to discrete robot direction commands
    if (distance < 15) {
      setDirection('stop');
    } else {
      // Calculate angle in degrees (0 is Right, 90 is Down, -90 is Up)
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      let newDir: Direction = 'stop';
      if (angle >= -45 && angle <= 45) {
        newDir = 'right';
      } else if (angle > 45 && angle < 135) {
        newDir = 'backward';
      } else if (angle >= 135 || angle <= -135) {
        newDir = 'left';
      } else if (angle > -135 && angle < -45) {
        newDir = 'forward';
      }
      
      if (robot.direction !== newDir) {
        setDirection(newDir);
      }
    }
  };

  // Add global mouseup listener to handle drags that end outside joystick
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) handleEnd();
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Joystick Outer Base */}
      <div 
        ref={containerRef}
        className="w-40 h-40 joystick-base flex items-center justify-center relative touch-none select-none"
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseMove={(e) => isDragging && handleMove(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          handleStart(touch.clientX, touch.clientY);
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          handleMove(touch.clientX, touch.clientY);
        }}
        onTouchEnd={handleEnd}
      >
        {/* Joystick Handle */}
        <div 
          className="w-16 h-16 joystick-handle flex items-center justify-center select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
          }}
        >
          <div className="w-5 h-5 rounded-full bg-white/20 border border-white/40 shadow-inner" />
        </div>
        
        {/* Compass Guides */}
        <span className="absolute top-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">F</span>
        <span className="absolute bottom-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">B</span>
        <span className="absolute left-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">L</span>
        <span className="absolute right-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">R</span>
      </div>
      <p className="text-[11px] text-slate-500 mt-3 font-semibold uppercase tracking-wider">
        Drag to steer
      </p>
    </div>
  );
};

export default Joystick;
