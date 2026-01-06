/**
 * Keyboard shortcuts utility for desktop application
 * Handles keyboard shortcuts that work across all OS (Windows, macOS, Linux)
 */

export interface KeyboardShortcut {
  key: string;
  description: string;
  handler: () => void;
  preventDefault?: boolean;
}

// Shortcut mappings
export const SHORTCUTS = {
  FOCUS_SEARCH: 'f', // F key - Focus search input
  FOCUS_SEARCH_ALT: 'k', // K key - Alternative focus search (Cmd/Ctrl+K)
  TOGGLE_CART: 'c', // C key - Toggle cart
  CLOSE_MODAL: 'Escape', // Escape - Close modals
  SUBMIT: 'Enter', // Enter - Submit form
  CANCEL: 'Escape', // Escape - Cancel action
  INCREMENT_QUANTITY: 'ArrowUp', // Up arrow - Increment quantity
  DECREMENT_QUANTITY: 'ArrowDown', // Down arrow - Decrement quantity
  DELETE_ITEM: 'Delete', // Delete - Delete item
  NEXT_ITEM: 'ArrowRight', // Right arrow - Next item
  PREV_ITEM: 'ArrowLeft', // Left arrow - Previous item
} as const;

/**
 * Check if we're running in Tauri desktop app
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Register keyboard shortcuts
 */
export function registerShortcuts(shortcuts: Map<string, () => void>) {
  if (typeof window === 'undefined') return;

  const handleKeyDown = (event: KeyboardEvent) => {
    // Don't trigger if user is typing in input/textarea
    const target = event.target as HTMLElement;
    if (
      target &&
      (target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable)
    ) {
      // Allow some shortcuts even in inputs
      const allowedInInput = ['Escape'];
      if (!allowedInInput.includes(event.key)) {
        return;
      }
    }

    // Build shortcut key string
    const modifiers: string[] = [];
    if (event.ctrlKey || event.metaKey) modifiers.push('CommandOrControl');
    if (event.altKey) modifiers.push('Alt');
    if (event.shiftKey) modifiers.push('Shift');

    const key = event.key;
    let shortcutKey = key;

    // Handle modifier keys
    if (modifiers.length > 0) {
      shortcutKey = `${modifiers.join('+')}+${key}`;
    }

    // Check for exact match
    const handler = shortcuts.get(shortcutKey);
    if (handler) {
      event.preventDefault();
      handler();
      return;
    }

    // Check for key only (no modifiers)
    if (modifiers.length === 0) {
      const keyOnlyHandler = shortcuts.get(key);
      if (keyOnlyHandler) {
        event.preventDefault();
        keyOnlyHandler();
        return;
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Listen to Tauri custom events for global shortcuts
 */
export function listenToTauriShortcuts(handlers: {
  onSearch?: () => void;
  onEscape?: () => void;
}) {
  if (typeof window === 'undefined' || !isTauri()) return;

  const handleTauriSearch = () => {
    handlers.onSearch?.();
  };

  const handleTauriEscape = () => {
    handlers.onEscape?.();
  };

  window.addEventListener('tauri-shortcut-search', handleTauriSearch);
  window.addEventListener('tauri-shortcut-escape', handleTauriEscape);

  return () => {
    window.removeEventListener('tauri-shortcut-search', handleTauriSearch);
    window.removeEventListener('tauri-shortcut-escape', handleTauriEscape);
  };
}

