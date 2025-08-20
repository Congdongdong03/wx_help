// src/services/adminPostService.ts
import { prisma } from "../lib/prisma";
import { posts_status } from "@prisma/client";

export interface AdminPostFilters {
  category?: string;
  keyword?: string;
  page: number;
  limit: number;
  status?: posts_status | "all";
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
}
