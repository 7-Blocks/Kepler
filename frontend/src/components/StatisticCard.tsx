import React from 'react';
import { AnimatedCounter } from './AnimatedCounter';
import type { FormatOptions } from '../utils/numberFormatter';

export interface StatisticCardProps extends FormatOptions {
  /** Icon/emoji shown above the label, e.g. "🛰️". */
  icon?: React.ReactNode;
  /** Card label, e.g. "Total Satellites". */
  label: string;
  /** The statistic's current value. */
  value: number;
  /** Show a loading skeleton instead of the value. */
  loading?: boolean;
  /** Highlight the counter briefly when it increases (e.g. on live updates). */
  highlightOnIncrease?: boolean;
  /** Animation duration override in ms. */
  duration?: number;
  className?: string;
}

/**
 * StatisticCard
 *
 * One dashboard tile: icon, label, and an AnimatedCounter. Kept intentionally
 * dumb — all animation/formatting behavior lives in AnimatedCounter, so this
 * component only handles layout for a single stat.
 */
export function StatisticCard({
  icon,
  label,
  value,
  loading = false,
  highlightOnIncrease = true,
  duration,
  className = '',
  ...formatOptions
}: StatisticCardProps) {
  return (
    <div
      className={`statistic-card ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        padding: '1.25rem',
        borderRadius: '12px',
        background: 'var(--card-bg, #161b22)',
        border: '1px solid var(--card-border, #30363d)',
        minWidth: 0, // allows text/number to shrink instead of overflowing on mobile
      }}
    >
      {icon && (
        <div style={{ fontSize: '1.5rem', lineHeight: 1 }} aria-hidden="true">
          {icon}
        </div>
      )}
      <div
        style={{
          fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
          fontWeight: 700,
          color: 'var(--card-value-color, #f0f6fc)',
          wordBreak: 'break-word',
        }}
      >
        <AnimatedCounter
          value={value}
          loading={loading}
          duration={duration}
          highlightOnIncrease={highlightOnIncrease}
          {...formatOptions}
        />
      </div>
      <div
        style={{
          fontSize: '0.875rem',
          color: 'var(--card-label-color, #8b949e)',
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default StatisticCard;