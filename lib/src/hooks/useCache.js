"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCache = useCache;
const taro_1 = require("@tarojs/taro");
const taro_2 = require("@tarojs/taro");
function useCache(options = {}) {
    const { expiresIn = 5 * 60 * 1000, // 默认5分钟过期
    maxSize = 100, // 默认最大缓存100条
     } = options;
    // 获取缓存数据
    const get = (0, taro_1.useCallback)((key) => {
        try {
            const item = taro_2.default.getStorageSync(key);
            if (!item)
                return null;
            const cacheItem = JSON.parse(item);
            const now = Date.now();
            if (now - cacheItem.timestamp > cacheItem.expiresIn) {
                taro_2.default.removeStorageSync(key);
                return null;
            }
            return cacheItem.data;
        }
        catch (error) {
            console.error("Cache get error:", error);
            return null;
        }
    }, []);
    // 设置缓存数据
    const set = (0, taro_1.useCallback)((key, data, customExpiresIn) => {
        try {
            const cacheItem = {
                data,
                timestamp: Date.now(),
                expiresIn: customExpiresIn || expiresIn,
            };
            taro_2.default.setStorageSync(key, JSON.stringify(cacheItem));
        }
        catch (error) {
            console.error("Cache set error:", error);
            // 如果存储失败，可能是存储空间不足，尝试清理过期数据
            cleanup();
            // 重试一次
            try {
                const cacheItem = {
                    data,
                    timestamp: Date.now(),
                    expiresIn: customExpiresIn || expiresIn,
                };
                taro_2.default.setStorageSync(key, JSON.stringify(cacheItem));
            }
            catch (retryError) {
                console.error("Cache set retry error:", retryError);
            }
        }
    }, [expiresIn]);
    // 清理过期缓存
    const cleanup = (0, taro_1.useCallback)(() => {
        try {
            const now = Date.now();
            const keys = taro_2.default.getStorageInfoSync().keys;
            for (const key of keys) {
                const item = taro_2.default.getStorageSync(key);
                if (item) {
                    const cacheItem = JSON.parse(item);
                    if (now - cacheItem.timestamp > cacheItem.expiresIn) {
                        taro_2.default.removeStorageSync(key);
                    }
                }
            }
        }
        catch (error) {
            console.error("Cache cleanup error:", error);
        }
    }, []);
    // 删除缓存数据
    const remove = (0, taro_1.useCallback)((key) => {
        try {
            taro_2.default.removeStorageSync(key);
        }
        catch (error) {
            console.error("Cache remove error:", error);
        }
    }, []);
    // 清空所有缓存
    const clear = (0, taro_1.useCallback)(() => {
        try {
            taro_2.default.clearStorageSync();
        }
        catch (error) {
            console.error("Cache clear error:", error);
        }
    }, []);
    return {
        get,
        set,
        remove,
        clear,
    };
}
//# sourceMappingURL=useCache.js.map