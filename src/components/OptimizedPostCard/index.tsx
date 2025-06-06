import { memo } from "react";
import { View, Text, Image } from "@tarojs/components";
import { Post } from "../../types";
import "./index.scss";

interface PostCardProps {
  post: Post;
  onClick: (id: string) => void;
}

export const OptimizedPostCard = memo<PostCardProps>(
  ({ post, onClick }) => {
    return (
      <View className="post-card" onClick={() => onClick(post.id)}>
        {post.images && post.images.length > 0 && (
          <Image
            className="post-image"
            src={post.images[0]}
            mode="aspectFill"
            lazyLoad
          />
        )}
        <View className="post-content">
          <Text className="title">{post.title}</Text>
          {post.price && <Text className="price">¥{post.price}</Text>}
          <Text className="description">{post.description}</Text>
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // 自定义比较函数，只在必要时重新渲染
    return (
      prevProps.post.id === nextProps.post.id &&
      prevProps.post.title === nextProps.post.title &&
      prevProps.post.price === nextProps.post.price &&
      prevProps.post.description === nextProps.post.description &&
      prevProps.post.images?.[0] === nextProps.post.images?.[0]
    );
  }
);
