import { Request, Response, NextFunction } from "express";
import { RedisService } from "../services/redis";
import { config } from "../config";

export const rateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const openid = req.headers["x-openid"] as string;
    if (!openid) {
      return next();
    }

    const key = `ratelimit:${openid}`;
    const windowMs = config.security.rateLimit.windowMs;
    const max = config.security.rateLimit.max;

    // 获取当前计数
    const count = await RedisService.incr(key);

    // 如果是第一次请求，设置过期时间
    if (count === 1) {
      await RedisService.expire(key, Math.floor(windowMs / 1000));
    }

    // 设置速率限制头
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - count));
    res.setHeader(
      "X-RateLimit-Reset",
      Math.floor(Date.now() / 1000) + Math.floor(windowMs / 1000)
    );

    // 检查是否超过限制
    if (count > max) {
      return res.status(429).json({
        code: 429,
        message: "请求过于频繁，请稍后再试",
      });
    }

    next();
  } catch (error) {
    console.error("Rate limit error:", error);
    next();
  }
};

// 针对特定路由的速率限制
export const routeRateLimit = (max: number, windowMs: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const openid = req.headers["x-openid"] as string;
      if (!openid) {
        return next();
      }

      const key = `ratelimit:${req.path}:${openid}`;

      // 获取当前计数
      const count = await RedisService.incr(key);

      // 如果是第一次请求，设置过期时间
      if (count === 1) {
        await RedisService.expire(key, Math.floor(windowMs / 1000));
      }

      // 设置速率限制头
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, max - count));
      res.setHeader(
        "X-RateLimit-Reset",
        Math.floor(Date.now() / 1000) + Math.floor(windowMs / 1000)
      );

      // 检查是否超过限制
      if (count > max) {
        return res.status(429).json({
          code: 429,
          message: "请求过于频繁，请稍后再试",
        });
      }

      next();
    } catch (error) {
      console.error("Route rate limit error:", error);
      next();
    }
  };
};
