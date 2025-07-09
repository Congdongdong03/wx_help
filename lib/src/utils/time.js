"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatRelativeTime = void 0;
const formatRelativeTime = (date) => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) {
        return "刚刚";
    }
    else if (seconds < 3600) {
        return `${Math.floor(seconds / 60)}分钟前`;
    }
    else if (seconds < 86400) {
        return `${Math.floor(seconds / 3600)}小时前`;
    }
    else if (seconds < 2592000) {
        // 30 days
        return `${Math.floor(seconds / 86400)}天前`;
    }
    else {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        return `${year}-${month}-${day}`;
    }
};
exports.formatRelativeTime = formatRelativeTime;
//# sourceMappingURL=time.js.map