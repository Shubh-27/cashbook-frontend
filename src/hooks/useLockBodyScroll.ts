import { useEffect } from 'react';

/**
 * Locks scrolling on the document body and `.mobile-scroll` containers while a modal/sheet is open.
 */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return;

    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const scrollContainers = Array.from(document.querySelectorAll<HTMLElement>('.mobile-scroll'));
    const prevOverflows = scrollContainers.map(el => el.style.overflow);
    scrollContainers.forEach(el => {
      el.style.overflow = 'hidden';
    });

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      scrollContainers.forEach((el, index) => {
        el.style.overflow = prevOverflows[index] ?? '';
      });
    };
  }, [locked]);
}
