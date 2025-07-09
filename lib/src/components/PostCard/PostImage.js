"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@tarojs/components");
const react_1 = require("react");
const PostImage = ({ mockImagePlaceholderHeight, mockImagePlaceholderColor, coverImage, alt = "Post cover image", }) => {
    const [imageError, setImageError] = (0, react_1.useState)(false);
    if (mockImagePlaceholderHeight && mockImagePlaceholderColor) {
        return ((0, jsx_runtime_1.jsx)(components_1.View, { className: "pcc-image-placeholder", style: {
                height: `${mockImagePlaceholderHeight}rpx`,
                backgroundColor: mockImagePlaceholderColor,
            }, role: "img", "aria-label": "Placeholder image" }));
    }
    if (coverImage && !imageError) {
        return ((0, jsx_runtime_1.jsx)(components_1.Image, { className: "pcc-image", src: coverImage, mode: "aspectFill", lazyLoad: true, onError: () => setImageError(true), alt: alt }));
    }
    return null;
};
exports.default = PostImage;
//# sourceMappingURL=PostImage.js.map