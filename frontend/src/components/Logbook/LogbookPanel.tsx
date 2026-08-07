import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useLogbookStore } from '@/store/logbookStore';
import type { LogCategory, LogPriority } from '@/types/logbook';
import { LogEntryItem } from './LogEntryItem';
import { CATEGORY_CONFIG, CATEGORY_ORDER, PRIORITY_CONFIG, PRIORITY_ORDER } from './logbookConfig';

/** How close (px) to the top the list must be to count as "viewing latest". */
const AUTO_SCROLL_THRESHOLD = 24;

export const LogbookPanel: React.FC = () => {
  const entries = useLogbookStore((s) => s.entries);
  const clearAll = useLogbookStore((s) => s.clearAll);

  const [query, setQuery] = useState('');
  const [activeCategories, setActiveCategories] = useState<Set<LogCategory>>(new Set());
  const [activePriorities, setActivePriorities] = useState<Set<LogPriority>>(new Set());

  const listRef = useRef<HTMLDivElement>(null);
  const [pinnedToTop, setPinnedToTop] = useState(true);
  const [newSinceScroll, setNewSinceScroll] = useState(0);
  const prevCountRef = useRef(entries.length);

  const toggleCategory = (cat: LogCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const togglePriority = (pri: LogPriority) => {
    setActivePriorities((prev) => {
      const next = new Set(prev);
      if (next.has(pri)) next.delete(pri);
      else next.add(pri);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (activeCategories.size > 0 && !activeCategories.has(e.category)) return false;
      if (activePriorities.size > 0 && !activePriorities.has(e.priority)) return false;
      if (q && !e.title.toLowerCase().includes(q) && !(e.description ?? '').toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [entries, activeCategories, activePriorities, query]);

  // Track whether the user is parked at the top (viewing the latest entry)
  // so we know whether it's safe to auto-scroll, or whether we'd be
  // yanking them away from history they're reviewing.
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const atTop = el.scrollTop <= AUTO_SCROLL_THRESHOLD;
    setPinnedToTop(atTop);
    if (atTop) setNewSinceScroll(0);
  }, []);

  useEffect(() => {
    const prevCount = prevCountRef.current;
    const grew = entries.length > prevCount;
    prevCountRef.current = entries.length;

    if (pinnedToTop && grew) {
      listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Surface a "N new entries" affordance when entries arrive while the
    // user is reading history, instead of yanking their scroll position.
    setNewSinceScroll((n) => (pinnedToTop ? 0 : grew ? n + (entries.length - prevCount) : n));
  }, [entries.length, pinnedToTop]);

  const jumpToLatest = () => {
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setNewSinceScroll(0);
    setPinnedToTop(true);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Search */}
      <div className="relative mb-2 shrink-0">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="SEARCH LOGBOOK..."
          className="w-full bg-surface-container-low border border-border-panel text-[10px] font-technical-data px-2.5 py-2 pl-7 focus:outline-none focus:border-primary-container transition-ui"
        />
        <MaterialIcon name="search" className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-primary/50" />
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-1 mb-1.5 shrink-0">
        {CATEGORY_ORDER.map((cat) => {
          const cfg = CATEGORY_CONFIG[cat];
          const active = activeCategories.has(cat);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className="flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-label-caps font-bold uppercase rounded transition-ui"
              style={{
                color: active ? '#0C1220' : cfg.color,
                backgroundColor: active ? cfg.color : `${cfg.color}12`,
                border: `1px solid ${cfg.color}50`,
              }}
            >
              <MaterialIcon name={cfg.icon} className="text-[9px]" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Priority filter chips */}
      <div className="flex flex-wrap gap-1 mb-3 shrink-0">
        {PRIORITY_ORDER.map((pri) => {
          const cfg = PRIORITY_CONFIG[pri];
          const active = activePriorities.has(pri);
          return (
            <button
              key={pri}
              type="button"
              onClick={() => togglePriority(pri)}
              className="px-1.5 py-0.5 text-[8px] font-label-caps font-bold uppercase rounded transition-ui"
              style={{
                color: active ? '#0C1220' : cfg.color,
                backgroundColor: active ? cfg.color : `${cfg.color}12`,
                border: `1px solid ${cfg.color}50`,
              }}
            >
              {cfg.label}
            </button>
          );
        })}
        {(activeCategories.size > 0 || activePriorities.size > 0 || query) && (
          <button
            type="button"
            onClick={() => {
              setActiveCategories(new Set());
              setActivePriorities(new Set());
              setQuery('');
            }}
            className="px-1.5 py-0.5 text-[8px] font-label-caps font-bold uppercase rounded text-on-surface-variant border border-border-panel hover:text-primary transition-ui"
          >
            Reset
          </button>
        )}
      </div>

      {/* Entry count / clear */}
      <div className="flex items-center justify-between mb-1.5 shrink-0">
        <span className="text-[9px] text-on-surface-variant font-technical-data">
          {filtered.length} of {entries.length} {entries.length === 1 ? 'ENTRY' : 'ENTRIES'}
        </span>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[9px] font-label-caps text-on-surface-variant hover:text-status-emergency transition-ui"
          >
            CLEAR LOG
          </button>
        )}
      </div>

      {/* New entries indicator */}
      <AnimatePresence>
        {newSinceScroll > 0 && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            onClick={jumpToLatest}
            className="mb-2 shrink-0 flex items-center justify-center gap-1.5 text-[9px] font-label-caps font-bold text-bg-deep-space bg-primary-container py-1.5 rounded"
          >
            <MaterialIcon name="arrow_upward" className="text-[10px]" />
            {newSinceScroll} NEW {newSinceScroll === 1 ? 'ENTRY' : 'ENTRIES'}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Entry list */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar space-y-1 min-h-0"
      >
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-8">
            <MaterialIcon name="history_edu" className="text-primary/30 text-3xl" />
            <p className="text-[10px] text-on-surface-variant font-technical-data">
              No mission events recorded yet.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-8">
            <MaterialIcon name="search_off" className="text-primary/30 text-3xl" />
            <p className="text-[10px] text-on-surface-variant font-technical-data">
              No entries match the current filters.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filtered.map((entry) => (
              <LogEntryItem key={entry.id} entry={entry} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default LogbookPanel;
