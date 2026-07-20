import React from 'react';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import { formatNumber, formatForScreenReader } from '../utils/numberFormatter';
import type { FormatOptions } from '../utils/numberFormatter';

export interface AnimatedCounterProps extends FormatOptions {
  /** The target numeric value to display. */
  value: number;
  /** Animation duration in ms (800–1500 recommended). Default: 1200. */
  duration?: number;
  /** Show a skeleton placeholder instead of the number/animation. */
  loading?: boolean;
  /** Extra class name for the wrapping <span>. */
  className?: string;
  /** Briefly highlight the counter when the value increases. Default: false. */
  highlightOnIncrease?: boolean;
}

/**
 * AnimatedCounter
 *
 * Lightweight, reusable counter that animates from 0 (first load) or the
 * previous value (on updates) to a new target. Formatting and animation
 * logic are delegated to numberFormatter.ts and useAnimatedCounter.ts —
 * this component only handles rendering and accessibility.
 */
export function AnimatedCounter({
  value,
  duration = 1200,
  loading = false,
  className = '',
  highlightOnIncrease = false,
  ...formatOptions
}: AnimatedCounterProps) {
  const { displayValue, isAnimating } = useAnimatedCounter(value, {
    duration,
    disableAnimation: loading,
  });

  const [highlight, setHighlight] = React.useState(false);
  const prevValueRef = React.useRef(value);

  React.useEffect(() => {
    if (highlightOnIncrease && value > prevValueRef.current) {
      setHighlight(true);
      const t = setTimeout(() => setHighlight(false), 600);
      prevValueRef.current = value;
      return () => clearTimeout(t);
    }
    prevValueRef.current = value;
  }, [value, highlightOnIncrease]);

  if (loading) {
    return (
      <span
        className={`animated-counter animated-counter--skeleton ${className}`}
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: '4.5em',
          height: '1em',
          borderRadius: '4px',
          background:
            'linear-gradient(90deg, rgba(148,163,184,0.15) 25%, rgba(148,163,184,0.3) 37%, rgba(148,163,184,0.15) 63%)',
          backgroundSize: '400% 100%',
          animation: 'animated-counter-shimmer 1.4s ease infinite',
        }}
      />
    );
  }

  const displayText = formatNumber(displayValue, formatOptions);
  const finalText = formatForScreenReader(value, formatOptions);

  return (
    <span
      className={`animated-counter${highlight ? ' animated-counter--highlight' : ''} ${className}`}
      style={{
        transition: highlightOnIncrease ? 'color 0.3s ease, transform 0.3s ease' : undefined,
        color: highlight ? 'var(--counter-highlight-color, #4ade80)' : undefined,
        display: 'inline-block',
      }}
    >
      {/* Visual, rapidly-updating number — hidden from assistive tech while animating. */}
      <span aria-hidden="true">{displayText}</span>

      {/* Screen-reader-only element: only ever announces the settled final value,
          never the in-between animation frames. */}
      <span
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
        aria-live={isAnimating ? 'off' : 'polite'}
      >
        {finalText}
      </span>
    </span>
  );
}

export default AnimatedCounter;