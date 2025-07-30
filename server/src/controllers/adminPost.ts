// src/controllers/adminPost.ts
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AdminPostService } from "../services/adminPostService";
import { AuthenticatedRequest } from "../middleware/auth";

// 统一的日志函数
const log = (
  level: "info" | "error" | "warn" | "debug",
  message: string,
  data?: any
) => {
  const timestamp = new Date().toISOString();
  console[level](
    `[${timestamp}] [AdminPostController] ${message}`,
    data !== undefined ? JSON.stringify(data) : ""
  );
};

export class AdminPostController {
  /**
   * 获取待审核帖子列表（包括普通待审核和敏感词审核）
   * GET /api/admin/posts/pending?page=1&limit=20&category=rent&keyword=搜索词&reviewType=all
   */
  static async getPendingPosts(req: AuthenticatedRequest, res: Response) {
    log("info", "getPendingPosts: Received request", { query: req.query });

    try {
      const {
        page = "1",
        limit = "20",
        category,
        keyword,
        reviewType = "all",
      } = req.query;

      // 参数验证
      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);

      if (isNaN(pageNumber) || pageNumber < 1) {
        return res.status(400).json({
          code: 1,
          message: "页码必须是大于0的数字",
        });
      }

      if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
        return res.status(400).json({
          code: 1,
          message: "每页数量必须是1-100之间的数字",
        });
      }

      // 验证审核类型参数
      if (!["all", "normal", "sensitive"].includes(reviewType as string)) {
        return res.status(400).json({
          code: 1,
          message: "无效的审核类型，必须是 all、normal 或 sensitive",
        });
      }

      const result = await AdminPostService.getPendingPosts({
        category: category as string,
        keyword: keyword as string,
        page: pageNumber,
        limit: limitNumber,
        reviewType: reviewType as "all" | "normal" | "sensitive",
      });

      log("info", "getPendingPosts: Success", {
        count: result.posts.length,
        total: result.pagination.total,
        page: pageNumber,
        reviewType,
      });

