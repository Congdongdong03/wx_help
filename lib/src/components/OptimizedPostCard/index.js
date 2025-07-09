"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizedPostCard = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const components_1 = require("@tarojs/components");
require("./index.scss");
exports.OptimizedPostCard = (0, react_1.memo)(({ post, onClick }) => {
    return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "post-card", onClick: () => onClick(post.id), children: [post.images && post.images.length > 0 && ((0, jsx_runtime_1.jsx)(components_1.Image, { className: "post-image", src: post.images[0], mode: "aspectFill", lazyLoad: true })), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "post-content", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "title", children: post.title }), post.price && (0, jsx_runtime_1.jsxs)(components_1.Text, { className: "price", children: ["\u00A5", post.price] }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "description", children: post.description })] })] }));
}, (prevProps, nextProps) => {
    var _a, _b;
    // 自定义比较函数，只在必要时重新渲染
    return (prevProps.post.id === nextProps.post.id &&
        prevProps.post.title === nextProps.post.title &&
        prevProps.post.price === nextProps.post.price &&
        prevProps.post.description === nextProps.post.description &&
        ((_a = prevProps.post.images) === null || _a === void 0 ? void 0 : _a[0]) === ((_b = nextProps.post.images) === null || _b === void 0 ? void 0 : _b[0]));
});
//# sourceMappingURL=index.js.map