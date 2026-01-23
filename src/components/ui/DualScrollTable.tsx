import { useRef, useEffect, useCallback, useState, ReactNode } from 'react';

interface DualScrollTableProps {
  children: ReactNode;
  className?: string;
}

export function DualScrollTable({ children, className = '' }: DualScrollTableProps) {
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const isScrollingRef = useRef<'top' | 'bottom' | null>(null);

  const syncScroll = useCallback((source: 'top' | 'bottom') => {
    if (isScrollingRef.current && isScrollingRef.current !== source) return;

    isScrollingRef.current = source;
    const sourceEl = source === 'top' ? topScrollRef.current : bottomScrollRef.current;
    const targetEl = source === 'top' ? bottomScrollRef.current : topScrollRef.current;

    if (sourceEl && targetEl) {
      requestAnimationFrame(() => {
        targetEl.scrollLeft = sourceEl.scrollLeft;
      });
    }

    setTimeout(() => { isScrollingRef.current = null; }, 50);
  }, []);

  useEffect(() => {
    const content = bottomScrollRef.current?.firstElementChild as HTMLElement;
    if (!content) return;

    const observer = new ResizeObserver((entries) => {
      setContentWidth(entries[0].contentRect.width);
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  // Показываем верхний скроллбар только если контент шире контейнера
  const [showTopScroll, setShowTopScroll] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      const container = bottomScrollRef.current;
      if (container) {
        setShowTopScroll(container.scrollWidth > container.clientWidth);
      }
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [contentWidth]);

  return (
    <div className={`dual-scroll-wrapper ${className}`}>
      {/* Top scrollbar - показывается только если есть overflow */}
      {showTopScroll && (
        <div
          ref={topScrollRef}
          onScroll={() => syncScroll('top')}
          className="overflow-x-auto overflow-y-hidden border-b border-gray-300 bg-gray-100"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#64748b #e2e8f0',
            height: '14px',
            marginBottom: '4px'
          }}
        >
          <div style={{ width: contentWidth, height: 1 }} />
        </div>
      )}

      {/* Content with bottom scrollbar */}
      <div
        ref={bottomScrollRef}
        onScroll={() => syncScroll('bottom')}
        className="overflow-x-auto"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#94a3b8 #f1f5f9' }}
      >
        {children}
      </div>
    </div>
  );
}
