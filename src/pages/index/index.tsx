import Taro from "@tarojs/taro";
import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Image, ScrollView, Button } from "@tarojs/components";
import "./index.scss";

// ------------------ DATA STRUCTURES ------------------

interface Category {
  id: string;
  name: string;
  color: string;
}

interface FeedPost {
  id: string;
  mockImagePlaceholderHeight?: number;
  mockImagePlaceholderColor?: string;
  title: string;
  description: string;
  category: Category;
  price?: string | number;
  updateTime: Date;
  boostTime?: Date;
  city: string;
  auditStatus: "approved" | "pending" | "rejected" | "draft";
  image_url?: string;
}

// ------------------ MOCK DATA ------------------

const CATEGORIES: Category[] = [
  { id: "recommend", name: "推荐", color: "#6f42c1" },
  { id: "help", name: "帮帮", color: "#17a2b8" },
  { id: "rent", name: "租房", color: "#007bff" },
  { id: "used", name: "二手", color: "#28a745" },
  { id: "jobs", name: "招聘", color: "#ffc107" },
];

const PRESET_PLACEHOLDER_COLORS = [
  "#a2d2ff",
  "#bde0fe",
  "#ffafcc",
  "#ffc8dd",
  "#cdb4db",
  "#deaaff",
  "#b0f2c2",
  "#c1fba4",
  "#fbf8cc",
  "#fde4cf",
  "#ffcfd2",
  "#f1c0e8",
  "#cfbaf0",
  "#a3c4f3",
  "#90dbf4",
];

// ------------------ MASONRY LAYOUT HELPER ------------------
const distributePosts = (posts: FeedPost[]): [FeedPost[], FeedPost[]] => {
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
      url: "http://localhost:3000/api/home/cities",
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
      if (isLoadingRef.current && !append && page === currentPageRef.current) {
        console.log("LoadPosts call skipped by guard using refs");
        return;
      }

      setIsLoading(true);
      setLoadError(false);

      try {
        let url = `http://localhost:3000/api/home/recommendations?city=${encodeURIComponent(
          city
        )}`;
        if (categoryId && categoryId !== "recommend") {
          url += `&category=${categoryId}`;
        }

        const res = await Taro.request({
          url,
          method: "GET",
        });

        console.log("API返回数据:", res.data);

        // 先检查API返回的完整数据结构
        console.log("API返回的完整响应:", JSON.stringify(res.data, null, 2));

        if (res.data && res.data.code === 0 && res.data.data) {
          const responseData = res.data.data;

          // 根据实际API返回结构处理数据
          let pinnedRaw = responseData.pinned || [];
          let listRaw = responseData.list || [];

          console.log("原始置顶数据:", pinnedRaw);
          console.log("原始普通数据:", listRaw);

          const mapToFeedPost = (item: any): FeedPost => {
            const feedPost = {
              id: String(
                item.id || item.post_id || `temp-${Date.now()}-${Math.random()}`
              ),
              title: item.title || "无标题",
              description: item.description || "暂无描述",
              category:
                CATEGORIES.find(
                  (c) => c.id === (item.category || "recommend")
                ) || CATEGORIES[0],
              price: item.price || undefined,
              updateTime: new Date(
                item.updated_at || item.created_at || Date.now()
              ),
              boostTime: item.is_pinned ? new Date() : undefined,
              city: item.city || city,
              auditStatus: (item.is_active ? "approved" : "pending") as
                | "approved"
                | "pending"
                | "rejected"
                | "draft",
              image_url: item.image_url || undefined,
              mockImagePlaceholderHeight:
                Math.floor(Math.random() * (550 - 200 + 1)) + 200,
              mockImagePlaceholderColor:
                PRESET_PLACEHOLDER_COLORS[
                  Math.floor(Math.random() * PRESET_PLACEHOLDER_COLORS.length)
                ],
            };
            console.log("映射单个帖子:", item, "->", feedPost);
            return feedPost;
          };

          const pinned = pinnedRaw.map(mapToFeedPost);
          const list = listRaw.map(mapToFeedPost);

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

          setHasMoreData(list.length === POSTS_PER_PAGE);
          setCurrentPage(page);
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
      .sort((a, b) => b.updateTime.getTime() - a.updateTime.getTime());
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

      {/* Posts Feed */}
      <ScrollView
        scrollY
        className="posts-scroll-view"
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

        {/* 空状态显示逻辑优化 */}
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

        {/* 瀑布流内容 */}
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
    </View>
  );
}

// ------------------ POST CARD COMPONENT ------------------
interface PostCardProps {
  post: FeedPost;
  isPinned?: boolean;
}

const DEFAULT_IMAGE_URL =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb";

const PostCard: React.FC<PostCardProps> = ({ post, isPinned }) => {
  const safeDescription = post.description || "暂无描述";
  const truncatedDescription =
    safeDescription.length > 50
      ? safeDescription.substring(0, 50) + "..."
      : safeDescription;

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
      <Image
        className="post-card-image"
        src={post.image_url || DEFAULT_IMAGE_URL}
        mode="aspectFill"
        style={{
          height: post.mockImagePlaceholderHeight
            ? `${post.mockImagePlaceholderHeight}rpx`
            : "400rpx",
        }}
      />
      <View className="post-card-content">
        <Text className="post-card-title" numberOfLines={2}>
          {post.title || "无标题"}
        </Text>
        <Text className="post-card-description" numberOfLines={2}>
          {truncatedDescription}
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
              <Text className="post-card-price-tag">{post.price}</Text>
            )}
          </View>
          <Text className="post-card-time">
            {formatRelativeTime(post.updateTime)}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ------------------ SKELETON CARD COMPONENT ------------------
interface SkeletonCardProps {
  mockImageHeight: number;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ mockImageHeight }) => {
  return (
    <View className="post-card skeleton-card">
      <View
        className="skeleton-image"
        style={{ height: `${mockImageHeight}rpx` }}
      />
      <View className="post-card-content">
        <View className="skeleton-line title" />
        <View className="skeleton-line short" />
        <View className="skeleton-line long" />
        <View className="post-card-footer skeleton-footer">
          <View className="skeleton-line tag" />
          <View className="skeleton-line time" />
        </View>
      </View>
    </View>
  );
};

// ------------------ HELPER FUNCTIONS ------------------
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  if (diffSeconds < 60) return `${diffSeconds}秒前`;
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays <= 7) return `${diffDays}天前`;
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(
    date.getHours()
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};
