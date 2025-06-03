import { Request, Response } from "express";
import { PostModel, Post, PostStatus } from "../models/post";
// import { Logtail } from "@logtail/node"; // 移除 Logtail 导入
// import { config } from "../config"; // 移除 config 导入

// const logtail = new Logtail(config.logtailToken); // 移除 Logtail 初始化

// 简单的日志辅助函数，与 user.ts 中一致
const log = (
  level: "info" | "error" | "warn" | "debug",
  message: string,
  data?: any
) => {
  // Add a timestamp to logs for better readability
  const timestamp = new Date().toISOString();
  console[level](`[${timestamp}] ${message}`, data !== undefined ? data : "");
};

export class PostController {
  static getPendingPosts(arg0: string, getPendingPosts: any) {
    throw new Error("Method not implemented.");
  }
  static reviewPost(arg0: string, reviewPost: any) {
    throw new Error("Method not implemented.");
  }
  static async getMyPosts(req: Request, res: Response) {
    log("info", "PostController.getMyPosts: Received request", {
      query: req.query,
    });
    try {
      // TODO: Get user ID from authenticated user
      const userId = 1; // Placeholder user ID

      const { status, page = "1", limit = "10" } = req.query;

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);

      if (isNaN(pageNumber) || pageNumber < 1) {
        return res.status(400).json({ error: "页码必须是大于0的数字" });
      }
      if (isNaN(limitNumber) || limitNumber < 1) {
        return res.status(400).json({ error: "每页数量必须是大于0的数字" });
      }

      // Validate status if provided
      if (
        status &&
        !["draft", "pending", "published", "failed"].includes(status as string)
      ) {
        return res.status(400).json({ error: "无效的状态值" });
      }

      const result = await PostModel.findByUserIdWithFilters(userId, {
        status: status as PostStatus | undefined,
        page: pageNumber,
        limit: limitNumber,
      });

      log(
        "info",
        "PostController.getMyPosts: Fetched user posts successfully",
        { userId, result }
      );

      res.json(result);
    } catch (error: any) {
      log("error", "PostController.getMyPosts: Error fetching user posts", {
        message: error.message,
        stack: error.stack,
        query: req.query,
      });
      res.status(500).json({ error: "获取我的发布失败，请稍后再试" });
    }
  }

  static async createPost(req: Request, res: Response) {
    log("info", "PostController.createPost: Received request", {
      body: req.body,
      contentType: req.get("Content-Type"),
      headers: req.headers,
    });

    try {
      // 检查req.body是否为空
      if (!req.body || Object.keys(req.body).length === 0) {
        log("error", "PostController.createPost: Empty request body", {
          body: req.body,
          contentType: req.get("Content-Type"),
        });
        return res.status(400).json({ error: "请求体为空，请检查数据格式" });
      }

      const {
        title,
        description,
        wechatId,
        images,
        category,
        status: intentStatus,
      } = req.body;

      log("info", "PostController.createPost: Destructured request body", {
        title,
        description,
        wechatId,
        images,
        category,
        intentStatus,
      });

      const userId = 1;

      // 增强验证逻辑
      const missingFields = [];
      if (!title || title.trim() === "") missingFields.push("title");
      if (!wechatId || wechatId.trim() === "") missingFields.push("wechatId");
      if (!category) missingFields.push("category");
      if (!intentStatus) missingFields.push("status");

      if (missingFields.length > 0) {
        log(
          "warn",
          "PostController.createPost: Validation failed - Missing required fields",
          {
            missingFields,
            body: req.body,
          }
        );
        return res.status(400).json({
          error: `缺少必填字段: ${missingFields.join(", ")}`,
          missingFields,
        });
      }

      if (!["draft", "published"].includes(intentStatus)) {
        log("warn", "PostController.createPost: Invalid intent status", {
          intentStatus,
        });
        return res.status(400).json({ error: "无效的意图状态值" });
      }

      // 数据准备
      const postData: Omit<Post, "id" | "created_at" | "updated_at"> = {
        user_id: userId,
        title: title.trim(),
        content: description ? description.trim() : null,
        wechat_id: wechatId.trim(),
        images:
          images && Array.isArray(images) && images.length > 0
            ? JSON.stringify(images)
            : null,
        category,
        status: intentStatus as "draft" | "published",
      };

      log("info", "PostController.createPost: Prepared data for model", {
        postData,
      });

      const newPost = await PostModel.create(postData);

      log("info", "PostController.createPost: Post created successfully", {
        newPost,
      });

      let message = "操作成功";
      if (newPost.status === "pending") {
        message = "提交成功，等待审核";
      } else if (newPost.status === "draft") {
        message = "草稿已保存";
      }

      res.status(201).json({ message, post: newPost });
    } catch (error: any) {
      log("error", "PostController.createPost: Error caught", {
        message: error.message,
        stack: error.stack,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        body: req.body,
        contentType: req.get("Content-Type"),
      });

      // 更详细的错误分类
      if (error.code === "ER_NO_SUCH_TABLE") {
        return res.status(500).json({ error: "数据库表不存在" });
      } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
        return res.status(500).json({ error: "数据库连接权限错误" });
      } else if (error.code === "ECONNREFUSED") {
        return res.status(500).json({ error: "数据库连接被拒绝" });
      } else if (error.message.includes("Bind parameters")) {
        return res.status(500).json({ error: "数据格式错误" });
      } else {
        return res.status(500).json({
          error: "操作失败，请稍后再试",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    }
  }

  // TODO: Add methods for creating, updating, and deleting posts for other categories if needed
}
