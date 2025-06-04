// src/services/postService.ts
import { prisma } from "../lib/prisma";
import { posts_status, posts } from "@prisma/client";

export interface PostFilters {
  category?: string;
  city?: string;
  keyword?: string;
  page: number;
  limit: number;
  status?: posts_status;
}

export interface PostCreateInput {
  user_id: number;
  title: string;
  content?: string;
  wechat_id: string;
  images?: string;
  category?: string;
  city?: string;
  status: posts_status;
}

export interface PostsResult {
  posts: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalPosts: number;
    limit: number;
  };
  stats: {
    draftCount: number;
    pendingCount: number;
    publishedCount: number;
    failedCount: number;
    totalCount: number;
  };
}

export class PostService {
  /**
   * 根据筛选条件获取帖子列表
   */
  static async findWithFilters(filters: PostFilters): Promise<PostsResult> {
    const {
      category,
      city,
      keyword,
      page,
      limit,
      status = "published",
    } = filters;
    const offset = (page - 1) * limit;

    // 构建 where 条件
    const where: any = {
      status,
    };

    if (category) {
      where.category = category;
    }

    if (city) {
      where.city = city;
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { content: { contains: keyword } },
      ];
    }

    // 并行查询
    const [posts, totalPosts, stats] = await Promise.all([
      // 获取帖子列表
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

      // 获取总数
      prisma.posts.count({ where }),

      // 获取统计信息
      prisma.posts.groupBy({
        by: ["status"],
        _count: {
          status: true,
        },
      }),
    ]);

    const statsMap = stats.reduce((acc, item) => {
      if (item.status) {
        // 添加 null 检查
        acc[item.status] = item._count.status;
      }
      return acc;
    }, {} as Record<string, number>);

    const totalPages = Math.ceil(totalPosts / limit);

    return {
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        limit,
      },
      stats: {
        draftCount: statsMap.draft || 0,
        pendingCount: statsMap.pending || 0,
        publishedCount: statsMap.published || 0,
        failedCount: statsMap.failed || 0,
        totalCount: totalPosts,
      },
    };
  }

  /**
   * 根据用户ID获取帖子
   */
  static async findByUserIdWithFilters(
    userId: number,
    options: {
      status?: posts_status;
      page: number;
      limit: number;
    }
  ): Promise<PostsResult> {
    const { status, page, limit } = options;
    const offset = (page - 1) * limit;

    const where: any = { user_id: userId };
    if (status) {
      where.status = status;
    }

    const [posts, totalPosts, userStats] = await Promise.all([
      prisma.posts.findMany({
        where,
        orderBy: { created_at: "desc" },
        take: limit,
        skip: offset,
      }),

      prisma.posts.count({ where }),

      prisma.posts.groupBy({
        by: ["status"],
        where: { user_id: userId },
        _count: { status: true },
      }),
    ]);

    const statsMap = userStats.reduce((acc, item) => {
      if (item.status) {
        // 添加 null 检查
        acc[item.status] = item._count.status;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        limit,
      },
      stats: {
        draftCount: statsMap.draft || 0,
        pendingCount: statsMap.pending || 0,
        publishedCount: statsMap.published || 0,
        failedCount: statsMap.failed || 0,
        totalCount: totalPosts,
      },
    };
  }

  /**
   * 创建帖子
   */
  static async create(data: PostCreateInput): Promise<posts> {
    return await prisma.posts.create({
      data: {
        ...data,
      },
    });
  }

  /**
   * 根据ID查找帖子
   */
  static async findById(id: number): Promise<posts | null> {
    return await prisma.posts.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            nickname: true,
            avatar_url: true,
          },
        },
      },
    });
  }

  /**
   * 更新帖子
   */
  static async update(id: number, data: Partial<posts>): Promise<posts> {
    return await prisma.posts.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  }

  /**
   * 删除帖子
   */
  static async delete(id: number): Promise<boolean> {
    try {
      await prisma.posts.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }
}
