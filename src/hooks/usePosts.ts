import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import Taro from "@tarojs/taro";
import { API_CONFIG } from "../config/api";
import {
  PRESET_PLACEHOLDER_HEIGHTS,
  PRESET_PLACEHOLDER_COLORS,
  CATEGORIES,
  POSTS_PER_PAGE,
} from "../constants";
import { FeedPost, RecommendMeta } from "../types";
import { distributePosts, mapToFeedPost } from "../utils/postUtils";

interface UsePostsOptions {
  city: string;
  categoryId: string;
}

interface UsePostsReturn {
  posts: FeedPost[];
  pinnedPosts: FeedPost[];
  isLoading: boolean;
  loadError: boolean;
  hasMoreData: boolean;
  recommendMeta: RecommendMeta | null;
  loadMore: () => void;
  refresh: () => Promise<void>;
}

export const usePosts = ({
  city,
  categoryId,
}: UsePostsOptions): UsePostsReturn => {
  const [displayedPosts, setDisplayedPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMoreData, setHasMoreData] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [pinnedPosts, setPinnedPosts] = useState<FeedPost[]>([]);
  const [normalPosts, setNormalPosts] = useState<FeedPost[]>([]);
  const [recommendMeta, setRecommendMeta] = useState<RecommendMeta | null>(
    null
  );

  const loadPosts = useCallback(
    async (
      page: number,
      append: boolean = false,
      isRefreshing: boolean = false
    ) => {
      if (isLoading && !isRefreshing) return; // Prevent multiple loads unless refreshing

      setIsLoading(true);
      if (!isRefreshing) setLoadError(false);

      try {
        const params: any = {
          page,
          limit: POSTS_PER_PAGE,
          city,
        };
        if (categoryId && categoryId !== "recommend") {
          params.category = categoryId;
        }

        const res = await Taro.request({
          url: API_CONFIG.getApiUrl("/posts"),
          method: "GET",
          data: params,
        });

        if (res.data && res.data.code === 0 && res.data.data) {
          const { posts, pinned_content, pagination, recommend_meta } =
            res.data.data;

          const newPosts: FeedPost[] = posts.map(mapToFeedPost);
          const newPinnedPosts: FeedPost[] = pinned_content.map(mapToFeedPost);

          setRecommendMeta(recommend_meta);

          if (append) {
            setDisplayedPosts((prevPosts) => {
              const allPosts = [...prevPosts, ...newPosts];
              setNormalPosts(allPosts);
              return allPosts; // displayedPosts is the combined list for masonry
            });
            setPinnedPosts((prevPinned) => [...prevPinned, ...newPinnedPosts]);
          } else {
            setDisplayedPosts(newPosts);
            setNormalPosts(newPosts);
            setPinnedPosts(newPinnedPosts);
          }

          setCurrentPage(pagination.currentPage);
          setHasMoreData(pagination.currentPage < pagination.totalPages);
        } else {
          console.warn("API返回格式不正确或数据为空:", res.data);
          setLoadError(true);
          Taro.showToast({
            title: `加载失败: ${res.data?.message || "未知错误"}`,
            icon: "none",
            duration: 2000,
          });
        }
      } catch (error) {
        console.error("加载帖子数据失败:", error);
        setLoadError(true);
        Taro.showToast({
          title: "加载帖子失败，请检查网络",
          icon: "none",
          duration: 2000,
        });
      }
      setIsLoading(false);
    },
    [
      city,
      categoryId,
      PRESET_PLACEHOLDER_HEIGHTS,
      PRESET_PLACEHOLDER_COLORS,
      CATEGORIES,
      POSTS_PER_PAGE,
    ]
  );

  useEffect(() => {
    if (city && categoryId) {
      loadPosts(1, false); // Initial load or when city/category changes
      setCurrentPage(1);
      setHasMoreData(true);
      setLoadError(false);
      setDisplayedPosts([]);
      setPinnedPosts([]);
      setNormalPosts([]);
    }
  }, [city, categoryId, loadPosts]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMoreData) {
      loadPosts(currentPage + 1, true);
    }
  }, [isLoading, hasMoreData, currentPage, loadPosts]);

  const refresh = useCallback(async () => {
    if (isLoading) return; // Prevent refresh if a load is already in progress
    setIsLoading(true);
    setLoadError(false);
    setCurrentPage(1);
    setHasMoreData(true);
    setDisplayedPosts([]);
    setPinnedPosts([]);
    setNormalPosts([]);
    await loadPosts(1, false, true); // Pass true for isRefreshing
  }, [isLoading, loadPosts]);

  // Combine pinned and normal posts for the final display, applying filtering based on category
  const postsToDisplay = useMemo(() => {
    return normalPosts.filter((post) => {
      if (categoryId === "recommend") {
        return !post.is_pinned && !post.is_weekly_deal; // In recommend, show non-pinned/non-weekly
      } else {
        return post.category.id === categoryId; // In other categories, show only matching category posts
      }
    });
  }, [normalPosts, categoryId]);

  const pinnedPostsToDisplay = useMemo(() => {
    return pinnedPosts.filter((post) => {
      if (categoryId === "recommend") {
        return post.is_pinned || post.is_weekly_deal; // In recommend, show all pinned and weekly deals
      } else {
        return post.category.id === categoryId && post.is_pinned; // In other categories, show only matching category pinned posts
      }
    });
  }, [pinnedPosts, categoryId]);

  return {
    posts: postsToDisplay,
    pinnedPosts: pinnedPostsToDisplay,
    isLoading,
    loadError,
    hasMoreData,
    recommendMeta,
    loadMore,
    refresh,
  };
};
