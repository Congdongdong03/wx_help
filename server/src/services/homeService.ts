// src/services/homeService.ts
import { prisma } from "../lib/prisma";

export class HomeService {
  /**
   * 获取所有活跃城市
   */
  static async getAllCities() {
    return await prisma.cities.findMany({
      where: {
        is_active: true,
      },
      select: {
        name: true,
        code: true,
        is_hot: true,
      },
      orderBy: [
        { is_hot: "desc" }, // 热门城市排在前面
        { sort_order: "asc" },
        { name: "asc" },
      ],
    });
  }

  /**
   * 获取置顶推荐（全局，不受城市限制）
   */
  static async getPinnedRecommendations() {
    return await prisma.recommendations.findMany({
      where: {
        is_pinned: true,
      },
      include: {
        posts: {
          select: {
            id: true,
            title: true,
            wechat_id: true,
            city: true,
            category: true,
            price: true,
            users: {
              select: {
                nickname: true,
                avatar_url: true,
              },
            },
          },
        },
      },
      orderBy: [{ sort_order: "asc" }, { created_at: "desc" }],
    });
  }

  /**
   * 根据城市获取普通推荐（非置顶）
   */
  static async getNormalRecommendationsByCity(city: string) {
    return await prisma.recommendations.findMany({
      where: {
        is_pinned: false,
        posts: {
          OR: [{ city: city }, { city: "通用" }],
        },
      },
      include: {
        posts: {
          select: {
            id: true,
            title: true,
            wechat_id: true,
            city: true,
            category: true,
            price: true,
            users: {
              select: {
                nickname: true,
                avatar_url: true,
              },
            },
          },
        },
      },
      orderBy: [{ sort_order: "asc" }, { created_at: "desc" }],
    });
  }

  /**
   * 根据城市和分类获取推荐
   */
  static async getRecommendationsByCityAndCategory(
    city: string,
    category: string
  ) {
    return await prisma.recommendations.findMany({
      where: {
        posts: {
          category: category,
          OR: [{ city: city }, { city: "通用" }],
        },
      },
      include: {
        posts: {
          select: {
            id: true,
            title: true,
            wechat_id: true,
            city: true,
            category: true,
            price: true,
            users: {
              select: {
                nickname: true,
                avatar_url: true,
              },
            },
          },
        },
      },
      orderBy: [
        { is_pinned: "desc" }, // 置顶的排在前面
        { sort_order: "asc" },
        { created_at: "desc" },
      ],
    });
  }

  /**
   * 获取数据库中所有城市（调试用）
   */
  static async getAllCitiesInDatabase() {
    const cities = await prisma.posts.findMany({
      select: {
        city: true,
      },
      distinct: ["city"],
      where: {
        recommendations: {
          isNot: null,
        },
      },
    });

    return cities.map((item) => item.city).filter(Boolean);
  }

  /**
   * 获取所有推荐数据（调试用）
   */
  static async getAllRecommendations() {
    return await prisma.recommendations.findMany({
      include: {
        posts: {
          select: {
            id: true,
            title: true,
            city: true,
            category: true,
            price: true,
          },
        },
      },
      orderBy: [{ is_pinned: "desc" }, { created_at: "desc" }],
    });
  }
}
