import Redis from "ioredis";

class RedisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RedisError";
  }
}

// Redis 连接配置
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on("error", (error: Error) => {
  console.error("Redis connection error:", error);
});

redis.on("connect", () => {
  console.log("Redis connected successfully");
});

export class RedisService {
  /**
   * 设置缓存
   */
  static async setCache(
    key: string,
    value: string,
    ttl: number = 300
  ): Promise<void> {
    try {
      await redis.setex(key, ttl, value);
    } catch (error) {
      console.error("Redis setCache error:", error);
      throw new RedisError("Failed to set cache");
    }
  }

  /**
   * 获取缓存
   */
  static async getCache(key: string): Promise<string | null> {
    try {
      return await redis.get(key);
    } catch (error) {
      console.error("Redis getCache error:", error);
      throw new RedisError("Failed to get cache");
    }
  }

  /**
   * 删除缓存
   */
  static async deleteCache(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error("Redis deleteCache error:", error);
      throw new RedisError("Failed to delete cache");
    }
  }

  /**
   * 增加计数器
   */
  static async incr(key: string): Promise<number> {
    try {
      return await redis.incr(key);
    } catch (error) {
      console.error("Redis incr error:", error);
      throw new RedisError("Failed to increment counter");
    }
  }

  /**
   * 设置过期时间
   */
  static async expire(key: string, ttl: number): Promise<void> {
    try {
      await redis.expire(key, ttl);
    } catch (error) {
      console.error("Redis expire error:", error);
      throw new RedisError("Failed to set expire");
    }
  }

  /**
   * 添加到黑名单
   */
  static async addToOpenidBlacklist(
    openid: string,
    ttl: number
  ): Promise<void> {
    try {
      const key = `blacklist:${openid}`;
      await redis.setex(key, ttl, "1");
    } catch (error) {
      console.error("Redis addToOpenidBlacklist error:", error);
      throw new RedisError("Failed to add openid to blacklist");
    }
  }

  /**
   * 检查是否在黑名单中
   */
  static async isOpenidBlacklisted(openid: string): Promise<boolean> {
    try {
      const key = `blacklist:${openid}`;
      const exists = await redis.exists(key);
      return exists === 1;
    } catch (error) {
      console.error("Redis isOpenidBlacklisted error:", error);
      throw new RedisError("Failed to check openid blacklist");
    }
  }

  /**
   * 优雅关闭
   */
  static async shutdown(): Promise<void> {
    try {
      await redis.quit();
      console.log("Redis connection closed");
    } catch (error) {
      console.error("Redis shutdown error:", error);
    }
  }
}
