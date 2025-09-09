import Taro from "@tarojs/taro";
import { useState, useEffect, useCallback } from "react";
import { API_CONFIG } from "../config/api";
import { CATEGORIES } from "../constants";
import { distributePosts } from "../utils/postUtils";

// 使用统一的类型定义

interface UsePostsOptions {
  selectedCity: string;
  selectedCategoryId: string;
}

interface UsePostsReturn {
  displayedPosts: any[];
  pinnedPosts: any[];
  normalPosts: any[];
  isLoading: boolean;
  loadError: boolean;
  hasMoreData: boolean;
  refreshing: boolean;
  currentPage: number;
  loadPosts: (
    city: string,
    categoryId: string,
    page: number,
    append?: boolean
  ) => Promise<void>;
  loadMore: () => void;
  refresh: () => Promise<void>;
  retryLoad: () => void;
  isRecommendFirstPage: boolean;
  pinnedPostsToShow: any[];
  mixedPosts: any[];
  leftColumnPosts: any[];
  rightColumnPosts: any[];
}

const POSTS_PER_PAGE = 10;

export const usePosts = ({
  selectedCity,
  selectedCategoryId,
}: UsePostsOptions): UsePostsReturn => {
  const [displayedPosts, setDisplayedPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMoreData, setHasMoreData] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [pinnedPosts, setPinnedPosts] = useState<any[]>([]);
  const [normalPosts, setNormalPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // 数据映射函数
  const mapToFeedPost = (item: any): any => {
    if (!item.id) return null;

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
      title: item.title || "无标题",
      content: item.content || "暂无描述",
      content_preview:
        item.content_preview ||
        (item.content ? item.content.slice(0, 50) + "..." : "暂无描述"),
      category:
        CATEGORIES.find((c) => c.id === (item.category || "recommend")) ||
        CATEGORIES[0],
      sub_category: item.sub_category || "",
      price: item.price || undefined,
      updated_at: item.updated_at || new Date().toISOString(),
      created_at: item.created_at || new Date().toISOString(),
      city_code: item.city_code || selectedCity,
      status: item.status || "published",
      images,
      cover_image:
        images[0] ||
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
      is_pinned: item.is_pinned || false,
      is_weekly_deal: item.is_weekly_deal || false,
      users: item.users
        ? {
            id: item.users.id,
            nickname: item.users.nickname || "未知用户",
            avatar_url:
              item.users.avatar_url || "https://example.com/default-avatar.png",
          }
        : undefined,
    };
  };

  // 加载帖子数据
  const loadPosts = useCallback(
    async (
      city: string,
      categoryId: string,
      page: number,
      append: boolean = false
    ) => {
      if (isLoading) return;

      setIsLoading(true);
      setLoadError(false);

      try {
        const baseParams: any = { city };
        if (categoryId && categoryId !== "recommend") {
          baseParams.category = categoryId;
        }

        // 并行请求置顶帖子和普通帖子
        const [pinnedResponse, normalResponse] = await Promise.all([
          Taro.request({
            url: API_CONFIG.getApiUrl("/posts/pinned"),
            method: "GET",
            data: { ...baseParams, limit: 10 },
          }),
          Taro.request({
            url: API_CONFIG.getApiUrl("/posts/normal"),
            method: "GET",
            data: { ...baseParams, page, limit: POSTS_PER_PAGE },
          }),
        ]);

        // 处理置顶帖子
        let pinnedPosts: any[] = [];
        if (pinnedResponse.data?.code === 0 && pinnedResponse.data.data) {
          const pinnedData = pinnedResponse.data.data.pinned_posts || [];
          pinnedPosts = pinnedData.map(mapToFeedPost).filter(Boolean);
        }

        // 处理普通帖子
        let normalPosts: any[] = [];
        let pagination = {
          currentPage: page,
          totalPages: 1,
          totalPosts: 0,
          limit: POSTS_PER_PAGE,
        };

        if (normalResponse.data?.code === 0 && normalResponse.data.data) {
          const { posts, pagination: paginationData } =
            normalResponse.data.data;
          normalPosts = posts.map(mapToFeedPost).filter(Boolean);
          pagination = paginationData;
        }

        setPinnedPosts(pinnedPosts);
        setNormalPosts((prevPosts) =>
          append ? [...prevPosts, ...normalPosts] : normalPosts
        );

        if (categoryId !== "recommend") {
          setDisplayedPosts((prevPosts) =>
            append ? [...prevPosts, ...normalPosts] : normalPosts
          );
        } else {
          setDisplayedPosts([]);
        }

        setHasMoreData(page < pagination.totalPages);
        setCurrentPage(page);
      } catch (error) {
        console.error("Failed to load posts:", error);
        setLoadError(true);
        Taro.showToast({
          title: "加载失败，请检查网络连接",
          icon: "none",
          duration: 2000,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  // 加载更多
  const loadMore = useCallback(() => {
    if (!isLoading && hasMoreData) {
      loadPosts(selectedCity, selectedCategoryId, currentPage + 1, true);
    }
  }, [
    isLoading,
    hasMoreData,
    currentPage,
    selectedCity,
    selectedCategoryId,
    loadPosts,
  ]);

  // 重试加载
  const retryLoad = useCallback(() => {
    setDisplayedPosts([]);
    setCurrentPage(1);
    setHasMoreData(true);
    loadPosts(selectedCity, selectedCategoryId, 1);
  }, [selectedCity, selectedCategoryId, loadPosts]);

  // 下拉刷新
  const refresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMoreData(true);
    await loadPosts(selectedCity, selectedCategoryId, 1, false);
    setRefreshing(false);
  }, [selectedCity, selectedCategoryId, loadPosts]);

  // 计算属性
  const isRecommendFirstPage =
    selectedCategoryId === "recommend" && currentPage === 1;

  let pinnedPostsToShow: any[] = [];
  let mixedPosts: any[] = [];

  if (isRecommendFirstPage && pinnedPosts.length > 0) {
    pinnedPostsToShow = pinnedPosts.slice(0, 2);
    const pinnedIds = new Set(pinnedPostsToShow.map((p) => p.id));
    mixedPosts = normalPosts
      .filter((p) => !pinnedIds.has(p.id))
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
  } else {
    if (selectedCategoryId === "recommend") {
      mixedPosts = normalPosts;
    } else {
      mixedPosts = displayedPosts;
    }
  }

  // 分配到两列
  const [leftColumnPosts, rightColumnPosts] = distributePosts(mixedPosts);

  return {
    displayedPosts,
    pinnedPosts,
    normalPosts,
    isLoading,
    loadError,
    hasMoreData,
    refreshing,
    currentPage,
    loadPosts,
    loadMore,
    refresh,
    retryLoad,
    isRecommendFirstPage,
    pinnedPostsToShow,
    mixedPosts,
    leftColumnPosts,
    rightColumnPosts,
  };
};
