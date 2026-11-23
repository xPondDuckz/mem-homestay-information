import { useState, useEffect } from 'react';

/**
 * Animates a number smoothly to `target`.
 * Handles asynchronous data updates and React strict mode re-renders cleanly.
 */
export function useCountUp(target: number, durationMs = 800): number {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    const startVal = display;
    const endVal = Number(target) || 0;

    if (startVal === endVal) {
      setDisplay(endVal);
      return;
    }

    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * eased);

      setDisplay(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [target, durationMs]);

  return display;
}
