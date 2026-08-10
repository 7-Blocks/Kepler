import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MaterialIcon } from '@/components/MaterialIcon';
import {
  formatShortcut,
  groupShortcutsByCategory,
  SHORTCUT_CATEGORIES_ORDER,
} from '@/utils/keyboardShortcuts';
import type { ShortcutDefinition } from '@/utils/keyboardShortcuts';

interface ShortcutHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMac: boolean;
  definitions?: ShortcutDefinition[];
}

export const ShortcutHelpModal: React.FC<ShortcutHelpModalProps> = ({
  isOpen,
  onClose,
  isMac,
  definitions,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Keep focus inside the modal while open, restore it on close.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, [isOpen]);

  const grouped = groupShortcutsByCategory(definitions);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcut-modal-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[85vh] overflow-y-auto custom-scrollbar bg-surface-container border border-border-panel rounded-md shadow-2xl outline-none"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-surface-container border-b border-border-panel">
              <div className="flex items-center gap-2">
                <MaterialIcon name="keyboard" className="text-primary-container text-lg" />
                <h2
                  id="shortcut-modal-title"
                  className="font-headline-lg text-on-surface text-base md:text-lg font-bold tracking-tight"
                >
                  KEYBOARD SHORTCUTS
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close shortcut help"
                className="flex items-center gap-1 px-2 py-1 rounded border border-border-panel text-on-surface-variant hover:text-primary-container hover:border-primary-container transition-ui cursor-pointer"
              >
                <MaterialIcon name="close" className="text-sm" />
                <span className="font-technical-data text-xs">Esc</span>
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 p-6">
              {SHORTCUT_CATEGORIES_ORDER.map((category) => {
                const items = grouped[category];
                if (!items.length) return null;
                return (
                  <section key={category} className="pt-4">
                    <h3 className="font-label-caps text-primary-container text-xs font-bold uppercase tracking-wider border-b border-border-panel/40 pb-2 mb-2">
                      {category}
                    </h3>
                    <ul className="space-y-1">
                      {items.map((def) => (
                        <li
                          key={def.id}
                          className="flex items-center justify-between gap-4 py-1 text-sm"
                        >
                          <span className="text-on-surface-variant">{def.description}</span>
                          <kbd className="shrink-0 font-technical-data text-xs text-on-surface bg-surface-container-high border border-border-panel border-b-2 rounded px-2 py-0.5">
                            {formatShortcut(def.combo, isMac)}
                          </kbd>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>

            <footer className="border-t border-border-panel px-6 py-3 text-center font-technical-data text-xs text-text-muted">
              Press <kbd className="px-1">?</kbd> or{' '}
              <kbd className="px-1">{isMac ? '⌘' : 'Ctrl'} + /</kbd> anytime to reopen this.
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
