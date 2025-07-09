"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_IMAGE_URL = exports.POSTS_PER_PAGE = exports.SUB_CATEGORIES = exports.CATEGORIES = exports.PRESET_PLACEHOLDER_COLORS = exports.PRESET_PLACEHOLDER_HEIGHTS = void 0;
exports.PRESET_PLACEHOLDER_HEIGHTS = [200, 250, 300, 350, 400, 450, 500];
exports.PRESET_PLACEHOLDER_COLORS = [
    "#f0f0f0",
    "#e0e0e0",
    "#d0d0d0",
    "#c0c0c0",
    "#b0b0b0",
    "#a0a0a0",
    "#909090",
];
exports.CATEGORIES = [
    { id: "recommend", name: "推荐", color: "#6f42c1" },
    { id: "help", name: "帮帮", color: "#17a2b8" },
    { id: "rent", name: "租房", color: "#007bff" },
    { id: "used", name: "二手", color: "#28a745" },
    { id: "jobs", name: "招聘", color: "#ffc107" },
];
exports.SUB_CATEGORIES = {
    rent: [
        { label: "出租", value: "rent", icon: "租" },
        { label: "求租", value: "wanted_rent", icon: "求租" },
        { label: "出售", value: "sell", icon: "售" },
        { label: "求购", value: "wanted_buy", icon: "求购" },
    ],
    used: [
        { label: "出售", value: "sell", icon: "卖" },
        { label: "求购", value: "wanted", icon: "收" },
    ],
    help: [
        { label: "求助", value: "need_help", icon: "求助" },
        { label: "提供帮助", value: "offer_help", icon: "帮助" },
    ],
};
exports.POSTS_PER_PAGE = 10;
exports.DEFAULT_IMAGE_URL = "https://images.unsplash.com/photo-1506744038136-46273834b3fb";
//# sourceMappingURL=index.js.map