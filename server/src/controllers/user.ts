// src/controllers/user.ts
import { Request, Response } from "express";
import { UserService } from "../services/userService";
import { AuthenticatedRequest } from "../middleware/auth";
import { log } from "../utils/logger";

export class UserController {
  /**
   * 用户注册
   */
  static async register(req: Request, res: Response) {
    try {
      const { username, email, nickname, phone } = req.body;
      if (!username) {
        return res.status(400).json({
          code: 1,
          message: "用户名不能为空",
        });
      }

      // 基本验证
      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({
          code: 1,
          message: "用户名长度必须在3-20字符之间",
        });
      }

      // 检查用户名是否已存在
      const isUsernameExists = await UserService.isUsernameExists(username);
      if (isUsernameExists) {
        return res.status(400).json({
          code: 1,
          message: "用户名已存在",
        });
      }

      // 检查邮箱是否已存在（如果提供了邮箱）
      if (email) {
        const isEmailExists = await UserService.isEmailExists(email);
        if (isEmailExists) {
          return res.status(400).json({
            code: 1,
            message: "邮箱已被注册",
          });
        }
      }

      // 创建新用户
      const newUser = await UserService.create({
        openid: `temp_${Date.now()}`, // 临时 openid，后续需要更新
        username,
        email,
        nickname: nickname || username,
        phone,
      });

      log("info", "User registered", {
        userId: newUser.id,
        username,
        email,
      });

      res.status(201).json({
        code: 0,
        message: "注册成功",
        data: {
          id: newUser.id,
          username: newUser.username,
          nickname: newUser.nickname,
          email: newUser.email,
        },
      });
    } catch (error: any) {
      log("error", "Registration error", {
        error: error.message || error,
        username: req.body?.username,
      });
      res.status(500).json({
        code: 1,
        message: "注册失败，请稍后再试",
      });
    }
  }

  /**
   * 微信登录
   */
  static async wechatLogin(req: Request, res: Response) {
    try {
      const { openid, userInfo } = req.body;

      if (!openid) {
        return res.status(400).json({
          code: 1,
          message: "openid不能为空",
        });
      }

      // 查找或创建用户
      let user = await UserService.findByOpenid(openid);

      if (!user) {
        // 用户不存在，创建新用户
        user = await UserService.create({
          openid,
          username: userInfo?.nickName || `user_${Date.now()}`,
          nickname: userInfo?.nickName,
          avatar_url: userInfo?.avatarUrl,
        });
      } else {
        // 更新最后登录时间
        await UserService.updateLastLogin(user.id);
      }

      log("info", "User logged in via WeChat", {
        userId: user.id,
        openid: openid,
      });

      res.json({
        code: 0,
        message: "登录成功",
        data: {
          user: {
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            avatar_url: user.avatar_url,
            email: user.email,
          },
        },
      });
    } catch (error: any) {
      log("error", "WeChat login error", {
        error: error.message || error,
        openid: req.body?.openid,
      });
      res.status(500).json({
        code: 1,
        message: "登录失败，请稍后再试",
      });
    }
  }

  /**
   * 获取用户信息
   */
  static async getUserInfo(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          code: 401,
          message: "未登录",
        });
      }

      const userInfo = await UserService.getSafeUserInfo(userId);
      if (!userInfo) {
        return res.status(404).json({
          code: 1,
          message: "用户不存在",
        });
      }

      const stats = await UserService.getUserStats(userId);

      res.json({
        code: 0,
        message: "获取成功",
        data: {
          ...userInfo,
          stats,
        },
      });
    } catch (error: any) {
      log("error", "Get user info error", {
        error: error.message || error,
        userId: req.user?.id,
      });
      res.status(500).json({
        code: 1,
        message: "获取用户信息失败",
      });
    }
  }

  /**
   * 更新用户信息
   */
  static async updateUserInfo(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          code: 1,
          message: "未授权",
        });
      }

      const { nickname, avatar_url, phone, city, province, country } = req.body;

      // 昵称基础校验
      if (nickname && (nickname.trim().length === 0 || nickname.trim().length > 20)) {
        return res.status(400).json({ code: 1, message: "昵称长度需为1-20个字符" });
      }

      // 昵称敏感词校验（兜底）
      if (nickname) {
        const text = String(nickname).trim();
        try {
          const { SensitiveWordService } = await import("../services/sensitiveWordService");
          const svc = new SensitiveWordService();
          const result = await svc.checkSensitiveWords(text);
          if (result.hasSensitiveWords) {
            return res.status(400).json({ code: 1, message: "昵称包含敏感词，请更换" });
          }
        } catch (e) {
          // 失败不阻断，但会记录
          console.warn("敏感词校验失败，放行更新:", e);
        }
      }

      // 更新用户信息
      const updatedUser = await UserService.update(userId, {
        nickname,
        avatar_url,
        phone,
        city,
        province,
        country,
      });

      res.json({
        code: 0,
        message: "更新成功",
        data: updatedUser,
      });
    } catch (error) {
      console.error("更新用户信息失败:", error);
      res.status(500).json({
        code: 1,
        message: "更新用户信息失败",
      });
    }
  }

  /**
   * 用户登出
   */
  static async logout(req: AuthenticatedRequest, res: Response) {
    try {
      // 这里可以添加登出逻辑，比如清除token等
      res.json({
        code: 0,
        message: "登出成功",
      });
    } catch (error) {
      console.error("登出失败:", error);
      res.status(500).json({
        code: 1,
        message: "登出失败",
      });
    }
  }
}
