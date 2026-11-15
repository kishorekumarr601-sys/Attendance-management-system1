import { useEffect } from 'react';

export function useKeyboardShortcuts(onSearchFocus?: () => void, onEscape?: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (e.key === '/' && !isInput && onSearchFocus) {
        e.preventDefault();
        onSearchFocus();
      } else if (e.key === 'Escape' && onEscape) {
        onEscape();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSearchFocus, onEscape]);
}
