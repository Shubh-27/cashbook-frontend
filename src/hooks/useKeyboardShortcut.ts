import { useEffect } from 'react';

type KeyCombo = string;

/**
 * Hook to handle keyboard shortcuts.
 * @param shortcut The shortcut string, e.g., "mod+shift+enter" or "mod+enter".
 * @param callback The function to call when the shortcut is triggered.
 * @param options Configuration options.
 */
export function useKeyboardShortcut(
  shortcut: KeyCombo,
  callback: (e: KeyboardEvent) => void,
  options: {
    enabled?: boolean;
    disableOnInput?: boolean;
    preventDefault?: boolean;
  } = {}
) {
  const { enabled = true, disableOnInput = true, preventDefault = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const keys = shortcut.toLowerCase().split('+');
      
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const modKey = isMac ? event.metaKey : event.ctrlKey;
      
      const match = keys.every(key => {
        if (key === 'mod') return modKey;
        if (key === 'ctrl') return event.ctrlKey;
        if (key === 'shift') return event.shiftKey;
        if (key === 'alt') return event.altKey;
        if (key === 'meta') return event.metaKey;
        
        // Handle specific keys like 'enter', 'escape', etc.
        return event.key.toLowerCase() === key;
      });

      if (match) {
        if (disableOnInput) {
          const target = event.target as HTMLElement;
          const isInput = 
            target.tagName === 'INPUT' || 
            target.tagName === 'TEXTAREA' || 
            target.isContentEditable;
          
          // Exception: allow mod+enter even in inputs/textareas if it's for submission
          const isSubmitShortcut = shortcut.toLowerCase() === 'mod+enter';
          
          if (isInput && !isSubmitShortcut) return;
        }

        if (preventDefault) {
          event.preventDefault();
        }
        callback(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcut, callback, enabled, disableOnInput, preventDefault]);
}
