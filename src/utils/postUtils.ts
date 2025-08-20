import Taro from "@tarojs/taro";
import { FeedPost, Category } from "../types";
import { CATEGORIES } from "../constants";

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
    title: item.title,
    content: item.content,
    category: {
      id: item.category_id,
      name: CATEGORIES.find((cat) => cat.id === item.category_id)?.name || "",
      color: CATEGORIES.find((cat) => cat.id === item.category_id)?.color || "",
    },
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
  if (!Array.isArray(posts)) {
    console.warn("distributePosts: posts is not an array:", posts);
    return [[], []];
  }

  const leftColumn: FeedPost[] = [];
  const rightColumn: FeedPost[] = [];
  let leftHeight = 0;
  let rightHeight = 0;

  posts.forEach((post) => {
    const imageHeight = 300; // 固定图片高度
    const contentHeight = 180;
    const cardHeight = imageHeight + contentHeight;

    if (leftHeight <= rightHeight) {
      leftColumn.push(post);
      leftHeight += cardHeight + 20;
    } else {
      rightColumn.push(post);
      rightHeight += cardHeight + 20;
    }
  });

  return [leftColumn, rightColumn];
};
