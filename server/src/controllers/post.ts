// src/controllers/post.ts
import { Request, Response } from "express";
import { PostService } from "../services/postService";
import { PostModel } from "../models/post";
import { AuthenticatedRequest } from "../middleware/auth";
import { sensitiveWordService } from "../services/sensitiveWordService";
import { log } from "../utils/logger";

export class PostController {
  /**
   * 获取我的发布列表
   * GET /api/posts/my?status=draft&page=1&limit=10
   */
  static async getMyPosts(req: AuthenticatedRequest, res: Response) {
    log("info", "getMyPosts: Received request", { query: req.query });

    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          code: 401,
          message: "未登录",
        });
      }

      const { status, page = "1", limit = "10" } = req.query;

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);

      if (isNaN(pageNumber) || pageNumber < 1) {
        return res.status(400).json({
          code: 1,
          message: "页码必须是大于0的数字",
        });
      }

      if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 50) {
        return res.status(400).json({
          code: 1,
          message: "每页数量必须是1-50之间的数字",
        });
      }

      if (
        status &&
        !["draft", "pending", "published", "failed"].includes(status as string)
      ) {
        return res.status(400).json({
          code: 1,
          message: "无效的状态值",
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
        message: "获取我的发布失败，请稍后再试",
      });
    }
  }

  /**
   * 创建新帖子
   * POST /api/posts
   */
  static async createPost(req: AuthenticatedRequest, res: Response) {
    log("info", "createPost: Received request", { body: req.body });

    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          code: 401,
          message: "未登录",
        });
      }

      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          code: 1,
          message: "请求体为空，请检查数据格式",
        });
      }

      const {
        title,
        description,
        images,
        categoryMain,
        categorySub,
        cityCode,
        price,
      } = req.body;

      // 验证必填字段
      const missingFields = [];
      if (!title || title.trim() === "") missingFields.push("title");
      if (!categoryMain) missingFields.push("categoryMain");

      if (missingFields.length > 0) {
        return res.status(400).json({
          code: 1,
          message: `缺少必填字段: ${missingFields.join(", ")}`,
          missingFields,
        });
      }

      // 验证字段长度和格式
      if (title.trim().length > 100) {
        return res.status(400).json({
          code: 1,
          message: "标题长度不能超过100字符",
        });
      }

      if (description && description.trim().length > 2000) {
        return res.status(400).json({
          code: 1,
          message: "描述长度不能超过2000字符",
        });
      }

      const validCategories = ["help", "rent", "used", "jobs"];
      if (!validCategories.includes(categoryMain)) {
        return res.status(400).json({
          code: 1,
          message: "无效的分类",
        });
      }

      if (images && Array.isArray(images) && images.length > 9) {
        return res.status(400).json({
          code: 1,
          message: "图片数量不能超过9张",
        });
      }

      // 敏感词检测
      const textToCheck = `${title} ${description || ""}`.trim();
      const sensitiveResult = await sensitiveWordService.checkSensitiveWords(
        textToCheck
      );

      let postStatus = "pending";
      let reviewStatus = "pending";
      let sensitiveWords = null;

      if (sensitiveResult.hasSensitiveWords) {
        postStatus = "review_required";
        reviewStatus = "pending";
        sensitiveWords = JSON.stringify({
          words: sensitiveResult.matchedWords,
          categories: sensitiveResult.categories,
        });

        log("warn", "createPost: Sensitive words detected", {
          postId: null,
          userId,
          matchedWords: sensitiveResult.matchedWords,
          categories: sensitiveResult.categories,
        });
      }

      // 使用 PostService 创建帖子
      const newPost = await PostService.create({
        user_id: userId,
        title: title.trim(),
        content: description ? description.trim() : undefined,
        images:
          images && Array.isArray(images) && images.length > 0
            ? JSON.stringify(images)
            : undefined,
        category: categoryMain,
        sub_category: categorySub,
        city_code: cityCode || undefined,
        status: postStatus as any,
        review_status: reviewStatus,
        sensitive_words: sensitiveWords || undefined,
        price: price || undefined,
      });

      log("info", "createPost: Success", {
        postId: newPost.id,
        status: newPost.status,
        userId,
      });

      res.status(201).json({
        code: 0,
        message: "提交成功，等待审核",
        data: newPost,
      });
    } catch (error: any) {
      log("error", "createPost: Error", {
        message: error.message,
        stack: error.stack,
        body: req.body,
      });
      res.status(500).json({
        code: 1,
        message: "创建帖子失败，请稍后再试",
      });
    }
  }

  /**
   * 更新帖子
   * PUT /api/posts/:id
   */
  static async updatePost(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          code: 401,
          message: "未登录",
        });
      }

      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({
          code: 1,
          message: "无效的帖子ID",
        });
      }

      const existingPost = await PostService.findById(postId);
      if (!existingPost) {
        return res.status(404).json({
          code: 1,
          message: "帖子不存在",
        });
      }

      if (existingPost.user_id !== userId) {
        return res.status(403).json({
          code: 1,
          message: "无权修改此帖子",
        });
      }

      const {
        title,
        description,
        images,
        category,
        status: intentStatus,
        city,
        cityCode,
        price,
      } = req.body;

      // 验证字段长度和格式
      if (title && title.trim().length > 100) {
        return res.status(400).json({
          code: 1,
          message: "标题长度不能超过100字符",
        });
      }

      if (description && description.trim().length > 2000) {
        return res.status(400).json({
          code: 1,
          message: "描述长度不能超过2000字符",
        });
      }

      if (category) {
        const validCategories = ["help", "rent", "used", "jobs"];
        if (!validCategories.includes(category)) {
          return res.status(400).json({
            code: 1,
            message: "无效的分类",
          });
        }
      }

      if (intentStatus && !["draft", "publish"].includes(intentStatus)) {
        return res.status(400).json({
          code: 1,
          message: "无效的意图状态值",
        });
      }

      if (images && Array.isArray(images) && images.length > 9) {
        return res.status(400).json({
          code: 1,
          message: "图片数量不能超过9张",
        });
      }

      // 敏感词检测（仅在发布时检测）
      let postStatus = intentStatus === "draft" ? "draft" : "pending";
      let reviewStatus = "pending";
      let sensitiveWords = null;

      if (intentStatus === "publish") {
        const textToCheck = `${title || existingPost.title} ${
          description || existingPost.content || ""
        }`.trim();
        const sensitiveResult = await sensitiveWordService.checkSensitiveWords(
          textToCheck
        );

        if (sensitiveResult.hasSensitiveWords) {
          postStatus = "review_required";
          reviewStatus = "pending";
          sensitiveWords = JSON.stringify({
            words: sensitiveResult.matchedWords,
            categories: sensitiveResult.categories,
          });

          log("warn", "updatePost: Sensitive words detected", {
            postId,
            userId,
            matchedWords: sensitiveResult.matchedWords,
            categories: sensitiveResult.categories,
          });
        }
      }

      // 更新帖子
      const updatedPost = await PostService.update(postId, {
        title: title ? title.trim() : undefined,
        content: description ? description.trim() : undefined,
        images:
          images && Array.isArray(images) && images.length > 0
            ? JSON.stringify(images)
            : undefined,
        category,
        city_code: cityCode || undefined,
        status: postStatus as any,
        review_status: reviewStatus,
        sensitive_words: sensitiveWords,
        price: price || undefined,
      });

      let message = "更新成功";
      if (updatedPost.status === "pending") {
        message = "提交成功，等待审核";
      } else if (updatedPost.status === "draft") {
        message = "草稿已保存";
      }

      log("info", "updatePost: Success", {
        postId,
        status: updatedPost.status,
        userId,
      });

      res.json({
        code: 0,
        message,
        data: updatedPost,
      });
    } catch (error: any) {
      log("error", "updatePost: Error", {
        message: error.message,
        stack: error.stack,
        postId: req.params.id,
      });
      res.status(500).json({
        code: 1,
        message: "更新帖子失败，请稍后再试",
      });
    }
  }

  /**
   * 删除帖子
   * DELETE /api/posts/:id
   */
  static async deletePost(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          code: 401,
          message: "未登录",
        });
      }

      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({
          code: 1,
          message: "无效的帖子ID",
        });
      }

      const existingPost = await PostService.findById(postId);
      if (!existingPost) {
        return res.status(404).json({
          code: 1,
          message: "帖子不存在",
        });
      }

      if (existingPost.user_id !== userId) {
        return res.status(403).json({
          code: 1,
          message: "无权删除此帖子",
        });
      }

      await PostService.delete(postId);

      log("info", "deletePost: Success", { postId, userId });

      res.json({
        code: 0,
        message: "删除成功",
      });
    } catch (error: any) {
      log("error", "deletePost: Error", {
        message: error.message,
        stack: error.stack,
        postId: req.params.id,
      });
      res.status(500).json({
        code: 1,
        message: "删除帖子失败，请稍后再试",
      });
    }
  }

  /**
   * 优化帖子
   * POST /api/posts/:id/polish
   */
  static async polishPost(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          code: 401,
          message: "未登录",
        });
      }

      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({
          code: 1,
          message: "无效的帖子ID",
        });
      }

      const existingPost = await PostService.findById(postId);
      if (!existingPost) {
        return res.status(404).json({
          code: 1,
          message: "帖子不存在",
        });
      }

      if (existingPost.user_id !== userId) {
        return res.status(403).json({
          code: 1,
          message: "无权优化此帖子",
        });
      }

      const { title, description, contactInfo } = req.body;

      // 验证字段长度和格式
      if (title && title.trim().length > 100) {
        return res.status(400).json({
          code: 1,
          message: "标题长度不能超过100字符",
        });
      }

      if (description && description.trim().length > 2000) {
        return res.status(400).json({
          code: 1,
          message: "描述长度不能超过2000字符",
        });
      }

      // 优化帖子
      const updatedPost = await PostService.update(postId, {
        title: title ? title.trim() : undefined,
        content: description ? description.trim() : undefined,
        contact_info: contactInfo ? contactInfo.trim() : undefined,
        status: "pending",
      });

      log("info", "polishPost: Success", {
        postId,
        status: updatedPost.status,
        userId,
      });

      res.json({
        code: 0,
        message: "优化成功，等待审核",
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
        message: "优化帖子失败，请稍后再试",
      });
    }
  }

  /**
   * 获取置顶帖子
   * GET /api/posts/pinned?category=rent&city=melbourne&limit=10
   */
  static async getPinnedPosts(req: Request, res: Response) {
    log("info", "getPinnedPosts: Received request", { query: req.query });

    try {
      const { category, city, limit = "10" } = req.query;

      // ===== 新增：城市参数兼容处理 =====
      let cityCode: string | undefined = undefined;
      if (city) {
        const cityStr = String(city).trim();
        // 允许 city=sydney、city=悉尼、city=SYD
        const cityRow = await require("../lib/prisma").prisma.cities.findFirst({
          where: {
            OR: [
              { code: cityStr.toUpperCase() },
              { name: cityStr },
              { name: { contains: cityStr } },
            ],
          },
        });
        if (cityRow) {
          cityCode = cityRow.code;
        } else {
          cityCode = cityStr;
        }
      }
      // ===== END =====

      // 参数验证
      const limitNumber = parseInt(limit as string, 10);

      if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 50) {
        return res.status(400).json({
          code: 1,
          message: "每页数量必须是1-50之间的数字",
        });
      }

      if (category) {
        const validCategories = ["help", "rent", "used", "jobs", "recommend"];
        if (!validCategories.includes(category as string)) {
          return res.status(400).json({
            code: 1,
            message: "无效的分类",
          });
        }
      }

      const pinnedPosts = await PostService.getPinnedPosts({
        category: category as string,
        city: cityCode,
        limit: limitNumber,
      });

      log("info", "getPinnedPosts: Success", {
        count: pinnedPosts.length,
        filters: { category, city },
      });

      res.json({
        code: 0,
        message: "获取置顶帖子成功",
        data: {
          pinned_posts: pinnedPosts,
        },
      });
    } catch (error: any) {
      log("error", "getPinnedPosts: Error", {
        message: error.message,
        stack: error.stack,
        query: req.query,
      });
      res.status(500).json({
        code: 1,
        message: "获取置顶帖子失败，请稍后再试",
      });
    }
  }

  /**
   * 获取普通帖子
   * GET /api/posts/normal?category=rent&city=melbourne&page=1&limit=20
   */
  static async getNormalPosts(req: Request, res: Response) {
    log("info", "getNormalPosts: Received request", { query: req.query });

    try {
      const {
        category,
        city,
        keyword,
        page = "1",
        limit = "20",
        sort = "latest",
      } = req.query;

      // ===== 新增：城市参数兼容处理 =====
      let cityCode: string | undefined = undefined;
      if (city) {
        const cityStr = String(city).trim();
        // 允许 city=sydney、city=悉尼、city=SYD
        const cityRow = await require("../lib/prisma").prisma.cities.findFirst({
          where: {
            OR: [
              { code: cityStr.toUpperCase() },
              { name: cityStr },
              { name: { contains: cityStr } },
            ],
          },
        });
        if (cityRow) {
          cityCode = cityRow.code;
        } else {
          cityCode = cityStr;
        }
      }
      // ===== END =====

      // 参数验证
      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);

      if (isNaN(pageNumber) || pageNumber < 1) {
        return res.status(400).json({
          code: 1,
          message: "页码必须是大于0的数字",
        });
      }

      if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 50) {
        return res.status(400).json({
          code: 1,
          message: "每页数量必须是1-50之间的数字",
        });
      }

      if (category) {
        const validCategories = ["help", "rent", "used", "jobs", "recommend"];
        if (!validCategories.includes(category as string)) {
          return res.status(400).json({
            code: 1,
            message: "无效的分类",
          });
        }
      }

      if (sort && !["latest", "popular"].includes(sort as string)) {
        return res.status(400).json({
          code: 1,
          message: "无效的排序方式",
        });
      }

      const result = await PostService.getNormalPosts({
        category: category as string,
        city: cityCode,
        keyword: keyword as string,
        page: pageNumber,
        limit: limitNumber,
        sort: sort as "latest" | "popular",
      });

      log("info", "getNormalPosts: Success", {
        count: result.posts.length,
        total: result.pagination.totalPosts,
        page: pageNumber,
        filters: { category, city, keyword, sort },
      });

      res.json({
        code: 0,
        message: "获取普通帖子成功",
        data: result,
      });
    } catch (error: any) {
      log("error", "getNormalPosts: Error", {
        message: error.message,
        stack: error.stack,
        query: req.query,
      });
      res.status(500).json({
        code: 1,
        message: "获取普通帖子失败，请稍后再试",
      });
    }
  }

  /**
   * 获取帖子列表
   * GET /api/posts?category=rent&city=melbourne&page=1&limit=20
   */
  static async getPosts(req: Request, res: Response) {
    log("info", "getPosts: Received request", { query: req.query });

    try {
      const {
        category,
        city,
        keyword,
        page = "1",
        limit = "20",
        sort = "latest",
      } = req.query;

      // ===== 新增：城市参数兼容处理 =====
      let cityCode: string | undefined = undefined;
      if (city) {
        const cityStr = String(city).trim();
        // 允许 city=sydney、city=悉尼、city=SYD
        const cityRow = await require("../lib/prisma").prisma.cities.findFirst({
          where: {
            OR: [
              { code: cityStr.toUpperCase() },
              { name: cityStr },
              { name: { contains: cityStr } },
            ],
          },
        });
        if (cityRow) {
          cityCode = cityRow.code;
        } else {
          cityCode = cityStr;
        }
      }
      // ===== END =====

      // 参数验证
      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);

      if (isNaN(pageNumber) || pageNumber < 1) {
        return res.status(400).json({
          code: 1,
          message: "页码必须是大于0的数字",
        });
      }

      if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 50) {
        return res.status(400).json({
          code: 1,
          message: "每页数量必须是1-50之间的数字",
        });
      }

      if (category) {
        const validCategories = ["help", "rent", "used", "jobs"];
        if (!validCategories.includes(category as string)) {
          return res.status(400).json({
            code: 1,
            message: "无效的分类",
          });
        }
      }

      if (sort && !["latest", "popular"].includes(sort as string)) {
        return res.status(400).json({
          code: 1,
          message: "无效的排序方式",
        });
      }

      const result = await PostService.findWithFilters({
        category: category as string,
        city: cityCode,
        keyword: keyword as string,
        page: pageNumber,
        limit: limitNumber,
        sort: sort as "latest" | "popular",
      });

      log("info", "getPosts: Success", {
        count: result.posts.length,
        total: result.pagination.totalPosts,
        page: pageNumber,
        filters: { category, city, keyword, sort },
      });

      res.json({
        code: 0,
        message: "获取成功",
        data: result,
      });
    } catch (error: any) {
      log("error", "getPosts: Error", {
        message: error.message,
        stack: error.stack,
        query: req.query,
      });
      res.status(500).json({
        code: 1,
        message: "获取帖子列表失败，请稍后再试",
      });
    }
  }

  /**
   * 获取帖子详情
   * GET /api/posts/:id
   */
  static async getPostDetail(req: AuthenticatedRequest, res: Response) {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({
          code: 1,
          message: "无效的帖子ID",
        });
      }

      const post = await PostService.findById(postId);
      if (!post) {
        return res.status(404).json({
          code: 1,
          message: "帖子不存在",
        });
      }

      // 如果帖子不是已发布状态，检查权限
      if (post.status !== "published") {
        const userId = req.user?.id;
        if (!userId || post.user_id !== userId) {
          return res.status(403).json({
            code: 1,
            message: "无权查看此帖子",
          });
        }
      }

      // 增加浏览量
      await PostService.incrementViewCount(postId);

      log("info", "getPostDetail: Success", { postId });

      res.json({
        code: 0,
        message: "获取成功",
        data: post,
      });
    } catch (error: any) {
      log("error", "getPostDetail: Error", {
        message: error.message,
        stack: error.stack,
        postId: req.params.id,
      });
      res.status(500).json({
        code: 1,
        message: "获取帖子详情失败，请稍后再试",
      });
    }
  }

  /**
   * 重新提交帖子
   * POST /api/posts/:id/resubmit
   */
  static async resubmitPost(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          code: 401,
          message: "未登录",
        });
      }

      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({
          code: 1,
          message: "无效的帖子ID",
        });
      }

      const existingPost = await PostService.findById(postId);
      if (!existingPost) {
        return res.status(404).json({
          code: 1,
          message: "帖子不存在",
        });
      }

      if (existingPost.user_id !== userId) {
        return res.status(403).json({
          code: 1,
          message: "无权重新提交此帖子",
        });
      }

      if (existingPost.status !== "failed") {
        return res.status(400).json({
          code: 1,
          message: "只有审核失败的帖子才能重新提交",
        });
      }

      const { title, description } = req.body;

      // 验证字段长度和格式
      if (title && title.trim().length > 100) {
        return res.status(400).json({
          code: 1,
          message: "标题长度不能超过100字符",
        });
      }

      if (description && description.trim().length > 2000) {
        return res.status(400).json({
          code: 1,
          message: "描述长度不能超过2000字符",
        });
      }

      // 重新提交帖子
      const updatedPost = await PostService.update(postId, {
        title: title ? title.trim() : undefined,
        content: description ? description.trim() : undefined,
        status: "pending",
      });

      log("info", "resubmitPost: Success", {
        postId,
        status: updatedPost.status,
        userId,
      });

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
        message: "重新提交失败，请稍后再试",
      });
    }
  }

  /**
   * 收藏/取消收藏帖子
   * POST /api/posts/:id/favorite
   */
  static async toggleFavorite(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          code: 401,
          message: "未登录",
        });
      }

      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({
          code: 1,
          message: "无效的帖子ID",
        });
      }

      const post = await PostService.findById(postId);
      if (!post) {
        return res.status(404).json({
          code: 1,
          message: "帖子不存在",
        });
      }

      const isFavorited = await PostService.toggleFavorite(userId, postId);

      log("info", "toggleFavorite: Success", {
        postId,
        userId,
        isFavorited,
      });

      res.json({
        code: 0,
        message: isFavorited ? "收藏成功" : "取消收藏成功",
        data: { isFavorited },
      });
    } catch (error: any) {
      log("error", "toggleFavorite: Error", {
        message: error.message,
        stack: error.stack,
        postId: req.params.id,
      });
      res.status(500).json({
        code: 1,
        message: "操作失败，请稍后再试",
      });
    }
  }
}

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: Function
) => {
  log("error", "Global error handler", {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    code: 1,
    message: "服务器内部错误，请稍后再试",
  });
};

export const validateRequest = (
  req: Request,
  res: Response,
  next: Function
) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      code: 1,
      message: "请求体为空，请检查数据格式",
    });
  }
  next();
};

export const validatePagination = (
  req: Request,
  res: Response,
  next: Function
) => {
  const { page = "1", limit = "20" } = req.query;
  const pageNumber = parseInt(page as string, 10);
  const limitNumber = parseInt(limit as string, 10);

  if (isNaN(pageNumber) || pageNumber < 1) {
    return res.status(400).json({
      code: 1,
      message: "页码必须是大于0的数字",
    });
  }

  if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 50) {
    return res.status(400).json({
      code: 1,
      message: "每页数量必须是1-50之间的数字",
    });
  }

  next();
};
