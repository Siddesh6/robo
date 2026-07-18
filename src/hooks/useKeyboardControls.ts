import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { Direction } from '../types';

export const useKeyboardControls = () => {
  const { robot, setDirection } = useAppStore();
  const [keysPressed, setKeysPressed] = useState({
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
  });

  useEffect(() => {
    if (robot.isEmergencyStopped) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling on Space or Arrow keys
      if (['Space', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      let dir: Direction | null = null;
      const key = e.key.toLowerCase();

      if (key === 'w' || e.key === 'ArrowUp') {
        dir = 'forward';
        setKeysPressed(prev => ({ ...prev, w: true }));
      } else if (key === 's' || e.key === 'ArrowDown') {
        dir = 'backward';
        setKeysPressed(prev => ({ ...prev, s: true }));
      } else if (key === 'a' || e.key === 'ArrowLeft') {
        dir = 'left';
        setKeysPressed(prev => ({ ...prev, a: true }));
      } else if (key === 'd' || e.key === 'ArrowRight') {
        dir = 'right';
        setKeysPressed(prev => ({ ...prev, d: true }));
      } else if (e.key === ' ' || key === 'space') {
        dir = 'stop';
        setKeysPressed(prev => ({ ...prev, space: true }));
      }

      if (dir && robot.direction !== dir) {
        setDirection(dir);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      let releasedDir: Direction | null = null;

      if (key === 'w' || e.key === 'ArrowUp') {
        releasedDir = 'forward';
        setKeysPressed(prev => ({ ...prev, w: false }));
      } else if (key === 's' || e.key === 'ArrowDown') {
        releasedDir = 'backward';
        setKeysPressed(prev => ({ ...prev, s: false }));
      } else if (key === 'a' || e.key === 'ArrowLeft') {
        releasedDir = 'left';
        setKeysPressed(prev => ({ ...prev, a: false }));
      } else if (key === 'd' || e.key === 'ArrowRight') {
        releasedDir = 'right';
        setKeysPressed(prev => ({ ...prev, d: false }));
      } else if (e.key === ' ' || key === 'space') {
        setKeysPressed(prev => ({ ...prev, space: false }));
      }

      // Safeguard: only stop if the key released is the direction the robot is currently going
      if (releasedDir && robot.direction === releasedDir) {
        setDirection('stop');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [robot.direction, robot.isEmergencyStopped, setDirection]);

  return keysPressed;
};
