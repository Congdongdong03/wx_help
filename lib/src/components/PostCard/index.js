"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const taro_1 = require("@tarojs/taro");
const components_1 = require("@tarojs/components");
const time_1 = require("../../utils/time"); // Assuming utils are here
const categoryUtils_1 = require("../../utils/categoryUtils"); // Import the new utility function
require("./index.scss");
const DEFAULT_IMAGE_URL = "https://images.unsplash.com/photo-1506744038136-46273834b3fb";
const PostCard = ({ post, isPinned }) => {
    const handlePostClick = () => {
        // Validate that post has a valid ID before navigation
        if (!post.id || post.id === undefined || post.id === null) {
            console.warn("Post has no valid ID:", post);
            taro_1.default.showToast({
                title: "帖子信息不完整",
                icon: "none",
                duration: 2000,
            });
            return;
        }
        // 处理不同类型的帖子
        if (typeof post.id === "number") {
            // 真实帖子，跳转到详情页
            taro_1.default.navigateTo({ url: `/pages/detail/index?id=${post.id}` });
        }
        else if (typeof post.id === "string" &&
            post.id.startsWith("catalogue_")) {
            // 宣传图片，跳转到轮播图页面
            taro_1.default.navigateTo({ url: `/pages/catalogue-image/index?id=${post.id}` });
        }
        else {
            // 其他情况，显示提示
            taro_1.default.showToast({
                title: "无法识别的帖子类型",
                icon: "none",
                duration: 2000,
            });
        }
    };
    return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "post-card", onClick: handlePostClick, children: [isPinned && ((0, jsx_runtime_1.jsx)(components_1.View, { className: "post-card-pin-indicator", children: (0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u7F6E\u9876" }) })), post.status === "pending" && post.title !== "草稿" && ((0, jsx_runtime_1.jsx)(components_1.View, { className: "post-card-status pending", children: (0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u5BA1\u6838\u4E2D" }) })), (0, jsx_runtime_1.jsx)(components_1.Image, { className: "post-card-image", src: post.cover_image || DEFAULT_IMAGE_URL, mode: "aspectFill", style: {
                    height: post.mockImagePlaceholderHeight
                        ? `${post.mockImagePlaceholderHeight}rpx`
                        : "400rpx",
                } }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "post-card-content", children: [(0, jsx_runtime_1.jsxs)(components_1.View, { className: "post-card-title", children: [post.sub_category && ((0, jsx_runtime_1.jsx)(components_1.Text, { className: "post-card-category-sub", children: (0, categoryUtils_1.getSubCategoryIcon)(post.category.id, post.sub_category) })), (0, jsx_runtime_1.jsx)(components_1.Text, { numberOfLines: 2, children: post.title || "无标题" })] }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "post-card-description", numberOfLines: 2, children: post.content_preview || "暂无描述" }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "post-card-footer", children: [(0, jsx_runtime_1.jsxs)(components_1.View, { className: "post-card-tags", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "post-card-category-tag", style: { backgroundColor: post.category.color }, children: post.category.name }), post.price && ((0, jsx_runtime_1.jsxs)(components_1.Text, { className: "post-card-price-tag", children: ["\uFFE5", post.price] }))] }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "post-card-time", children: (0, time_1.formatRelativeTime)(new Date(post.updated_at)) })] })] })] }));
};
exports.default = PostCard;
//# sourceMappingURL=index.js.map