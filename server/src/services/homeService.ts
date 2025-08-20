// src/services/homeService.ts
import { prisma } from "../lib/prisma";

export class HomeService {
  /**
   * 获取所有活跃城市
   */
  static async getAllCities() {
    return await prisma.cities.findMany({
      where: { is_active: true },
      select: {
        name: true,
        code: true,
        is_hot: true,
      },
      orderBy: [{ is_hot: "desc" }, { sort_order: "asc" }, { name: "asc" }],
    });
  }

  /**
   * 获取置顶帖子
   */
  static async getPinnedPosts() {
    const posts = await prisma.posts.findMany({
      where: {
        is_pinned: true,
        status: "published",
      },
      select: {
        id: true,
        title: true,
        city_code: true,
        category: true,
        price: true,
        images: true,
        users: {
          select: {
            nickname: true,
            avatar_url: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
    return posts.map(this.processPostImages);
  }

  /**
   * 根据城市获取普通帖子
   */
  static async getNormalPostsByCity(city: string) {
    const posts = await prisma.posts.findMany({
      where: {
        is_pinned: false,
        status: "published",
        OR: [{ city_code: city }, { city_code: "通用" }],
      },
      select: {
        id: true,
        title: true,
        city_code: true,
        category: true,
        price: true,
        images: true,
        users: {
          select: {
            nickname: true,
            avatar_url: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
    return posts.map(this.processPostImages);
  }

  /**
   * 根据城市和分类获取帖子
   */
  static async getPostsByCityAndCategory(city: string, category: string) {
    const posts = await prisma.posts.findMany({
      where: {
        status: "published",
        category: category,
        OR: [{ city_code: city }, { city_code: "通用" }],
      },
      select: {
        id: true,
        title: true,
        city_code: true,
        category: true,
        price: true,
        images: true,
        users: {
          select: {
            nickname: true,
            avatar_url: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
    return posts.map(this.processPostImages);
  }

  /**
   * 处理帖子图片数据
   */
  private static processPostImages(post: any) {
    return {
      ...post,
      images: (() => {
        if (!post.images) return [];
        if (Array.isArray(post.images)) return post.images;
        try {
          return JSON.parse(post.images);
        } catch {
          return [];
        }
      })(),
    };
  }
}
