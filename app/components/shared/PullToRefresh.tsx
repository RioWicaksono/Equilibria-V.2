'use client';

import { useState, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
}

export default function PullToRefresh({
  children,
  onRefresh,
  threshold = 80
}: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const isRefreshingRef = useRef(false);

  // Keep ref in sync with state
  const setAndTrackRefreshing = useCallback((value: boolean) => {
    isRefreshingRef.current = value;
    setIsRefreshing(value);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollTop = window.scrollY;
    if (scrollTop === 0 && !isRefreshingRef.current) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPullingRef.current || isRefreshingRef.current) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startYRef.current);
    setPullDistance(Math.min(distance, threshold * 1.5));
    setPulling(distance > 20);
  }, [threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (pulling && pullDistance > threshold && !isRefreshingRef.current) {
      setAndTrackRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setAndTrackRefreshing(false);
      }
    }
    setPulling(false);
    setPullDistance(0);
    isPullingRef.current = false;
  }, [pulling, pullDistance, threshold, onRefresh, setAndTrackRefreshing]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull Indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{
          height: isRefreshing ? 60 : pullDistance,
          opacity: pullDistance > 10 || isRefreshing ? 1 : 0
        }}
      >
        <div
          className={`flex flex-col items-center gap-1 transition-transform duration-200 ${
            pullDistance > threshold ? 'text-teal-400' : 'text-zinc-500'
          }`}
          style={{
            transform: pullDistance > threshold
              ? 'rotate(180deg)'
              : `rotate(${Math.min(pullDistance / threshold * 180, 179)}deg)`
          }}
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="text-[10px] font-medium">
            {isRefreshing ? 'Memuat...' : pullDistance > threshold ? 'Lepas untuk refresh' : 'Tarik ke bawah'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${isRefreshing ? 60 : pullDistance * 0.3}px)`,
          transition: isRefreshing ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
}
