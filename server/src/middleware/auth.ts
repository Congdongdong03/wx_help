import { Request, Response, NextFunction } from "express";
import { RedisService } from "../services/redis";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    openid: string;
    id: number;
  };
}

// 微信认证中间件
export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const openid = req.headers["x-openid"] as string;

    if (!openid) {
      return res.status(401).json({
        code: 401,
        message: "未提供 openid",
      });
    }

    // 开发环境跳过 Redis 校验
    if (process.env.NODE_ENV !== "production") {
      // 获取用户信息
      const user = await prisma.users.findUnique({
        where: { openid },
        select: { id: true },
      });

      if (!user) {
        return res.status(401).json({
          code: 401,
          message: "用户不存在",
        });
      }

      req.user = { openid, id: user.id };
      return next();
    }

    // 生产环境才校验 Redis 黑名单
    // 检查 openid 是否在黑名单中
    const isBlacklisted = await RedisService.isOpenidBlacklisted(openid);
    if (isBlacklisted) {
      return res.status(401).json({
        code: 401,
        message: "openid 已被禁用",
      });
    }

    // 获取用户信息
    const user = await prisma.users.findUnique({
      where: { openid },
      select: { id: true },
    });

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: "用户不存在",
      });
    }

    req.user = { openid, id: user.id };
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      code: 500,
      message: "服务器内部错误",
    });
  }
};

// 可选认证中间件
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const openid = req.headers["x-openid"] as string;

    if (openid) {
      // 开发环境跳过 Redis 校验
      if (process.env.NODE_ENV !== "production") {
        // 获取用户信息
        const user = await prisma.users.findUnique({
          where: { openid },
          select: { id: true },
        });

        if (user) {
          req.user = { openid, id: user.id };
        }
        return next();
      }

      // 生产环境才校验 Redis 黑名单
      // 检查 openid 是否在黑名单中
      const isBlacklisted = await RedisService.isOpenidBlacklisted(openid);
      if (!isBlacklisted) {
        // 获取用户信息
        const user = await prisma.users.findUnique({
          where: { openid },
          select: { id: true },
        });

        if (user) {
          req.user = { openid, id: user.id };
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

// 登出处理
export const revokeOpenid = async (openid: string) => {
  try {
    // 将 openid 加入黑名单，有效期 7 天
    await RedisService.addToOpenidBlacklist(openid, 7 * 24 * 60 * 60);
    // 删除 session_key
    await RedisService.deleteCache(`session:${openid}`);
  } catch (error) {
    console.error("Error revoking openid:", error);
    throw new Error("Failed to revoke openid");
  }
};
