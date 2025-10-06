import Taro from "@tarojs/taro";
import { useState, useEffect, useCallback } from "react";
import { View, Text, Button, ScrollView } from "@tarojs/components";
import PostCard from "../../../components/PostCard";
import { request } from "../../../utils/request";
import { FeedPost } from "../../../types";
import "./index.scss";

// FavoritePost can be directly compatible with PostCardData or mapped
type FavoritePost = FeedPost;

// 收藏数据将从API获取

// Helper to format collected time for display, similar to index page's formatRelativeTime
const formatCollectedTime = (date: Date): string => {
  // Simplified: just return date string, or implement full relative time logic
  return `收藏于 ${date.toLocaleDateString()}`;
};

const FAVORITE_CATEGORIES_TABS = [
  { id: "all", name: "全部" },
  { id: "rent", name: "租房" },
  { id: "used", name: "二手" },
  { id: "jobs", name: "招聘" },
];

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoritePost[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<FavoritePost[]>(
    []
  );
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const resp = await request<{ data: { favorites: FavoritePost[] } }>(
        "/api/user/favorites",
        { method: "GET" }
      );
      const list = (resp as any)?.data?.favorites || [];
      setFavorites(list);
    } catch (e) {
      Taro.showToast({ title: "加载收藏失败", icon: "none" });
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    // Filter favorites when `favorites` or `selectedFilter` changes
    if (selectedFilter === "all") {
      setFilteredFavorites(favorites);
    } else {
      setFilteredFavorites(
        favorites.filter((fav) => fav.category.id === selectedFilter)
      );
    }
  }, [favorites, selectedFilter]);

  const handleFilterChange = (filterId: string) => {
    setSelectedFilter(filterId);
  };

  const handleCancelFavorite = (favId: string | number) => {
    Taro.showModal({
      title: "取消收藏",
      content: "确定要取消收藏该信息吗？",
      success: (res) => {
        if (res.confirm) {
          request(`/api/posts/${favId}/favorite`, { method: "POST" })
            .then(() => {
              setFavorites((prev) => prev.filter((fav) => fav.id !== favId));
              Taro.showToast({ title: "已取消收藏", icon: "success" });
            })
            .catch(() => {
              Taro.showToast({ title: "取消失败", icon: "none" });
            });
        }
      },
    });
  };

  if (isLoading) {
    return <View className="favorites-loading">加载中...</View>;
  }

  return (
    <View className="favorites-page">
      {/* Filter Tabs */}
      <View className="filter-tabs-container">
        {FAVORITE_CATEGORIES_TABS.map((cat) => (
          <Button
            key={cat.id}
            className={`filter-tab ${
              selectedFilter === cat.id ? "active" : ""
            }`}
            onClick={() => handleFilterChange(cat.id)}
          >
            {cat.name}
          </Button>
        ))}
      </View>

      {/* Favorites List */}
      {filteredFavorites.length === 0 && (
        <View className="empty-favorites-state">
          <Text>你还没有收藏任何内容，</Text>
          <Text>去首页看看吧～</Text>
          <Button
            className="browse-home-button"
            onClick={() => Taro.switchTab({ url: "/pages/index/index" })}
          >
            浏览首页
          </Button>
        </View>
      )}

      <ScrollView scrollY className="favorites-scroll-view">
        <View className="post-list-masonry-container">
          {filteredFavorites.map((fav) => (
            <View key={fav.id} className="favorite-item-wrapper">
              <PostCard post={fav as any} />
              <Button
                size="mini"
                className="cancel-fav-button-external"
                onClick={() => handleCancelFavorite(fav.id)}
              >
                取消收藏
              </Button>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
