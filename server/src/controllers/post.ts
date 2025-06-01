import { Request, Response } from "express";
import { PostModel } from "../models/post";
// import { Logtail } from "@logtail/node"; // 移除 Logtail 导入
// import { config } from "../config"; // 移除 config 导入

// const logtail = new Logtail(config.logtailToken); // 移除 Logtail 初始化

// 简单的日志辅助函数，与 user.ts 中一致
const log = (
  level: "info" | "error" | "warn" | "debug",
  message: string,
  data?: any
) => {
  console[level](message, data);
};

export class PostController {
  static async getMyPosts(req: Request, res: Response) {
    try {
      // TODO: Get user ID from authenticated user
      const userId = 1; // Placeholder user ID

      const posts = await PostModel.findByUserId(userId);
      // logtail.info("Fetched user posts", { userId, count: posts.length }); // 移除 Logtail 日志调用
      log("info", "Fetched user posts", { userId, count: posts.length }); // 改用 console.log

      res.json({ posts });
    } catch (error: any) {
      // 明确 error 类型
      // logtail.error("Error fetching user posts", { error }); // 移除 Logtail 日志调用
      log("error", "Error fetching user posts", { error }); // 改用 console.error
      res.status(500).json({ error: "获取我的发布失败" });
    }
  }

  // TODO: Add methods for creating, updating, and deleting posts
}
