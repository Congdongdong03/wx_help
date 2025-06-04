// src/controllers/user.ts
import { Request, Response } from "express";
import { UserService } from "../services/userService";

// 统一的日志函数
const log = (
  level: "info" | "error" | "warn" | "debug",
  message: string,
  data?: any
) => {
  console[level](message, data);
};

export class UserController {
  /**
   * 用户注册
   */
  static async register(req: Request, res: Response) {
    try {
      const { username, password, email, nickname, phone } = req.body;
      if (!username) {
        return res.status(400).json({
          code: 1,
          error: "用户名不能为空",
        });
      }
      // 基本验证

      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({
          code: 1,
          error: "用户名长度必须在3-20字符之间",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          code: 1,
          error: "密码长度不能少于6位",
        });
      }

      // 检查用户名是否已存在
      const isUsernameExists = await UserService.isUsernameExists(username);
      if (isUsernameExists) {
        return res.status(400).json({
          code: 1,
          error: "用户名已存在",
        });
      }

      // 检查邮箱是否已存在（如果提供了邮箱）
      if (email) {
        const isEmailExists = await UserService.isEmailExists(email);
        if (isEmailExists) {
          return res.status(400).json({
            code: 1,
            error: "邮箱已被注册",
          });
        }
      }

      // 创建新用户
      const newUser = await UserService.create({
        username,
        email,
        nickname: nickname || username, // 如果没有提供昵称，使用用户名
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
        error: "注册失败，请稍后再试",
      });
    }
  }

  /**
   * 用户登录
   */
  /**
   * 微信登录
   */
  static async wechatLogin(req: Request, res: Response) {
    try {
      const { openid, userInfo } = req.body;

      if (!openid) {
        return res.status(400).json({
          code: 1,
          error: "openid不能为空",
        });
      }

      // 查找或创建用户
      let user = await UserService.findByOpenid(openid);

      if (!user) {
        // 用户不存在，创建新用户
        user = await UserService.create({
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
        error: "登录失败，请稍后再试",
      });
    }
  }
  /**
   * 获取用户信息
   */
  static async getUserInfo(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        return res.status(400).json({
          code: 1,
          error: "无效的用户ID",
        });
      }

      const userInfo = await UserService.getSafeUserInfo(userId);
      if (!userInfo) {
        return res.status(404).json({
          code: 1,
          error: "用户不存在",
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
        userId: req.params.id,
      });
      res.status(500).json({
        code: 1,
        error: "获取用户信息失败",
      });
    }
  }

  /**
   * 更新用户信息
   */
  static async updateUserInfo(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const { nickname, email, phone, city, province, avatar_url } = req.body;

      if (isNaN(userId)) {
        return res.status(400).json({
          code: 1,
          error: "无效的用户ID",
        });
      }

      // 检查用户是否存在
      const existingUser = await UserService.findById(userId);
      if (!existingUser) {
        return res.status(404).json({
          code: 1,
          error: "用户不存在",
        });
      }

      // 更新用户信息
      const updatedUser = await UserService.update(userId, {
        nickname,
        email,
        phone,
        city,
        province,
        avatar_url,
      });

      log("info", "User info updated", {
        userId,
        updatedFields: Object.keys(req.body),
      });

      res.json({
        code: 0,
        message: "更新成功",
        data: {
          id: updatedUser.id,
          username: updatedUser.username,
          nickname: updatedUser.nickname,
          email: updatedUser.email,
          phone: updatedUser.phone,
          city: updatedUser.city,
          province: updatedUser.province,
          avatar_url: updatedUser.avatar_url,
        },
      });
    } catch (error: any) {
      log("error", "Update user info error", {
        error: error.message || error,
        userId: req.params.id,
      });
      res.status(500).json({
        code: 1,
        error: "更新用户信息失败",
      });
    }
  }
}
