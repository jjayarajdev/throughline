import { useRef, useState, useEffect } from 'react';
import CountUp from 'react-countup';

interface AnimatedMetricProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  separator?: string;
  className?: string;
}

export function AnimatedMetric({
  end,
  duration = 1.5,
  prefix = '',
  suffix = '',
  decimals = 0,
  separator = ',',
  className,
}: AnimatedMetricProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const observerInitialized = useRef(false);

  useEffect(() => {
    // Prevent React 18 StrictMode double-invoke from creating duplicate observers
    if (observerInitialized.current) return;
    observerInitialized.current = true;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Trigger once only
        }
      },
      { threshold: 0.3 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Format the end value for static display
  const formattedEnd = `${prefix}${end.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}${suffix}`;

  // Check reduced motion preference for rendering
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
  const effectiveDuration = prefersReducedMotion ? 0 : duration;

  return (
    <div ref={elementRef} className={className}>
      {isVisible ? (
        <CountUp
          start={0}
          end={end}
          duration={effectiveDuration}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          separator={separator}
        />
      ) : (
        <span>{formattedEnd}</span>
      )}
    </div>
  );
}
