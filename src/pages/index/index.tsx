import Taro, { useRouter } from "@tarojs/taro";
import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, Image, ScrollView, Button } from "@tarojs/components";
import { BASE_URL } from "../../utils/env";
import { API_CONFIG } from "../../config/api";
import { clearLoginState, checkLoginAndShowModal } from "../../app";
import "./index.scss";
import LoginModal from "../../components/LoginModal";
import UserSwitcher from "../../components/UserSwitcher";
import PostCard from "../../components/PostCard";
import SkeletonCard from "../../components/SkeletonCard";
import { CATEGORIES } from "../../constants";
import { distributePosts } from "../../utils/postUtils";
import { usePosts } from "../../hooks/usePosts";

export default function Index() {
  const [cities, setCities] = useState<{ label: string; value: string }[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string>("recommend");

  const [isCityPickerVisible, setIsCityPickerVisible] =
    useState<boolean>(false);
  const [isUserSwitcherVisible, setIsUserSwitcherVisible] =
    useState<boolean>(false);

  const router = useRouter();

  // Use the custom hook for post data and logic
  const {
    posts,
    pinnedPosts,
    isLoading,
    loadError,
    hasMoreData,
    loadMore,
    refresh,
  } = usePosts({ city: selectedCity, categoryId: selectedCategoryId });

  // Get cities list
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

  // Handle category change (triggers data reload via usePosts hook)
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    Taro.pageScrollTo({
      scrollTop: 0,
      duration: 100,
    });
  };

  // City picker handlers
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

  // Scroll to load more posts
  const onScrollToLower = () => {
    console.log("onScrollToLower triggered.");
    loadMore();
  };

  // Retry load function
  const retryLoad = () => {
    refresh(); // Refresh to retry loading
  };

  // Pull-to-refresh handler
  const onRefresherRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  // Distribute posts for masonry layout
  const [leftColumnPosts, rightColumnPosts] = useMemo(
    () => distributePosts(posts),
    [posts]
  );

  // Skeleton screen logic
  const showSkeleton =
    isLoading && posts.length === 0 && pinnedPosts.length === 0;
  const skeletonItems = Array.from({ length: 10 }).map((_, i) => ({
    id: `skeleton-${i}`,
    mockImagePlaceholderHeight:
      PRESET_PLACEHOLDER_HEIGHTS[
        Math.floor(Math.random() * PRESET_PLACEHOLDER_HEIGHTS.length)
      ],
    title: "",
    content: "",
    category: { id: "", name: "", color: "" },
    updated_at: "",
    created_at: "",
    city_code: "",
    status: "draft",
    images: [],
  }));

  const [leftSkeleton, rightSkeleton] = useMemo(
    () => distributePosts(skeletonItems),
    [skeletonItems]
  );

  // Show no posts message
  const showNoPosts =
    !isLoading && posts.length === 0 && pinnedPosts.length === 0 && !loadError;

  return (
    <View className="index-page">
      <View className="header-container">
        <View className="header-content">
          <Text className="header-title">帮帮</Text>
          <View className="city-selector" onClick={handleCitySelectorClick}>
            <Text className="selected-city">{selectedCity || "选择城市"}</Text>
            <Text className="at-icon at-icon-chevron-down"></Text>
          </View>
        </View>
        {process.env.NODE_ENV === "development" && (
          <View
            className="user-switcher-toggle"
            onClick={() => setIsUserSwitcherVisible(true)}
          >
            <Text className="at-icon at-icon-user"></Text>
          </View>
        )}
      </View>
      <ScrollView scrollY className="category-scroll-view" scrollWithAnimation>
        <View className="category-list">
          {CATEGORIES.map((category) => (
            <View
              key={category.id}
              className={`category-item ${
                selectedCategoryId === category.id ? "active" : ""
              }`}
              onClick={() => handleCategoryChange(category.id)}
              style={{
                backgroundColor:
                  selectedCategoryId === category.id
                    ? category.color
                    : "#f8f8f8",
                color:
                  selectedCategoryId === category.id ? "#fff" : category.color,
              }}
            >
              <Text>{category.name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <ScrollView
        scrollY
        className="content-scroll-view"
        refresherEnabled={true}
        refresherTriggered={
          isLoading && posts.length === 0 && pinnedPosts.length === 0
        }
        onRefresherRefresh={onRefresherRefresh}
        onScrollToLower={onScrollToLower}
      >
        {showSkeleton ? (
          <View className="post-list-container">
            <View
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "20rpx",
              }}
            >
              {leftSkeleton.map((post) => (
                <SkeletonCard
                  key={post.id}
                  mockImageHeight={post.mockImagePlaceholderHeight!}
                />
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
              {rightSkeleton.map((post) => (
                <SkeletonCard
                  key={post.id}
                  mockImageHeight={post.mockImagePlaceholderHeight!}
                />
              ))}
            </View>
          </View>
        ) : showNoPosts ? (
          <View className="no-posts-found">
            <Text className="no-posts-text">暂无帖子</Text>
            {loadError && (
              <Button className="retry-button" onClick={retryLoad}>
                点击重试
              </Button>
            )}
          </View>
        ) : (
          <View className="post-list-container">
            {pinnedPosts.length > 0 && (
              <View className="pinned-posts-section">
                {pinnedPosts.map((post) => (
                  <PostCard key={post.id} post={post} isPinned={true} />
                ))}
              </View>
            )}
            {posts.length > 0 && (
              <View className="normal-posts-columns">
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

        {isLoading && posts.length > 0 && (
          <View className="loading-more-container">
            <Text>加载中...</Text>
          </View>
        )}

        {!isLoading &&
          !hasMoreData &&
          (posts.length > 0 || pinnedPosts.length > 0) && (
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
