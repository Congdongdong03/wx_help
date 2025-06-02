import Taro from "@tarojs/taro";
import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Image, ScrollView, Button } from "@tarojs/components";
import "./index.scss"; // We'll create this SCSS file later

// ------------------ DATA STRUCTURES ------------------

interface Category {
  id: string;
  name: string;
  color: string; // For styling category tags
}

interface FeedPost {
  id: string;
  mockImagePlaceholderHeight?: number; // For placeholder view height
  mockImagePlaceholderColor?: string; // For placeholder view background color
  title: string;
  description: string; // First 30-50 chars
  category: Category;
  price?: string | number; // Optional price/rent
  updateTime: Date; // For sorting and display
  boostTime?: Date; // For sorting (optional, boosted posts first)
  city: string; // For filtering
  auditStatus: "approved" | "pending" | "rejected" | "draft"; // Added auditStatus
  image_url?: string; // Added for the image URL
  // Potentially other fields like publisher_avatar, contact_info etc. for detail view
}

// ------------------ MOCK DATA ------------------

const CATEGORIES: Category[] = [
  { id: "recommend", name: "推荐", color: "#6f42c1" }, // Purple
  { id: "help", name: "帮帮", color: "#17a2b8" }, // Teal/Info Blue
  { id: "rent", name: "租房", color: "#007bff" }, // Blue
  { id: "used", name: "二手", color: "#28a745" }, // Green
  { id: "jobs", name: "招聘", color: "#ffc107" }, // Orange (text should be dark)
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

const generateMockPosts = (
  count: number,
  city: string,
  categoryId?: string
): FeedPost[] => {
  const posts: FeedPost[] = [];
  const baseDate = new Date();

  for (let i = 0; i < count; i++) {
    const randomCategory = categoryId
      ? CATEGORIES.find((c) => c.id === categoryId)!
      : CATEGORIES[i % CATEGORIES.length];
    const updatedMinutesAgo = Math.floor(Math.random() * 60 * 24 * 5); // Within last 5 days
    const updateTime = new Date(baseDate.getTime() - updatedMinutesAgo * 60000);

    let boostTime: Date | undefined = undefined;
    if (Math.random() < 0.3) {
      // 30% chance of being boosted
      const boostedMinutesAgo = Math.floor(Math.random() * 60 * 24); // Boosted within last 1 day
      boostTime = new Date(baseDate.getTime() - boostedMinutesAgo * 60000);
    }

    // Generate random height and color for the image placeholder
    const placeholderHeight = Math.floor(Math.random() * (550 - 200 + 1)) + 200; // Random height: 200rpx to 550rpx
    const placeholderColor =
      PRESET_PLACEHOLDER_COLORS[
        Math.floor(Math.random() * PRESET_PLACEHOLDER_COLORS.length)
      ];

    posts.push({
      id: `${city}-${randomCategory.id}-${i}`,
      mockImagePlaceholderHeight: placeholderHeight,
      mockImagePlaceholderColor: placeholderColor,
      title: `${randomCategory.name} Post Title ${
        i + 1
      } - Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatum.`,
      description:
        "This is a short description of the item. It will be truncated if it is too long for the card display. We need about 30 to 50 characters here for a good preview of content.",
      category: randomCategory,
      price:
        randomCategory.id === "used"
          ? `${Math.floor(Math.random() * 500) + 50}元`
          : randomCategory.id === "rent"
          ? `${Math.floor(Math.random() * 3000) + 1000}元/月`
          : undefined,
      updateTime: updateTime,
      boostTime: boostTime,
      city: city,
      auditStatus: "approved", // Ensuring mock posts are approved for initial display
    });
  }
  return posts;
};

// ------------------ API 数据加载 ------------------

const POSTS_PER_PAGE = 10;

export default function Index() {
  // 用于存储真实城市数据
  const [cities, setCities] = useState<string[]>([]);
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

  // Refs for values used in useCallback guard to prevent loops
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
    Taro.request({
      url: "http://192.168.1.243:3000/api/home/cities",
      method: "GET",
    }).then((res) => {
      if (res.data && res.data.code === 0) {
        setCities(res.data.data.map((city: any) => city.name));
      }
    });
  }, []);

  // 新的 loadPosts，调用后端 API
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
        let url = `http://192.168.1.243:3000/api/home/recommendations?city=${encodeURIComponent(
          city
        )}`;
        if (categoryId && categoryId !== "recommend") {
          url += `&category=${categoryId}`;
        }
        const res = await Taro.request({
          url,
          method: "GET",
        });
        // 调试日志
        console.log("API返回数据:", res.data);
        if (res.data && res.data.code === 0) {
          const pinnedRaw = res.data.data.pinned || [];
          const listRaw = res.data.data.list || [];
          const mapToFeedPost = (item: any): FeedPost => ({
            id: item.id || `temp-${Date.now()}-${Math.random()}`,
            title: item.title || "无标题",
            description: item.description || "暂无描述",
            category:
              CATEGORIES.find((c) => c.id === (item.category || "recommend")) ||
              CATEGORIES[0],
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
          });
          const pinned = pinnedRaw.map(mapToFeedPost);
          const list = listRaw.map(mapToFeedPost);
          // 调试日志
          console.log("置顶帖子数量:", pinned.length);
          console.log("普通帖子数量:", list.length);
          setPinnedPosts(pinned);
          setNormalPosts(list);
          if (categoryId !== "recommend") {
            setDisplayedPosts(list);
          } else {
            setDisplayedPosts([]);
          }
          setHasMoreData(list.length === POSTS_PER_PAGE);
          setCurrentPage(page);
        } else {
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
    [
      setIsLoading,
      setLoadError,
      setDisplayedPosts,
      setHasMoreData,
      setCurrentPage,
    ]
  );

  // 当城市和分类变化时加载数据
  useEffect(() => {
    if (!selectedCity && cities.length > 0) {
      setSelectedCity(cities[0]);
      return;
    }
    if (selectedCity) {
      setDisplayedPosts([]);
      setCurrentPage(1);
      setHasMoreData(true);
      setLoadError(false);
      loadPosts(selectedCity, selectedCategoryId, 1, false);
    }
  }, [selectedCity, selectedCategoryId, loadPosts, cities]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const handleCitySelectorClick = () => {
    setIsCityPickerVisible(true);
  };

  const handleCloseCityPicker = () => {
    setIsCityPickerVisible(false);
  };

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    setIsCityPickerVisible(false);
    // useEffect will handle reloading posts due to selectedCity change
  };

  const onScrollToLower = () => {
    if (!isLoading && hasMoreData) {
      console.log("Reached bottom, loading more...");
      loadPosts(selectedCity, selectedCategoryId, currentPage + 1, true);
    }
  };

  const retryLoad = () => {
    setDisplayedPosts([]); // Clear potentially partial data
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
    // 只在推荐页第一页显示置顶帖子
    singlePinnedPost = pinnedPosts[0];
    const pinnedIds = new Set(pinnedPosts.map((p) => p.id));
    // 普通帖子按时间降序排序，排除所有置顶帖
    mixedPosts = normalPosts
      .filter((p) => !pinnedIds.has(p.id))
      .sort((a, b) => b.updateTime.getTime() - a.updateTime.getTime());
  } else {
    // 其他分类或非第一页：使用原有逻辑，不显示置顶
    if (selectedCategoryId === "recommend") {
      mixedPosts = normalPosts;
    } else {
      mixedPosts = displayedPosts;
    }
  }

  console.log("singlePinnedPost:", singlePinnedPost);
  console.log("mixedPosts:", mixedPosts);

  return (
    <View className="index-page">
      {/* Header: City + Categories */}
      <View className="header">
        <View className="city-selector" onClick={handleCitySelectorClick}>
          <Text>{selectedCity}</Text>
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
          <View className="loading-container skeleton-container post-list-masonry-container">
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

        {/* 空状态：推荐页专用 */}
        {isRecommendFirstPage &&
          !singlePinnedPost &&
          mixedPosts.length === 0 && (
            <View className="empty-state-container">
              <Text className="empty-state-text">
                暂无相关信息，换个分类试试？
              </Text>
              <Button
                className="empty-state-button"
                onClick={() => Taro.navigateTo({ url: "/pages/publish/index" })}
              >
                去发帖
              </Button>
            </View>
          )}

        {/* 其他分类空状态 */}
        {!isRecommendFirstPage && mixedPosts.length === 0 && !isLoading && (
          <View className="empty-state-container">
            <Text className="empty-state-text">
              暂无相关信息，换个分类试试？
            </Text>
            <Button
              className="empty-state-button"
              onClick={() => Taro.navigateTo({ url: "/pages/publish/index" })}
            >
              去发帖
            </Button>
          </View>
        )}

        {/* 推荐页内容 */}
        {isRecommendFirstPage &&
          (singlePinnedPost || mixedPosts.length > 0) && (
            <View className="post-list-masonry-container">
              {/* 置顶帖子只在推荐页显示 */}
              {singlePinnedPost && (
                <PostCard
                  key={singlePinnedPost.id}
                  post={singlePinnedPost}
                  isPinned={true}
                />
              )}
              {/* 显示普通帖子 */}
              {mixedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </View>
          )}

        {/* 其他分类内容 */}
        {!isRecommendFirstPage && mixedPosts.length > 0 && (
          <View className="post-list-masonry-container">
            {mixedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
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
                  key={city}
                  className={`city-picker-item ${
                    selectedCity === city ? "active" : ""
                  }`}
                  onClick={() => handleSelectCity(city)}
                >
                  {city}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

// definePageConfig might be in index.config.ts or here.
// If it's in index.config.ts, this line is not needed here.
// definePageConfig({
//   navigationBarTitleText: '首页'
// });

// ------------------ POST CARD COMPONENT ------------------
interface PostCardProps {
  post: FeedPost;
  isPinned?: boolean; // Added for the pinned indicator
}

const DEFAULT_IMAGE_URL =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb";

const PostCard: React.FC<PostCardProps> = ({ post, isPinned }) => {
  // 安全处理 description，防止 undefined 错误
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
  mockImageHeight: number; // Expect a height for the mock image
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
