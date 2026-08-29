import { useState, useEffect, useRef } from 'react';

/**
 * Animates a number from 0 (or previous value) to `target`.
 * Duration defaults to 900ms with an ease-out curve.
 */
export function useCountUp(target: number, durationMs = 900): number {
  const [display, setDisplay] = useState(0);
  const startRef    = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef      = useRef<number | null>(null);
  const prevTarget  = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    const from = prevTarget.current;
    prevTarget.current = target;
    startRef.current = from;
    startTimeRef.current = null;

    const step = (now: number) => {
      if (startTimeRef.current === null) startTimeRef.current = now;
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs]);

  return display;
}