      res.json({
        code: 0,
        message: "获取成功",
        data: result,
      });
    } catch (error: any) {
      log("error", "getPendingPosts: Error", {
        message: error.message,
        stack: error.stack,
        query: req.query,
      });
      res.status(500).json({
        code: 1,
        message: "获取待审核帖子失败",
      });
    }
  }

  /**
   * 审核单个帖子
   * POST /api/admin/posts/:id/review
   */
  static async reviewPost(req: AuthenticatedRequest, res: Response) {
    log("info", "reviewPost: Received request", {
      postId: req.params.id,
      body: req.body,
    });

    try {
      const { id } = req.params;
      const { action, reason } = req.body;
      const postId = parseInt(id, 10);

      if (isNaN(postId)) {
        return res.status(400).json({
          code: 1,
          message: "无效的帖子ID",
        });
      }

      if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({
          code: 1,
          message: "无效的操作类型",
        });
      }

      const result = await AdminPostService.reviewPost(
        postId,
        action,
        req.user!.id
      );

      log("info", "reviewPost: Success", {
        postId,
        action,
        adminId: req.user!.id,
      });

      const message =
        action === "approve" ? "审核通过，已加入推荐" : "审核拒绝";

      res.json({
        code: 0,
        message,
        data: result,
      });
    } catch (error: any) {
      log("error", "reviewPost: Error", {
        message: error.message,
        stack: error.stack,
        postId: req.params.id,
        action: req.body.action,
      });
      res.status(500).json({
        code: 1,
        message: error.message || "审核操作失败",
      });
    }
  }

  /**
   * 批量审核帖子
   * POST /api/admin/posts/batch-review
   */
  static async batchReviewPosts(req: AuthenticatedRequest, res: Response) {
    log("info", "batchReviewPosts: Received request", { body: req.body });

    try {
      const { postIds, action, reason } = req.body;

      if (!Array.isArray(postIds) || postIds.length === 0) {
        return res.status(400).json({
          code: 1,
          message: "请选择要操作的帖子",
        });
      }

      if (postIds.length > 50) {
        return res.status(400).json({
          code: 1,
          message: "单次批量操作不能超过50个帖子",
        });
      }

      if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({
          code: 1,
          message: "无效的操作类型",
        });
      }

      const result = await AdminPostService.batchReviewPosts(
        postIds,
        action,
        req.user!.id
      );

      log("info", "batchReviewPosts: Completed", {
        total: postIds.length,
        success: result.summary.success,
        action,
      });

      res.json({
        code: 0,
        message: `批量操作完成，成功处理 ${result.summary.success}/${postIds.length} 个帖子`,
        data: result,
      });
    } catch (error: any) {
      log("error", "batchReviewPosts: Error", {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        code: 1,
        message: "批量操作失败",
      });
    }
  }

  /**
   * 批量删除帖子
   * DELETE /api/admin/posts/batch-delete
   */
  static async batchDeletePosts(req: AuthenticatedRequest, res: Response) {
    log("info", "batchDeletePosts: Received request", { body: req.body });

    try {
      const { postIds } = req.body;

      if (!Array.isArray(postIds) || postIds.length === 0) {
        return res.status(400).json({
          code: 1,
          message: "请选择要删除的帖子",
        });
      }

      if (postIds.length > 50) {
        return res.status(400).json({
          code: 1,
          message: "单次批量删除不能超过50个帖子",
        });
      }

      const result = await AdminPostService.batchDeletePosts(
        postIds,
        req.user!.id
      );

      log("info", "batchDeletePosts: Completed", {
        total: postIds.length,
        success: result.summary.success,
      });

      res.json({
        code: 0,
        message: `批量删除完成，成功删除 ${result.summary.success}/${postIds.length} 个帖子`,
        data: result,
      });
    } catch (error: any) {
      log("error", "batchDeletePosts: Error", {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        code: 1,
        message: "批量删除失败",
      });
    }
  }

  /**
   * 获取所有帖子（管理员视图）
   * GET /api/admin/posts?status=published&page=1&limit=20
   */
  static async getAllPosts(req: AuthenticatedRequest, res: Response) {
    log("info", "getAllPosts: Received request", { query: req.query });

    try {
      const {
        status,
        category,
        city,
        keyword,
        page = "1",
        limit = "20",
        startDate,
        endDate,
        userId,
      } = req.query;

      // 参数验证
      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);

      if (isNaN(pageNumber) || pageNumber < 1) {
        return res.status(400).json({
          code: 1,
          message: "页码必须是大于0的数字",
        });
      }

      if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
        return res.status(400).json({
          code: 1,
          message: "每页数量必须是1-100之间的数字",
        });
      }

      const result = await AdminPostService.getAllPosts({
        status: status as any,
        category: category as string,
        city: city as string,
        keyword: keyword as string,
        page: pageNumber,
        limit: limitNumber,
        startDate: startDate as string,
        endDate: endDate as string,
        userId: userId ? parseInt(userId as string) : undefined,
      });

      log("info", "getAllPosts: Success", {
        count: result.posts.length,
        total: result.pagination.total,
        page: pageNumber,
        filters: { status, category, city, keyword },
      });

      res.json({
        code: 0,
        message: "获取成功",
        data: result,
      });
    } catch (error: any) {
      log("error", "getAllPosts: Error", {
        message: error.message,
        stack: error.stack,
        query: req.query,
      });
      res.status(500).json({
        code: 1,
        message: "获取帖子列表失败",
      });
    }
  }

  /**
   * 管理员删除帖子
   * DELETE /api/admin/posts/:id
   */
  static async deletePost(req: AuthenticatedRequest, res: Response) {
    log("info", "deletePost: Received request", {
      postId: req.params.id,
    });

    try {
      const { id } = req.params;
      const postId = parseInt(id, 10);

      if (isNaN(postId)) {
        return res.status(400).json({
          code: 1,
          message: "无效的帖子ID",
        });
      }

      await AdminPostService.deletePost(postId, req.user!.id);

      log("info", "deletePost: Success", { postId, adminId: req.user!.id });

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
        message: "删除帖子失败",
      });
    }
  }

  /**
   * 获取审核统计数据
   * GET /api/admin/posts/stats
   */
  static async getReviewStats(req: AuthenticatedRequest, res: Response) {
    log("info", "getReviewStats: Received request");

    try {
      const stats = await AdminPostService.getReviewStats();

      log("info", "getReviewStats: Success", { stats });

      res.json({
        code: 0,
        message: "获取成功",
        data: stats,
      });
    } catch (error: any) {
      log("error", "getReviewStats: Error", {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        code: 1,
        message: "获取统计数据失败",
      });
    }
  }

  /**
   * 获取目录图片
   * GET /api/admin/catalogue-images
   */
  static async getCatalogueImages(req: AuthenticatedRequest, res: Response) {
    log("info", "getCatalogueImages: Received request");

    try {
      const images = await AdminPostService.getCatalogueImages();

      log("info", "getCatalogueImages: Success", { count: images.length });

      res.json({
        code: 0,
        message: "获取成功",
        data: images,
      });
    } catch (error: any) {
      log("error", "getCatalogueImages: Error", {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        code: 1,
        message: "获取目录图片失败",
      });
    }
  }
}
