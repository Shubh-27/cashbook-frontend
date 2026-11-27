import { useCallback, useEffect, useRef, useState } from 'react';

interface OverlayScrollbarOptions {
  topInset?: number;
  bottomInset?: number;
  leftInset?: number;
  rightInset?: number;
}

/**
 * Computes overlay scrollbar thumb geometry and drag-to-scroll handlers for a scrollable container,
 * auto-hiding when idle and staying clear of sticky headers/columns.
 */
export function useOverlayScrollbars(
  getElement: () => HTMLElement | null | undefined,
  deps: unknown[],
  { topInset = 8, bottomInset = 10, leftInset = 10, rightInset = 12 }: OverlayScrollbarOptions = {},
) {
  const [scrollMetrics, setScrollMetrics] = useState({
    vRatio: 0,
    vThumbPos: 0,
    vThumbSize: 0,
    hRatio: 0,
    hThumbPos: 0,
    hThumbSize: 0,
    showV: false,
    showH: false,
  });
  const [draggingAxis, setDraggingAxis] = useState<'v' | 'h' | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isHoveringScrollbar, setIsHoveringScrollbar] = useState(false);
  const scrollHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateScrollMetrics = useCallback(() => {
    const el = getElement();
    if (!el) return;
    const { scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth } = el;
    const maxV = Math.max(0, scrollHeight - clientHeight);
    const maxH = Math.max(0, scrollWidth - clientWidth);
    const vTrackLen = Math.max(0, clientHeight - topInset - bottomInset);
    const hTrackLen = Math.max(0, clientWidth - leftInset - rightInset);

    const showV = maxV > 1 && vTrackLen > 24;
    const showH = maxH > 1 && hTrackLen > 24;

    const vThumbSize = showV ? Math.min(vTrackLen, Math.max(28, (clientHeight / scrollHeight) * vTrackLen)) : 0;
    const hThumbSize = showH ? Math.min(hTrackLen, Math.max(28, (clientWidth / scrollWidth) * hTrackLen)) : 0;

    const vThumbPos = showV && maxV > 0 ? (scrollTop / maxV) * (vTrackLen - vThumbSize) : 0;
    const hThumbPos = showH && maxH > 0 ? (scrollLeft / maxH) * (hTrackLen - hThumbSize) : 0;

    setScrollMetrics({
      vRatio: maxV > 0 ? (vTrackLen - vThumbSize) / maxV : 0,
      vThumbPos,
      vThumbSize,
      hRatio: maxH > 0 ? (hTrackLen - hThumbSize) / maxH : 0,
      hThumbPos,
      hThumbSize,
      showV,
      showH,
    });
  }, [getElement, topInset, bottomInset, leftInset, rightInset]);

  useEffect(() => {
    const el = getElement();
    if (!el) return;
    updateScrollMetrics();
    const onScroll = () => {
      updateScrollMetrics();
      setIsScrolling(true);
      if (scrollHideTimerRef.current) clearTimeout(scrollHideTimerRef.current);
      scrollHideTimerRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 800);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateScrollMetrics) : null;
    ro?.observe(el);
    window.addEventListener('resize', updateScrollMetrics);
    return () => {
      el.removeEventListener('scroll', onScroll);
      ro?.disconnect();
      window.removeEventListener('resize', updateScrollMetrics);
      if (scrollHideTimerRef.current) clearTimeout(scrollHideTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateScrollMetrics, ...deps]);

  const startThumbDrag = (axis: 'v' | 'h', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = getElement();
    if (!el) return;
    const startCoord = axis === 'v' ? e.clientY : e.clientX;
    const startScroll = axis === 'v' ? el.scrollTop : el.scrollLeft;
    const ratio = axis === 'v' ? scrollMetrics.vRatio : scrollMetrics.hRatio;
    if (ratio <= 0) return;

    setDraggingAxis(axis);
    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = (axis === 'v' ? moveEvent.clientY : moveEvent.clientX) - startCoord;
      if (axis === 'v') {
        el.scrollTop = startScroll + delta / ratio;
      } else {
        el.scrollLeft = startScroll + delta / ratio;
      }
    };
    const onMouseUp = () => {
      setDraggingAxis(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return {
    scrollMetrics,
    draggingAxis,
    isScrolling,
    isHoveringScrollbar,
    setIsHoveringScrollbar,
    startThumbDrag,
    topInset,
    bottomInset,
    leftInset,
    rightInset,
  };
}
