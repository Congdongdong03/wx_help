import Taro from "@tarojs/taro";
import { View, Text, Image } from "@tarojs/components";
import { FeedPost, Category } from "../../types"; // Assuming types are here
import { SUB_CATEGORIES } from "../../constants"; // Assuming constants are here
import { formatRelativeTime } from "../../utils/time"; // Assuming utils are here
import { getSubCategoryIcon } from "../../utils/categoryUtils"; // Import the new utility function
import "./index.scss";

interface PostCardProps {
  post: FeedPost;
  isPinned?: boolean;
}

const DEFAULT_IMAGE_URL =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb";

const PostCard: React.FC<PostCardProps> = ({ post, isPinned }) => {
  return (
    <View
      className="post-card"
      onClick={() =>
        Taro.navigateTo({ url: `/pages/detail/index?id=${post.id}` })
      }
    >
      {isPinned && (
        <View className="post-card-pin-indicator">
          <Text>置顶</Text>
        </View>
      )}
      {post.status === "pending" && post.title !== "草稿" && (
        <View className="post-card-status pending">
          <Text>审核中</Text>
        </View>
      )}
      <Image
        className="post-card-image"
        src={post.cover_image || DEFAULT_IMAGE_URL}
        mode="aspectFill"
        style={{
          height: post.mockImagePlaceholderHeight
            ? `${post.mockImagePlaceholderHeight}rpx`
            : "400rpx",
        }}
      />
      <View className="post-card-content">
        <View className="post-card-title">
          {post.sub_category && (
            <Text className="post-card-category-sub">
              {getSubCategoryIcon(post.category.id, post.sub_category)}
            </Text>
          )}
          <Text numberOfLines={2}>{post.title || "无标题"}</Text>
        </View>
        <Text className="post-card-description" numberOfLines={2}>
          {post.content_preview || "暂无描述"}
        </Text>
        <View className="post-card-footer">
          <View className="post-card-tags">
            <Text
              className="post-card-category-tag"
              style={{ backgroundColor: post.category.color }}
            >
              {post.category.name}
            </Text>
            {post.price && (
              <Text className="post-card-price-tag">￥{post.price}</Text>
            )}
          </View>
          <Text className="post-card-time">
            {formatRelativeTime(new Date(post.updated_at))}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default PostCard;
