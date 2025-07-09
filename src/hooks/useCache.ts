import { useState, useCallback } from "@tarojs/taro";
import Taro from "@tarojs/taro";

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

interface CacheOptions {
  expiresIn?: number; // 缓存过期时间（毫秒）
  maxSize?: number; // 最大缓存条目数
}

export function useCache<T>(options: CacheOptions = {}) {
  const {
    expiresIn = 5 * 60 * 1000, // 默认5分钟过期
    maxSize = 100, // 默认最大缓存100条
  } = options;

  // 获取缓存数据
  const get = useCallback((key: string): T | null => {
    try {
      const item = Taro.getStorageSync(key);
      if (!item) return null;

      const cacheItem: CacheItem<T> = JSON.parse(item);
      const now = Date.now();

      if (now - cacheItem.timestamp > cacheItem.expiresIn) {
        Taro.removeStorageSync(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }, []);

  // 设置缓存数据
  const set = useCallback(
    (key: string, data: T, customExpiresIn?: number) => {
      try {
        const cacheItem: CacheItem<T> = {
          data,
          timestamp: Date.now(),
          expiresIn: customExpiresIn || expiresIn,
        };

        Taro.setStorageSync(key, JSON.stringify(cacheItem));
      } catch (error) {
        console.error("Cache set error:", error);
        // 如果存储失败，可能是存储空间不足，尝试清理过期数据
        cleanup();
        // 重试一次
        try {
          const cacheItem: CacheItem<T> = {
            data,
            timestamp: Date.now(),
            expiresIn: customExpiresIn || expiresIn,
          };
          Taro.setStorageSync(key, JSON.stringify(cacheItem));
        } catch (retryError) {
          console.error("Cache set retry error:", retryError);
        }
      }
    },
    [expiresIn]
  );

  // 清理过期缓存
  const cleanup = useCallback(() => {
    try {
      const now = Date.now();
      const keys = Taro.getStorageInfoSync().keys;

      for (const key of keys) {
        const item = Taro.getStorageSync(key);
        if (item) {
          const cacheItem: CacheItem<T> = JSON.parse(item);
          if (now - cacheItem.timestamp > cacheItem.expiresIn) {
            Taro.removeStorageSync(key);
          }
        }
      }
    } catch (error) {
      console.error("Cache cleanup error:", error);
    }
  }, []);

  // 删除缓存数据
  const remove = useCallback((key: string) => {
    try {
      Taro.removeStorageSync(key);
    } catch (error) {
      console.error("Cache remove error:", error);
    }
  }, []);

  // 清空所有缓存
  const clear = useCallback(() => {
    try {
      Taro.clearStorageSync();
    } catch (error) {
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
