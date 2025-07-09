"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePosts = void 0;
const react_1 = require("react");
const taro_1 = require("@tarojs/taro");
const api_1 = require("../config/api");
const constants_1 = require("../constants");
const postUtils_1 = require("../utils/postUtils");
// ------------------ CONSTANTS ------------------
const POSTS_PER_PAGE = 10;
const DEFAULT_IMAGE_URL = "https://example.com/default-image.jpg";
const usePosts = ({ selectedCity, selectedCategoryId, }) => {
    // ------------------ 状态管理 ------------------
    const [displayedPosts, setDisplayedPosts] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [currentPage, setCurrentPage] = (0, react_1.useState)(1);
    const [hasMoreData, setHasMoreData] = (0, react_1.useState)(true);
    const [loadError, setLoadError] = (0, react_1.useState)(false);
    const [pinnedPosts, setPinnedPosts] = (0, react_1.useState)([]);
    const [normalPosts, setNormalPosts] = (0, react_1.useState)([]);
    const [recommendMeta, setRecommendMeta] = (0, react_1.useState)(null);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const isLoadingRef = (0, react_1.useRef)(isLoading);
    const currentPageRef = (0, react_1.useRef)(currentPage);
    (0, react_1.useEffect)(() => {
        isLoadingRef.current = isLoading;
    }, [isLoading]);
    (0, react_1.useEffect)(() => {
        currentPageRef.current = currentPage;
    }, [currentPage]);
    // ------------------ 核心逻辑：加载帖子数据 ------------------
    const loadPosts = (0, react_1.useCallback)(async (city, categoryId, page, append = false) => {
        if (isLoading)
            return;
        setIsLoading(true);
        setLoadError(false);
        try {
            const params = {
                page,
                limit: POSTS_PER_PAGE,
                city,
            };
            if (categoryId && categoryId !== "recommend") {
                params.category = categoryId;
            }
            console.log("🔍 usePosts: Making API request with params:", params);
            console.log("🔍 usePosts: API URL:", api_1.API_CONFIG.getApiUrl("/posts"));
            const res = await taro_1.default.request({
                url: api_1.API_CONFIG.getApiUrl("/posts"),
                method: "GET",
                data: params,
            });
            console.log("🔍 usePosts: API response:", res);
            if (res.data && res.data.code === 0 && res.data.data) {
                const { posts, pinned_content, pagination, recommend_meta } = res.data.data;
                console.log("原始置顶数据:", pinned_content);
                console.log("原始普通数据:", posts);
                const mapToFeedPost = (item) => {
                    // Validate that the item has a valid ID
                    if (!item.id || item.id === undefined || item.id === null) {
                        console.warn("Skipping item without valid ID:", item);
                        return null;
                    }
                    // 兼容 images 字段为字符串（JSON数组）、数组、空值
                    let images = [];
                    if (Array.isArray(item.images)) {
                        images = item.images;
                    }
                    else if (typeof item.images === "string") {
                        try {
                            const parsed = JSON.parse(item.images);
                            if (Array.isArray(parsed)) {
                                images = parsed;
                            }
                        }
                        catch (_a) {
                            images = [];
                        }
                    }
                    return {
                        id: item.id,
                        mockImagePlaceholderHeight: constants_1.PRESET_PLACEHOLDER_HEIGHTS[Math.floor(Math.random() * constants_1.PRESET_PLACEHOLDER_HEIGHTS.length)],
                        mockImagePlaceholderColor: constants_1.PRESET_PLACEHOLDER_COLORS[Math.floor(Math.random() * constants_1.PRESET_PLACEHOLDER_COLORS.length)],
                        title: item.title || "无标题",
                        content: item.content || "暂无描述",
                        content_preview: item.content_preview ||
                            (item.content ? item.content.slice(0, 50) + "..." : "暂无描述"),
                        category: constants_1.CATEGORIES.find((c) => c.id === (item.category || "recommend")) || constants_1.CATEGORIES[0],
                        sub_category: item.sub_category || "",
                        price: item.price || undefined,
                        updated_at: item.updated_at || new Date().toISOString(),
                        created_at: item.created_at || new Date().toISOString(),
                        city_code: item.city_code || city,
                        status: item.status || "published",
                        images,
                        cover_image: images[0] || DEFAULT_IMAGE_URL,
                        is_pinned: item.is_pinned || false,
                        is_weekly_deal: item.is_weekly_deal || false,
                        users: item.users
                            ? {
                                id: item.users.id,
                                nickname: item.users.nickname || "未知用户",
                                avatar_url: item.users.avatar_url ||
                                    "https://example.com/default-avatar.png",
                                gender: item.users.gender,
                                city: item.users.city,
                            }
                            : undefined,
                    };
                };
                const pinned = pinned_content.map(mapToFeedPost).filter(Boolean);
                const list = posts.map(mapToFeedPost).filter(Boolean);
                console.log("处理后的置顶帖子:", pinned);
                console.log("处理后的普通帖子:", list);
                setPinnedPosts(pinned);
                setNormalPosts((prevPosts) => append ? [...prevPosts, ...list] : list);
                if (categoryId !== "recommend") {
                    setDisplayedPosts((prevPosts) => append ? [...prevPosts, ...list] : list);
                }
                else {
                    setDisplayedPosts([]);
                }
                setHasMoreData(page < pagination.totalPages);
                setCurrentPage(page);
                // 如果是推荐分类，更新推荐元数据
                if (categoryId === "recommend" && recommend_meta) {
                    setRecommendMeta(recommend_meta);
                }
            }
            else if (res.data && res.data.message) {
                // 处理API返回错误信息的情况
                console.log("❌ API返回错误:", res.data.message);
                console.log("❌ 完整响应数据:", res.data);
                setPinnedPosts([]);
                setNormalPosts([]);
                setDisplayedPosts([]);
                setHasMoreData(false);
            }
            else {
                console.log("❌ API返回数据格式不正确:", res.data);
                console.log("❌ 响应状态码:", res.statusCode);
                setPinnedPosts([]);
                setNormalPosts([]);
                setDisplayedPosts([]);
                setHasMoreData(false);
            }
        }
        catch (error) {
            console.error("Failed to load posts:", error);
            setLoadError(true);
            taro_1.default.showToast({
                title: "加载失败，请检查网络连接",
                icon: "none",
                duration: 2000,
            });
        }
        finally {
            setIsLoading(false);
        }
    }, [] // 移除所有依赖项，避免死循环
    );
    // ------------------ 加载更多 ------------------
    const loadMore = (0, react_1.useCallback)(() => {
        if (!isLoading && hasMoreData) {
            console.log("Reached bottom, loading more...");
            loadPosts(selectedCity, selectedCategoryId, currentPage + 1, true);
        }
    }, [
        isLoading,
        hasMoreData,
        currentPage,
        loadPosts,
        selectedCity,
        selectedCategoryId,
    ]);
    // ------------------ 重试加载 ------------------
    const retryLoad = (0, react_1.useCallback)(() => {
        setDisplayedPosts([]);
        setCurrentPage(1);
        setHasMoreData(true);
        loadPosts(selectedCity, selectedCategoryId, 1);
    }, [loadPosts, selectedCity, selectedCategoryId]);
    // ------------------ 下拉刷新 ------------------
    const refresh = (0, react_1.useCallback)(async () => {
        console.log("开始下拉刷新...");
        setRefreshing(true);
        setCurrentPage(1);
        setHasMoreData(true);
        await loadPosts(selectedCity, selectedCategoryId, 1, false);
        setRefreshing(false);
        console.log("下拉刷新完成");
    }, [loadPosts, selectedCity, selectedCategoryId]);
    // ------------------ 计算属性 ------------------
    // 修改渲染逻辑：只在推荐页显示置顶帖子
    const isRecommendFirstPage = selectedCategoryId === "recommend" && currentPage === 1;
    let singlePinnedPost = undefined;
    let mixedPosts = [];
    if (isRecommendFirstPage && pinnedPosts.length > 0) {
        singlePinnedPost = pinnedPosts[0];
        const pinnedIds = new Set(pinnedPosts.map((p) => p.id));
        mixedPosts = normalPosts
            .filter((p) => !pinnedIds.has(p.id))
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
    else {
        if (selectedCategoryId === "recommend") {
            mixedPosts = normalPosts;
        }
        else {
            mixedPosts = displayedPosts;
        }
    }
    // 分配到两列
    const [leftColumnPosts, rightColumnPosts] = (0, postUtils_1.distributePosts)(mixedPosts);
    console.log("=== 渲染状态调试 ===");
    console.log("isLoading:", isLoading);
    console.log("loadError:", loadError);
    console.log("selectedCategoryId:", selectedCategoryId);
    console.log("isRecommendFirstPage:", isRecommendFirstPage);
    console.log("singlePinnedPost:", singlePinnedPost);
    console.log("mixedPosts.length:", mixedPosts.length);
    console.log("leftColumnPosts.length:", leftColumnPosts.length);
    console.log("rightColumnPosts.length:", rightColumnPosts.length);
    console.log("pinnedPosts:", pinnedPosts);
    console.log("normalPosts:", normalPosts);
    console.log("displayedPosts:", displayedPosts);
    // ------------------ 返回接口 ------------------
    return {
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
        singlePinnedPost,
        mixedPosts,
        leftColumnPosts,
        rightColumnPosts,
    };
};
exports.usePosts = usePosts;
//# sourceMappingURL=usePosts.js.map