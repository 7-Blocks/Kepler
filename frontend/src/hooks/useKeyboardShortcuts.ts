import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SHORTCUT_DEFINITIONS } from '@/utils/keyboardShortcuts';
import type { ModifierKey, ShortcutDefinition } from '@/utils/keyboardShortcuts';
/**
 * Map of handlerKey -> callback. Only handlers that are actually provided
 * will fire; missing handlers are silently skipped so partial wiring
 * (e.g. shortcuts for pages that don't exist yet) never throws.
 *
 * Example:
 *   useKeyboardShortcuts({
 *     goToDashboard: () => navigate('/dashboard'),
 *     openGlobalSearch: () => setGlobalSearchOpen(true),
 *     toggleSidebar: () => toggleSidebar(),
 *     ...
 *   })
 */
export type ShortcutHandlers = Partial<Record<string, () => void>>;

export interface UseKeyboardShortcutsOptions {
  /** Disable all shortcut handling (e.g. while a blocking modal owns focus). */
  disabled?: boolean;
  /** Provide a custom shortcut list instead of the default app-wide registry. */
  definitions?: ShortcutDefinition[];
}

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isTypingContext(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (TYPING_TAGS.has(el.tagName)) return true;
  if (el.isContentEditable) return true;
  // Covers rich text / code editors (Monaco, CodeMirror, ProseMirror, etc.)
  if (el.closest('[contenteditable="true"], .monaco-editor, .CodeMirror, .ProseMirror')) {
    return true;
  }
  return false;
}

function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform ?? navigator.userAgent);
}

function modifiersMatch(event: KeyboardEvent, modifiers: ModifierKey[] = []): boolean {
  const wantCtrl = modifiers.includes('ctrl');
  const wantShift = modifiers.includes('shift');
  const wantAlt = modifiers.includes('alt');

  // Treat Cmd as Ctrl on macOS so shortcuts feel native on every OS.
  const ctrlPressed = event.ctrlKey || event.metaKey;

  if (wantCtrl !== ctrlPressed) return false;
  if (wantShift !== event.shiftKey) return false;
  if (wantAlt !== event.altKey) return false;
  return true;
}

function keyMatches(event: KeyboardEvent, key: string): boolean {
  if (key.length === 1) {
    return event.key.toLowerCase() === key.toLowerCase();
  }
  return event.key === key;
}

/**
 * Registers Kepler's global keyboard shortcuts on the window, and returns
 * state/controls for the shortcut help modal. Handlers are looked up by
 * the `handlerKey` on each ShortcutDefinition — pass whichever ones are
 * relevant; unmatched shortcuts are safe no-ops.
 */
export function useKeyboardShortcuts(
  handlers: ShortcutHandlers,
  options: UseKeyboardShortcutsOptions = {}
) {
  const { disabled = false, definitions = SHORTCUT_DEFINITIONS } = options;
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const isMac = useMemo(isMacPlatform, []);

  const openHelp = useCallback(() => setIsHelpOpen(true), []);
  const closeHelp = useCallback(() => setIsHelpOpen(false), []);
  const toggleHelp = useCallback(() => setIsHelpOpen((prev) => !prev), []);

  useEffect(() => {
    if (disabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      const typing = isTypingContext(event.target);

      for (const def of definitions) {
        if (typing && !def.allowInTypingContext) continue;
        if (!keyMatches(event, def.combo.key)) continue;
        if (!modifiersMatch(event, def.combo.modifiers)) continue;

        // Built-in handling for the help modal so it works with zero wiring.
        if (def.handlerKey === 'openShortcutHelp') {
          event.preventDefault();
          toggleHelp();
          return;
        }
        if (def.handlerKey === 'closeModal' && isHelpOpen) {
          event.preventDefault();
          closeHelp();
          return;
        }

        const handler = handlersRef.current[def.handlerKey];
        if (handler) {
          event.preventDefault();
          handler();
        }
        return; // First match wins; combos are designed to be unambiguous.
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, definitions, isHelpOpen, toggleHelp, closeHelp]);

  return { isHelpOpen, openHelp, closeHelp, toggleHelp, isMac };
}
