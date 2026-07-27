'use client';

/**
 * Virtualized List Component
 *
 * Uses windowing to efficiently render large lists (>100 items).
 * Built on top of native CSS containment for simplicity.
 *
 * For very large lists (1000+), consider using @tanstack/react-virtual.
 */

import { useRef, useEffect, useState, useCallback, type ReactNode, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  estimatedItemHeight?: number;
  overscan?: number;
  className?: string;
  itemClassName?: string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  keyExtractor?: (item: T, index: number) => string;
  emptyComponent?: ReactNode;
  loadingComponent?: ReactNode;
  isLoading?: boolean;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  estimatedItemHeight = 60,
  overscan = 5,
  className,
  itemClassName,
  onEndReached,
  endReachedThreshold = 200,
  keyExtractor,
  emptyComponent,
  loadingComponent,
  isLoading = false,
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const totalHeight = items.length * estimatedItemHeight;

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const viewportHeight = container.clientHeight;

    const start = Math.max(0, Math.floor(scrollTop / estimatedItemHeight) - overscan);
    const visibleCount = Math.ceil(viewportHeight / estimatedItemHeight);
    const end = Math.min(items.length, start + visibleCount + overscan * 2);

    setVisibleRange({ start, end });

    // Check for end reached
    if (onEndReached) {
      const scrollBottom = scrollTop + viewportHeight;
      const contentBottom = items.length * estimatedItemHeight;
      if (contentBottom - scrollBottom < endReachedThreshold) {
        onEndReached();
      }
    }
  }, [items.length, estimatedItemHeight, overscan, onEndReached, endReachedThreshold]);

  useEffect(() => {
    handleScroll();
  }, [handleScroll]);

  // Reset scroll when items change significantly
  useEffect(() => {
    if (containerRef.current && items.length < visibleRange.end + overscan) {
      containerRef.current.scrollTop = 0;
      setVisibleRange({ start: 0, end: Math.min(items.length, 20) });
    }
  }, [items.length]);

  if (items.length === 0 && !isLoading) {
    return emptyComponent ? (
      <div className={className}>{emptyComponent}</div>
    ) : null;
  }

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      onScroll={handleScroll}
      style={{ contain: 'strict' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {items.slice(visibleRange.start, visibleRange.end).map((item, index) => {
          const actualIndex = visibleRange.start + index;
          return (
            <div
              key={keyExtractor ? keyExtractor(item, actualIndex) : actualIndex}
              style={{
                position: 'absolute',
                top: actualIndex * estimatedItemHeight,
                left: 0,
                right: 0,
                height: estimatedItemHeight,
              }}
              className={itemClassName}
            >
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>
      {isLoading && loadingComponent && (
        <div className="p-4 text-center">{loadingComponent}</div>
      )}
    </div>
  );
}

// ============================================
// SIMPLE INFINITE SCROLL
// ============================================

interface InfiniteScrollProps {
  children: ReactNode;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  loader?: ReactNode;
  endMessage?: ReactNode;
  className?: string;
}

export function InfiniteScroll({
  children,
  hasMore,
  isLoading,
  onLoadMore,
  loader,
  endMessage,
  className,
}: InfiniteScrollProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, isLoading, onLoadMore]);

  return (
    <div className={cn('space-y-4', className)}>
      {children}
      <div ref={loadMoreRef}>
        {isLoading && (loader || <div className="text-center p-4">Memuat...</div>)}
        {!hasMore && !isLoading && (endMessage || <div className="text-center p-4 text-muted-foreground">Semua data sudah dimuat</div>)}
      </div>
    </div>
  );
}

// ============================================
// VIRTUALIZED GRID
// ============================================

interface VirtualizedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  columns?: number;
  gap?: number;
  className?: string;
  keyExtractor?: (item: T, index: number) => string;
}

export function VirtualizedGrid<T>({
  items,
  renderItem,
  columns = 3,
  gap = 16,
  className,
  keyExtractor,
}: VirtualizedGridProps<T>) {
  return (
    <div
      className={cn('grid gap-4', className)}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
      }}
    >
      {items.map((item, index) => (
        <div key={keyExtractor ? keyExtractor(item, index) : index}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

// ============================================
// LAZY LOADING IMAGE LIST
// ============================================

interface LazyImageListProps {
  images: { src: string; alt: string }[];
  renderItem?: (src: string, alt: string, index: number) => ReactNode;
  className?: string;
  placeholder?: ReactNode;
}

export function LazyImageList({
  images,
  renderItem,
  className,
  placeholder,
}: LazyImageListProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {images.map((image, index) => (
        <LazyImage
          key={index}
          src={image.src}
          alt={image.alt}
        >
          {renderItem ? renderItem(image.src, image.alt, index) : null}
        </LazyImage>
      ))}
    </div>
  );
}

function LazyImage({
  src,
  alt,
  children,
}: {
  src: string;
  alt: string;
  children?: ReactNode;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className="relative">
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      {isInView && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={cn(
            'w-full h-auto transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setIsLoaded(true)}
        />
      )}
      {children}
    </div>
  );
}
