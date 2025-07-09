"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@tarojs/components");
require("./index.scss");
const SkeletonCard = ({ mockImageHeight }) => {
    return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "post-card skeleton-card", children: [(0, jsx_runtime_1.jsx)(components_1.View, { className: "skeleton-image", style: { height: `${mockImageHeight}rpx` } }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "post-card-content", children: [(0, jsx_runtime_1.jsx)(components_1.View, { className: "skeleton-line title" }), (0, jsx_runtime_1.jsx)(components_1.View, { className: "skeleton-line short" }), (0, jsx_runtime_1.jsx)(components_1.View, { className: "skeleton-line long" }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "post-card-footer skeleton-footer", children: [(0, jsx_runtime_1.jsx)(components_1.View, { className: "skeleton-line tag" }), (0, jsx_runtime_1.jsx)(components_1.View, { className: "skeleton-line time" })] })] })] }));
};
exports.default = SkeletonCard;
//# sourceMappingURL=index.js.map