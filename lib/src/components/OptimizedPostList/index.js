"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizedPostList = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@tarojs/components");
const useVirtualList_1 = require("../../hooks/useVirtualList");
const OptimizedPostCard_1 = require("../OptimizedPostCard");
require("./index.scss");
const OptimizedPostList = ({ posts, onPostClick, loading = false }) => {
    const { visibleData, offsetY, handleScroll, totalHeight } = (0, useVirtualList_1.useVirtualList)({
        data: posts,
        itemHeight: 300, // 每个卡片的高度（包含margin）
        containerHeight: 600, // 容器高度
        overscan: 3, // 预加载的项数
    });
    return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "optimized-post-list", children: [(0, jsx_runtime_1.jsx)(components_1.ScrollView, { className: "post-list-container", scrollY: true, onScroll: handleScroll, style: { height: "600px" }, children: (0, jsx_runtime_1.jsx)(components_1.View, { className: "post-list-content", style: { height: `${totalHeight}px`, position: "relative" }, children: (0, jsx_runtime_1.jsx)(components_1.View, { className: "post-list-items", style: { transform: `translateY(${offsetY}px)` }, children: visibleData.map((post) => ((0, jsx_runtime_1.jsx)(OptimizedPostCard_1.OptimizedPostCard, { post: post, onClick: onPostClick }, post.id))) }) }) }), loading && (0, jsx_runtime_1.jsx)(components_1.View, { className: "loading-indicator", children: "\u52A0\u8F7D\u4E2D..." })] }));
};
exports.OptimizedPostList = OptimizedPostList;
//# sourceMappingURL=index.js.map