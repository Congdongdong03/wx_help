import { useState, useEffect, useRef, useCallback } from "react";

interface VirtualListOptions {
  itemHeight: number;
  overscan?: number;
  initialScrollTop?: number;
}

interface VirtualListResult<T> {
  virtualItems: T[];
  totalHeight: number;
  startIndex: number;
  endIndex: number;
  containerRef: React.RefObject<HTMLDivElement>;
  scrollToIndex: (index: number) => void;
}

export function useVirtualList<T>(
  list: T[],
  options: VirtualListOptions
): VirtualListResult<T> {
  const { itemHeight, overscan = 3, initialScrollTop = 0 } = options;
  const [scrollTop, setScrollTop] = useState(initialScrollTop);
  const containerRef = useRef<HTMLDivElement>(null);

  // 计算可见区域能显示的项目数量
  const visibleCount =
    Math.ceil(window.innerHeight / itemHeight) + overscan * 2;

  // 计算起始索引
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);

  // 计算结束索引
  const endIndex = Math.min(list.length - 1, startIndex + visibleCount - 1);

  // 获取虚拟列表项
  const virtualItems = list.slice(startIndex, endIndex + 1);

  // 计算总高度
  const totalHeight = list.length * itemHeight;

  // 处理滚动事件
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  // 滚动到指定索引
  const scrollToIndex = useCallback(
    (index: number) => {
      if (containerRef.current) {
        const scrollTop = index * itemHeight;
        containerRef.current.scrollTo({
          top: scrollTop,
          behavior: "smooth",
        });
      }
    },
    [itemHeight]
  );

  // 添加滚动事件监听
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => {
        container.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll]);

  return {
    virtualItems,
    totalHeight,
    startIndex,
    endIndex,
    containerRef,
    scrollToIndex,
  };
}
