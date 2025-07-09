"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Index;
const jsx_runtime_1 = require("react/jsx-runtime");
const taro_1 = require("@tarojs/taro");
const react_1 = require("react");
const components_1 = require("@tarojs/components");
const env_1 = require("../../utils/env");
const app_1 = require("../../app");
require("./index.scss");
const LoginModal_1 = require("../../components/LoginModal");
const UserSwitcher_1 = require("../../components/UserSwitcher");
const PostCard_1 = require("../../components/PostCard");
const SkeletonCard_1 = require("../../components/SkeletonCard");
const constants_1 = require("../../constants");
const usePosts_1 = require("../../hooks/usePosts");
// ------------------ MOCK DATA ------------------
// ------------------ MASONRY LAYOUT HELPER ------------------
// ------------------ API 数据加载 ------------------
function Index() {
    var _a;
    const [cities, setCities] = (0, react_1.useState)([]);
    const [selectedCity, setSelectedCity] = (0, react_1.useState)("");
    const [selectedCategoryId, setSelectedCategoryId] = (0, react_1.useState)("recommend");
    const [isCityPickerVisible, setIsCityPickerVisible] = (0, react_1.useState)(false);
    const [isUserSwitcherVisible, setIsUserSwitcherVisible] = (0, react_1.useState)(false);
    // 使用 usePosts hook
    const { 
    // 数据
    displayedPosts, pinnedPosts, normalPosts, recommendMeta, 
    // 状态
    isLoading, loadError, hasMoreData, refreshing, currentPage, 
    // 遥控器（函数）
    loadPosts, loadMore, refresh, retryLoad, 
    // 计算属性
    isRecommendFirstPage, singlePinnedPost, mixedPosts, leftColumnPosts, rightColumnPosts, } = (0, usePosts_1.usePosts)({
        selectedCity,
        selectedCategoryId,
    });
    // 获取城市列表
    (0, react_1.useEffect)(() => {
        console.log("开始加载城市列表...");
        taro_1.default.request({
            url: `${env_1.BASE_URL}/api/home/cities`,
            method: "GET",
            timeout: 10000,
            header: {
                "Content-Type": "application/json",
            },
        })
            .then((res) => {
            console.log("城市API响应:", res);
            if (res.data && res.data.code === 0) {
                const cityOptions = res.data.data.map((city) => ({
                    label: city.name,
                    value: city.code,
                }));
                console.log("解析后的城市选项:", cityOptions);
                setCities(cityOptions);
                if (cityOptions.length > 0 && !selectedCity) {
                    setSelectedCity(cityOptions[0].value);
                }
            }
            else {
                console.warn("城市API返回格式不正确:", res.data);
                taro_1.default.showToast({
                    title: "获取城市列表失败",
                    icon: "none",
                    duration: 2000,
                });
            }
        })
            .catch((error) => {
            console.error("加载城市列表失败:", error);
            taro_1.default.showToast({
                title: "加载城市列表失败，请检查网络",
                icon: "none",
                duration: 2000,
            });
        });
    }, []);
    // 当城市和分类变化时加载数据
    (0, react_1.useEffect)(() => {
        if (!selectedCity && cities.length > 0) {
            setSelectedCity(cities[0].value);
            return;
        }
        if (selectedCity) {
            loadPosts(selectedCity, selectedCategoryId, 1, false);
        }
    }, [selectedCity, selectedCategoryId, cities, loadPosts]);
    const handleCategoryChange = (categoryId) => {
        setSelectedCategoryId(categoryId);
    };
    const handleCitySelectorClick = () => {
        setIsCityPickerVisible(true);
    };
    const handleCloseCityPicker = () => {
        setIsCityPickerVisible(false);
    };
    const handleSelectCity = (cityCode) => {
        setSelectedCity(cityCode);
        setIsCityPickerVisible(false);
    };
    return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "index-page", children: [(0, jsx_runtime_1.jsxs)(components_1.View, { className: "header", children: [(0, jsx_runtime_1.jsxs)(components_1.View, { className: "city-selector", onClick: handleCitySelectorClick, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { children: ((_a = cities.find((c) => c.value === selectedCity)) === null || _a === void 0 ? void 0 : _a.label) ||
                                    selectedCity }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "arrow", children: "\u25BC" })] }), (0, jsx_runtime_1.jsx)(components_1.View, { className: "category-tabs", children: constants_1.CATEGORIES.map((cat) => ((0, jsx_runtime_1.jsx)(components_1.Button, { className: `category-tab ${selectedCategoryId === cat.id ? "active" : ""}`, onClick: () => handleCategoryChange(cat.id), children: cat.name }, cat.id))) })] }), (0, jsx_runtime_1.jsx)(components_1.Button, { className: "test-button", onClick: () => {
                    (0, app_1.clearLoginState)();
                    (0, app_1.checkLoginAndShowModal)();
                }, style: {
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
                }, children: "\u6D4B\u8BD5\u767B\u5F55" }), process.env.NODE_ENV === "development" && ((0, jsx_runtime_1.jsx)(components_1.Button, { className: "user-switcher-button", onClick: () => setIsUserSwitcherVisible(true), style: {
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
                }, children: "\u5207\u6362\u7528\u6237" })), (0, jsx_runtime_1.jsxs)(components_1.ScrollView, { scrollY: true, className: "posts-scroll-view", refresherEnabled: true, refresherTriggered: refreshing, onRefresherRefresh: refresh, onScrollToLower: loadMore, lowerThreshold: 150, children: [isLoading && currentPage === 1 && !loadError && ((0, jsx_runtime_1.jsx)(components_1.View, { className: "loading-container skeleton-container", children: [...Array(4)].map((_, index) => {
                            const randomHeight = Math.floor(Math.random() * (450 - 250 + 1)) + 250;
                            return ((0, jsx_runtime_1.jsx)(SkeletonCard_1.default, { mockImageHeight: randomHeight }, `skeleton-${index}`));
                        }) })), loadError && !isLoading && ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "empty-state-container", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "empty-state-text", children: "\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5" }), (0, jsx_runtime_1.jsx)(components_1.Button, { className: "empty-state-button", onClick: retryLoad, children: "\u91CD\u8BD5" })] })), !isLoading && !loadError && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [isRecommendFirstPage &&
                                !singlePinnedPost &&
                                mixedPosts.length === 0 && ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "empty-state-container", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "empty-state-text", children: "\u6682\u65E0\u76F8\u5173\u4FE1\u606F\uFF0C\u6362\u4E2A\u5206\u7C7B\u8BD5\u8BD5\uFF1F" }), (0, jsx_runtime_1.jsx)(components_1.Button, { className: "empty-state-button", onClick: () => taro_1.default.navigateTo({ url: "/pages/publish/index" }), children: "\u53BB\u53D1\u5E16" })] })), !isRecommendFirstPage && mixedPosts.length === 0 && ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "empty-state-container", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "empty-state-text", children: "\u8BE5\u5206\u7C7B\u6682\u65E0\u5185\u5BB9\uFF0C\u6362\u4E2A\u5206\u7C7B\u8BD5\u8BD5\uFF1F" }), (0, jsx_runtime_1.jsx)(components_1.Button, { className: "empty-state-button", onClick: () => taro_1.default.navigateTo({ url: "/pages/publish/index" }), children: "\u53BB\u53D1\u5E16" })] }))] })), (mixedPosts.length > 0 || singlePinnedPost) && ((0, jsx_runtime_1.jsxs)(components_1.View, { style: { padding: "20rpx" }, children: [singlePinnedPost && ((0, jsx_runtime_1.jsx)(components_1.View, { style: { width: "100%", marginBottom: "20rpx" }, children: (0, jsx_runtime_1.jsx)(PostCard_1.default, { post: singlePinnedPost, isPinned: true }) })), mixedPosts.length > 0 && ((0, jsx_runtime_1.jsxs)(components_1.View, { style: { display: "flex", flexDirection: "row", gap: "20rpx" }, children: [(0, jsx_runtime_1.jsx)(components_1.View, { style: {
                                            flex: 1,
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "20rpx",
                                        }, children: leftColumnPosts.map((post) => ((0, jsx_runtime_1.jsx)(PostCard_1.default, { post: post }, post.id))) }), (0, jsx_runtime_1.jsx)(components_1.View, { style: {
                                            flex: 1,
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "20rpx",
                                        }, children: rightColumnPosts.map((post) => ((0, jsx_runtime_1.jsx)(PostCard_1.default, { post: post }, post.id))) })] }))] })), isLoading && currentPage > 1 && ((0, jsx_runtime_1.jsx)(components_1.View, { className: "loading-more-container", children: (0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u52A0\u8F7D\u4E2D..." }) })), !isLoading && !hasMoreData && mixedPosts.length > 0 && ((0, jsx_runtime_1.jsx)(components_1.View, { className: "no-more-posts-container", children: (0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u5DF2\u7ECF\u5230\u5E95\u5566~" }) }))] }), isCityPickerVisible && ((0, jsx_runtime_1.jsx)(components_1.View, { className: "city-picker-overlay", onClick: handleCloseCityPicker, children: (0, jsx_runtime_1.jsxs)(components_1.View, { className: "city-picker-content", onClick: (e) => e.stopPropagation(), children: [(0, jsx_runtime_1.jsxs)(components_1.View, { className: "city-picker-header", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u9009\u62E9\u57CE\u5E02" }), (0, jsx_runtime_1.jsx)(components_1.Button, { className: "city-picker-close-btn", onClick: handleCloseCityPicker, children: "\u5173\u95ED" })] }), (0, jsx_runtime_1.jsx)(components_1.ScrollView, { scrollY: true, className: "city-picker-list", children: cities.map((city) => ((0, jsx_runtime_1.jsx)(components_1.View, { className: `city-picker-item ${selectedCity === city.value ? "active" : ""}`, onClick: () => handleSelectCity(city.value), children: city.label }, city.value))) })] }) })), (0, jsx_runtime_1.jsx)(LoginModal_1.default, {}), (0, jsx_runtime_1.jsx)(UserSwitcher_1.default, { isVisible: isUserSwitcherVisible, onClose: () => setIsUserSwitcherVisible(false) })] }));
}
//# sourceMappingURL=index.js.map