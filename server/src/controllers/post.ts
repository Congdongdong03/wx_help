// src/controllers/post.ts
import { Request, Response } from "express";
import { PostService } from "../services/postService";

// 统一的日志函数
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

export class PostController {
  /**
   * 获取我的发布列表
   * GET /api/posts/my?status=draft&page=1&limit=10
   */
  static async getMyPosts(req: Request, res: Response) {
    log("info", "getMyPosts: Received request", { query: req.query });

    try {
      const userId = (req as any).userId || 1; // TODO: 从认证中间件获取
      const { status, page = "1", limit = "10" } = req.query;

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);

      if (isNaN(pageNumber) || pageNumber < 1) {
        return res.status(400).json({
          code: 1,
          error: "页码必须是大于0的数字",
        });
      }

      if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 50) {
        return res.status(400).json({
          code: 1,
          error: "每页数量必须是1-50之间的数字",
        });
      }

      if (
        status &&
        !["draft", "pending", "published", "failed"].includes(status as string)
      ) {
        return res.status(400).json({
          code: 1,
          error: "无效的状态值",
        });
      }

      const result = await PostService.findByUserIdWithFilters(userId, {
        status: status as any,
        page: pageNumber,
        limit: limitNumber,
      });

      log("info", "getMyPosts: Success", {
        userId,
        status,
        resultCount: result.posts.length,
        total: result.pagination.totalPosts,
      });

