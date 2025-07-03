import Taro, { useRouter } from "@tarojs/taro";
import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Image, ScrollView, Button } from "@tarojs/components";
import { BASE_URL } from "../../utils/env";
import { API_CONFIG } from "../../config/api";
import { clearLoginState, checkLoginAndShowModal } from "../../app";
import "./index.scss";
import LoginModal from "../../components/LoginModal";
import UserSwitcher from "../../components/UserSwitcher";
import PostCard from "../../components/PostCard";
import SkeletonCard from "../../components/SkeletonCard";
import {
  CATEGORIES,
  PRESET_PLACEHOLDER_HEIGHTS,
  PRESET_PLACEHOLDER_COLORS,
} from "../../constants";
import { distributePosts } from "../../utils/postUtils";
import { usePosts } from "../../hooks/usePosts";

// ------------------ DATA STRUCTURES ------------------

interface Category {
  id: string;
  name: string;
  color: string;
}

interface FeedPost {
  id: string | number;
  mockImagePlaceholderHeight?: number;
  mockImagePlaceholderColor?: string;
  title: string;
  content: string;
  content_preview?: string;
  category: Category;
  sub_category?: string;
  price?: string | number;
  updated_at: string;
  created_at: string;
  city_code: string;
  status: "published" | "pending" | "rejected" | "draft";
  images: string[];
  cover_image?: string;
  is_pinned?: boolean;
  is_weekly_deal?: boolean;
  users?: {
    id: number;
    nickname: string;
    avatar_url: string;
    gender?: string;
    city?: string;
  };
}

interface RecommendMeta {
  weekly_deals_count: number;
  pinned_posts_count: number;
  total_pinned: number;
}

// ------------------ MOCK DATA ------------------

// ------------------ MASONRY LAYOUT HELPER ------------------

// ------------------ API 数据加载 ------------------

const POSTS_PER_PAGE = 10;

