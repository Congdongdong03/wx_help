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

// Mock data for favorites
const MOCK_FAVORITES: FavoritePost[] = [
  {
    id: "fav1",
    mockImagePlaceholderHeight: 300,
    mockImagePlaceholderColor: "#a2d2ff",
    title: "收藏的帖子标题1 - 温馨小屋",
    price: "$250/周",
    category: { id: "rent", name: "租房", color: "#007bff" },
    collectedTime: new Date(Date.now() - 24 * 60 * 60 * 1000 * 1), // 1 day ago
    description: "这是收藏的温馨小屋的简短描述...",
  },
  {
    id: "fav2",
    mockImagePlaceholderHeight: 450,
    mockImagePlaceholderColor: "#ffafcc",
    title: "收藏的帖子标题2 - 九成新山地自行车",
    price: "$120",
    category: { id: "used", name: "二手", color: "#28a745" },
    collectedTime: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2),
    description: "一个几乎全新的自行车，非常适合城市骑行。",
  },
  {
    id: "fav3",
    mockImagePlaceholderHeight: 280,
    mockImagePlaceholderColor: "#b0f2c2",
    title: "收藏的帖子标题3 - 市中心咖啡店招聘服务员",
    category: { id: "jobs", name: "招聘", color: "#ffc107" },
    collectedTime: new Date(Date.now() - 24 * 60 * 60 * 1000 * 3),
    description: "诚聘有经验的服务员数名，待遇优厚。",
  },
];

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
      setFavorites(MOCK_FAVORITES);
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
    return <View className="favorites-loading">加载中...</View>; // TODO: Use skeleton
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
