// src/services/adminPostService.ts
import { prisma } from "../lib/prisma";

type PostStatus = "draft" | "pending" | "published" | "rejected" | "failed";

export interface AdminPostFilters {
  category?: string;
  keyword?: string;
  page: number;
  limit: number;
  status?: PostStatus | "all";
  reviewType?: "all" | "normal" | "sensitive";
  city?: string;
  startDate?: string;
  endDate?: string;
  userId?: number;
}

export class AdminPostService {
  /**
   * 获取待审核帖子列表
   */
  static async getPendingPosts(filters: AdminPostFilters) {
    const { category, keyword, page, limit, status = "pending" } = filters;
    const offset = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};
    if (status !== "all") {
      where.status = status;
    }
    if (category && category !== "all") {
      where.category = category;
    }
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { content: { contains: keyword } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.posts.findMany({
        where,
        orderBy: { created_at: "asc" },
        take: limit,
        skip: offset,
        include: {
          users: {
            select: {
              id: true,
              nickname: true,
              avatar_url: true,
            },
          },
        },
      }),
      prisma.posts.count({ where }),
    ]);

    return {
      posts: posts.map(this.processPost),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        total: total,
        limit,
      },
    };
  }

  /**
   * 审核帖子
   */
  static async reviewPost(
    postId: number,
    action: "approve" | "reject",
    adminId?: number,
    note?: string
  ) {
    const status = action === "approve" ? "published" : "rejected";

    const post = await prisma.posts.update({
      where: { id: postId },
      data: {
        status,
        review_note: note,
        updated_at: new Date(),
      },
      include: {
        users: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    return this.processPost(post);
  }

  /**
   * 批量审核帖子
   */
  static async batchReviewPosts(
    postIds: number[],
    action: "approve" | "reject"
  ) {
    const status = action === "approve" ? "published" : "rejected";

    await prisma.posts.updateMany({
      where: { id: { in: postIds } },
      data: {
        status,
        updated_at: new Date(),
      },
    });

    return { success: true, count: postIds.length };
  }

  /**
   * 获取审核统计
   */
  static async getReviewStats() {
    const [pending, approved, rejected] = await Promise.all([
      prisma.posts.count({ where: { status: "pending" } }),
      prisma.posts.count({ where: { status: "published" } }),
      prisma.posts.count({ where: { status: "rejected" } }),
    ]);

    return {
      pending,
      approved,
      rejected,
      total: pending + approved + rejected,
    };
  }

  /**
   * 处理帖子数据
   */
  private static processPost(post: any): any {
    return {
      ...post,
      images: post.images ? JSON.parse(post.images) : [],
      sensitive_words: post.sensitive_words
        ? JSON.parse(post.sensitive_words)
        : null,
      created_at: post.created_at?.toISOString(),
      updated_at: post.updated_at?.toISOString(),
    };
  }

  /**
   * 获取所有帖子
   */
  static async getAllPosts(filters: AdminPostFilters) {
    const {
      category,
      keyword,
      page,
      limit,
      status = "all",
      reviewType = "all",
      city,
    } = filters;
    const offset = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};
    if (status !== "all") {
      where.status = status;
    }
    if (category && category !== "all") {
      where.category = category;
    }
    if (city && city !== "all") {
      where.city_code = city;
    }
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { content: { contains: keyword } },
      ];
    }
    if (reviewType === "sensitive") {
      where.NOT = { sensitive_words: null };
    } else if (reviewType === "normal") {
      where.sensitive_words = null;
    }

    const [posts, total] = await Promise.all([
      prisma.posts.findMany({
        where,
        orderBy: { created_at: "desc" },
        take: limit,
        skip: offset,
        include: {
          users: {
            select: {
              id: true,
              nickname: true,
              avatar_url: true,
            },
          },
        },
      }),
      prisma.posts.count({ where }),
    ]);

    return {
      posts: posts.map(this.processPost),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        total: total,
        limit,
      },
    };
  }

  /**
   * 删除帖子
   */
  static async deletePost(postId: number, adminId: number) {
    try {
      await prisma.posts.delete({
        where: { id: postId },
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 批量删除帖子
   */
  static async batchDeletePosts(postIds: number[], adminId: number) {
    try {
      await prisma.posts.deleteMany({
        where: { id: { in: postIds } },
      });
      return {
        success: true,
        count: postIds.length,
        summary: {
          success: postIds.length,
          failed: 0,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        count: 0,
        summary: {
          success: 0,
          failed: postIds.length,
        },
        error: error.message,
      };
    }
  }

  /**
   * 批量审核帖子（带管理员ID）
   */
  static async batchReviewPostsWithAdmin(
    postIds: number[],
    action: "approve" | "reject",
    adminId: number
  ) {
    const status = action === "approve" ? "published" : "rejected";

    try {
      await prisma.posts.updateMany({
        where: { id: { in: postIds } },
        data: {
          status,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        count: postIds.length,
        summary: {
          success: postIds.length,
          failed: 0,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        count: 0,
        summary: {
          success: 0,
          failed: postIds.length,
        },
        error: error.message,
      };
    }
  }

  /**
   * 获取目录图片
   */
  static async getCatalogueImages() {
    try {
      const images = await prisma.catalogue_images.findMany({
        orderBy: { created_at: "desc" },
      });
      return images;
    } catch (error) {
      console.error("获取目录图片失败:", error);
      return [];
    }
  }
}