export default function Index() {
  const [cities, setCities] = useState<{ label: string; value: string }[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string>("recommend");
  const [displayedPosts, setDisplayedPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMoreData, setHasMoreData] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [isCityPickerVisible, setIsCityPickerVisible] =
    useState<boolean>(false);
  const [pinnedPosts, setPinnedPosts] = useState<FeedPost[]>([]);
  const [normalPosts, setNormalPosts] = useState<FeedPost[]>([]);
  const [recommendMeta, setRecommendMeta] = useState<RecommendMeta | null>(
    null
  );
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isUserSwitcherVisible, setIsUserSwitcherVisible] =
    useState<boolean>(false);

  const isLoadingRef = useRef(isLoading);
  const currentPageRef = useRef(currentPage);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // 获取城市列表
  useEffect(() => {
    console.log("开始加载城市列表...");
    Taro.request({
      url: `${BASE_URL}/api/home/cities`,
      method: "GET",
      timeout: 10000,
      header: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        console.log("城市API响应:", res);
        if (res.data && res.data.code === 0) {
          const cityOptions = res.data.data.map((city: any) => ({
            label: city.name,
            value: city.code,
          }));
          console.log("解析后的城市选项:", cityOptions);
          setCities(cityOptions);
          if (cityOptions.length > 0 && !selectedCity) {
            setSelectedCity(cityOptions[0].value);
          }
        } else {
          console.warn("城市API返回格式不正确:", res.data);
          Taro.showToast({
            title: "获取城市列表失败",
            icon: "none",
            duration: 2000,
          });
        }
      })
      .catch((error) => {
        console.error("加载城市列表失败:", error);
        Taro.showToast({
          title: "加载城市列表失败，请检查网络",
          icon: "none",
          duration: 2000,
        });
      });
  }, []);

  // 加载帖子数据 - 调用真实API
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

          console.log("原始置顶数据:", pinned_content);
          console.log("原始普通数据:", posts);

          const mapToFeedPost = (item: any): FeedPost => {
            // 兼容 images 字段为字符串（JSON数组）、数组、空值
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
              title: item.title || "无标题",
              content: item.content || "暂无描述",
              content_preview:
                item.content_preview ||
                (item.content ? item.content.slice(0, 50) + "..." : "暂无描述"),
              category:
                CATEGORIES.find(
                  (c) => c.id === (item.category || "recommend")
                ) || CATEGORIES[0],
              sub_category: item.sub_category || "",
              price: item.price || undefined,
              updated_at: item.updated_at || new Date().toISOString(),
              created_at: item.created_at || new Date().toISOString(),
              city_code: item.city_code || city,
              status: item.status || "published",
              images,
              cover_image: images[0] || DEFAULT_IMAGE_URL,
              is_pinned: item.is_pinned || false,
              is_weekly_deal: item.is_weekly_deal || false,
              users: item.users
                ? {
                    id: item.users.id,
                    nickname: item.users.nickname || "未知用户",
                    avatar_url:
                      item.users.avatar_url ||
                      "https://example.com/default-avatar.png",
                    gender: item.users.gender,
                    city: item.users.city,
                  }
                : undefined,
            };
          };

          const pinned = pinned_content.map(mapToFeedPost);
          const list = posts.map(mapToFeedPost);

          console.log("处理后的置顶帖子:", pinned);
          console.log("处理后的普通帖子:", list);

          setPinnedPosts(pinned);
          setNormalPosts((prevPosts) =>
            append ? [...prevPosts, ...list] : list
          );

          if (categoryId !== "recommend") {
            setDisplayedPosts((prevPosts) =>
              append ? [...prevPosts, ...list] : list
            );
          } else {
            setDisplayedPosts([]);
          }

          setHasMoreData(page < pagination.totalPages);
          setCurrentPage(page);

          // 如果是推荐分类，更新推荐元数据
          if (categoryId === "recommend" && recommend_meta) {
            setRecommendMeta(recommend_meta);
          }
        } else if (res.data && res.data.message) {
          // 处理API返回错误信息的情况
          console.log("API返回错误:", res.data.message);
          setPinnedPosts([]);
          setNormalPosts([]);
          setDisplayedPosts([]);
          setHasMoreData(false);
        } else {
          console.log("API返回数据格式不正确:", res.data);
          setPinnedPosts([]);
          setNormalPosts([]);
          setDisplayedPosts([]);
          setHasMoreData(false);
        }
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
    [] // 移除所有依赖项，避免死循环
  );

  // 当城市和分类变化时加载数据
  useEffect(() => {
    if (!selectedCity && cities.length > 0) {
      setSelectedCity(cities[0].value);
      return;
    }
    if (selectedCity) {
      setDisplayedPosts([]);
      setCurrentPage(1);
      setHasMoreData(true);
      setLoadError(false);
      loadPosts(selectedCity, selectedCategoryId, 1, false);
    }
  }, [selectedCity, selectedCategoryId, cities]); // 移除 loadPosts 依赖

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const handleCitySelectorClick = () => {
    setIsCityPickerVisible(true);
  };

  const handleCloseCityPicker = () => {
    setIsCityPickerVisible(false);
  };

  const handleSelectCity = (cityCode: string) => {
    setSelectedCity(cityCode);
    setIsCityPickerVisible(false);
  };

  const onScrollToLower = () => {
    if (!isLoading && hasMoreData) {
      console.log("Reached bottom, loading more...");
      loadPosts(selectedCity, selectedCategoryId, currentPage + 1, true);
    }
  };

  const retryLoad = () => {
    setDisplayedPosts([]);
    setCurrentPage(1);
    setHasMoreData(true);
    loadPosts(selectedCity, selectedCategoryId, 1);
  };

  // 修改渲染逻辑：只在推荐页显示置顶帖子
  const isRecommendFirstPage =
    selectedCategoryId === "recommend" && currentPage === 1;
  let singlePinnedPost: FeedPost | undefined = undefined;
  let mixedPosts: FeedPost[] = [];

  if (isRecommendFirstPage && pinnedPosts.length > 0) {
    singlePinnedPost = pinnedPosts[0];
    const pinnedIds = new Set(pinnedPosts.map((p) => p.id));
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

  console.log("=== 渲染状态调试 ===");
  console.log("isLoading:", isLoading);
  console.log("loadError:", loadError);
  console.log("selectedCategoryId:", selectedCategoryId);
  console.log("isRecommendFirstPage:", isRecommendFirstPage);
  console.log("singlePinnedPost:", singlePinnedPost);
  console.log("mixedPosts.length:", mixedPosts.length);
  console.log("leftColumnPosts.length:", leftColumnPosts.length);
  console.log("rightColumnPosts.length:", rightColumnPosts.length);
  console.log("pinnedPosts:", pinnedPosts);
  console.log("normalPosts:", normalPosts);
  console.log("displayedPosts:", displayedPosts);

  // 处理下拉刷新
  const onRefresherRefresh = async () => {
    console.log("开始下拉刷新...");
    setRefreshing(true);
    setCurrentPage(1);
    setHasMoreData(true);
    await loadPosts(selectedCity, selectedCategoryId, 1, false);
    setRefreshing(false);
    console.log("下拉刷新完成");
  };

  return (
    <View className="index-page">
      {/* Header: City + Categories */}
      <View className="header">
        <View className="city-selector" onClick={handleCitySelectorClick}>
          <Text>
            {cities.find((c) => c.value === selectedCity)?.label ||
              selectedCity}
          </Text>
          <Text className="arrow">▼</Text>
        </View>
        <View className="category-tabs">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              className={`category-tab ${
                selectedCategoryId === cat.id ? "active" : ""
              }`}
              onClick={() => handleCategoryChange(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </View>
      </View>

      {/* 测试按钮 - 独立固定定位 */}
      <Button
        className="test-button"
        onClick={() => {
          clearLoginState();
          checkLoginAndShowModal();
        }}
        style={{
          position: "fixed",
          top: "120rpx",
          right: "20rpx",
          zIndex: 9999,
          background: "#ff4444",
          color: "white",
          fontSize: "24rpx",
          padding: "10rpx 20rpx",
          borderRadius: "20rpx",
          border: "2rpx solid #fff",
          boxShadow: "0 4rpx 12rpx rgba(0,0,0,0.3)",
        }}
      >
        测试登录
      </Button>

      {/* 用户切换按钮 - 仅在开发环境显示 */}
      {process.env.NODE_ENV === "development" && (
        <Button
          className="user-switcher-button"
          onClick={() => setIsUserSwitcherVisible(true)}
          style={{
            position: "fixed",
            top: "180rpx",
            right: "20rpx",
            zIndex: 9999,
            background: "#007aff",
            color: "white",
            fontSize: "24rpx",
            padding: "10rpx 20rpx",
            borderRadius: "20rpx",
            border: "2rpx solid #fff",
            boxShadow: "0 4rpx 12rpx rgba(0,0,0,0.3)",
          }}
        >
          切换用户
        </Button>
      )}

      {/* Posts Feed */}
      <ScrollView
        scrollY
        className="posts-scroll-view"
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={onRefresherRefresh}
        onScrollToLower={onScrollToLower}
        lowerThreshold={150}
      >
        {isLoading && currentPage === 1 && !loadError && (
          <View className="loading-container skeleton-container">
            {[...Array(4)].map((_, index) => {
              const randomHeight =
                Math.floor(Math.random() * (450 - 250 + 1)) + 250;
              return (
                <SkeletonCard
                  key={`skeleton-${index}`}
                  mockImageHeight={randomHeight}
                />
              );
            })}
          </View>
        )}

        {loadError && !isLoading && (
          <View className="empty-state-container">
            <Text className="empty-state-text">加载失败，请检查网络连接</Text>
            <Button className="empty-state-button" onClick={retryLoad}>
              重试
            </Button>
          </View>
        )}

        {!isLoading && !loadError && (
          <>
            {/* 推荐页空状态 */}
            {isRecommendFirstPage &&
              !singlePinnedPost &&
              mixedPosts.length === 0 && (
                <View className="empty-state-container">
                  <Text className="empty-state-text">
                    暂无相关信息，换个分类试试？
                  </Text>
                  <Button
                    className="empty-state-button"
                    onClick={() =>
                      Taro.navigateTo({ url: "/pages/publish/index" })
                    }
                  >
                    去发帖
                  </Button>
                </View>
              )}

            {/* 其他分类空状态 */}
            {!isRecommendFirstPage && mixedPosts.length === 0 && (
              <View className="empty-state-container">
                <Text className="empty-state-text">
                  该分类暂无内容，换个分类试试？
                </Text>
                <Button
                  className="empty-state-button"
                  onClick={() =>
                    Taro.navigateTo({ url: "/pages/publish/index" })
                  }
                >
                  去发帖
                </Button>
              </View>
            )}
          </>
        )}

        {(mixedPosts.length > 0 || singlePinnedPost) && (
          <View style={{ padding: "20rpx" }}>
            {/* 置顶帖子 - 跨两列显示 */}
            {singlePinnedPost && (
              <View style={{ width: "100%", marginBottom: "20rpx" }}>
                <PostCard post={singlePinnedPost} isPinned={true} />
              </View>
            )}

            {/* 双列瀑布流 */}
            {mixedPosts.length > 0 && (
              <View
                style={{ display: "flex", flexDirection: "row", gap: "20rpx" }}
              >
                <View
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "20rpx",
                  }}
                >
                  {leftColumnPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </View>
                <View
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "20rpx",
                  }}
                >
                  {rightColumnPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {isLoading && currentPage > 1 && (
          <View className="loading-more-container">
            <Text>加载中...</Text>
          </View>
        )}

        {!isLoading && !hasMoreData && mixedPosts.length > 0 && (
          <View className="no-more-posts-container">
            <Text>已经到底啦~</Text>
          </View>
        )}
      </ScrollView>

      {/* City Picker Popup */}
      {isCityPickerVisible && (
        <View className="city-picker-overlay" onClick={handleCloseCityPicker}>
          <View
            className="city-picker-content"
            onClick={(e) => e.stopPropagation()}
          >
            <View className="city-picker-header">
              <Text>选择城市</Text>
              <Button
                className="city-picker-close-btn"
                onClick={handleCloseCityPicker}
              >
                关闭
              </Button>
            </View>
            <ScrollView scrollY className="city-picker-list">
              {cities.map((city) => (
                <View
                  key={city.value}
                  className={`city-picker-item ${
                    selectedCity === city.value ? "active" : ""
                  }`}
                  onClick={() => handleSelectCity(city.value)}
                >
                  {city.label}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
      {/* 登录弹窗全局渲染 */}
      <LoginModal />

      {/* 用户切换面板 - 仅在开发环境显示 */}
      <UserSwitcher
        isVisible={isUserSwitcherVisible}
        onClose={() => setIsUserSwitcherVisible(false)}
      />
    </View>
  );
}
