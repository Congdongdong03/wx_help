import Taro from "@tarojs/taro";
import { useCache } from "../hooks/useCache";

interface Post {
  id: string;
  title: string;
  content: string;
  images?: string[];
  author: {
    name: string;
    avatar: string;
  };
  createdAt: string;
}

interface PostListResponse {
  posts: Post[];
  total: number;
  page: number;
  pageSize: number;
}

// 缓存配置
const CACHE_CONFIG = {
  POST_LIST: {
    expiresIn: 5 * 60 * 1000, // 5分钟
    maxSize: 10,
  },
  POST_DETAIL: {
    expiresIn: 10 * 60 * 1000, // 10分钟
    maxSize: 50,
  },
};

export function usePostService() {
  const listCache = useCache<PostListResponse>(CACHE_CONFIG.POST_LIST);
  const detailCache = useCache<Post>(CACHE_CONFIG.POST_DETAIL);

  // 获取帖子列表
  const getPostList = async (
    page: number,
    pageSize: number
  ): Promise<PostListResponse> => {
    const cacheKey = `post_list_${page}_${pageSize}`;

    const cachedData = listCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const { data } = await Taro.request({
        url: "/api/posts",
        method: "GET",
        data: {
          page,
          pageSize,
        },
      });

      listCache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Failed to fetch post list:", error);
      throw error;
    }
  };

  // 获取帖子详情
  const getPostDetail = async (id: string): Promise<Post> => {
    const cacheKey = `post_detail_${id}`;

    const cachedData = detailCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const { data } = await Taro.request({
        url: `/api/posts/${id}`,
        method: "GET",
      });

      detailCache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Failed to fetch post detail:", error);
      throw error;
    }
  };

  // 清除帖子列表缓存
  const clearPostListCache = () => {
    listCache.clear();
  };

  // 清除帖子详情缓存
  const clearPostDetailCache = (id?: string) => {
    if (id) {
      detailCache.remove(`post_detail_${id}`);
    } else {
      detailCache.clear();
    }
  };

  return {
    getPostList,
    getPostDetail,
    clearPostListCache,
    clearPostDetailCache,
  };
}
