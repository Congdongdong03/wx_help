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

const PostCard = ({ post, isPinned }: PostCardProps) => {
  const handlePostClick = () => {
    // Validate that post has a valid ID before navigation
    if (!post.id || post.id === undefined || post.id === null) {
      console.warn("Post has no valid ID:", post);
      Taro.showToast({
        title: "帖子信息不完整",
        icon: "none",
        duration: 2000,
      });
      return;
    }

    // 处理不同类型的帖子
    if (typeof post.id === "number") {
      // 真实帖子，跳转到详情页
      Taro.navigateTo({ url: `/pages/detail/index?id=${post.id}` });
    } else if (
      typeof post.id === "string" &&
      post.id.startsWith("catalogue_")
    ) {
      // 宣传图片，跳转到轮播图页面
      Taro.navigateTo({ url: `/pages/catalogue-image/index?id=${post.id}` });
    } else {
      // 其他情况，显示提示
      Taro.showToast({
        title: "无法识别的帖子类型",
        icon: "none",
        duration: 2000,
      });
    }
  };

  return (
    <View className="post-card" onClick={handlePostClick}>
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
            : "70rpx",
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
