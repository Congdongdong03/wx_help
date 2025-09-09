import Taro from "@tarojs/taro";
import { useState, useEffect } from "react";
import { View, Text, Image, Button, ScrollView } from "@tarojs/components";
import PostCard, { PostCardData } from "../../../components/PostCard";
import "./index.scss";

// FavoritePost can be directly compatible with PostCardData or mapped
interface FavoritePost {
  id: string;
  mockImagePlaceholderHeight?: number;
  mockImagePlaceholderColor?: string;
  title: string;
  price?: string;
  category: { name: string; color: string; id: string }; // Ensure category has id for filtering
  collectedTime: Date; // Use Date object for easier formatting
  // Add other fields if PostCard expects them e.g. description
  description?: string;
}

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

  useEffect(() => {
    // Simulate fetching favorites
    setIsLoading(true);
    setTimeout(() => {
      // TODO: In a real app, fetch from storage or backend
      // 从API获取收藏数据
      setFavorites([]);
      setIsLoading(false);
    }, 500);
  }, []);

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

  const handleCancelFavorite = (favId: string) => {
    Taro.showModal({
      title: "取消收藏",
      content: "确定要取消收藏该信息吗？",
      success: (res) => {
        if (res.confirm) {
          console.log("Cancelling favorite:", favId);
          // TODO: Remove from storage/backend
          setFavorites((prev) => prev.filter((fav) => fav.id !== favId));
          Taro.showToast({ title: "已取消收藏", icon: "success" });
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
          {filteredFavorites.map((fav) => {
            // Adapt FavoritePost to PostCardData
            const cardData: PostCardData = {
              id: fav.id,
              mockImagePlaceholderHeight: fav.mockImagePlaceholderHeight,
              mockImagePlaceholderColor: fav.mockImagePlaceholderColor,
              title: fav.title,
              description: fav.description || "", // Ensure description is a string
              category: fav.category, // Assumes FavoritePost.category has {name, color}
              price: fav.price,
              displayTimeText: formatCollectedTime(fav.collectedTime),
            };
            return (
              <View key={fav.id} className="favorite-item-wrapper">
                <PostCard post={cardData} />
                <Button
                  size="mini"
                  className="cancel-fav-button-external"
                  onClick={() => handleCancelFavorite(fav.id)}
                >
                  取消收藏
                </Button>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
