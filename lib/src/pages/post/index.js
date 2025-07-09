"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PostCategorySelectionPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const taro_1 = require("@tarojs/taro");
const react_1 = require("react");
const components_1 = require("@tarojs/components");
require("./index.scss");
const POST_CATEGORIES = [
    { id: "help", name: "帮帮", icon: "🤝" },
    { id: "rent", name: "租房", icon: "🏠" },
    { id: "used", name: "二手", icon: "📦" },
    { id: "jobs", name: "招聘", icon: "💼" },
];
function PostCategorySelectionPage() {
    const [selectedCategory, setSelectedCategory] = (0, react_1.useState)(null);
    const handleCategorySelect = (categoryId) => {
        setSelectedCategory(categoryId);
    };
    const handleNextStep = () => {
        if (!selectedCategory) {
            taro_1.default.showToast({
                title: "请选择一个分类类型",
                icon: "none",
                duration: 2000,
            });
            return;
        }
        // Navigate to the form page for the selected category
        // Example: Taro.navigateTo({ url: `/pages/post-form/index?category=${selectedCategory}` });
        console.log("Navigating to form for category:", selectedCategory);
        taro_1.default.showToast({
            title: `下一步: ${selectedCategory} 表单 (待实现)`,
            icon: "none",
        });
        // For now, let's navigate to a placeholder or the old publish page if it makes sense
        // Or, we can create a new unified form page: /pages/post/form?category=rent etc.
        // Based on your new doc: "进入对应表单页面"
        // Let's assume a new path like /pages/post/form/index for now
        taro_1.default.navigateTo({
            url: `/pages/post/form/index?category=${selectedCategory}`,
        });
    };
    return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "post-category-selection-page", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "page-title", children: "\u4F60\u60F3\u53D1\u5E03\u4EC0\u4E48\uFF1F" }), (0, jsx_runtime_1.jsx)(components_1.View, { className: "category-options-container", children: POST_CATEGORIES.map((category) => ((0, jsx_runtime_1.jsxs)(components_1.View, { className: `category-card ${selectedCategory === category.id ? "selected" : ""}`, onClick: () => handleCategorySelect(category.id), children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "category-icon", children: category.icon }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "category-name", children: category.name })] }, category.id))) }), (0, jsx_runtime_1.jsx)(components_1.Button, { className: "next-step-button", disabled: !selectedCategory, onClick: handleNextStep, children: "\u4E0B\u4E00\u6B65" })] }));
}
//# sourceMappingURL=index.js.map