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
    maxSize: 10, // 最多缓存10页
  },
  POST_DETAIL: {
    expiresIn: 10 * 60 * 1000, // 10分钟
    maxSize: 50, // 最多缓存50个帖子详情
  },
};

export function usePostService() {
  // 创建列表缓存和详情缓存
  const listCache = useCache<PostListResponse>(CACHE_CONFIG.POST_LIST);
  const detailCache = useCache<Post>(CACHE_CONFIG.POST_DETAIL);

  // 获取帖子列表
  const getPostList = async (
    page: number,
    pageSize: number
  ): Promise<PostListResponse> => {
    const cacheKey = `post_list_${page}_${pageSize}`;

    // 尝试从缓存获取
    const cachedData = listCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      // 从API获取数据
      const { data } = await Taro.request({
        url: "/api/posts",
        method: "GET",
        data: {
          page,
          pageSize,
        },
      });

      // 存入缓存
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

    // 尝试从缓存获取
    const cachedData = detailCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      // 从API获取数据
      const { data } = await Taro.request({
        url: `/api/posts/${id}`,
        method: "GET",
      });

      // 存入缓存
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
