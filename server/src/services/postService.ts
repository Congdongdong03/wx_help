// src/services/postService.ts
import { prisma } from "../lib/prisma";

// Prisma schema 中 posts.status 是 String 字段，使用字符串联合类型更合适
type PostStatus = "draft" | "pending" | "published" | "rejected" | "failed";

export interface PostFilters {
  category?: string;
  city?: string;
  keyword?: string;
  page: number;
  limit: number;
  status?: PostStatus;
  sort?: "latest" | "popular";
}

export interface PostCreateInput {
  user_id: number;
  title: string;
  content?: string;
  images?: string;
  category?: string;
  sub_category?: string;
  city_code?: string;
  status: PostStatus;
  price?: string;
  review_status?: string;
  contact_info?: string;
  sensitive_words?: string | null;
}

export interface PostsResult {
  posts: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalPosts: number;
    limit: number;
  };
}

export class PostService {
  /**
   * 获取帖子列表
   */
  static async getPosts(filters: PostFilters): Promise<PostsResult> {
    const {
      category,
      city,
      keyword,
      page,
      limit,
      status = "published",
    } = filters;
    const offset = (page - 1) * limit;

    // 构建查询条件
    const where: any = { status };
    if (category) where.category = category;
    if (city) where.city_code = city;
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { content: { contains: keyword } },
      ];
    }

    // 获取帖子和总数
    const [posts, totalPosts] = await Promise.all([
      prisma.posts.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: offset,
        take: limit,
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

    const totalPages = Math.ceil(totalPosts / limit);

    return {
      posts: posts.map(this.processPost),
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        limit,
      },
    };
  }

  /**
   * 创建帖子
   */
  static async createPost(input: PostCreateInput): Promise<any> {
    const post = await prisma.posts.create({
      data: {
        user_id: input.user_id,
        title: input.title,
        content: input.content,
        images: input.images,
        category: input.category,
        sub_category: input.sub_category,
        city_code: input.city_code,
        status: input.status,
        price: input.price,
      },
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

    return this.processPost(post);
  }

  /**
   * 更新帖子
   */
  static async updatePost(
    id: number,
    input: Partial<PostCreateInput>
  ): Promise<any> {
    const post = await prisma.posts.update({
      where: { id },
      data: input,
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

    return this.processPost(post);
  }

  /**
   * 删除帖子
   */
  static async deletePost(id: number): Promise<boolean> {
    try {
      await prisma.posts.delete({ where: { id } });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取帖子详情
   */
  static async getPostById(id: number): Promise<any | null> {
    const post = await prisma.posts.findUnique({
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

    if (!post) return null;
    return this.processPost(post);
  }

  /**
   * 处理帖子数据
   */
  private static processPost(post: any): any {
    return {
      ...post,
      images: post.images ? JSON.parse(post.images) : [],
      created_at: post.created_at?.toISOString(),
      updated_at: post.updated_at?.toISOString(),
    };
  }

  static async findByUserIdWithFilters(
    userId: number,
    filters: any
  ): Promise<PostsResult> {
    const { page = 1, limit = 10, status = "published" } = filters;
    const offset = (page - 1) * limit;

    const where: any = { user_id: userId, status };

    const [posts, totalPosts] = await Promise.all([
      prisma.posts.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: offset,
        take: limit,
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

    const totalPages = Math.ceil(totalPosts / limit);

    return {
      posts: posts.map(this.processPost),
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        limit,
      },
    };
  }

  static async incrementViewCount(id: number): Promise<void> {
    await prisma.posts.update({
      where: { id },
      data: {
        view_count: {
          increment: 1,
        },
      },
    });
  }

  static async toggleFavorite(
    userId: number,
    postId: number
  ): Promise<boolean> {
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        user_id: userId,
        post_id: postId,
      },
    });

    if (existingFavorite) {
      // 如果已收藏，则取消收藏
      await prisma.$transaction([
        prisma.favorite.delete({ where: { id: existingFavorite.id } }),
        prisma.posts.update({
          where: { id: postId },
          data: { favorite_count: { decrement: 1 } },
        }),
      ]);
      return false;
    } else {
      // 如果未收藏，则添加收藏
      await prisma.$transaction([
        prisma.favorite.create({
          data: { user_id: userId, post_id: postId },
        }),
        prisma.posts.update({
          where: { id: postId },
          data: { favorite_count: { increment: 1 } },
        }),
      ]);
      return true;
    }
  }

  // 重载 getPinnedPosts 方法以支持参数对象
  static async getPinnedPosts(
    params?: { category?: string; city?: string; limit?: number } | number
  ): Promise<any[]> {
    if (typeof params === "number") {
      return this.getPinnedPosts({ limit: params });
    }

    const { category, city, limit = 5 } = params || {};

    const where: any = {
      status: "published",
      is_pinned: true,
    };

    if (category) where.category = category;
    if (city) where.city_code = city;

    const posts = await prisma.posts.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: limit,
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

    return posts.map(this.processPost);
  }
}
