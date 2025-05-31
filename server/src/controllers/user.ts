import { Request, Response } from "express";
import { UserModel, User } from "../models/user";
import { Logtail } from "@logtail/node";
import { config } from "../config";

const logtail = new Logtail(config.logtailToken);

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
      logtail.info("User registered", { username, email });

      res.status(201).json({ message: "注册成功" });
    } catch (error) {
      logtail.error("Registration error", { error });
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

      logtail.info("User logged in", { username });
      res.json({
        message: "登录成功",
        user: { id: user.id, username: user.username, email: user.email },
      });
    } catch (error) {
      logtail.error("Login error", { error });
      res.status(500).json({ error: "登录失败" });
    }
  }
}
