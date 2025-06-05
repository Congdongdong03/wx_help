import Taro from "@tarojs/taro";
import { View } from "@tarojs/components";
import { useState } from "react";
import PostImage from "./PostImage";
import PostContent from "./PostContent";
import "./index.scss"; // We will create this SCSS file

// Define a common interface for data the PostCard expects
// This should be general enough for both FeedPost and FavoritePost (or any other source)
export interface PostCardData {
  id: string;
  mockImagePlaceholderHeight?: number;
  mockImagePlaceholderColor?: string;
  coverImage?: string;
  title: string;
  description?: string; // Description might be optional for some card uses
  category: {
    // Assuming category will always have a name and color
    name: string;
    color: string;
  };
  price?: string | number;
  // Instead of specific updateTime or collectedTime, use a general displayTime
  displayTimeText: string; // This will be pre-formatted time string
  // Add any other fields that PostCard strictly needs to display
}

interface PostCardProps {
  post: PostCardData;
  onCardClick?: (id: string) => void; // Optional click handler for the whole card
}

// Helper function to format time - can be moved to a utils file
// For now, keeping it here if PostCard is the only consumer.
// Or, better, ensure time is pre-formatted before passing to PostCard.
// const formatRelativeTime = (date: Date): string => { ... }; // Removed as we expect pre-formatted displayTimeText

const PostCard: React.FC<PostCardProps> = ({ post, onCardClick }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCardClick = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      if (onCardClick) {
        await onCardClick(post.id);
      } else {
        await Taro.navigateTo({ url: `/pages/detail/index?id=${post.id}` });
      }
    } catch (error) {
      Taro.showToast({
        title: "操作失败，请重试",
        icon: "none",
        duration: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      className={`post-card-component ${isLoading ? "loading" : ""}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-label={`查看帖子：${post.title}`}
      onKeyPress={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleCardClick();
        }
      }}
    >
      <PostImage
        mockImagePlaceholderHeight={post.mockImagePlaceholderHeight}
        mockImagePlaceholderColor={post.mockImagePlaceholderColor}
        coverImage={post.coverImage}
        alt={post.title}
      />
      <PostContent
        title={post.title}
        description={post.description}
        category={post.category}
        price={post.price}
        displayTimeText={post.displayTimeText}
      />
    </View>
  );
};

export default PostCard;
