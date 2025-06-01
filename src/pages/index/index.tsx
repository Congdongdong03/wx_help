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
  // Potentially other fields like publisher_avatar, contact_info etc. for detail view
}

// ------------------ MOCK DATA ------------------

const CITIES: string[] = ["悉尼", "墨尔本", "卧龙岗"];

const CATEGORIES: Category[] = [
  { id: "recommend", name: "推荐", color: "#6f42c1" }, // A distinct color for "Recommend", e.g., purple
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

const ALL_MOCK_POSTS: FeedPost[] = CITIES.reduce((acc, city) => {
  return acc.concat(generateMockPosts(25, city)); // Generate 25 posts per city for diverse data
}, [] as FeedPost[]);

const POSTS_PER_PAGE = 10;

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

// ------------------ POST CARD COMPONENT ------------------
interface PostCardProps {
  post: FeedPost;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  return (
    <View
      className="post-card"
      onClick={() =>
        Taro.navigateTo({ url: `/pages/post-detail/post-detail?id=${post.id}` })
      }
    >
      {post.mockImagePlaceholderHeight && post.mockImagePlaceholderColor && (
        <View
          className="post-card-image-placeholder"
          style={{
            height: `${post.mockImagePlaceholderHeight}rpx`,
            backgroundColor: post.mockImagePlaceholderColor,
          }}
        />
      )}
      <View className="post-card-content">
        <Text className="post-card-title" numberOfLines={2}>
          {post.title}
        </Text>
        <Text className="post-card-description" numberOfLines={2}>
          {post.description.substring(0, 50)}...
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

// ------------------ INDEX PAGE COMPONENT ------------------
const LAST_VIEWED_CATEGORY_KEY = "home_last_viewed_category";

export default function Index() {
  const [selectedCity, setSelectedCity] = useState<string>(CITIES[0]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => {
    try {
      const lastCategory = Taro.getStorageSync(LAST_VIEWED_CATEGORY_KEY);
      // Default to 'recommend' if no valid last category is found or if it doesn't exist in current CATEGORIES
      return lastCategory && CATEGORIES.some((c) => c.id === lastCategory)
        ? lastCategory
        : CATEGORIES[0].id; // CATEGORIES[0] is now 'recommend'
    } catch (e) {
      console.error("Failed to get last viewed category from storage", e);
      return CATEGORIES[0].id; // Default to 'recommend'
    }
  });
  const [displayedPosts, setDisplayedPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMoreData, setHasMoreData] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [isCityPickerVisible, setIsCityPickerVisible] =
    useState<boolean>(false); // State for city picker visibility

  // Refs for values used in useCallback guard to prevent loops
  const isLoadingRef = useRef(isLoading);
  const currentPageRef = useRef(currentPage);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  const loadPosts = useCallback(
    async (
      city: string,
      categoryId: string,
      page: number,
      append: boolean = false
    ) => {
      // Use refs for the guard to ensure stable useCallback reference
      if (isLoadingRef.current && !append && page === currentPageRef.current) {
        console.log("LoadPosts call skipped by guard using refs");
        return;
      }
      setIsLoading(true);
      setLoadError(false);

      console.log(
        `Loading posts for City: ${city}, Category: ${categoryId}, Page: ${page}`
      );

      try {
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve(true);
          }, 2000); // Keep 2s delay for testing skeleton
        });

        let filteredPostsForCategory;
        if (categoryId === "recommend") {
          // For 'recommend', include posts from all actual content categories ('rent', 'used', 'jobs')
          // Exclude 'recommend' itself from this specific filter step if it somehow got into post.category.id
          const actualContentCategoryIds = CATEGORIES.filter(
            (c) => c.id !== "recommend"
          ).map((c) => c.id);
          filteredPostsForCategory = ALL_MOCK_POSTS.filter(
            (p) =>
              p.city === city &&
              actualContentCategoryIds.includes(p.category.id) && // Check if post category is one of the content categories
              p.auditStatus === "approved"
          );
        } else {
          // For specific categories like 'rent', 'used', 'jobs'
          filteredPostsForCategory = ALL_MOCK_POSTS.filter(
            (p) =>
              p.city === city &&
              p.category.id === categoryId &&
              p.auditStatus === "approved"
          );
        }

        // Sort all filtered posts (either from a specific category or from all for 'recommend')
        filteredPostsForCategory.sort((a, b) => {
          const aBoostTime = a.boostTime ? a.boostTime.getTime() : 0;
          const bBoostTime = b.boostTime ? b.boostTime.getTime() : 0;
          if (aBoostTime !== bBoostTime) {
            return bBoostTime - aBoostTime;
          }
          return b.updateTime.getTime() - a.updateTime.getTime();
        });

        const startIndex = (page - 1) * POSTS_PER_PAGE;
        const endIndex = startIndex + POSTS_PER_PAGE;
        const newPosts = filteredPostsForCategory.slice(startIndex, endIndex);

        console.log(
          "Simulated newPosts count:",
          newPosts.length,
          "Total filtered for category/city:",
          filteredPostsForCategory.length
        );

        setDisplayedPosts((prevPosts) =>
          append ? [...prevPosts, ...newPosts] : newPosts
        );
        setHasMoreData(
          newPosts.length === POSTS_PER_PAGE &&
            filteredPostsForCategory.length > endIndex
        );
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
        console.log(
          "setIsLoading(false) called in finally. isLoading should be false."
        );
      }
    },
    // Dependencies are now stable setters, making loadPosts reference stable
    [
      setIsLoading,
      setLoadError,
      setDisplayedPosts,
      setHasMoreData,
      setCurrentPage,
    ]
  );

  useEffect(() => {
    console.log(
      "Effect for city/category change is running. City:",
      selectedCity,
      "Category:",
      selectedCategoryId
    );
    setDisplayedPosts([]);
    setCurrentPage(1); // Set to 1 before loading
    setHasMoreData(true);
    setLoadError(false);
    loadPosts(selectedCity, selectedCategoryId, 1, false);
  }, [selectedCity, selectedCategoryId, loadPosts]); // loadPosts is now stable

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    try {
      Taro.setStorageSync(LAST_VIEWED_CATEGORY_KEY, categoryId);
    } catch (e) {
      console.error("Failed to save last viewed category to storage", e);
    }
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

  // Add auditStatus to FeedPost and mock data
  // For now, let's assume all mock posts are 'approved' for simplicity in loadPosts filter
  // In a real app, this would come from the backend.
  // Add a temporary fix in generateMockPosts to include auditStatus: 'approved'

  return (
    <View className="index-page">
      {/* Header: City + Categories */}
      <View className="header">
        <View className="city-selector" onClick={handleCitySelectorClick}>
          <Text>{selectedCity}</Text>
          <Text className="arrow">▼</Text> {/* Placeholder for dropdown icon */}
        </View>
        <View className="category-tabs">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              className={`category-tab ${
                selectedCategoryId === cat.id ? "active" : ""
              }`}
              onClick={() => handleCategoryChange(cat.id)}
              // style={selectedCategoryId === cat.id ? { backgroundColor: cat.color, color: '#fff' } : {}}
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
        lowerThreshold={150} // Pixels from bottom to trigger load more
      >
        {isLoading && currentPage === 1 && !loadError && (
          <View className="loading-container skeleton-container post-list-masonry-container">
            {" "}
            {/* Apply masonry to skeleton too */}
            {/* Display a few skeleton cards with random heights for initial load */}
            {[...Array(4)].map((_, index) => {
              // Example: 4 skeleton cards
              const randomHeight =
                Math.floor(Math.random() * (450 - 250 + 1)) + 250; // Random height between 250rpx and 450rpx
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
            {" "}
            {/* Reusing empty-state for error display */}
            <Text className="empty-state-text">加载失败，请检查网络连接</Text>
            <Button className="empty-state-button" onClick={retryLoad}>
              重试
            </Button>
          </View>
        )}

        {displayedPosts.length === 0 && !isLoading && !loadError && (
          <View className="empty-state-container">
            {/* TODO: Add empty state image */}
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

        {/* Masonry Container for Posts */}
        {displayedPosts.length > 0 && !loadError && (
          <View className="post-list-masonry-container">
            {displayedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </View>
        )}

        {isLoading && currentPage > 1 && (
          <View className="loading-more-container">
            <Text>加载中...</Text>
          </View>
        )}

        {!isLoading && !hasMoreData && displayedPosts.length > 0 && (
          <View className="no-more-posts-container">
            <Text>已经到底啦~</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Discount Area - Placeholder */}
      <View className="bottom-discount-area">
        <Text>本周折扣推荐区域 (占位)</Text>
      </View>

      {/* City Picker Popup */}
      {isCityPickerVisible && (
        <View className="city-picker-overlay" onClick={handleCloseCityPicker}>
          <View
            className="city-picker-content"
            onClick={(e) => e.stopPropagation()}
          >
            {" "}
            {/* Prevent click through */}
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
              {CITIES.map((city) => (
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
