"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.distributePosts = exports.mapToFeedPost = exports.truncateText = exports.validatePostData = exports.handlePostError = exports.formatRelativeTime = void 0;
const taro_1 = require("@tarojs/taro");
const constants_1 = require("../constants");
const formatRelativeTime = (date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) {
        return `${days}天前`;
    }
    if (hours > 0) {
        return `${hours}小时前`;
    }
    if (minutes > 0) {
        return `${minutes}分钟前`;
    }
    return "刚刚";
};
exports.formatRelativeTime = formatRelativeTime;
const handlePostError = (error) => {
    console.error("Post operation error:", error);
    let errorMessage = "操作失败，请重试";
    if (error.response) {
        switch (error.response.status) {
            case 401:
                errorMessage = "请先登录";
                break;
            case 403:
                errorMessage = "没有权限执行此操作";
                break;
            case 404:
                errorMessage = "内容不存在";
                break;
            case 500:
                errorMessage = "服务器错误，请稍后重试";
                break;
        }
    }
    taro_1.default.showToast({
        title: errorMessage,
        icon: "none",
        duration: 2000,
    });
};
exports.handlePostError = handlePostError;
const validatePostData = (data) => {
    if (!data.title || data.title.trim().length === 0) {
        taro_1.default.showToast({
            title: "标题不能为空",
            icon: "none",
            duration: 2000,
        });
        return false;
    }
    if (data.title.length > 100) {
        taro_1.default.showToast({
            title: "标题不能超过100个字符",
            icon: "none",
            duration: 2000,
        });
        return false;
    }
    if (data.description && data.description.length > 500) {
        taro_1.default.showToast({
            title: "描述不能超过500个字符",
            icon: "none",
            duration: 2000,
        });
        return false;
    }
    return true;
};
exports.validatePostData = validatePostData;
const truncateText = (text, maxLength) => {
    if (!text)
        return "";
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};
exports.truncateText = truncateText;
const mapToFeedPost = (item) => {
    var _a, _b;
    let images = [];
    if (Array.isArray(item.images)) {
        images = item.images;
    }
    else if (typeof item.images === "string") {
        try {
            const parsed = JSON.parse(item.images);
            if (Array.isArray(parsed)) {
                images = parsed;
            }
        }
        catch (_c) {
            images = [];
        }
    }
    return {
        id: item.id,
        mockImagePlaceholderHeight: constants_1.PRESET_PLACEHOLDER_HEIGHTS[Math.floor(Math.random() * constants_1.PRESET_PLACEHOLDER_HEIGHTS.length)],
        mockImagePlaceholderColor: constants_1.PRESET_PLACEHOLDER_COLORS[Math.floor(Math.random() * constants_1.PRESET_PLACEHOLDER_COLORS.length)],
        title: item.title,
        content: item.content,
        content_preview: item.content_preview,
        category: {
            id: item.category_id,
            name: ((_a = constants_1.CATEGORIES.find((cat) => cat.id === item.category_id)) === null || _a === void 0 ? void 0 : _a.name) || "",
            color: ((_b = constants_1.CATEGORIES.find((cat) => cat.id === item.category_id)) === null || _b === void 0 ? void 0 : _b.color) || "",
        },
        sub_category: item.sub_category,
        price: item.price,
        updated_at: item.updated_at,
        created_at: item.created_at,
        city_code: item.city_code,
        status: item.status,
        images: images,
        cover_image: item.cover_image,
        is_pinned: item.is_pinned,
        is_weekly_deal: item.is_weekly_deal,
        users: item.users,
    };
};
exports.mapToFeedPost = mapToFeedPost;
const distributePosts = (posts) => {
    const leftColumn = [];
    const rightColumn = [];
    let leftHeight = 0;
    let rightHeight = 0;
    posts.forEach((post) => {
        // 估算卡片高度 (图片高度 + 内容高度)
        const imageHeight = post.mockImagePlaceholderHeight || 300;
        const contentHeight = 180; // 估算的内容区域高度
        const cardHeight = imageHeight + contentHeight;
        // 选择高度较小的列
        if (leftHeight <= rightHeight) {
            leftColumn.push(post);
            leftHeight += cardHeight + 20; // 加上margin
        }
        else {
            rightColumn.push(post);
            rightHeight += cardHeight + 20; // 加上margin
        }
    });
    return [leftColumn, rightColumn];
};
exports.distributePosts = distributePosts;
//# sourceMappingURL=postUtils.js.map