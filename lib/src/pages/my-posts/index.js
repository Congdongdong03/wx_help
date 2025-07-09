"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const taro_1 = require("@tarojs/taro");
const components_1 = require("@tarojs/components");
const index_module_scss_1 = require("./index.module.scss");
const env_1 = require("../../utils/env");
// Replace with your actual API base URL
const BASE_API_URL = `${env_1.BASE_URL}/api`;
const MyPostsPage = () => {
    const [posts, setPosts] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const [currentPage, setCurrentPage] = (0, react_1.useState)(1);
    const [totalPages, setTotalPages] = (0, react_1.useState)(1);
    const [limit] = (0, react_1.useState)(10); // Or make it configurable
    const [currentStatus, setCurrentStatus] = (0, react_1.useState)(""); // Empty string means all
    const [stats, setStats] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const fetchPosts = async () => {
            setIsLoading(true);
            setError(null);
            try {
                let url = `${BASE_API_URL}/posts/my?page=${currentPage}&limit=${limit}`;
                if (currentStatus) {
                    url += `&status=${currentStatus}`;
                }
                const response = await taro_1.default.request({
                    url,
                    method: "GET",
                });
                if (response.statusCode === 200 && response.data) {
                    setPosts(response.data.posts);
                    setTotalPages(response.data.pagination.totalPages);
                    setStats(response.data.stats);
                }
                else {
                    throw new Error(`Failed to fetch posts. Status: ${response.statusCode}`);
                }
            }
            catch (err) {
                setError(err.message || "An unknown error occurred");
                setPosts([]);
                setStats(null);
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchPosts();
    }, [currentPage, limit, currentStatus]);
    const handleStatusFilterChange = (status) => {
        setCurrentStatus(status);
        setCurrentPage(1); // Reset to first page when filter changes
    };
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };
    // Placeholder Action Handlers
    const handleRefresh = (postId) => {
        taro_1.default.showToast({
            title: `擦亮 Post ID: ${postId} (Not Implemented)`,
            icon: "none",
        });
        // TODO: Implement API call for PUT /api/posts/:id/refresh
    };
    const handleEdit = (postId) => {
        taro_1.default.showToast({
            title: `编辑 Post ID: ${postId} (Not Implemented)`,
            icon: "none",
        });
        // TODO: Navigate to edit page or implement modal for PUT /api/posts/:id
    };
    const handleDelete = (postId) => {
        taro_1.default.showModal({
            title: "确认删除",
            content: "确定要删除这篇帖子吗？此操作不可撤销。",
            success: (res) => {
                if (res.confirm) {
                    taro_1.default.showToast({
                        title: `删除 Post ID: ${postId} (Not Implemented)`,
                        icon: "none",
                    });
                    // TODO: Implement API call for DELETE /api/posts/:id
                    // After successful deletion, refetch posts: fetchPosts();
                }
            },
        });
    };
    const handleRepublish = (postId) => {
        taro_1.default.showToast({
            title: `重新发布 Post ID: ${postId} (Not Implemented)`,
            icon: "none",
        });
        // TODO: Implement API call for PUT /api/posts/:id/publish
    };
    const statusFilters = [
        { label: "全部", value: "" },
        { label: "草稿", value: "draft" },
        { label: "审核中", value: "pending" },
        { label: "已发布", value: "published" },
        { label: "未通过", value: "failed" },
    ];
    return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: index_module_scss_1.default.myPostsPage, children: [(0, jsx_runtime_1.jsx)(components_1.View, { className: index_module_scss_1.default.filterContainer, children: statusFilters.map((filter) => ((0, jsx_runtime_1.jsx)(components_1.Button, { size: "mini", className: `${index_module_scss_1.default.filterButton} ${currentStatus === filter.value ? index_module_scss_1.default.filterButtonActive : ""}`, onClick: () => handleStatusFilterChange(filter.value), children: filter.label }, filter.value))) }), stats && ((0, jsx_runtime_1.jsxs)(components_1.View, { className: index_module_scss_1.default.statsContainer, children: [(0, jsx_runtime_1.jsxs)(components_1.Text, { children: ["\u603B\u8BA1: ", stats.totalCount, " |"] }), (0, jsx_runtime_1.jsxs)(components_1.Text, { children: ["\u8349\u7A3F: ", stats.draftCount, " |"] }), (0, jsx_runtime_1.jsxs)(components_1.Text, { children: ["\u5BA1\u6838\u4E2D: ", stats.pendingCount, " |"] }), (0, jsx_runtime_1.jsxs)(components_1.Text, { children: ["\u5DF2\u53D1\u5E03: ", stats.publishedCount, " |"] }), (0, jsx_runtime_1.jsxs)(components_1.Text, { children: ["\u672A\u901A\u8FC7: ", stats.failedCount] })] })), isLoading && (0, jsx_runtime_1.jsx)(components_1.View, { className: index_module_scss_1.default.loading, children: "\u52A0\u8F7D\u4E2D..." }), error && (0, jsx_runtime_1.jsxs)(components_1.View, { className: index_module_scss_1.default.error, children: ["\u9519\u8BEF: ", error] }), !isLoading && !error && posts.length === 0 && ((0, jsx_runtime_1.jsx)(components_1.View, { className: index_module_scss_1.default.noPosts, children: "\u6CA1\u6709\u627E\u5230\u5E16\u5B50\u3002" })), !isLoading && !error && posts.length > 0 && ((0, jsx_runtime_1.jsx)(components_1.ScrollView, { scrollY: true, children: posts.map((post) => ((0, jsx_runtime_1.jsxs)(components_1.View, { className: index_module_scss_1.default.postItem, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: index_module_scss_1.default.postTitle, children: post.title }), (0, jsx_runtime_1.jsxs)(components_1.Text, { className: index_module_scss_1.default.postStatus, children: ["\u72B6\u6001: ", post.status] }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: index_module_scss_1.default.postActions, children: [post.status === "draft" && ((0, jsx_runtime_1.jsx)(components_1.Button, { size: "mini", className: `${index_module_scss_1.default.actionButton} ${index_module_scss_1.default.republishButton}`, onClick: () => handleRepublish(post.id), children: "\u53D1\u5E03" })), (0, jsx_runtime_1.jsx)(components_1.Button, { size: "mini", className: `${index_module_scss_1.default.actionButton} ${index_module_scss_1.default.editButton}`, onClick: () => handleEdit(post.id), children: "\u7F16\u8F91" }), (0, jsx_runtime_1.jsx)(components_1.Button, { size: "mini", className: `${index_module_scss_1.default.actionButton} ${index_module_scss_1.default.refreshButton}`, onClick: () => handleRefresh(post.id), children: "\u64E6\u4EAE" }), (0, jsx_runtime_1.jsx)(components_1.Button, { size: "mini", className: `${index_module_scss_1.default.actionButton} ${index_module_scss_1.default.deleteButton}`, onClick: () => handleDelete(post.id), children: "\u5220\u9664" })] })] }, post.id))) })), !isLoading && !error && posts.length > 0 && totalPages > 1 && ((0, jsx_runtime_1.jsxs)(components_1.View, { className: index_module_scss_1.default.paginationContainer, children: [(0, jsx_runtime_1.jsx)(components_1.Button, { onClick: () => handlePageChange(currentPage - 1), disabled: currentPage === 1, className: index_module_scss_1.default.paginationButton, children: "\u4E0A\u4E00\u9875" }), (0, jsx_runtime_1.jsxs)(components_1.Text, { className: index_module_scss_1.default.paginationText, children: [currentPage, " / ", totalPages] }), (0, jsx_runtime_1.jsx)(components_1.Button, { onClick: () => handlePageChange(currentPage + 1), disabled: currentPage === totalPages, className: index_module_scss_1.default.paginationButton, children: "\u4E0B\u4E00\u9875" })] }))] }));
};
exports.default = MyPostsPage;
//# sourceMappingURL=index.js.map