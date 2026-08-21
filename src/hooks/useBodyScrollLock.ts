import { useEffect } from 'react';

/**
 * Custom hook to lock body & layout scrolling when a modal or overlay is open.
 * Prevents background page from scrolling without creating blank right-side gutters.
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalDocOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Also lock main container scroll if present in layout
    const mainContainers = Array.from(document.querySelectorAll('main, .dashboard-main-scrollbar')) as HTMLElement[];
    const originalMainOverflows = mainContainers.map(el => el.style.overflow);
    mainContainers.forEach(el => {
      el.style.overflow = 'hidden';
    });

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalDocOverflow;
      mainContainers.forEach((el, idx) => {
        el.style.overflow = originalMainOverflows[idx] || '';
      });
    };
  }, [isLocked]);
}

export default useBodyScrollLock;
