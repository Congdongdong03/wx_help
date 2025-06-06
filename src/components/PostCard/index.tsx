import React, { memo } from "react";
import { View, Text } from "@tarojs/components";
import LazyImage from "../LazyImage";
import "./index.scss";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    images?: string[];
    author: {
      name: string;
      avatar: string;
    };
    createdAt: string;
  };
  onClick?: () => void;
}

const PostCard: React.FC<PostCardProps> = memo(({ post, onClick }) => {
  const { title, content, images, author, createdAt } = post;

  return (
    <View className="post-card" onClick={onClick}>
      <View className="post-header">
        <LazyImage
          src={author.avatar}
          alt={author.name}
          className="author-avatar"
          width={40}
          height={40}
        />
        <View className="author-info">
          <Text className="author-name">{author.name}</Text>
          <Text className="post-time">{createdAt}</Text>
        </View>
      </View>

      <View className="post-content">
        <Text className="post-title">{title}</Text>
        <Text className="post-text">{content}</Text>
        {images && images.length > 0 && (
          <View className="post-images">
            {images.map((image, index) => (
              <LazyImage
                key={index}
                src={image}
                alt={`图片 ${index + 1}`}
                className="post-image"
                width="100%"
                height={200}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
});

export default PostCard;
