import { Router } from "express";
import { revokeOpenid, AuthenticatedRequest } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";
import axios from "axios";

const router = Router();
const prisma = new PrismaClient();

// 微信登录
router.post("/wechat-login", async (req, res) => {
  try {
    const { code, userInfo } = req.body;

    if (!code) {
      return res.status(400).json({
        code: 1,
        message: "缺少登录凭证",
      });
    }

    // 开发环境临时认证（用于测试）
    if (process.env.NODE_ENV === "development" && code === "dev_test_code") {
      console.log("🧪 Auth: Using development test authentication");

      // 创建或查找测试用户
      let user = await prisma.users.findUnique({
        where: { openid: "dev_openid_123" },
      });

      if (!user) {
        user = await prisma.users.create({
          data: {
            username: "dev_test_user",
            openid: "dev_openid_123",
            nickname: userInfo?.nickName || "测试用户",
            avatar_url: userInfo?.avatarUrl || "",
            gender: userInfo?.gender || 0,
            city: userInfo?.city || "",
            province: userInfo?.province || "",
            country: userInfo?.country || "",
            language: userInfo?.language || "zh_CN",
            status: "active",
            last_login_at: new Date(),
          },
        });
      } else {
        user = await prisma.users.update({
          where: { id: user.id },
          data: {
            nickname: userInfo?.nickName || user.nickname,
            avatar_url: userInfo?.avatarUrl || user.avatar_url,
            gender: userInfo?.gender || user.gender,
            city: userInfo?.city || user.city,
            province: userInfo?.province || user.province,
            country: userInfo?.country || user.country,
            language: userInfo?.language || user.language,
            last_login_at: new Date(),
          },
        });
      }

      return res.json({
        code: 0,
        message: "开发环境登录成功",
        data: {
          id: user.id,
          openid: user.openid,
          nickName: user.nickname,
          avatarUrl: user.avatar_url,
          gender: user.gender,
          city: user.city,
          province: user.province,
          country: user.country,
          language: user.language,
          status: user.status,
        },
      });
    }

    // 1. 通过code获取openid
    const appId = process.env.WECHAT_APP_ID;
    const appSecret = process.env.WECHAT_APP_SECRET;

    console.log("🔍 Auth: Checking WeChat credentials...");
    console.log("🔍 Auth: WECHAT_APP_ID:", appId ? "已配置" : "未配置");
    console.log("🔍 Auth: WECHAT_APP_SECRET:", appSecret ? "已配置" : "未配置");

    if (!appId || !appSecret) {
      console.error(
        "❌ Auth: 微信配置缺失 - WECHAT_APP_ID 或 WECHAT_APP_SECRET 未设置"
      );
      return res.status(400).json({
        code: 1,
        message: "微信登录失败",
      });
    }

    console.log(
      "🔄 Auth: Calling WeChat API with code:",
      code.substring(0, 10) + "..."
    );

    const wxResponse = await axios.get(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`
    );

    console.log("📡 Auth: WeChat API response status:", wxResponse.status);
    console.log("📡 Auth: WeChat API response data:", wxResponse.data);

    const { openid, session_key, errcode, errmsg } = wxResponse.data;

    if (errcode) {
      console.error("微信登录失败:", errmsg);
      return res.status(400).json({
        code: 1,
        message: "微信登录失败",
      });
    }

    if (!openid) {
      return res.status(400).json({
        code: 1,
        message: "获取用户标识失败",
      });
    }

    // 2. 查找或创建用户
    let user = await prisma.users.findUnique({
      where: { openid },
    });

    if (!user) {
      // 创建新用户
      user = await prisma.users.create({
        data: {
          username: `user_${openid.slice(-8)}`, // 生成唯一用户名
          openid,
          nickname: userInfo?.nickName || "微信用户",
          avatar_url: userInfo?.avatarUrl || "",
          gender: userInfo?.gender || 0,
          city: userInfo?.city || "",
          province: userInfo?.province || "",
          country: userInfo?.country || "",
          language: userInfo?.language || "zh_CN",
          status: "active",
          last_login_at: new Date(),
        },
      });
    } else {
      // 更新用户信息
      user = await prisma.users.update({
        where: { id: user.id },
        data: {
          nickname: userInfo?.nickName || user.nickname,
          avatar_url: userInfo?.avatarUrl || user.avatar_url,
          gender: userInfo?.gender || user.gender,
          city: userInfo?.city || user.city,
          province: userInfo?.province || user.province,
          country: userInfo?.country || user.country,
          language: userInfo?.language || user.language,
          last_login_at: new Date(),
        },
      });
    }

    // 3. 返回用户信息
    res.json({
      code: 0,
      message: "登录成功",
      data: {
        id: user.id,
        openid: user.openid,
        nickName: user.nickname,
        avatarUrl: user.avatar_url,
        gender: user.gender,
        city: user.city,
        province: user.province,
        country: user.country,
        language: user.language,
        status: user.status,
      },
    });
  } catch (error: any) {
    console.error("❌ Auth: 微信登录错误:", error);
    console.error("❌ Auth: 错误堆栈:", error.stack);
    console.error("❌ Auth: 错误详情:", {
      name: error.name,
      message: error.message,
      code: error.code,
    });
    res.status(500).json({
      code: 1,
      message: "登录失败，请稍后重试",
    });
  }
});

// 登出
router.post("/logout", async (req, res, next) => {
  const { openid } = (req as AuthenticatedRequest).user!;
  if (!openid) {
    return res.status(400).json({
      code: 1,
      message: "缺少 openid",
    });
  }

  try {
    await revokeOpenid(openid);
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
});

export default router;
