"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FavoritesPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const taro_1 = require("@tarojs/taro");
const react_1 = require("react");
const components_1 = require("@tarojs/components");
const PostCard_1 = require("../../../components/PostCard");
require("./index.scss");
// Mock data for favorites
const MOCK_FAVORITES = [
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
const formatCollectedTime = (date) => {
    // Simplified: just return date string, or implement full relative time logic
    return `收藏于 ${date.toLocaleDateString()}`;
};
const FAVORITE_CATEGORIES_TABS = [
    { id: "all", name: "全部" },
    { id: "rent", name: "租房" },
    { id: "used", name: "二手" },
    { id: "jobs", name: "招聘" },
];
function FavoritesPage() {
    const [favorites, setFavorites] = (0, react_1.useState)([]);
    const [filteredFavorites, setFilteredFavorites] = (0, react_1.useState)([]);
    const [selectedFilter, setSelectedFilter] = (0, react_1.useState)("all");
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        // Simulate fetching favorites
        setIsLoading(true);
        setTimeout(() => {
            // TODO: In a real app, fetch from storage or backend
            setFavorites(MOCK_FAVORITES);
            setIsLoading(false);
        }, 500);
    }, []);
    (0, react_1.useEffect)(() => {
        // Filter favorites when `favorites` or `selectedFilter` changes
        if (selectedFilter === "all") {
            setFilteredFavorites(favorites);
        }
        else {
            setFilteredFavorites(favorites.filter((fav) => fav.category.id === selectedFilter));
        }
    }, [favorites, selectedFilter]);
    const handleFilterChange = (filterId) => {
        setSelectedFilter(filterId);
    };
    const handleCancelFavorite = (favId) => {
        taro_1.default.showModal({
            title: "取消收藏",
            content: "确定要取消收藏该信息吗？",
            success: (res) => {
                if (res.confirm) {
                    console.log("Cancelling favorite:", favId);
                    // TODO: Remove from storage/backend
                    setFavorites((prev) => prev.filter((fav) => fav.id !== favId));
                    taro_1.default.showToast({ title: "已取消收藏", icon: "success" });
                }
            },
        });
    };
    if (isLoading) {
        return (0, jsx_runtime_1.jsx)(components_1.View, { className: "favorites-loading", children: "\u52A0\u8F7D\u4E2D..." }); // TODO: Use skeleton
    }
    return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "favorites-page", children: [(0, jsx_runtime_1.jsx)(components_1.View, { className: "filter-tabs-container", children: FAVORITE_CATEGORIES_TABS.map((cat) => ((0, jsx_runtime_1.jsx)(components_1.Button, { className: `filter-tab ${selectedFilter === cat.id ? "active" : ""}`, onClick: () => handleFilterChange(cat.id), children: cat.name }, cat.id))) }), filteredFavorites.length === 0 && ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "empty-favorites-state", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u4F60\u8FD8\u6CA1\u6709\u6536\u85CF\u4EFB\u4F55\u5185\u5BB9\uFF0C" }), (0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u53BB\u9996\u9875\u770B\u770B\u5427\uFF5E" }), (0, jsx_runtime_1.jsx)(components_1.Button, { className: "browse-home-button", onClick: () => taro_1.default.switchTab({ url: "/pages/index/index" }), children: "\u6D4F\u89C8\u9996\u9875" })] })), (0, jsx_runtime_1.jsx)(components_1.ScrollView, { scrollY: true, className: "favorites-scroll-view", children: (0, jsx_runtime_1.jsx)(components_1.View, { className: "post-list-masonry-container", children: filteredFavorites.map((fav) => {
                        // Adapt FavoritePost to PostCardData
                        const cardData = {
                            id: fav.id,
                            mockImagePlaceholderHeight: fav.mockImagePlaceholderHeight,
                            mockImagePlaceholderColor: fav.mockImagePlaceholderColor,
                            title: fav.title,
                            description: fav.description || "", // Ensure description is a string
                            category: fav.category, // Assumes FavoritePost.category has {name, color}
                            price: fav.price,
                            displayTimeText: formatCollectedTime(fav.collectedTime),
                        };
                        return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "favorite-item-wrapper", children: [(0, jsx_runtime_1.jsx)(PostCard_1.default, { post: cardData }), (0, jsx_runtime_1.jsx)(components_1.Button, { size: "mini", className: "cancel-fav-button-external", onClick: () => handleCancelFavorite(fav.id), children: "\u53D6\u6D88\u6536\u85CF" })] }, fav.id));
                    }) }) })] }));
}
//# sourceMappingURL=index.js.map