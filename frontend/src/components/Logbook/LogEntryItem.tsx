import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MaterialIcon } from '@/components/MaterialIcon';
import type { LogEntry } from '@/types/logbook';
import { CATEGORY_CONFIG, PRIORITY_CONFIG, formatLogTime } from './logbookConfig';

interface LogEntryItemProps {
  entry: LogEntry;
}

export const LogEntryItem: React.FC<LogEntryItemProps> = ({ entry }) => {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_CONFIG[entry.category];
  const pri = PRIORITY_CONFIG[entry.priority];
  const detailEntries = entry.details ? Object.entries(entry.details) : [];
  const hasDetails = detailEntries.length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="border-b border-border-panel/40 pb-2"
    >
      <button
        type="button"
        onClick={() => hasDetails && setExpanded((e) => !e)}
        aria-expanded={hasDetails ? expanded : undefined}
        className={`w-full flex items-start gap-2 text-left py-1 ${hasDetails ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <span
          className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${pri.pulse ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: `${cat.color}20`, border: `1px solid ${cat.color}60` }}
        >
          <MaterialIcon name={cat.icon} className="text-[11px]" style={{ color: cat.color }} />
        </span>

        <span className="flex-1 min-w-0">
          <span className="flex items-center justify-between gap-2">
            <span className="font-technical-data text-[11px] font-bold text-on-surface truncate">
              {entry.title}
            </span>
            <span
              className="font-label-caps text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0"
              style={{ color: pri.color, border: `1px solid ${pri.color}50`, backgroundColor: `${pri.color}15` }}
            >
              {pri.label}
            </span>
          </span>

          {entry.description && (
            <span className="block text-[10px] text-on-surface-variant font-technical-data mt-0.5">
              {entry.description}
            </span>
          )}

          <span className="flex items-center gap-2 mt-1">
            <span className="text-[9px] text-primary/40 font-technical-data font-mono">
              {formatLogTime(entry.timestamp)}
            </span>
            <span className="text-[9px] font-label-caps uppercase" style={{ color: cat.color }}>
              {cat.label}
            </span>
            {hasDetails && (
              <MaterialIcon
                name={expanded ? 'expand_less' : 'expand_more'}
                className="text-[10px] text-on-surface-variant/50 ml-auto"
              />
            )}
          </span>
        </span>
      </button>

      {expanded && hasDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="ml-7 mt-1.5 space-y-1 bg-surface-container/40 border border-border-panel/40 p-2 rounded"
        >
          {detailEntries.map(([key, value]) => (
            <div key={key} className="flex justify-between gap-3 text-[9px] font-technical-data">
              <span className="text-on-surface-variant/70 uppercase">{key}</span>
              <span className="text-on-surface font-semibold text-right">{value}</span>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default LogEntryItem;
