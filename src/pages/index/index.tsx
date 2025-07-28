import Taro from "@tarojs/taro";
import { useState, useEffect } from "react";
import { View, Text, ScrollView, Button } from "@tarojs/components";
import { BASE_URL } from "../../utils/env";
import { clearLoginState, checkLoginAndShowModal } from "../../app";
import "./index.scss";
import LoginModal from "../../components/LoginModal";
import UserSwitcher from "../../components/UserSwitcher";
import PostCard from "../../components/PostCard";
import SkeletonCard from "../../components/SkeletonCard";
import { CATEGORIES } from "../../constants";
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

// mock 两个置顶帖子
const pinnedPostsToShow = [
  {
    id: 1,
    title: "Coles 每周打折信息",
    content: "Coles 本周特价商品：新鲜蔬菜、肉类、日用品等都有大幅折扣！",
    category: { id: "help", name: "互助", color: "#4CAF50" },
    price: "0",
    images: [
      "https://www.coles.com.au/_next/image?url=https%3A%2F%2Fwww.coles.com.au%2Fcontent%2Fdam%2Fcoles%2Fcusp%2Fhomepage-specials%2F2025%2F9-4-25%2FHeroTile-Roundel-Padding-FG-HalfPrice.png&w=1080&q=90",
    ],
    cover_image:
      "https://www.coles.com.au/_next/image?url=https%3A%2F%2Fwww.coles.com.au%2Fcontent%2Fdam%2Fcoles%2Fcusp%2Fhomepage-specials%2F2025%2F9-4-25%2FHeroTile-Roundel-Padding-FG-HalfPrice.png&w=1080&q=90",
    is_pinned: true,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    city_code: "通用",
    status: "published",
    users: { id: 1, nickname: "管理员", avatar_url: "" },
    mockImagePlaceholderHeight: 70,
    mockImagePlaceholderColor: "rgb(250,213,46)",
  },
  {
    id: 2,
    title: "Woolworths 每周打折信息",
    content: "Woolworths 本周特价商品：水果、海鲜、零食等都有超值优惠！",
    category: { id: "help", name: "互助", color: "#2196F3" },
    price: "0",
    images: [
      "https://via.placeholder.com/400x300/2196F3/FFFFFF?text=WWS+Weekly+Deals",
    ],
    cover_image:
      "https://via.placeholder.com/400x300/2196F3/FFFFFF?text=WWS+Weekly+Deals",
    is_pinned: true,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    city_code: "通用",
    status: "published",
    users: { id: 1, nickname: "管理员", avatar_url: "" },
  },
];

// ------------------ MASONRY LAYOUT HELPER ------------------

// ------------------ API 数据加载 ------------------

export default function Index() {
  const [cities, setCities] = useState<{ label: string; value: string }[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string>("recommend");
  const [isCityPickerVisible, setIsCityPickerVisible] =
    useState<boolean>(false);
  const [isUserSwitcherVisible, setIsUserSwitcherVisible] =
    useState<boolean>(false);

  // 使用 usePosts hook
  const {
    // 数据
    displayedPosts,
    pinnedPosts,
    normalPosts,
    recommendMeta,

    // 状态
    isLoading,
    loadError,
    hasMoreData,
    refreshing,
    currentPage,

    // 遥控器（函数）
    loadPosts,
    loadMore,
    refresh,
    retryLoad,

    // 计算属性
    isRecommendFirstPage,
    mixedPosts,
    leftColumnPosts,
    rightColumnPosts,
  } = usePosts({
    selectedCity,
    selectedCategoryId,
  });

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

  // 当城市和分类变化时加载数据
  useEffect(() => {
    if (!selectedCity && cities.length > 0) {
      setSelectedCity(cities[0].value);
      return;
    }
    if (selectedCity) {
      loadPosts(selectedCity, selectedCategoryId, 1, false);
    }
  }, [selectedCity, selectedCategoryId, cities, loadPosts]);

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
        onRefresherRefresh={refresh}
        onScrollToLower={loadMore}
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
              pinnedPostsToShow.length === 0 &&
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

        {(mixedPosts.length > 0 || pinnedPostsToShow.length > 0) && (
          <View style={{ padding: "20rpx" }}>
            {/* 置顶帖子 - 跨两列显示 */}
            {pinnedPostsToShow.length > 0 && (
              <View style={{ width: "100%", marginBottom: "20rpx" }}>
                {pinnedPostsToShow.map((post) => (
                  <View key={post.id} style={{ marginBottom: "20rpx" }}>
                    <PostCard post={post} isPinned={true} />
                  </View>
                ))}
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
