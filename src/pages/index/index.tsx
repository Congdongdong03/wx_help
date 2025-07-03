import Taro, { useRouter } from "@tarojs/taro";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, Image, ScrollView, Button } from "@tarojs/components";
import { BASE_URL } from "../../utils/env";
import { API_CONFIG } from "../../config/api";
import { clearLoginState, checkLoginAndShowModal } from "../../app";
import "./index.scss";
import LoginModal from "../../components/LoginModal";
import UserSwitcher from "../../components/UserSwitcher";
import PostCard from "../../components/PostCard";
import SkeletonCard from "../../components/SkeletonCard";
import { CATEGORIES, PRESET_PLACEHOLDER_HEIGHTS } from "../../constants";
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
      <View className="header">
        <View className="city-selector" onClick={handleCitySelectorClick}>
          <Text className="selected-city">{selectedCity || "选择城市"}</Text>
          <Text className="arrow at-icon at-icon-chevron-down"></Text>
        </View>
        {process.env.NODE_ENV === "development" && (
          <View
            className="user-switcher-toggle"
            onClick={() => setIsUserSwitcherVisible(true)}
          >
            <Text className="at-icon at-icon-user"></Text>
          </View>
        )}
        {/* 分类 tabs 放 header 内部，符合 SCSS 结构 */}
        <View className="category-tabs">
          {CATEGORIES.map((category) => (
            <View
              key={category.id}
              className={`category-tab ${
                selectedCategoryId === category.id ? "active" : ""
              }`}
              onClick={() => handleCategoryChange(category.id)}
            >
              <Text>{category.name}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView
        scrollY
        className="posts-scroll-view"
        refresherEnabled={true}
        refresherTriggered={false}
        onScrollToLower={onScrollToLower}
        onRefresherRefresh={onRefresherRefresh}
      >
        <View className="masonry-container">
          <View className="masonry-column">
            {/* 左列：置顶、普通、骨架 */}
            {pinnedPosts
              .filter((_, i) => i % 2 === 0)
              .map((post) => (
                <PostCard key={post.id} post={post} pinned />
              ))}
            {leftColumnPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {showSkeleton &&
              leftSkeleton.map((item) => (
                <SkeletonCard key={item.id} {...item} />
              ))}
          </View>
          <View className="masonry-column">
            {/* 右列：置顶、普通、骨架 */}
            {pinnedPosts
              .filter((_, i) => i % 2 === 1)
              .map((post) => (
                <PostCard key={post.id} post={post} pinned />
              ))}
            {rightColumnPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {showSkeleton &&
              rightSkeleton.map((item) => (
                <SkeletonCard key={item.id} {...item} />
              ))}
          </View>
        </View>
        {showNoPosts && <View className="empty-tip">已经到底啦~</View>}
        {loadError && (
          <View className="empty-tip">
            加载失败{" "}
            <Text
              onClick={retryLoad}
              style={{ color: "#007bff", marginLeft: 8 }}
            >
              重试
            </Text>
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
        visible={isUserSwitcherVisible}
        onClose={() => setIsUserSwitcherVisible(false)}
      />
    </View>
  );
}
