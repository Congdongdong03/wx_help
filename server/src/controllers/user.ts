import { Request, Response } from "express";
import { UserModel, User } from "../models/user";
// import { AsyncClient, PutLogsRequest, LogGroup, LogItem, Content } from "tencentcloud-cls-sdk-js"; // 移除腾讯云 CLS 导入

// 移除 CLS 环境变量获取和客户端初始化
// const { TENCENTCLOUD_SECRET_ID, TENCENTCLOUD_SECRET_KEY, TENCENTCLOUD_REGION, TENCENTCLOUD_CLS_TOPIC_ID } = process.env;
// const endpoint = `${TENCENTCLOUD_REGION}.cls.tencentcs.com`;
// const clsClient = new AsyncClient({ /* ... */ });

// 移除发送日志到 CLS 的辅助函数，改用 console.log
const log = (
  level: "info" | "error" | "warn" | "debug",
  message: string,
  data?: any
) => {
  console[level](message, data);
};

export class UserController {
  static async register(req: Request, res: Response) {
    try {
      const { username, password, email } = req.body;

      // 检查用户是否已存在
      const existingUser = await UserModel.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "用户名已存在" });
      }

      // 创建新用户
      const user: User = {
        username,
        password, // 注意：实际应用中应该对密码进行加密
        email,
      };

      await UserModel.create(user);
      // sendLogToCls("info", "User registered", { username, email }); // 移除 CLS 日志调用
      log("info", "User registered", { username, email }); // 改用 console.log

      res.status(201).json({ message: "注册成功" });
    } catch (error: any) {
      // sendLogToCls("error", "Registration error", { error: error.message || error }); // 移除 CLS 日志调用
      log("error", "Registration error", { error: error.message || error }); // 改用 console.error
      res.status(500).json({ error: "注册失败" });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      const user = await UserModel.findByUsername(username);
      if (!user || user.password !== password) {
        // 注意：实际应用中应该使用加密比较
        return res.status(401).json({ error: "用户名或密码错误" });
      }

      // sendLogToCls("info", "User logged in", { username }); // 移除 CLS 日志调用
      log("info", "User logged in", { username }); // 改用 console.log
      res.json({
        message: "登录成功",
        user: { id: user.id, username: user.username, email: user.email },
      });
    } catch (error: any) {
      // sendLogToCls("error", "Login error", { error: error.message || error }); // 移除 CLS 日志调用
      log("error", "Login error", { error: error.message || error }); // 改用 console.error
      res.status(500).json({ error: "登录失败" });
    }
  }
}
