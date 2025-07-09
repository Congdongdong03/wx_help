"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PostList;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const components_1 = require("@tarojs/components");
const taro_1 = require("@tarojs/taro");
const PostCard_1 = require("../../components/PostCard");
const postService_1 = require("../../services/postService");
require("./index.scss");
const PAGE_SIZE = 10;
function PostList() {
    const [posts, setPosts] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [hasMore, setHasMore] = (0, react_1.useState)(true);
    const [currentPage, setCurrentPage] = (0, react_1.useState)(1);
    const postService = (0, postService_1.usePostService)();
    // 加载帖子列表
    const loadPosts = async (page) => {
        if (loading || !hasMore)
            return;
        setLoading(true);
        try {
            const response = await postService.getPostList(page, PAGE_SIZE);
            if (page === 1) {
                setPosts(response.posts);
            }
            else {
                setPosts((prev) => [...prev, ...response.posts]);
            }
            setHasMore(response.posts.length === PAGE_SIZE);
            setCurrentPage(page);
        }
        catch (error) {
            console.error("Failed to load posts:", error);
            taro_1.default.showToast({
                title: "加载失败，请重试",
                icon: "none",
            });
        }
        finally {
            setLoading(false);
        }
    };
    // 初始加载
    (0, react_1.useEffect)(() => {
        loadPosts(1);
    }, []);
    // 处理滚动加载
    const handleScrollToLower = () => {
        if (!loading && hasMore) {
            loadPosts(currentPage + 1);
        }
    };
    // 处理帖子点击
    const handlePostClick = (post) => {
        taro_1.default.navigateTo({
            url: `/pages/postDetail/index?id=${post.id}`,
        });
    };
    return ((0, jsx_runtime_1.jsx)(components_1.View, { className: "post-list", children: (0, jsx_runtime_1.jsxs)(components_1.ScrollView, { scrollY: true, className: "post-list-scroll", onScrollToLower: handleScrollToLower, children: [posts.map((post) => ((0, jsx_runtime_1.jsx)(PostCard_1.default, { post: post, onClick: () => handlePostClick(post) }, post.id))), loading && (0, jsx_runtime_1.jsx)(components_1.View, { className: "loading", children: "\u52A0\u8F7D\u4E2D..." }), !hasMore && posts.length > 0 && ((0, jsx_runtime_1.jsx)(components_1.View, { className: "no-more", children: "\u6CA1\u6709\u66F4\u591A\u4E86" }))] }) }));
}
//# sourceMappingURL=index.js.map