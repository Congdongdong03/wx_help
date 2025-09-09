import Taro from "@tarojs/taro";

// 使用统一的FeedPost类型

interface PostListResponse {
  posts: any[];
  total: number;
  page: number;
  pageSize: number;
}

export function usePostService() {
  // 获取帖子列表
  const getPostList = async (
    page: number,
    pageSize: number
  ): Promise<PostListResponse> => {
    try {
      const { data } = await Taro.request({
        url: "/api/posts",
        method: "GET",
        data: {
          page,
          pageSize,
        },
      });

      return data;
    } catch (error) {
      console.error("Failed to fetch post list:", error);
      throw error;
    }
  };

  // 获取帖子详情
  const getPostDetail = async (id: string): Promise<any> => {
    try {
      const { data } = await Taro.request({
        url: `/api/posts/${id}`,
        method: "GET",
      });

      return data;
    } catch (error) {
      console.error("Failed to fetch post detail:", error);
      throw error;
    }
  };

  return {
    getPostList,
    getPostDetail,
  };
}
