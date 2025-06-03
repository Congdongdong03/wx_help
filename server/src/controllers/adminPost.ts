import { Request, Response } from "express";
import { getDb } from "../config/database"; // Assuming getDb is here

// Define a log function (if you have a shared one, import it)
const log = (
  level: "info" | "error" | "warn" | "debug",
  message: string,
  data?: any
) => {
  const timestamp = new Date().toISOString();
  console[level](
    `[${timestamp}] [PostController] ${message}`,
    data !== undefined ? JSON.stringify(data) : ""
  );
};

export class AdminPostController {
  // (在这里可以放回之前 PostController 中的其他方法，如果需要的话)
  // static async updatePostStatus(req: Request, res: Response) { ... }
  // static async syncRecommendations(req: Request, res: Response) { ... }

  // 获取待审核帖子
  static async getPendingPosts(req: Request, res: Response) {
    try {
      log("info", "getPendingPosts: Fetching pending posts.");
      const db = getDb();
      const [posts]: any = await db.execute(`
        SELECT p.id, p.title, p.category, p.wechat_id, u.nickname as author_nickname, p.created_at 
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.status = 'pending' 
        ORDER BY p.created_at ASC
      `);
      // 注意：posts 查询结果是数组，即使只有一个结果也是数组包对象。
      // 如果 posts 表中的 city 和 recommendations 表中的 city 含义不同，确保这里使用的是正确的 city 字段。
      // 同样，content 可能也需要从 posts 表中获取，而不是依赖 recommendations 表。

      log("info", "getPendingPosts: Successfully fetched pending posts.", {
        count: posts.length,
      });
      res.json({ posts }); // 直接返回查询结果，前端需要适配
    } catch (error: any) {
      log("error", "getPendingPosts: Error fetching pending posts.", {
        errorMessage: error.message,
        stack: error.stack,
      });
      res.status(500).json({ error: "获取待审核帖子失败" }); // 更具体的错误信息
    }
  }

  // 审核帖子
  static async reviewPost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { action } = req.body; // action: 'approve' or 'reject'
      const postId = parseInt(id, 10);

      if (isNaN(postId)) {
        log("warn", "reviewPost: Invalid post ID provided.", { id });
        return res.status(400).json({ error: "无效的帖子ID" });
      }

      if (!["approve", "reject"].includes(action)) {
        log("warn", "reviewPost: Invalid action provided.", { action });
        return res.status(400).json({ error: "无效的操作类型" });
      }

      log("info", "reviewPost: Processing review action.", { postId, action });
      const db = getDb();

      if (action === "approve") {
        // 1. 更新状态为published
        const [updateResult]: any = await db.execute(
          "UPDATE posts SET status = 'published', updated_at = NOW() WHERE id = ?",
          [postId]
        );
        if (updateResult.affectedRows === 0) {
          log(
            "warn",
            "reviewPost: Post not found or status already published during approval.",
            { postId }
          );
          return res.status(404).json({ error: "帖子不存在或无法更新状态" });
        }

        // 2. 获取帖子信息 (确保获取的是最新的，或者必须的字段)
        const [postRows]: any = await db.execute(
          "SELECT * FROM posts WHERE id = ?",
          [postId]
        );
        if (postRows.length === 0) {
          log(
            "error",
            "reviewPost: Post not found after update for recommendation.",
            { postId }
          );
          return res.status(404).json({ error: "更新后找不到帖子信息" });
        }
        const post = postRows[0];

        // 3. 加入推荐表 (确保字段匹配 recommendations 表结构)
        // 您可能需要从 post 对象中获取 image_url (如果存在且需要)
        let imageUrl = null;
        if (post.images) {
          try {
            const imagesArray = JSON.parse(post.images);
            if (Array.isArray(imagesArray) && imagesArray.length > 0) {
              imageUrl = imagesArray[0]; // Assuming first image is used for recommendation
            }
          } catch (e) {
            log(
              "warn",
              "reviewPost: Failed to parse images for recommendation.",
              { postId, images: post.images }
            );
          }
        }

        // 使用 ON DUPLICATE KEY UPDATE 来避免重复插入或处理已存在推荐的情况
        await db.execute(
          `
          INSERT INTO recommendations (post_id, title, description, category, city, image_url, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            description = VALUES(description),
            category = VALUES(category),
            city = VALUES(city),
            image_url = VALUES(image_url),
            is_active = 1,
            updated_at = NOW()
        `,
          [
            postId,
            post.title,
            post.content || post.title, // Ensure content field exists or fallback
            post.category,
            post.city || "通用", // Ensure city field exists or fallback
            imageUrl,
          ]
        );

        log(
          "info",
          "reviewPost: Post approved and added/updated in recommendations.",
          { postId }
        );
        res.json({ message: "审核通过，已加入推荐" });
      } else if (action === "reject") {
        // 拒绝
        const [updateResult]: any = await db.execute(
          "UPDATE posts SET status = 'failed', updated_at = NOW() WHERE id = ?",
          [postId]
        );
        if (updateResult.affectedRows === 0) {
          log("warn", "reviewPost: Post not found during rejection.", {
            postId,
          });
          return res.status(404).json({ error: "帖子不存在或无法更新状态" });
        }
        // 如果帖子曾被推荐，也应该从推荐中移除或标记为不活跃
        await db.execute(
          "UPDATE recommendations SET is_active = 0, updated_at = NOW() WHERE post_id = ?",
          [postId]
        );

        log("info", "reviewPost: Post rejected.", { postId });
        res.json({ message: "审核拒绝" });
      } else {
        //理论上不会到这里，因为前面有 action 校验
        log("warn", "reviewPost: Unknown action.", { action });
        return res.status(400).json({ error: "未知的操作类型" });
      }
    } catch (error: any) {
      log("error", "reviewPost: Error during review process.", {
        errorMessage: error.message,
        stack: error.stack,
      });
      res.status(500).json({ error: "审核操作失败" });
    }
  }
}
