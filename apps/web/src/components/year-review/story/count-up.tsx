import { useLayoutEffect, useRef } from 'react';

interface P {
  value: number;
  format: (value: number) => string;
  /** Milliseconds before it starts, to follow the slide's own entrance */
  delay?: number;
  duration?: number;
}

const easeOutExpo = (progress: number) =>
  progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

/**
 * A figure that counts up to its value. It writes to the DOM itself, frame
 * by frame, and shows the value at once when motion is reduced. Pausing the
 * story renders it again: only a new value restarts the count.
 */
export function CountUp({ value, format, delay = 250, duration = 1600 }: P) {
  const node = useRef<HTMLSpanElement>(null);
  const formatter = useRef(format);
  formatter.current = format;

  useLayoutEffect(() => {
    const element = node.current;
    if (!element) return;
    const write = (current: number) => {
      element.textContent = formatter.current(current);
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      write(value);
      return;
    }
    const start = performance.now() + delay;
    let frame = 0;
    const step = (now: number) => {
      const progress = Math.min(1, Math.max(0, (now - start) / duration));
      write(value * easeOutExpo(progress));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    write(0);
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, delay, duration]);

  return <span ref={node}>{format(value)}</span>;
}
