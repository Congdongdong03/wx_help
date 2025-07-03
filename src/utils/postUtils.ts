import Taro from "@tarojs/taro";
import { FeedPost, Category } from "../types";
import {
  PRESET_PLACEHOLDER_HEIGHTS,
  PRESET_PLACEHOLDER_COLORS,
  CATEGORIES,
} from "../constants";

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}天前`;
  }
  if (hours > 0) {
    return `${hours}小时前`;
  }
  if (minutes > 0) {
    return `${minutes}分钟前`;
  }
  return "刚刚";
};

export const handlePostError = (error: any): void => {
  console.error("Post operation error:", error);

  let errorMessage = "操作失败，请重试";

  if (error.response) {
    switch (error.response.status) {
      case 401:
        errorMessage = "请先登录";
        break;
      case 403:
        errorMessage = "没有权限执行此操作";
        break;
      case 404:
        errorMessage = "内容不存在";
        break;
      case 500:
        errorMessage = "服务器错误，请稍后重试";
        break;
    }
  }

  Taro.showToast({
    title: errorMessage,
    icon: "none",
    duration: 2000,
  });
};

export const validatePostData = (data: any): boolean => {
  if (!data.title || data.title.trim().length === 0) {
    Taro.showToast({
      title: "标题不能为空",
      icon: "none",
      duration: 2000,
    });
    return false;
  }

  if (data.title.length > 100) {
    Taro.showToast({
      title: "标题不能超过100个字符",
      icon: "none",
      duration: 2000,
    });
    return false;
  }

  if (data.description && data.description.length > 500) {
    Taro.showToast({
      title: "描述不能超过500个字符",
      icon: "none",
      duration: 2000,
    });
    return false;
  }

  return true;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return "";
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

export const mapToFeedPost = (item: any): FeedPost => {
  let images: string[] = [];
  if (Array.isArray(item.images)) {
    images = item.images;
  } else if (typeof item.images === "string") {
    try {
      const parsed = JSON.parse(item.images);
      if (Array.isArray(parsed)) {
        images = parsed;
      }
    } catch {
      images = [];
    }
  }
  return {
    id: item.id,
    mockImagePlaceholderHeight:
      PRESET_PLACEHOLDER_HEIGHTS[
        Math.floor(Math.random() * PRESET_PLACEHOLDER_HEIGHTS.length)
      ],
    mockImagePlaceholderColor:
      PRESET_PLACEHOLDER_COLORS[
        Math.floor(Math.random() * PRESET_PLACEHOLDER_COLORS.length)
      ],
    title: item.title,
    content: item.content,
    content_preview: item.content_preview,
    category: {
      id: item.category_id,
      name: CATEGORIES.find((cat) => cat.id === item.category_id)?.name || "",
      color: CATEGORIES.find((cat) => cat.id === item.category_id)?.color || "",
    },
    sub_category: item.sub_category,
    price: item.price,
    updated_at: item.updated_at,
    created_at: item.created_at,
    city_code: item.city_code,
    status: item.status,
    images: images,
    cover_image: item.cover_image,
    is_pinned: item.is_pinned,
    is_weekly_deal: item.is_weekly_deal,
    users: item.users,
  };
};

export const distributePosts = (
  posts: FeedPost[]
): [FeedPost[], FeedPost[]] => {
  const leftColumn: FeedPost[] = [];
  const rightColumn: FeedPost[] = [];
  let leftHeight = 0;
  let rightHeight = 0;

  posts.forEach((post) => {
    // 估算卡片高度 (图片高度 + 内容高度)
    const imageHeight = post.mockImagePlaceholderHeight || 300;
    const contentHeight = 180; // 估算的内容区域高度
    const cardHeight = imageHeight + contentHeight;

    // 选择高度较小的列
    if (leftHeight <= rightHeight) {
      leftColumn.push(post);
      leftHeight += cardHeight + 20; // 加上margin
    } else {
      rightColumn.push(post);
      rightHeight += cardHeight + 20; // 加上margin
    }
  });

  return [leftColumn, rightColumn];
};
