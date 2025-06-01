import Taro from "@tarojs/taro";
import { View, Text, Image } from "@tarojs/components";
import "./index.scss"; // We will create this SCSS file

// Define a common interface for data the PostCard expects
// This should be general enough for both FeedPost and FavoritePost (or any other source)
export interface PostCardData {
  id: string;
  mockImagePlaceholderHeight?: number;
  mockImagePlaceholderColor?: string;
  // coverImage?: string; // Uncomment if using real images
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
  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(post.id);
    } else {
      // Default navigation if no specific handler is passed
      Taro.navigateTo({ url: `/pages/detail/index?id=${post.id}` });
    }
  };

  return (
    <View
      className="post-card-component" // Use a distinct class for the component
      onClick={handleCardClick}
    >
      {post.mockImagePlaceholderHeight && post.mockImagePlaceholderColor && (
        <View
          className="pcc-image-placeholder" // Prefixed to avoid collision
          style={{
            height: `${post.mockImagePlaceholderHeight}rpx`,
            backgroundColor: post.mockImagePlaceholderColor,
          }}
        />
      )}
      {/* Uncomment if using real images
      {post.coverImage && (
        <Image
          className="pcc-image"
          src={post.coverImage}
          mode="aspectFill"
          lazyLoad
        />
      )}
      */}
      <View className="pcc-content">
        <Text className="pcc-title" numberOfLines={2}>
          {post.title}
        </Text>
        {post.description && (
          <Text className="pcc-description" numberOfLines={2}>
            {post.description.substring(0, 50)}...
          </Text>
        )}
        <View className="pcc-footer">
          <View className="pcc-tags">
            <Text
              className="pcc-category-tag"
              style={{ backgroundColor: post.category.color }}
            >
              {post.category.name}
            </Text>
            {post.price && <Text className="pcc-price-tag">{post.price}</Text>}
          </View>
          <Text className="pcc-time">{post.displayTimeText}</Text>
        </View>
      </View>
    </View>
  );
};

export default PostCard;
