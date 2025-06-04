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
   * 获取待审核帖子列表
   */
  static async getPendingPosts(filters: {
    category?: string;
    keyword?: string;
    page: number;
    limit: number;
  }) {
    const { category, keyword, page, limit } = filters;
    const offset = (page - 1) * limit;

    const where: any = { status: "pending" };

    if (category && category !== "all") {
      where.category = category;
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

    // 处理图片数据
    const processedPosts = posts.map((post) => {
      let images = [];
      if (post.images) {
        try {
          images = JSON.parse(post.images);
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
        // 1. 更新帖子状态为已发布
        const updatedPost = await tx.posts.update({
          where: { id: postId },
          data: {
            status: "published",
            updated_at: new Date(),
          },
        });

        // 2. 处理图片URL
        let imageUrl = null;
        if (post.images) {
          try {
            const imagesArray = JSON.parse(post.images);
            if (Array.isArray(imagesArray) && imagesArray.length > 0) {
              imageUrl = imagesArray[0];
            }
          } catch (e) {
            console.warn(`Failed to parse images for post ${postId}`);
          }
        }

        // 3. 添加到推荐表
        await tx.recommendations.upsert({
          where: { post_id: postId },
          update: {
            title: post.title,
            description: post.content || post.title,
            category: post.category || "help",
            city: post.city || "通用",
            image_url: imageUrl,
            is_active: true,
            updated_at: new Date(),
          },
          create: {
            post_id: postId,
            title: post.title,
            description: post.content || post.title,
            category: post.category || "help",
            city: post.city || "通用",
            image_url: imageUrl,
            is_active: true,
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

        // 如果之前在推荐中，标记为不活跃
        await tx.recommendations.updateMany({
          where: { post_id: postId },
          data: {
            is_active: false,
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
      where.city = city;
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
          recommendations: {
            select: {
              is_pinned: true,
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
          images = JSON.parse(post.images);
        } catch (e) {
          // 忽略解析错误
        }
      }
      return {
        ...post,
        images,
        preview_image: images.length > 0 ? images[0] : null,
        is_pinned: post.recommendations?.is_pinned || false,
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

      // 删除推荐记录
      await tx.recommendations.deleteMany({
        where: { post_id: postId },
      });

      // 删除帖子
      await tx.posts.delete({
        where: { id: postId },
      });

      return { success: true };
    });
  }

  /**
   * 获取审核统计数据
   */
  static async getReviewStats() {
    const [statusStats, todayStats, categoryStats] = await Promise.all([
      // 各状态帖子数量
      prisma.posts.groupBy({
        by: ["status"],
        _count: { status: true },
      }),

      // 今日审核数量
      prisma.posts.aggregate({
        where: {
          updated_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
          status: { in: ["published", "failed"] },
        },
        _count: {
          _all: true,
        },
      }),

      // 分类统计（已发布的）
      prisma.posts.groupBy({
        by: ["category"],
        where: { status: "published" },
        _count: { category: true },
      }),
    ]);

    // 获取今日详细统计
    const [approvedToday, rejectedToday] = await Promise.all([
      prisma.posts.count({
        where: {
          status: "published",
          updated_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.posts.count({
        where: {
          status: "failed",
          updated_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
    ]);

    // 获取最近7天趋势
    const trendStats = await prisma.$queryRaw`
      SELECT 
        DATE(updated_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as rejected
      FROM posts
      WHERE updated_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      AND status IN ('published', 'failed')
      GROUP BY DATE(updated_at)
      ORDER BY date DESC
    `;

    const stats = {
      status: statusStats.reduce((acc: any, item: any) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {}),
      today: {
        total_today: todayStats._count._all,
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
}
