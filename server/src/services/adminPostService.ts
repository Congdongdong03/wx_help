// src/services/adminPostService.ts
import { prisma } from "../lib/prisma";
import { posts_status } from "@prisma/client";

export interface AdminPostFilters {
  category?: string;
  city?: string;
  keyword?: string;
  page: number;
  limit: number;
  status?: posts_status | "all";
  startDate?: string;
  endDate?: string;
  userId?: number;
}

export class AdminPostService {
  /**
   * 获取待审核帖子列表（包括普通待审核和敏感词审核）
   */
  static async getPendingPosts(filters: {
    category?: string;
    keyword?: string;
    page: number;
    limit: number;
    reviewType?: "all" | "normal" | "sensitive"; // 新增：审核类型过滤
  }) {
    const { category, keyword, page, limit, reviewType = "all" } = filters;
    const offset = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};

    // 根据审核类型设置状态条件
    if (reviewType === "normal") {
      where.status = "pending";
    } else if (reviewType === "sensitive") {
      where.status = "review_required";
      where.sensitive_words = { not: null };
    } else {
      // "all" - 包含所有需要审核的帖子
      where.OR = [
        { status: "pending" },
        {
          status: "review_required",
          sensitive_words: { not: null },
        },
      ];
    }

    if (category && category !== "all") {
      if (reviewType === "sensitive") {
        // 敏感词分类过滤
        where.sensitive_words = {
          contains: `"categories":["${category}"]`,
        };
      } else {
        where.category = category;
      }
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { content: { contains: keyword } },
        { users: { nickname: { contains: keyword } } },
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

    // 处理图片数据和敏感词信息
    const processedPosts = posts.map((post) => {
      let images = [];
      if (post.images) {
        try {
          images = Array.isArray(post.images)
            ? post.images
            : JSON.parse(post.images);
        } catch (e) {
          console.warn(`Failed to parse images for post ${post.id}`);
        }
      }

      // 处理敏感词信息
      let sensitiveWordsInfo = null;
      if (post.sensitive_words) {
        try {
          sensitiveWordsInfo = JSON.parse(post.sensitive_words);
        } catch (e) {
          console.warn(`Failed to parse sensitive words for post ${post.id}`);
        }
      }

      return {
        ...post,
        images,
        preview_image: images.length > 0 ? images[0] : null,
        author_nickname: post.users?.nickname,
        author_avatar: post.users?.avatar_url,
        sensitive_words_info: sensitiveWordsInfo,
        // 添加审核类型标识
        review_type:
          post.status === "review_required" && post.sensitive_words
            ? "sensitive"
            : "normal",
      };
    });

    return {
      posts: processedPosts,
      pagination: {
        current: page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 审核单个帖子
   */
  static async reviewPost(
    postId: number,
    action: "approve" | "reject",
    adminId?: number
  ) {
    return await prisma.$transaction(async (tx) => {
      // 检查帖子是否存在且为待审核状态
      const post = await tx.posts.findFirst({
        where: {
          id: postId,
          status: "pending",
        },
      });

      if (!post) {
        throw new Error("帖子不存在或不是待审核状态");
      }

      if (action === "approve") {
        // 更新帖子状态为已发布
        const updatedPost = await tx.posts.update({
          where: { id: postId },
          data: {
            status: "published",
            updated_at: new Date(),
          },
        });

        return { id: postId, status: "published" };
      } else {
        // 拒绝：更新帖子状态为审核失败
        await tx.posts.update({
          where: { id: postId },
          data: {
            status: "failed",
            updated_at: new Date(),
          },
        });

        return { id: postId, status: "failed" };
      }
    });
  }

  /**
   * 批量审核帖子
   */
  static async batchReviewPosts(
    postIds: number[],
    action: "approve" | "reject",
    adminId?: number
  ) {
    const results = [];
    let successCount = 0;

    for (const postId of postIds) {
      try {
        const result = await this.reviewPost(postId, action, adminId);
        results.push({
          id: postId,
          success: true,
          message: action === "approve" ? "审核通过" : "审核拒绝",
        });
        successCount++;
      } catch (error: any) {
        results.push({
          id: postId,
          success: false,
          message: error.message || "处理失败",
        });
      }
    }

    return {
      results,
      summary: {
        total: postIds.length,
        success: successCount,
        failed: postIds.length - successCount,
      },
    };
  }

  /**
   * 获取所有帖子（管理员视图）
   */
  static async getAllPosts(filters: AdminPostFilters) {
    const {
      status,
      category,
      city,
      keyword,
      page,
      limit,
      startDate,
      endDate,
      userId,
    } = filters;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (category && category !== "all") {
      where.category = category;
    }

    if (city && city !== "all") {
      where.city_code = city;
    }

    if (userId) {
      where.user_id = userId;
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { content: { contains: keyword } },
        { users: { nickname: { contains: keyword } } },
      ];
    }

    if (startDate) {
      where.created_at = { gte: new Date(startDate) };
    }

    if (endDate) {
      if (where.created_at) {
        where.created_at.lte = new Date(endDate);
      } else {
        where.created_at = { lte: new Date(endDate) };
      }
    }

    const [posts, total] = await Promise.all([
      prisma.posts.findMany({
        where,
        orderBy: { updated_at: "desc" },
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

    const processedPosts = posts.map((post) => {
      let images = [];
      if (post.images) {
        try {
          images = Array.isArray(post.images)
            ? post.images
            : JSON.parse(post.images);
        } catch (e) {
          console.warn(`Failed to parse images for post ${post.id}`);
        }
      }
      return {
        ...post,
        images,
        preview_image: images.length > 0 ? images[0] : null,
        author_nickname: post.users?.nickname,
        author_avatar: post.users?.avatar_url,
      };
    });

    return {
      posts: processedPosts,
      pagination: {
        current: page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 管理员删除帖子
   */
  static async deletePost(postId: number, adminId?: number) {
    return await prisma.$transaction(async (tx) => {
      // 检查帖子是否存在
      const post = await tx.posts.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new Error("帖子不存在");
      }

      // 删除帖子
      await tx.posts.delete({
        where: { id: postId },
      });

      return { success: true };
    });
  }

  /**
   * 批量删除帖子
   */
  static async batchDeletePosts(postIds: number[], adminId?: number) {
    const results = [];
    let successCount = 0;

    for (const postId of postIds) {
      try {
        const result = await this.deletePost(postId, adminId);
        results.push({
          id: postId,
          success: true,
          message: "删除成功",
        });
        successCount++;
      } catch (error: any) {
        results.push({
          id: postId,
          success: false,
          message: error.message || "删除失败",
        });
      }
    }

    return {
      results,
      summary: {
        total: postIds.length,
        success: successCount,
        failed: postIds.length - successCount,
      },
    };
  }

  /**
   * 获取审核统计数据
   */
  static async getReviewStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [statusStats, todayStats, categoryStats, trendStats] =
      await Promise.all([
        // 各状态帖子数量
        prisma.posts.groupBy({
          by: ["status"],
          _count: { status: true },
        }),

        // 今日数据
        prisma.posts.count({
          where: {
            created_at: { gte: today },
          },
        }),

        // 各分类帖子数量
        prisma.posts.groupBy({
          by: ["category"],
          _count: { category: true },
        }),

        // 最近7天趋势
        prisma.posts.groupBy({
          by: ["created_at"],
          where: {
            created_at: {
              gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
            },
          },
          _count: { created_at: true },
        }),
      ]);

    // 计算今日审核数据
    const approvedToday =
      statusStats.find((stat) => stat.status === "published")?._count.status ||
      0;
    const rejectedToday =
      statusStats.find((stat) => stat.status === "failed")?._count.status || 0;

    const stats = {
      status: statusStats.reduce((acc: any, item: any) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {}),
      today: {
        total_today: todayStats,
        approved_today: approvedToday,
        rejected_today: rejectedToday,
      },
      category: categoryStats.map((item) => ({
        category: item.category,
        count: item._count.category,
      })),
      trend: trendStats,
    };

    return stats;
  }

  /**
   * 获取目录图片（模拟实现）
   */
  static async getCatalogueImages(): Promise<string[]> {
    // 这里可以返回模拟图片数据，实际项目可替换为真实逻辑
    return [
      "/images/catalogue1.jpg",
      "/images/catalogue2.jpg",
      "/images/catalogue3.jpg",
    ];
  }
}
