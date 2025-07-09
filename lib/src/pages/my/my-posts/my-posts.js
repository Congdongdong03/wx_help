"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MyPosts;
const jsx_runtime_1 = require("react/jsx-runtime");
const taro_1 = require("@tarojs/taro");
const components_1 = require("@tarojs/components");
const request_1 = require("@/utils/request");
require("./index.scss");
const env_1 = require("../../../utils/env");
// --- API Integration START ---
const BASE_API_URL = `${env_1.BASE_URL}/api`; // 确保这是您后端API的正确地址
// mockPosts 将被API数据替代，暂时注释或后续删除
// const mockPosts: UIPost[] = [ ... ];
const tabList = [
    { title: "全部", status: "all" },
    { title: "已发布", status: "published" },
    { title: "审核中", status: "reviewing" },
    { title: "未通过", status: "failed" }, // 新增 "未通过" 标签页
    { title: "草稿", status: "draft" },
];
// MyPosts 页面组件
function MyPosts() {
    const router = (0, taro_1.useRouter)();
    const [currentTabIndex, setCurrentTabIndex] = (0, taro_1.useState)(0); // Renamed from 'current' for clarity
    // --- API Related State START ---
    const [apiPosts, setApiPosts] = (0, taro_1.useState)([]); // 存储从API获取的原始帖子
    const [displayedPosts, setDisplayedPosts] = (0, taro_1.useState)([]); // 存储转换后用于UI展示的帖子
    const [isLoading, setIsLoading] = (0, taro_1.useState)(false);
    const [error, setError] = (0, taro_1.useState)(null);
    const [pagination, setPagination] = (0, taro_1.useState)({
        currentPage: 1,
        totalPages: 1,
        totalPosts: 0,
        limit: 10, // 每页数量，可以设为可配置
    });
    const [stats, setStats] = (0, taro_1.useState)(null);
    // --- API Related State END ---
    const [activeMenuPostId, setActiveMenuPostId] = (0, taro_1.useState)(null);
    const [boostedPostIds, setBoostedPostIds] = (0, taro_1.useState)(new Set());
    const getCurrentApiStatusFilter = (0, taro_1.useCallback)(() => {
        const selectedTab = tabList[currentTabIndex]; // tabList is in closure, currentTabIndex is state
        let apiStatusFilter = "";
        switch (selectedTab.status) {
            case "published":
                apiStatusFilter = "published";
                break;
            case "reviewing":
                apiStatusFilter = "pending";
                break;
            case "failed":
                apiStatusFilter = "failed";
                break;
            case "all":
            default:
                apiStatusFilter = "";
                break;
        }
        return apiStatusFilter;
    }, [currentTabIndex]); // Dependency on currentTabIndex
    // 将 API Post 转换为 UIPost
    const mapApiPostToUIPost = (0, taro_1.useCallback)((apiPost) => {
        let imageUrl = "https://via.placeholder.com/200x150.png?text=No+Image";
        if (typeof apiPost.images === "string" &&
            apiPost.images.trim().startsWith("[")) {
            try {
                const imagesArray = JSON.parse(apiPost.images);
                if (Array.isArray(imagesArray) && imagesArray.length > 0) {
                    imageUrl = imagesArray[0]; // 取第一张图作为封面
                }
            }
            catch (e) {
                console.error("Error parsing images JSON:", e);
            }
        }
        let uiStatus = "pending"; // Default
        switch (apiPost.status) {
            case "published":
                uiStatus = "published";
                break;
            case "pending":
                uiStatus = "pending";
                break;
            case "failed":
                uiStatus = "rejected";
                break; // API 'failed' -> UI 'rejected' (未通过)
            case "draft":
                uiStatus = "draft";
                break;
        }
        return {
            id: apiPost.id,
            image: imageUrl,
            title: apiPost.title,
            description: apiPost.content || apiPost.title, // 如果没有content，用title
            createTime: apiPost.created_at
                ? new Date(apiPost.created_at).toLocaleString()
                : "未知时间",
            uiDisplayStatus: uiStatus,
            category: apiPost.category,
            originalApiPost: apiPost, // 保存原始数据
        };
    }, []); // Empty dependency array as it doesn't depend on component state/props
    // 将本地草稿转换为 UIPost
    const mapLocalDraftToUIPost = (0, taro_1.useCallback)((draftData, draftKey) => {
        if (draftData && typeof draftData === "object" && draftData.category) {
            return {
                id: draftKey, // 使用 draftKey 作为唯一ID
                draftId: draftKey,
                image: draftData.imageFiles && draftData.imageFiles.length > 0
                    ? draftData.imageFiles[0].path
                    : "https://via.placeholder.com/200x150.png?text=No+Image",
                title: draftData.formData.title ||
                    draftData.formData.description ||
                    `草稿: ${draftData.category}`,
                description: draftData.formData.description ||
                    draftData.formData.title ||
                    "无描述内容",
                createTime: new Date(draftData.timestamp).toLocaleString(),
                uiDisplayStatus: "draft",
                category: draftData.category,
            };
        }
        return null;
    }, [] // Empty dependency array
    );
    const fetchAndSetLocalDrafts = (0, taro_1.useCallback)(() => {
        console.log("MyPosts: fetchAndSetLocalDrafts called");
        setIsLoading(true); // 也为加载本地草稿设置loading
        setError(null);
        try {
            const { keys } = taro_1.default.getStorageInfoSync();
            const draftKeys = keys.filter((key) => key.startsWith("draft_"));
            let loadedDrafts = draftKeys
                .map((key) => {
                const storedValue = taro_1.default.getStorageSync(key);
                // Ensure storedValue is a valid object structure before casting to DraftPostData
                // and before calling mapLocalDraftToUIPost
                if (storedValue &&
                    typeof storedValue === "object" &&
                    typeof storedValue.category === "string" &&
                    typeof storedValue.timestamp === "number" &&
                    typeof storedValue.formData === "object" &&
                    Array.isArray(storedValue.imageFiles)) {
                    return mapLocalDraftToUIPost(storedValue, key);
                }
                return null; // Will be filtered out by .filter(Boolean)
            })
                .filter(Boolean);
            loadedDrafts.sort((a, b) => {
                var _a, _b;
                const tsA = parseInt(((_a = a.draftId) === null || _a === void 0 ? void 0 : _a.split("_").pop()) || "0");
                const tsB = parseInt(((_b = b.draftId) === null || _b === void 0 ? void 0 : _b.split("_").pop()) || "0");
                return tsB - tsA;
            });
            console.log("MyPosts: Loaded all local drafts:", loadedDrafts.length);
            setDisplayedPosts(loadedDrafts);
            setApiPosts([]); // 清空API帖子
            setStats(null); // 本地草稿不从API获取统计
            setPagination((prev) => (Object.assign(Object.assign({}, prev), { totalPages: 1, currentPage: 1, totalPosts: loadedDrafts.length })));
        }
        catch (e) {
            console.error("MyPosts: Error loading local drafts:", e);
            setError("加载草稿失败");
            setDisplayedPosts([]);
        }
        finally {
            setIsLoading(false);
        }
    }, [mapLocalDraftToUIPost]); // Added mapLocalDraftToUIPost
    // 获取 API 帖子的函数
    const fetchApiPosts = (0, taro_1.useCallback)(async (page = 1, statusFilter = "", isLoadMore = false) => {
        console.log(`MyPosts: fetchApiPosts called for page: ${page}, status: ${statusFilter}, isLoadMore: ${isLoadMore}`);
        setIsLoading(true);
        setError(null);
        try {
            let url = `${BASE_API_URL}/posts/my?page=${page}&limit=${pagination.limit}`;
            if (statusFilter) {
                url += `&status=${statusFilter}`;
            }
            const response = await (0, request_1.request)(url, {
                method: "GET",
            });
            if (response && response.code === 0 && response.data) {
                const apiData = response.data;
                const postsFromApi = apiData.posts;
                const safePosts = Array.isArray(postsFromApi) ? postsFromApi : [];
                console.log("MyPosts: Posts from API after safety check:", safePosts);
                setApiPosts((prev) => isLoadMore ? [...prev, ...safePosts] : safePosts);
                const uiPosts = safePosts.map(mapApiPostToUIPost);
                console.log("MyPosts: Posts mapped to UI Posts:", uiPosts);
                setDisplayedPosts((prev) => isLoadMore ? [...prev, ...uiPosts] : uiPosts);
                if (apiData.pagination) {
                    setPagination(apiData.pagination);
                }
                else {
                    console.warn("MyPosts: Pagination data missing from API response. Setting default.");
                    setPagination({
                        currentPage: page,
                        totalPages: page,
                        totalPosts: safePosts.length,
                        limit: pagination.limit,
                    });
                }
                if (apiData.stats) {
                    setStats(apiData.stats);
                }
                else {
                    console.warn("MyPosts: Stats data missing from API response. Setting default based on posts.");
                    setStats({
                        draftCount: 0,
                        pendingCount: 0,
                        publishedCount: 0,
                        failedCount: 0,
                        totalCount: safePosts.length,
                    });
                }
            }
            else {
                let errorMessage = `请求失败`;
                if (response.data && (response.data.message || response.data.error)) {
                    errorMessage =
                        response.data.message || response.data.error || errorMessage;
                }
                else if (response.statusCode) {
                    errorMessage += `，状态码: ${response.statusCode}`;
                }
                console.error("MyPosts: API business logic error or non-200 response:", errorMessage, response);
                throw new Error(errorMessage);
            }
        }
        catch (err) {
            let detailedErrorMessage = "获取帖子列表失败";
            if (err.message) {
                detailedErrorMessage = err.message;
            }
            else if (err.response &&
                err.response.data &&
                (err.response.data.message || err.response.data.error)) {
                detailedErrorMessage =
                    err.response.data.message || err.response.data.error;
            }
            console.error("MyPosts: Error fetching API posts (catch block):", detailedErrorMessage, err);
            setError(detailedErrorMessage);
            if (!isLoadMore) {
                setApiPosts([]);
                setDisplayedPosts([]);
                setStats(null);
                setPagination((prev) => (Object.assign(Object.assign({}, prev), { currentPage: 1, totalPages: 1, totalPosts: 0 })));
            }
        }
        finally {
            setIsLoading(false);
        }
    }, [pagination.limit, mapApiPostToUIPost]);
    // 根据当前选中的Tab加载数据
    const loadCurrentTabData = (0, taro_1.useCallback)(() => {
        const selectedTab = tabList[currentTabIndex];
        console.log("MyPosts: loadCurrentTabData for tab:", selectedTab.title, selectedTab.status);
        setActiveMenuPostId(null); // 切换tab时关闭菜单
        if (selectedTab.status === "draft") {
            fetchAndSetLocalDrafts();
        }
        else {
            let apiStatusFilter = "";
            switch (selectedTab.status) {
                case "published":
                    apiStatusFilter = "published";
                    break;
                case "reviewing":
                    apiStatusFilter = "pending";
                    break;
                case "failed":
                    apiStatusFilter = "failed";
                    break;
                case "all": // "all" falls through to no filter
                default:
                    apiStatusFilter = "";
                    break;
            }
            fetchApiPosts(1, apiStatusFilter); // 默认加载第一页
        }
    }, [
        currentTabIndex,
        fetchApiPosts,
        fetchAndSetLocalDrafts,
        mapLocalDraftToUIPost,
    ]); // Added mapLocalDraftToUIPost
    (0, taro_1.useEffect)(() => {
        loadCurrentTabData();
    }, [currentTabIndex, loadCurrentTabData]); // currentTabIndex 变化时重新加载数据
    taro_1.default.useDidShow(() => {
        console.log("MyPosts: useDidShow triggered. Current tab index:", currentTabIndex);
        const needsRefresh = taro_1.default.getStorageSync("refreshMyPosts");
        if (needsRefresh === "true") {
            console.log("MyPosts: Detected refreshMyPosts flag. Refreshing current tab data.");
            taro_1.default.removeStorageSync("refreshMyPosts");
            loadCurrentTabData(); // 重新加载当前tab数据
        }
        else {
            // 如果不是强制刷新，并且当前是草稿页，也刷新一下草稿列表，因为草稿可能在表单页被修改
            if (tabList[currentTabIndex].status === "draft") {
                fetchAndSetLocalDrafts();
            }
        }
        // ... (保留您原有的 eventCenter 逻辑，如果还需要)
    });
    taro_1.default.usePullDownRefresh(() => {
        console.log("MyPosts: usePullDownRefresh hook triggered for tab index:", currentTabIndex);
        const selectedTab = tabList[currentTabIndex];
        if (selectedTab.status === "draft") {
            fetchAndSetLocalDrafts();
        }
        else {
            const apiStatusFilter = getCurrentApiStatusFilter();
            fetchApiPosts(1, apiStatusFilter, false); // 重置到第一页
        }
        setTimeout(() => {
            taro_1.default.stopPullDownRefresh();
        }, 1000);
    });
    // 添加触底加载更多功能
    taro_1.default.useReachBottom(() => {
        console.log("MyPosts: Reached bottom, loading more...");
        const selectedTab = tabList[currentTabIndex];
        if (selectedTab.status !== "draft" &&
            !isLoading &&
            pagination.currentPage < pagination.totalPages) {
            const apiStatusFilter = getCurrentApiStatusFilter();
            fetchApiPosts(pagination.currentPage + 1, apiStatusFilter, true);
        }
    });
    // Tab 点击处理函数
    const handleTabClick = (index) => {
        setCurrentTabIndex(index);
        const apiStatusFilter = tabList[index].status === "draft" ? "draft" : getCurrentApiStatusFilter();
        fetchApiPosts(1, apiStatusFilter, false);
    };
    // *** 修改函数：处理擦亮按钮点击事件 (占位符) ***
    const handleBoostClick = async (postId) => {
        const postToBoost = displayedPosts.find((p) => p.id === postId);
        if (!postToBoost ||
            typeof postToBoost.id !== "number" ||
            postToBoost.uiDisplayStatus !== "published") {
            taro_1.default.showToast({ title: "只有已发布的帖子才能擦亮", icon: "none" });
            return;
        }
        const numericPostId = postToBoost.id;
        setIsLoading(true);
        try {
            const response = await (0, request_1.request)(`${BASE_API_URL}/posts/${numericPostId}/polish`, {
                method: "POST",
                data: {
                    title: "擦亮帖子",
                    description: "帖子已擦亮",
                },
            });
            if (response && response.code === 0) {
                taro_1.default.showToast({ title: "擦亮成功", icon: "success" });
                setBoostedPostIds((prev) => new Set(prev).add(numericPostId));
                const currentFilter = getCurrentApiStatusFilter();
                fetchApiPosts(pagination.currentPage, currentFilter);
            }
            else {
                const errorMessage = (response === null || response === void 0 ? void 0 : response.message) || "擦亮失败";
                throw new Error(`擦亮失败: ${errorMessage}`);
            }
        }
        catch (e) {
            taro_1.default.showToast({ title: e.message || "擦亮失败", icon: "error" });
            console.error("Error boosting post:", e);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleEdit = (postToEdit) => {
        setActiveMenuPostId(null);
        console.log("Editing post:", postToEdit);
        if (!postToEdit.category) {
            taro_1.default.showToast({ title: "帖子分类未知，无法编辑", icon: "none" });
            return;
        }
        if (postToEdit.draftId) {
            // 是本地草稿
            taro_1.default.navigateTo({
                url: `/pages/post/form/index?category=${postToEdit.category}&draftId=${postToEdit.draftId}`,
            });
        }
        else if (typeof postToEdit.id === "number" &&
            postToEdit.originalApiPost) {
            // 是API帖子
            // 对于API帖子，导航到表单页，并传递ID和分类，表单页应能根据ID获取完整帖子信息
            taro_1.default.setStorageSync("editingPostData", postToEdit.originalApiPost); // 可以先存一份用于快速回填
            taro_1.default.navigateTo({
                url: `/pages/post/form/index?editingPostId=${postToEdit.id}&category=${postToEdit.category}`,
            });
            // TODO: 后续表单页应实现根据 editingPostId 从API获取最新数据
        }
        else {
            taro_1.default.showToast({ title: "无法确定帖子类型进行编辑", icon: "none" });
        }
    };
    const handleDeleteDraft = (draftIdToDelete) => {
        // 这个函数保持不变，处理本地草稿删除
        setActiveMenuPostId(null);
        taro_1.default.showModal({
            title: "确认删除",
            content: "确定要删除此草稿吗？操作不可撤销。",
            success: (res) => {
                if (res.confirm) {
                    try {
                        taro_1.default.removeStorageSync(draftIdToDelete);
                        taro_1.default.showToast({ title: "草稿已删除", icon: "success" });
                        fetchAndSetLocalDrafts(); // 重新加载草稿列表
                    }
                    catch (e) {
                        taro_1.default.showToast({ title: "删除失败", icon: "error" });
                    }
                }
            },
        });
    };
    const handleDeleteApiPost = (postId) => {
        setActiveMenuPostId(null);
        taro_1.default.showModal({
            title: "确认删除",
            content: "确定要删除此帖子吗？此操作不可撤销。",
            success: async (res) => {
                if (res.confirm) {
                    setIsLoading(true);
                    try {
                        const response = await (0, request_1.request)(`${BASE_API_URL}/posts/${postId}`, {
                            method: "DELETE",
                        });
                        if (response && response.code === 0) {
                            taro_1.default.showToast({ title: "删除成功", icon: "success" });
                            const currentFilter = getCurrentApiStatusFilter();
                            fetchApiPosts(1, currentFilter); // Refresh list, go to page 1
                        }
                        else {
                            const errorMessage = (response === null || response === void 0 ? void 0 : response.message) || "删除失败";
                            throw new Error(`删除失败: ${errorMessage}`);
                        }
                    }
                    catch (e) {
                        taro_1.default.showToast({ title: e.message || "删除失败", icon: "error" });
                        console.error("Error deleting API post:", e);
                    }
                    finally {
                        setIsLoading(false);
                    }
                }
            },
        });
    };
    const handleRepublish = async (postId) => {
        setActiveMenuPostId(null);
        taro_1.default.showModal({
            title: "确认重新发布",
            content: "确定要重新发布此帖子吗？",
            success: async (res) => {
                if (res.confirm) {
                    setIsLoading(true);
                    try {
                        const response = await (0, request_1.request)(`${BASE_API_URL}/posts/${postId}`, {
                            method: "PUT",
                            data: {
                                status: "publish",
                            },
                        });
                        if (response && response.code === 0) {
                            taro_1.default.showToast({ title: "重新发布成功", icon: "success" });
                            const currentFilter = getCurrentApiStatusFilter();
                            fetchApiPosts(pagination.currentPage, currentFilter); // Refresh current page
                        }
                        else {
                            const errorMessage = (response === null || response === void 0 ? void 0 : response.message) || "重新发布失败";
                            throw new Error(`重新发布失败: ${errorMessage}`);
                        }
                    }
                    catch (e) {
                        taro_1.default.showToast({
                            title: e.message || "重新发布失败",
                            icon: "error",
                        });
                        console.error("Error republishing post:", e);
                    }
                    finally {
                        setIsLoading(false);
                    }
                }
            },
        });
    };
    // 辅助函数：将 UI 展示状态转换为中文显示
    const displayUiStatus = (status) => {
        switch (status) {
            case "pending":
                return "审核中";
            case "published": // Fallthrough
            case "approved":
                return "已发布";
            case "rejected": // Fallthrough
            case "failed":
                return "未通过";
            case "taken_down":
                return "已下架";
            case "draft":
                return "草稿";
            default:
                return "未知";
        }
    };
    // 组件渲染结构
    return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "my-posts", children: [(0, jsx_runtime_1.jsx)(components_1.View, { className: "tabs", children: tabList.map((tab, index) => ((0, jsx_runtime_1.jsx)(components_1.View, { className: `tab-item ${currentTabIndex === index ? "active" : ""}`, onClick: () => handleTabClick(index), children: (0, jsx_runtime_1.jsx)(components_1.Text, { children: tab.title }) }, tab.status))) }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "tab-content", children: [isLoading && (0, jsx_runtime_1.jsx)(components_1.View, { className: "loading-message", children: "\u52A0\u8F7D\u4E2D..." }), error && (0, jsx_runtime_1.jsxs)(components_1.View, { className: "error-message", children: ["\u9519\u8BEF: ", error] }), !isLoading && !error && displayedPosts.length === 0 && ((0, jsx_runtime_1.jsx)(components_1.View, { className: "no-posts-message", children: tabList[currentTabIndex].status === "draft"
                            ? "你还没有任何本地草稿～"
                            : "没有找到相关帖子～" })), !isLoading && !error && displayedPosts.length > 0 && ((0, jsx_runtime_1.jsxs)(components_1.ScrollView, { scrollY: true, className: "post-list", onScrollToLower: () => {
                            if (tabList[currentTabIndex].status !== "draft" &&
                                !isLoading &&
                                pagination.currentPage < pagination.totalPages) {
                                const apiStatusFilter = getCurrentApiStatusFilter();
                                fetchApiPosts(pagination.currentPage + 1, apiStatusFilter, true);
                            }
                        }, children: [(tabList[currentTabIndex].status === "reviewing"
                                ? displayedPosts.filter((post) => post.title !== "草稿")
                                : displayedPosts).map((post) => {
                                const isApiPost = typeof post.id === "number";
                                const isBoostable = isApiPost && post.uiDisplayStatus === "published"; // API帖子且已发布
                                const isBoosted = isBoostable && boostedPostIds.has(post.id);
                                const currentPostIdForMenu = post.draftId || post.id;
                                return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "post-card", children: [(0, jsx_runtime_1.jsxs)(components_1.View, { className: "post-main", onClick: () => {
                                                if (post.category) {
                                                    handleEdit(post);
                                                }
                                            }, children: [(0, jsx_runtime_1.jsx)(components_1.Image, { className: "post-image", src: post.image, mode: "aspectFill" }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "post-details", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "post-description", children: post.title || post.description }), (0, jsx_runtime_1.jsx)(components_1.View, { className: "post-footer-row", children: (0, jsx_runtime_1.jsxs)(components_1.View, { className: "post-meta", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "post-time", children: post.createTime }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: `post-status status-${post.uiDisplayStatus}`, children: post.uiDisplayStatus === "pending" &&
                                                                            post.title === "草稿"
                                                                            ? "草稿"
                                                                            : displayUiStatus(post.uiDisplayStatus) })] }) })] })] }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "post-actions", children: [(0, jsx_runtime_1.jsxs)(components_1.View, { className: "post-options-menu-container", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "three-dots-icon", onClick: () => setActiveMenuPostId(activeMenuPostId === currentPostIdForMenu
                                                                ? null
                                                                : currentPostIdForMenu), children: "\u00B7\u00B7\u00B7" }), activeMenuPostId === currentPostIdForMenu && ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "options-menu", children: [(0, jsx_runtime_1.jsx)(components_1.Button, { className: "menu-button", onClick: () => handleEdit(post), children: post.draftId ? "编辑草稿" : "编辑" }), isApiPost && ((0, jsx_runtime_1.jsx)(components_1.Button, { className: "menu-button takedown", onClick: () => handleDeleteApiPost(post.id), children: "\u5220\u9664" })), post.draftId && ( // 本地草稿的删除
                                                                (0, jsx_runtime_1.jsx)(components_1.Button, { className: "menu-button takedown", onClick: () => handleDeleteDraft(post.draftId), children: "\u5220\u9664\u8349\u7A3F" })), isApiPost &&
                                                                    (post.uiDisplayStatus === "draft" || // API Draft
                                                                        post.uiDisplayStatus === "rejected") && ((0, jsx_runtime_1.jsx)(components_1.Button, { className: "menu-button", onClick: () => handleRepublish(post.id), children: "\u91CD\u65B0\u53D1\u5E03" }))] }))] }), isBoostable && ((0, jsx_runtime_1.jsx)(components_1.View, { className: `boost-button-container ${isBoosted ? "is-boosted" : ""}`, onClick: () => {
                                                        if (!isBoosted && typeof post.id === "number") {
                                                            handleBoostClick(post.id);
                                                        }
                                                        else if (isBoosted) {
                                                            taro_1.default.showToast({
                                                                title: "一天只能擦亮一次",
                                                                icon: "none",
                                                            });
                                                        }
                                                    }, children: (0, jsx_runtime_1.jsx)(components_1.Button, { className: "boost-button", disabled: isBoosted, children: isBoosted ? "已擦亮" : "擦亮" }) }))] })] }, currentPostIdForMenu));
                            }), isLoading && ((0, jsx_runtime_1.jsx)(components_1.View, { className: "loading-more", children: (0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u52A0\u8F7D\u66F4\u591A..." }) })), !isLoading && pagination.currentPage >= pagination.totalPages && ((0, jsx_runtime_1.jsx)(components_1.View, { className: "no-more", children: (0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u6CA1\u6709\u66F4\u591A\u5185\u5BB9\u4E86" }) }))] }))] })] }));
}
definePageConfig({
    navigationBarTitleText: "我的发布",
    enablePullDownRefresh: true,
});
//# sourceMappingURL=my-posts.js.map