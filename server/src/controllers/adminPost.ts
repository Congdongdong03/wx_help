// src/controllers/adminPost.ts
import { Request, Response } from "express";
import { prisma } from "../lib/prisma"; // 添加这行
import { AdminPostService } from "../services/adminPostService";

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
   * 获取待审核帖子列表
   * GET /api/admin/posts/pending?page=1&limit=20&category=rent&keyword=搜索词
   */
  static async getPendingPosts(req: Request, res: Response) {
    log("info", "getPendingPosts: Received request", { query: req.query });

    try {
      const { page = "1", limit = "20", category, keyword } = req.query;

      // 参数验证
      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);

      if (isNaN(pageNumber) || pageNumber < 1) {
        return res.status(400).json({
          code: 1,
          error: "页码必须是大于0的数字",
        });
      }

      if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
        return res.status(400).json({
          code: 1,
          error: "每页数量必须是1-100之间的数字",
        });
      }

      const result = await AdminPostService.getPendingPosts({
        category: category as string,
        keyword: keyword as string,
        page: pageNumber,
        limit: limitNumber,
      });

      log("info", "getPendingPosts: Success", {
        count: result.posts.length,
        total: result.pagination.total,
        page: pageNumber,
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
        error: "获取待审核帖子失败",
      });
    }
  }

  /**
   * 审核单个帖子
   * POST /api/admin/posts/:id/review
   */
  static async reviewPost(req: Request, res: Response) {
    log("info", "reviewPost: Received request", {
      postId: req.params.id,
      body: req.body,
    });

    try {
      const { id } = req.params;
      const { action, reason, adminId } = req.body;
      const postId = parseInt(id, 10);

      if (isNaN(postId)) {
        return res.status(400).json({
          code: 1,
          error: "无效的帖子ID",
        });
      }

      if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({
          code: 1,
          error: "无效的操作类型",
        });
      }

      const result = await AdminPostService.reviewPost(postId, action, adminId);

      log("info", "reviewPost: Success", { postId, action, adminId });

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
        error: error.message || "审核操作失败",
      });
    }
  }

  /**
   * 批量审核帖子
   * POST /api/admin/posts/batch-review
   */
  static async batchReviewPosts(req: Request, res: Response) {
    log("info", "batchReviewPosts: Received request", { body: req.body });

    try {
      const { postIds, action, reason, adminId } = req.body;

      if (!Array.isArray(postIds) || postIds.length === 0) {
        return res.status(400).json({
          code: 1,
          error: "请选择要操作的帖子",
        });
      }

      if (postIds.length > 50) {
        return res.status(400).json({
          code: 1,
          error: "单次批量操作不能超过50个帖子",
        });
      }

      if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({
          code: 1,
          error: "无效的操作类型",
        });
      }

      const result = await AdminPostService.batchReviewPosts(
        postIds,
        action,
        adminId
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
        error: "批量操作失败",
      });
    }
  }

  /**
   * 获取所有帖子（管理员视图）
   * GET /api/admin/posts?status=published&page=1&limit=20
   */
  static async getAllPosts(req: Request, res: Response) {
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
          error: "页码必须是大于0的数字",
        });
      }

      if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
        return res.status(400).json({
          code: 1,
          error: "每页数量必须是1-100之间的数字",
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
        error: "获取帖子列表失败",
      });
    }
  }

  /**
   * 管理员删除帖子
   * DELETE /api/admin/posts/:id
   */
  static async deletePost(req: Request, res: Response) {
    log("info", "deletePost: Received request", { postId: req.params.id });

    try {
      const postId = parseInt(req.params.id);
      const { reason, adminId } = req.body;

      if (isNaN(postId)) {
        return res.status(400).json({
          code: 1,
          error: "无效的帖子ID",
        });
      }

      await AdminPostService.deletePost(postId, adminId);

      log("info", "deletePost: Success", { postId, adminId });

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
        error: error.message || "删除失败",
      });
    }
  }

  /**
   * 获取审核统计数据
   * GET /api/admin/posts/stats
   */
  static async getReviewStats(req: Request, res: Response) {
    log("info", "getReviewStats: Received request");

    try {
      const stats = await AdminPostService.getReviewStats();

      log("info", "getReviewStats: Success");

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
        error: "获取统计数据失败",
      });
    }
  }

  /**
   * 获取目录图片
   * GET /api/admin/catalogue-images?postId=1
   */
  static async getCatalogueImages(req: Request, res: Response) {
    log("info", "getCatalogueImages: Received request", { query: req.query });

    try {
      const { postId } = req.query;

      // 验证postId是否为置顶帖子
      if (postId) {
        const post = await prisma.posts.findUnique({
          where: { id: parseInt(postId as string) },
          select: { is_pinned: true },
        });

        if (!post || !post.is_pinned) {
          return res.json({
            code: 1,
            message: "该帖子不是目录帖子",
            data: [],
          });
        }
      }

      // 获取最新的目录图片，按商店和页码排序
      const images = await prisma.catalogue_images.findMany({
        orderBy: [
          { store_name: "asc" }, // coles在前，woolworths在后
          { page_number: "asc" }, // 页码从小到大
        ],
        select: {
          id: true,
          store_name: true,
          page_number: true,
          image_data: true,
          week_date: true,
        },
      });

      log("info", "getCatalogueImages: Success", {
        count: images.length,
        postId,
      });

      // 只返回图片数据数组，按顺序排列
      const imageDataArray = images.map((img) => img.image_data);

      res.json({
        code: 0,
        message: "获取目录图片成功",
        data: imageDataArray,
        meta: {
          total: images.length,
          stores: [...new Set(images.map((img) => img.store_name))],
          lastUpdate: images.length > 0 ? images[0].week_date : null,
        },
      });
    } catch (error: any) {
      log("error", "getCatalogueImages: Error", {
        message: error.message,
        stack: error.stack,
        query: req.query,
      });
      res.status(500).json({
        code: 1,
        error: "获取目录图片失败",
        message: error.message,
        data: [],
      });
    }
  }
}
