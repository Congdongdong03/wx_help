import Redis from "ioredis";
import { getDb } from "../config/database";

class RedisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RedisError";
  }
}

// Redis 连接池配置
const redisPool = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 10000,
});

redisPool.on("error", (error: Error) => {
  console.error("Redis connection error:", error);
});

redisPool.on("connect", () => {
  console.log("Redis connected successfully");
});

export class RedisService {
  private static readonly VIEW_COUNT_EXPIRE = 30 * 60; // 30分钟
  private static readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5分钟
  private static readonly HEALTH_CHECK_INTERVAL = 60 * 1000; // 1分钟
  private static readonly DEFAULT_CACHE_TTL = 5 * 60; // 5分钟

  // OpenID 黑名单相关方法
  static async addToOpenidBlacklist(
    openid: string,
    ttl: number
  ): Promise<void> {
    try {
      const key = `blacklist:${openid}`;
      await redisPool.setex(key, ttl, "1");
    } catch (error) {
      console.error("Redis error in addToOpenidBlacklist:", error);
      throw new RedisError("Failed to add openid to blacklist");
    }
  }

  static async isOpenidBlacklisted(openid: string): Promise<boolean> {
    try {
      const key = `blacklist:${openid}`;
      const exists = await redisPool.exists(key);
      return exists === 1;
    } catch (error) {
      console.error("Redis error in isOpenidBlacklisted:", error);
      throw new RedisError("Failed to check openid blacklist");
    }
  }

  // 浏览量相关方法
  static async shouldIncrementViewCount(
    userId: number,
    postId: number
  ): Promise<boolean> {
    try {
      const key = `view:${userId}:${postId}`;
      const exists = await redisPool.exists(key);

      if (!exists) {
        await redisPool.setex(key, this.VIEW_COUNT_EXPIRE, "1");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Redis error in shouldIncrementViewCount:", error);
      throw new RedisError("Failed to check view count increment");
    }
  }

  static async incrementViewCount(postId: number): Promise<void> {
    try {
      const key = `post:${postId}:views`;
      await redisPool.incr(key);
    } catch (error) {
      console.error("Redis error in incrementViewCount:", error);
      throw new RedisError("Failed to increment view count");
    }
  }

  static async getViewCount(postId: number): Promise<number> {
    try {
      const key = `post:${postId}:views`;
      const count = await redisPool.get(key);
      return count ? parseInt(count) : 0;
    } catch (error) {
      console.error("Redis error in getViewCount:", error);
      throw new RedisError("Failed to get view count");
    }
  }

  // 数据同步方法
  static async syncViewCountsToDatabase(): Promise<void> {
    try {
      const db = getDb();
      const keys = await redisPool.keys("post:*:views");

      for (const key of keys) {
        const postId = parseInt(key.split(":")[1]);
        const count = await this.getViewCount(postId);

        if (count > 0) {
          await db.execute("UPDATE posts SET view_count = ? WHERE id = ?", [
            count,
            postId,
          ]);

          // 清除已同步的计数
          await redisPool.del(key);
        }
      }
    } catch (error) {
      console.error("Error syncing view counts to database:", error);
      throw new RedisError("Failed to sync view counts");
    }
  }

  // 健康检查方法
  static async checkHealth(): Promise<boolean> {
    try {
      await redisPool.ping();
      return true;
    } catch (error) {
      console.error("Redis health check failed:", error);
      return false;
    }
  }

  // 启动定时任务
  static startSyncJob(): void {
    setInterval(async () => {
      try {
        await this.syncViewCountsToDatabase();
      } catch (error) {
        console.error("Error in view count sync job:", error);
      }
    }, this.SYNC_INTERVAL);

    // 启动健康检查
    setInterval(async () => {
      const isHealthy = await this.checkHealth();
      if (!isHealthy) {
        console.error("Redis health check failed");
      }
    }, this.HEALTH_CHECK_INTERVAL);
  }

  // 优雅关闭
  static async shutdown(): Promise<void> {
    try {
      await redisPool.quit();
    } catch (error) {
      console.error("Error shutting down Redis:", error);
    }
  }

  // 缓存相关方法
  static async setCache(
    key: string,
    value: string,
    ttl: number = this.DEFAULT_CACHE_TTL
  ): Promise<void> {
    try {
      await redisPool.setex(key, ttl, value);
    } catch (error) {
      console.error("Redis error in setCache:", error);
      throw new RedisError("Failed to set cache");
    }
  }

  static async getCache(key: string): Promise<string | null> {
    try {
      return await redisPool.get(key);
    } catch (error) {
      console.error("Redis error in getCache:", error);
      throw new RedisError("Failed to get cache");
    }
  }

  static async deleteCache(key: string): Promise<void> {
    try {
      await redisPool.del(key);
    } catch (error) {
      console.error("Redis error in deleteCache:", error);
      throw new RedisError("Failed to delete cache");
    }
  }

  static async deleteCachePattern(pattern: string): Promise<void> {
    try {
      const keys = await redisPool.keys(pattern);
      if (keys.length > 0) {
        await redisPool.del(...keys);
      }
    } catch (error) {
      console.error("Redis error in deleteCachePattern:", error);
      throw new RedisError("Failed to delete cache pattern");
    }
  }

  /**
   * 增加计数器的值
   */
  static async incr(key: string): Promise<number> {
    try {
      return await redisPool.incr(key);
    } catch (error) {
      console.error("Redis error in incr:", error);
      throw new RedisError("Failed to increment counter");
    }
  }

  /**
   * 设置键的过期时间
   */
  static async expire(key: string, seconds: number): Promise<void> {
    try {
      await redisPool.expire(key, seconds);
    } catch (error) {
      console.error("Redis error in expire:", error);
      throw new RedisError("Failed to set expiration");
    }
  }
}
