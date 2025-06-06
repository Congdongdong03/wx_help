import { View, ScrollView } from "@tarojs/components";
import { useVirtualList } from "../../hooks/useVirtualList";
import { OptimizedPostCard } from "../OptimizedPostCard";
import { Post } from "../../types";
import "./index.scss";

interface OptimizedPostListProps {
  posts: Post[];
  onPostClick: (id: string) => void;
  loading?: boolean;
}

export const OptimizedPostList: React.FC<OptimizedPostListProps> = ({
  posts,
  onPostClick,
  loading = false,
}) => {
  const { visibleData, offsetY, handleScroll, totalHeight } = useVirtualList({
    data: posts,
    itemHeight: 300, // 每个卡片的高度（包含margin）
    containerHeight: 600, // 容器高度
    overscan: 3, // 预加载的项数
  });

  return (
    <View className="optimized-post-list">
      <ScrollView
        className="post-list-container"
        scrollY
        onScroll={handleScroll}
        style={{ height: "600px" }}
      >
        <View
          className="post-list-content"
          style={{ height: `${totalHeight}px`, position: "relative" }}
        >
          <View
            className="post-list-items"
            style={{ transform: `translateY(${offsetY}px)` }}
          >
            {visibleData.map((post) => (
              <OptimizedPostCard
                key={post.id}
                post={post}
                onClick={onPostClick}
              />
            ))}
          </View>
        </View>
      </ScrollView>
      {loading && <View className="loading-indicator">加载中...</View>}
    </View>
  );
};
