import { useVirtualList } from "../../hooks/useVirtualList";
import "./index.scss";

interface VirtualListProps<T> {
  list: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => any;
  overscan?: number;
  className?: string;
}

function VirtualList<T>({
  list,
  itemHeight,
  renderItem,
  overscan = 3,
  className = "",
}: VirtualListProps<T>) {
  const { virtualItems, totalHeight, containerRef, startIndex } =
    useVirtualList(list, {
      itemHeight,
      overscan,
    });

  return (
    <div
      ref={containerRef}
      className={`virtual-list ${className}`}
      style={{ height: "100%", overflow: "auto" }}
    >
      <div className="virtual-list-phantom" style={{ height: totalHeight }} />
      <div
        className="virtual-list-content"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          transform: `translateY(${startIndex * itemHeight}px)`,
        }}
      >
        {virtualItems.map((item, index) => (
          <div key={startIndex + index} style={{ height: itemHeight }}>
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default VirtualList;
