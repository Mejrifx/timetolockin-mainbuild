import React, { useMemo } from 'react';
import { useVirtualization } from '@/hooks/useVirtualization';
import { cn } from '@/lib/utils';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  height: number;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  height,
  className,
  overscan = 5,
  onScroll,
}: VirtualizedListProps<T>) {
  const {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
  } = useVirtualization(items, {
    itemHeight,
    containerHeight: height,
    overscan,
  });

  const handleScrollEvent = (e: React.UIEvent<HTMLDivElement>) => {
    handleScroll(e);
    onScroll?.(e.currentTarget.scrollTop);
  };

  return (
    <div
      className={cn("overflow-auto", className)}
      style={{ height }}
      onScroll={handleScrollEvent}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <div
              key={index}
              style={{ height: itemHeight }}
              className="flex-shrink-0"
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Specialized component for pages list in sidebar
interface VirtualizedPagesListProps {
  pages: any[];
  renderPage: (page: any, index: number) => React.ReactNode;
  height: number;
  searchQuery?: string;
  className?: string;
}

export function VirtualizedPagesList({
  pages,
  renderPage,
  height,
  searchQuery,
  className,
}: VirtualizedPagesListProps) {
  const filteredPages = useMemo(() => {
    if (!searchQuery) return pages;
    
    const query = searchQuery.toLowerCase();
    return pages.filter(page => 
      page.title.toLowerCase().includes(query) ||
      page.content.toLowerCase().includes(query) ||
      (page.blocks || []).some((block: any) => 
        typeof block.content === 'string' && 
        block.content.toLowerCase().includes(query)
      )
    );
  }, [pages, searchQuery]);

  return (
    <VirtualizedList
      items={filteredPages}
      renderItem={renderPage}
      itemHeight={40} // Approximate height of a page item
      height={height}
      className={className}
      overscan={10} // Render a few extra items for smooth scrolling
    />
  );
}

// Specialized component for daily tasks list
interface VirtualizedTasksListProps {
  tasks: any[];
  renderTask: (task: any, index: number) => React.ReactNode;
  height: number;
  className?: string;
}

export function VirtualizedTasksList({
  tasks,
  renderTask,
  height,
  className,
}: VirtualizedTasksListProps) {
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // Sort by priority and completion status
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      
      const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
    });
  }, [tasks]);

  return (
    <VirtualizedList
      items={sortedTasks}
      renderItem={renderTask}
      itemHeight={60} // Approximate height of a task item
      height={height}
      className={className}
      overscan={5}
    />
  );
}

// Hook for calculating optimal virtual list height
export function useOptimalListHeight(
  containerRef: React.RefObject<HTMLElement>,
  reservedHeight: number = 200
) {
  const [listHeight, setListHeight] = React.useState(400);

  React.useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const optimalHeight = Math.max(200, containerHeight - reservedHeight);
        setListHeight(optimalHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    
    return () => window.removeEventListener('resize', updateHeight);
  }, [containerRef, reservedHeight]);

  return listHeight;
}