      res.json({
        code: 0,
        message: "获取成功",
        data: result,
      });
    } catch (error: any) {
      log("error", "getMyPosts: Error", {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        code: 1,
        error: "获取我的发布失败，请稍后再试",
      });
    }
  }

  /**
   * 创建新帖子
   * POST /api/posts
   */
  static async createPost(req: Request, res: Response) {
    log("info", "createPost: Received request");

    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          code: 1,
          error: "请求体为空，请检查数据格式",
        });
      }

      const {
        title,
        description,
        contactInfo,
        images,
        category,
        status: intentStatus,
        city,
        cityCode,
        price,
      } = req.body;

      const userId = (req as any).userId || 1;

      // 验证必填字段
      const missingFields = [];
      if (!title || title.trim() === "") missingFields.push("title");
      if (!contactInfo || contactInfo.trim() === "")
        missingFields.push("contactInfo");
      if (!category) missingFields.push("category");
      if (!intentStatus) missingFields.push("status");

      if (missingFields.length > 0) {
        return res.status(400).json({
          code: 1,
          error: `缺少必填字段: ${missingFields.join(", ")}`,
          missingFields,
        });
      }

      // 验证字段长度和格式
      if (title.trim().length > 100) {
        return res.status(400).json({
          code: 1,
          error: "标题长度不能超过100字符",
        });
      }

      if (description && description.trim().length > 2000) {
        return res.status(400).json({
          code: 1,
          error: "描述长度不能超过2000字符",
        });
      }

      const validCategories = ["help", "rent", "used", "jobs"];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          code: 1,
          error: "无效的分类",
        });
      }

      if (!["draft", "publish"].includes(intentStatus)) {
        return res.status(400).json({
          code: 1,
          error: "无效的意图状态值",
        });
      }

      if (images && Array.isArray(images) && images.length > 9) {
        return res.status(400).json({
          code: 1,
          error: "图片数量不能超过9张",
        });
      }

      // 使用 PostService 创建帖子
      const newPost = await PostService.create({
        user_id: userId,
        title: title.trim(),
        content: description ? description.trim() : undefined,
        contact_info: contactInfo.trim(),
        images:
          images && Array.isArray(images) && images.length > 0
            ? JSON.stringify(images)
            : undefined,
        category,
        city_code: cityCode || undefined,
        status: intentStatus === "draft" ? "draft" : "pending",
        price: price || undefined,
      });

      let message = "操作成功";
      if (newPost.status === "pending") {
        message = "提交成功，等待审核";
      } else if (newPost.status === "draft") {
        message = "草稿已保存";
      }

      log("info", "createPost: Success", {
        postId: newPost.id,
        status: newPost.status,
        userId,
      });

      res.status(201).json({
        code: 0,
        message,
        data: newPost,
      });
    } catch (error: any) {
      log("error", "createPost: Error", {
        message: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        code: 1,
        error: "操作失败，请稍后再试",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * 更新帖子
   * PUT /api/posts/:id
   */
  static async updatePost(req: Request, res: Response) {
    try {
      const postId = parseInt(req.params.id);
      const userId = (req as any).userId || 1;

      if (isNaN(postId)) {
        return res.status(400).json({
          code: 1,
          error: "无效的帖子ID",
        });
      }

      const existingPost = await PostService.findById(postId);
      if (!existingPost) {
        return res.status(404).json({
          code: 1,
          error: "帖子不存在",
        });
      }

      if (existingPost.user_id !== userId) {
        return res.status(403).json({
          code: 1,
          error: "无权限操作此帖子",
        });
      }

      // Temporarily commented out for development to allow editing posts in any status
      /*
      if (
        !existingPost.status ||
        !["draft", "failed"].includes(existingPost.status)
      ) {
        return res.status(400).json({
          code: 1,
          error: "当前状态的帖子不允许编辑",
        });
      }
      */

      const { title, description, images, category, city, status } = req.body;

      const updateData: any = {};

      if (title !== undefined) {
        if (!title || title.trim() === "") {
          return res.status(400).json({
            code: 1,
            error: "标题不能为空",
          });
        }
        updateData.title = title.trim();
      }

      if (description !== undefined) {
        updateData.content = description ? description.trim() : null;
      }

      if (images !== undefined) {
        updateData.images =
          images && Array.isArray(images) && images.length > 0
            ? JSON.stringify(images)
            : null;
      }

      if (category !== undefined) {
        updateData.category = category;
      }

      if (city !== undefined) {
        updateData.city = city || null;
      }

      if (status !== undefined) {
        if (status === "publish") {
          updateData.status = "pending";
        } else if (status === "draft") {
          updateData.status = "draft";
        }
      }

      const updatedPost = await PostService.update(postId, updateData);

      let message = "更新成功";
      if (updatedPost.status === "pending") {
        message = "提交成功，等待审核";
      }

      res.json({
        code: 0,
        message,
        data: updatedPost,
      });
    } catch (error: any) {
      log("error", "updatePost: Error", { message: error.message });
      res.status(500).json({
        code: 1,
        error: "更新帖子失败",
      });
    }
  }

  /**
   * 删除帖子
   * DELETE /api/posts/:id
   */
  static async deletePost(req: Request, res: Response) {
    try {
      const postId = parseInt(req.params.id);
      const userId = (req as any).userId || 1;

      if (isNaN(postId)) {
        return res.status(400).json({
          code: 1,
          error: "无效的帖子ID",
        });
      }

      const existingPost = await PostService.findById(postId);
      if (!existingPost) {
        return res.status(404).json({
          code: 1,
          error: "帖子不存在",
        });
      }

      if (existingPost.user_id !== userId) {
        return res.status(403).json({
          code: 1,
          error: "无权限操作此帖子",
        });
      }

      // Temporarily commented out for development to allow deleting any post status
      /*
      if (
        !existingPost.status ||
        !["draft", "failed"].includes(existingPost.status)
      ) {
        return res.status(400).json({
          code: 1,
          error: "只能删除草稿或审核失败的帖子",
        });
      }
      */

      const success = await PostService.delete(postId);

      if (success) {
        res.json({
          code: 0,
          message: "删除成功",
        });
      } else {
        res.status(500).json({
          code: 1,
          error: "删除失败",
        });
      }
    } catch (error: any) {
      log("error", "deletePost: Error", { message: error.message });
      res.status(500).json({
        code: 1,
        error: "删除帖子失败",
      });
    }
  }

  /**
   * 擦亮帖子（刷新发布时间）
   * POST /api/posts/:id/polish
   */
  static async polishPost(req: Request, res: Response) {
    log("info", "polishPost: Received request", { postId: req.params.id });

    try {
      const postId = parseInt(req.params.id);
      const userId = (req as any).userId || 1;

      if (isNaN(postId)) {
        return res.status(400).json({
          code: 1,
          error: "无效的帖子ID",
        });
      }

      const existingPost = await PostService.findById(postId);
      if (!existingPost) {
        return res.status(404).json({
          code: 1,
          error: "帖子不存在",
        });
      }

      if (existingPost.user_id !== userId) {
        return res.status(403).json({
          code: 1,
          error: "无权限操作此帖子",
        });
      }

      if (!existingPost.status || existingPost.status !== "published") {
        return res.status(400).json({
          code: 1,
          error: "只有已发布的帖子才能擦亮",
        });
      }

      // 检查擦亮时间限制（例如：24小时内只能擦亮一次）
      const lastUpdate = new Date(
        existingPost.updated_at || existingPost.created_at || new Date()
      );
      const now = new Date();
      const hoursSinceLastUpdate =
        (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastUpdate < 24) {
        const remainingHours = Math.ceil(24 - hoursSinceLastUpdate);
        return res.status(400).json({
          code: 1,
          error: `请等待 ${remainingHours} 小时后再擦亮`,
        });
      }

      const updatedPost = await PostService.update(postId, {
        updated_at: new Date(),
      });

      log("info", "polishPost: Success", { postId, userId });

      res.json({
        code: 0,
        message: "擦亮成功",
        data: updatedPost,
      });
    } catch (error: any) {
      log("error", "polishPost: Error", {
        message: error.message,
        stack: error.stack,
        postId: req.params.id,
      });
      res.status(500).json({
        code: 1,
        error: "擦亮失败",
      });
    }
  }

  /**
   * 获取帖子列表（公开接口）
   * GET /api/posts?category=rent&city=beijing&page=1&limit=10
   */
  static async getPosts(req: Request, res: Response) {
    log("info", "getPosts: Received request", { query: req.query });

    try {
      const {
        category,
        city_code,
        page = "1",
        limit = "10",
        keyword,
      } = req.query;

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);

      if (isNaN(pageNumber) || pageNumber < 1) {
        return res.status(400).json({
          code: 1,
          error: "页码必须是大于0的数字",
        });
      }

      if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 50) {
        return res.status(400).json({
          code: 1,
          error: "每页数量必须是1-50之间的数字",
        });
      }

      if (
        category &&
        !["help", "rent", "used", "jobs", "recommend"].includes(
          category as string
        )
      ) {
        return res.status(400).json({
          code: 1,
          error: "无效的分类",
        });
      }

      const result = await PostService.findWithFilters({
        category: category as string,
        city: city_code as string,
        keyword: keyword as string,
        page: pageNumber,
        limit: limitNumber,
        status: "published",
      });

      log("info", "getPosts: Success", {
        category,
        city_code,
        keyword,
        resultCount: result.posts.length,
        pinnedCount: result.pinned_content?.length || 0,
        total: result.pagination.totalPosts,
      });

      // 构建推荐分类的元数据
      const recommend_meta =
        category === "recommend"
          ? {
              weekly_deals_count:
                result.pinned_content?.filter((item) => item.is_weekly_deal)
                  .length || 0,
              pinned_posts_count:
                result.pinned_content?.filter((item) => !item.is_weekly_deal)
                  .length || 0,
              total_pinned: result.pinned_content?.length || 0,
            }
          : undefined;

      res.json({
        code: 0,
        message: "获取成功",
        data: {
          posts: result.posts,
          pinned_content: result.pinned_content,
          pagination: {
            page: result.pagination.currentPage,
            pageSize: result.pagination.limit,
            total: result.pagination.totalPosts,
          },
          recommend_meta,
        },
      });
    } catch (error: any) {
      log("error", "getPosts: Error", {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        code: 1,
        error: "获取帖子列表失败",
      });
    }
  }

  /**
   * 获取帖子详情
   * GET /api/posts/:id
   */
  static async getPostById(req: Request, res: Response) {
    log("info", "getPostById: Received request", { postId: req.params.id });

    try {
      const postId = parseInt(req.params.id);

      if (isNaN(postId)) {
        log("warn", "getPostById: Invalid post ID", { postId: req.params.id });
        return res.status(400).json({
          code: 1,
          error: "无效的帖子ID",
        });
      }

      const post = await PostService.findById(postId);
      if (!post) {
        log("warn", "getPostById: Post not found", { postId });
        return res.status(404).json({
          code: 1,
          error: "帖子不存在",
        });
      }

      log("info", "getPostById: Success", { postId });
      res.json({
        code: 0,
        message: "获取成功",
        data: post,
      });
    } catch (error: any) {
      log("error", "getPostById: Error", {
        message: error.message,
        stack: error.stack,
        postId: req.params.id,
      });
      res.status(500).json({
        code: 1,
        error: "获取帖子详情失败",
      });
    }
  }

  /**
   * 重新提交帖子（将失败状态的帖子重新提交审核）
   * POST /api/posts/:id/resubmit
   */
  static async resubmitPost(req: Request, res: Response) {
    log("info", "resubmitPost: Received request", { postId: req.params.id });

    try {
      const postId = parseInt(req.params.id);
      const userId = (req as any).userId || 1;

      if (isNaN(postId)) {
        return res.status(400).json({
          code: 1,
          error: "无效的帖子ID",
        });
      }

      const existingPost = await PostService.findById(postId);
      if (!existingPost) {
        return res.status(404).json({
          code: 1,
          error: "帖子不存在",
        });
      }

      if (existingPost.user_id !== userId) {
        return res.status(403).json({
          code: 1,
          error: "无权限操作此帖子",
        });
      }
      if (!existingPost.status || existingPost.status !== "failed") {
        return res.status(400).json({
          code: 1,
          error: "只有审核失败的帖子才能重新提交",
        });
      }

      const updatedPost = await PostService.update(postId, {
        status: "pending",
        updated_at: new Date(),
      });

      log("info", "resubmitPost: Success", { postId, userId });

      res.json({
        code: 0,
        message: "重新提交成功，等待审核",
        data: updatedPost,
      });
    } catch (error: any) {
      log("error", "resubmitPost: Error", {
        message: error.message,
        stack: error.stack,
        postId: req.params.id,
      });
      res.status(500).json({
        code: 1,
        error: "重新提交失败",
      });
    }
  }
}
