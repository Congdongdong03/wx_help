"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@tarojs/components");
require("./index.scss");
const LoadingSpinner = ({ size = "medium", color = "#007AFF", text }) => {
    return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: `loading-spinner ${size}`, role: "status", "aria-label": text || "加载中", children: [(0, jsx_runtime_1.jsx)(components_1.View, { className: "spinner", style: { borderColor: color } }), text && (0, jsx_runtime_1.jsx)(components_1.View, { className: "spinner-text", children: text })] }));
};
exports.default = LoadingSpinner;
//# sourceMappingURL=index.js.map