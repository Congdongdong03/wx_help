"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AboutPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const taro_1 = require("@tarojs/taro");
const components_1 = require("@tarojs/components");
require("./index.scss");
function AboutPage() {
    const appVersion = "1.0.0"; // Placeholder version
    const navigateToPolicy = (type) => {
        // TODO: Create these pages and update URLs
        if (type === "user-agreement") {
            taro_1.default.navigateTo({ url: "/pages/settings/user-agreement/index" });
        }
        else if (type === "privacy-policy") {
            taro_1.default.navigateTo({ url: "/pages/settings/privacy-policy/index" });
        }
        console.log("Navigate to:", type);
    };
    return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "about-page", children: [(0, jsx_runtime_1.jsxs)(components_1.View, { className: "about-section logo-section", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "app-name", children: "\u5E2E\u5E2E" }), (0, jsx_runtime_1.jsxs)(components_1.Text, { className: "app-version", children: ["\u7248\u672C\u53F7\uFF1A", appVersion] })] }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "about-section links-section", children: [(0, jsx_runtime_1.jsxs)(components_1.View, { className: "link-item", onClick: () => navigateToPolicy("user-agreement"), children: [(0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u7528\u6237\u534F\u8BAE" }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "arrow", children: ">" })] }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "link-item", onClick: () => navigateToPolicy("privacy-policy"), children: [(0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u9690\u79C1\u653F\u7B56" }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "arrow", children: ">" })] })] })] }));
}
// Optional: Page configuration if needed
definePageConfig({
    navigationBarTitleText: "关于帮帮",
});
//# sourceMappingURL=index.js.map