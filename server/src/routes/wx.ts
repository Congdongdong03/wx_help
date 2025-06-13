import { Router } from "express";
import { WxService } from "../services/wx";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { RedisService } from "../services/redis";

const router = Router();

// 请求频率限制中间件
const rateLimit = async (req: AuthenticatedRequest, res: any, next: any) => {
  try {
    const key = `ratelimit:${req.path}:${req.user?.openid || req.ip}`;
    const limit = 60; // 每分钟最多60次请求
    const window = 60; // 时间窗口为60秒

    const current = await RedisService.incr(key);
    if (current === 1) {
      await RedisService.expire(key, window);
    }

    if (current > limit) {
      return res.status(429).json({
        code: 429,
        message: "请求过于频繁，请稍后再试",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// 微信登录
router.post("/login", rateLimit, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== "string") {
      return res.status(400).json({
        code: 1,
        message: "缺少有效的 code 参数",
      });
    }

    const { openid } = await WxService.login(code);
    res.json({
      code: 0,
      message: "登录成功",
      data: { openid },
    });
  } catch (error: any) {
    res.status(500).json({
      code: 1,
      message: error.message || "登录失败",
    });
  }
});

// 获取用户信息
router.get(
  "/user/info",
  requireAuth,
  rateLimit,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { openid } = req.user!;
      const userInfo = await WxService.getUserInfo(openid);
      res.json({
        code: 0,
        message: "获取成功",
        data: userInfo,
      });
    } catch (error: any) {
      res.status(500).json({
        code: 1,
        message: error.message || "获取用户信息失败",
      });
    }
  }
);

// 更新用户信息
router.put(
  "/user/info",
  requireAuth,
  rateLimit,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { openid } = req.user!;
      const { nickname, avatar_url } = req.body;

      // 验证参数
      if (nickname && typeof nickname !== "string") {
        return res.status(400).json({
          code: 1,
          message: "nickname 必须是字符串",
        });
      }
      if (avatar_url && typeof avatar_url !== "string") {
        return res.status(400).json({
          code: 1,
          message: "avatar_url 必须是字符串",
        });
      }

      await WxService.updateUserInfo(openid, { nickname, avatar_url });
      res.json({
        code: 0,
        message: "更新成功",
      });
    } catch (error: any) {
      res.status(500).json({
        code: 1,
        message: error.message || "更新用户信息失败",
      });
    }
  }
);

// 登出
router.post(
  "/logout",
  requireAuth,
  rateLimit,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { openid } = req.user!;
      await WxService.logout(openid);
      res.json({
        code: 0,
        message: "登出成功",
      });
    } catch (error: any) {
      res.status(500).json({
        code: 1,
        message: error.message || "登出失败",
      });
    }
  }
);

export default router;
