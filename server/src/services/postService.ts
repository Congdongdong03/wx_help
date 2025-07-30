// src/services/postService.ts
import { prisma } from "../lib/prisma";
import { posts_status, posts } from "@prisma/client";
import { RedisService } from "./redis";

export interface PostFilters {
  category?: string;
  city?: string;
  keyword?: string;
  page: number;
  limit: number;
  status?: posts_status;
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
  status: posts_status;
  review_status?: string;
  sensitive_words?: string;
  price?: string;
}

export interface PostsResult {
  posts: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalPosts: number;
    limit: number;
  };
  pinned_content?: any[];
}

export class PostService {
  /**
   * 获取置顶帖子
   */
  static async getPinnedPosts(filters: {
    city?: string;
    category?: string;
    limit?: number;
  }): Promise<any[]> {
    const { city, category, limit = 10 } = filters;

    // 构建 where 条件
    const where: any = {
      status: "published",
      is_pinned: true,
    };

    if (category && category !== "recommend") {
      where.category = category;
    }

    if (city) {
      where.city_code = city;
    }

    // 获取置顶帖子
    const pinnedPosts = await prisma.posts.findMany({
      where,
      orderBy: { last_polished_at: "desc" },
      take: limit,
      include: {
        users: {
          select: {
            id: true,
            openid: true,
            nickname: true,
            avatar_url: true,
            gender: true,
            city: true,
          },
        },
      },
    });

    // 处理推荐分类的特殊逻辑
    if (category === "recommend") {
      const [weeklyDeals, processedPinnedPosts] = await Promise.all([
        // 获取每周特价
        prisma.weekly_deals.findMany({
          where: { is_active: true },
          orderBy: { week_start_date: "desc" },
          take: limit,
        }),
        // 处理置顶帖子
        Promise.resolve(pinnedPosts.map(processPostImages)),
      ]);

      // 处理每周特价数据
      const processedWeeklyDeals = weeklyDeals.map(processPostImages);

      // 合并置顶帖子和每周特价
      const allPinnedContent = [
        ...processedWeeklyDeals,
        ...processedPinnedPosts,
      ];

      // 自动关联 catalogue_images 目录下的图片作为 pinned_content
      // 始终包含 Coles 和 Woolworths 的目录图片，优先显示
      const fs = require("fs");
      const path = require("path");
      const IMAGES_PATH = path.join(__dirname, "../public/catalogue_images");
      const stores = ["coles", "woolworths"];
      let catalogueImageList = [];

      for (const store of stores) {
        const dir = path.join(IMAGES_PATH, store);
        if (fs.existsSync(dir)) {
          const files = fs
            .readdirSync(dir)
            .filter((f: string) => f.endsWith(".jpg") || f.endsWith(".jpeg"))
            .sort();

          // 为每个商店创建一个汇总帖子，包含所有图片
          if (files.length > 0) {
            catalogueImageList.push({
              id: `catalogue_${store}_summary`,
              url: `/catalogue_images/${store}/${files[0]}`, // 使用第一张图片作为封面
              filename: files[0],
              store,
              title: `${store.toUpperCase()} 本周打折目录`,
              content: `${store.toUpperCase()} 本周最新打折信息，包含 ${
                files.length
              } 页详细内容`,
              content_preview: `${store.toUpperCase()} 本周最新打折信息，包含 ${
                files.length
              } 页详细内容`,
              category: "help",
              sub_category: "",
              price: "0",
              updated_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              city_code: "通用",
              status: "published",
              images: files.map(
                (file: string) => `/catalogue_images/${store}/${file}`
              ), // 包含所有图片
              cover_image: `/catalogue_images/${store}/${files[0]}`,
              is_pinned: true,
              is_weekly_deal: true,
              total_pages: files.length,
              users: {
                id: 1,
                nickname: "系统",
                avatar_url: "https://example.com/default-avatar.png",
                gender: "unknown",
                city: "通用",
              },
            });
          }
        }
      }

      // 合并目录图片、每周特价和置顶帖子
      const finalPinnedContent = [
        ...catalogueImageList, // 目录图片优先显示
        ...processedWeeklyDeals, // 然后是每周特价
        ...processedPinnedPosts, // 最后是其他置顶帖子
      ];

      return finalPinnedContent;
    }

    // 对于非推荐分类，也包含 Coles 和 Woolworths 的目录图片
    const fs = require("fs");
    const path = require("path");
    const IMAGES_PATH = path.join(__dirname, "../public/catalogue_images");
    const stores = ["coles", "woolworths"];
    let catalogueImageList = [];

    for (const store of stores) {
      const dir = path.join(IMAGES_PATH, store);
      if (fs.existsSync(dir)) {
        const files = fs
          .readdirSync(dir)
          .filter((f: string) => f.endsWith(".jpg") || f.endsWith(".jpeg"))
          .sort();

        // 为每个商店创建一个汇总帖子，包含所有图片
        if (files.length > 0) {
          catalogueImageList.push({
            id: `catalogue_${store}_summary`,
            url: `/catalogue_images/${store}/${files[0]}`, // 使用第一张图片作为封面
            filename: files[0],
            store,
            title: `${store.toUpperCase()} 本周打折目录`,
            content: `${store.toUpperCase()} 本周最新打折信息，包含 ${
              files.length
            } 页详细内容`,
            content_preview: `${store.toUpperCase()} 本周最新打折信息，包含 ${
              files.length
            } 页详细内容`,
            category: "help",
            sub_category: "",
            price: "0",
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            city_code: "通用",
            status: "published",
            images: files.map(
              (file: string) => `/catalogue_images/${store}/${file}`
            ), // 包含所有图片
            cover_image: `/catalogue_images/${store}/${files[0]}`,
            is_pinned: true,
            is_weekly_deal: true,
            total_pages: files.length,
            users: {
              id: 1,
              nickname: "系统",
              avatar_url: "https://example.com/default-avatar.png",
              gender: "unknown",
              city: "通用",
            },
          });
        }
      }
    }

    // 合并目录图片和置顶帖子
    const finalPinnedContent = [
      ...catalogueImageList, // 目录图片优先显示
      ...pinnedPosts.map(processPostImages), // 然后是其他置顶帖子
    ];

    return finalPinnedContent;
  }

  /**
   * 获取普通帖子（分页）
   */
  static async getNormalPosts(filters: PostFilters): Promise<PostsResult> {
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
      is_pinned: false, // 只获取非置顶帖子
    };

    if (category && category !== "recommend") {
      where.category = category;
    }

    if (city) {
      where.city_code = city;
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { content: { contains: keyword } },
      ];
    }

    const [posts, totalPosts] = await Promise.all([
      // 获取普通帖子
      prisma.posts.findMany({
        where,
        orderBy: { last_polished_at: "desc" },
        take: limit,
        skip: offset,
        include: {
          users: {
            select: {
              id: true,
              openid: true,
              nickname: true,
              avatar_url: true,
              gender: true,
              city: true,
            },
          },
        },
      }),
      // 获取总数
      prisma.posts.count({ where }),
    ]);

    return {
      posts: posts.map(processPostImages),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        limit,
      },
    };
  }

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

    if (category && category !== "recommend") {
      where.category = category;
    }

    if (city) {
      where.city_code = city;
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { content: { contains: keyword } },
      ];
    }

    // 处理推荐分类
    if (category === "recommend") {
      const [weeklyDeals, posts, totalPosts, pinnedPosts] = await Promise.all([
        // 获取每周特价
        prisma.weekly_deals.findMany({
          where: { is_active: true },
          orderBy: { week_start_date: "desc" },
          take: limit,
          skip: offset,
        }),
        // 获取普通帖子
        prisma.posts.findMany({
          where: { ...where, is_pinned: false },
          orderBy: { last_polished_at: "desc" },
          take: limit,
          skip: offset,
          include: {
            users: {
              select: {
                id: true,
                openid: true,
                nickname: true,
                avatar_url: true,
                gender: true,
                city: true,
              },
            },
          },
        }),
        // 获取总数
        prisma.posts.count({ where }),
        // 获取置顶帖子
        prisma.posts.findMany({
          where: { ...where, is_pinned: true },
          orderBy: { last_polished_at: "desc" },
          include: {
            users: {
              select: {
                id: true,
                openid: true,
                nickname: true,
                avatar_url: true,
                gender: true,
                city: true,
              },
            },
          },
        }),
      ]);

      // 处理每周特价数据
      const processedWeeklyDeals = weeklyDeals.map(processPostImages);

      // 处理帖子数据
      const processedPosts = posts.map(processPostImages);
      const processedPinnedPosts = pinnedPosts.map(processPostImages);

      // 合并置顶帖子和每周特价
      const allPinnedContent = [
        ...processedWeeklyDeals,
        ...processedPinnedPosts,
      ];

      // ===== 自动关联 catalogue_images 目录下的图片作为 pinned_content =====
      let finalPinnedContent = processedPinnedPosts;
      if (finalPinnedContent.length === 0) {
        const fs = require("fs");
        const path = require("path");
        const IMAGES_PATH = path.join(__dirname, "../public/catalogue_images");
        const stores = ["coles", "woolworths"];
        let imageList = [];
        for (const store of stores) {
          const dir = path.join(IMAGES_PATH, store);
          if (fs.existsSync(dir)) {
            const files = fs
              .readdirSync(dir)
              .filter((f: string) => f.endsWith(".jpg") || f.endsWith(".jpeg"))
              .sort();
            imageList.push(
              ...files.map((file: string, index: number) => ({
                id: `catalogue_${store}_${index}`,
                url: `/catalogue_images/${store}/${file}`,
                filename: file,
                store,
                title: `${store.toUpperCase()} 打折信息`,
                content: `${store.toUpperCase()} 每周打折信息`,
                content_preview: `${store.toUpperCase()} 每周打折信息`,
                category: "help",
                sub_category: "",
                price: "0",
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                city_code: "通用",
                status: "published",
                images: [`/catalogue_images/${store}/${file}`],
                cover_image: `/catalogue_images/${store}/${file}`,
                is_pinned: true,
                is_weekly_deal: false,
                users: {
                  id: 1,
                  nickname: "系统",
                  avatar_url: "https://example.com/default-avatar.png",
                  gender: "unknown",
                  city: "通用",
                },
              }))
            );
          }
        }
        finalPinnedContent = imageList;
      }
      // ===== END =====

      return {
        posts: processedPosts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts,
          limit,
        },
        pinned_content: finalPinnedContent,
      };
    } else {
      // 处理其他分类
      const [posts, totalPosts, pinnedPosts] = await Promise.all([
        // 获取帖子列表
        prisma.posts.findMany({
          where,
          orderBy: { last_polished_at: "desc" },
          take: limit,
          skip: offset,
          include: {
            users: {
              select: {
                id: true,
                openid: true,
                nickname: true,
                avatar_url: true,
                gender: true,
                city: true,
              },
            },
          },
        }),
        // 获取总数
        prisma.posts.count({ where }),
        // 获取置顶帖子
        prisma.posts.findMany({
          where: { ...where, is_pinned: true },
          orderBy: { last_polished_at: "desc" },
          include: {
            users: {
              select: {
                id: true,
                openid: true,
                nickname: true,
                avatar_url: true,
                gender: true,
                city: true,
              },
            },
          },
        }),
      ]);

      // 处理帖子数据
      const processedPosts = posts.map(processPostImages);
      const processedPinnedPosts = pinnedPosts.map(processPostImages);

      // ===== 自动关联 catalogue_images 目录下的图片作为 pinned_content =====
      let finalPinnedContent = processedPinnedPosts;
      if (finalPinnedContent.length === 0) {
        const fs = require("fs");
        const path = require("path");
        const IMAGES_PATH = path.join(__dirname, "../public/catalogue_images");
        const stores = ["coles", "woolworths"];
        let imageList = [];
        for (const store of stores) {
          const dir = path.join(IMAGES_PATH, store);
          if (fs.existsSync(dir)) {
            const files = fs
              .readdirSync(dir)
              .filter((f: string) => f.endsWith(".jpg") || f.endsWith(".jpeg"))
              .sort();
            imageList.push(
              ...files.map((file: string, index: number) => ({
                id: `catalogue_${store}_${index}`,
                url: `/catalogue_images/${store}/${file}`,
                filename: file,
                store,
                title: `${store.toUpperCase()} 打折信息`,
                content: `${store.toUpperCase()} 每周打折信息`,
                content_preview: `${store.toUpperCase()} 每周打折信息`,
                category: "help",
                sub_category: "",
                price: "0",
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                city_code: "通用",
                status: "published",
                images: [`/catalogue_images/${store}/${file}`],
                cover_image: `/catalogue_images/${store}/${file}`,
                is_pinned: true,
                is_weekly_deal: false,
                users: {
                  id: 1,
                  nickname: "系统",
                  avatar_url: "https://example.com/default-avatar.png",
                  gender: "unknown",
                  city: "通用",
                },
              }))
            );
          }
        }
        finalPinnedContent = imageList;
      }
      // ===== END =====

      return {
        posts: processedPosts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts,
          limit,
        },
        pinned_content: finalPinnedContent,
      };
    }
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

    const [posts, totalPosts, pinnedPosts] = await Promise.all([
      prisma.posts.findMany({
        where,
        orderBy: { last_polished_at: "desc" },
        take: limit,
        skip: offset,
        include: {
          users: {
            select: {
              id: true,
              openid: true,
              nickname: true,
              avatar_url: true,
              gender: true,
              city: true,
            },
          },
        },
      }),

      prisma.posts.count({ where }),

      prisma.posts.findMany({
        where: {
          ...where,
          is_pinned: true,
        },
        orderBy: { last_polished_at: "desc" },
        include: {
          users: {
            select: {
              id: true,
              openid: true,
              nickname: true,
              avatar_url: true,
              gender: true,
              city: true,
            },
          },
        },
      }),
    ]);

    // 处理帖子数据
    const processedPosts = posts.map(processPostImages);
    const processedPinnedPosts = pinnedPosts.map(processPostImages);

    // ===== 自动关联 catalogue_images 目录下的图片作为 pinned_content =====
    let finalPinnedContent = processedPinnedPosts;
    if (finalPinnedContent.length === 0) {
      const fs = require("fs");
      const path = require("path");
      const IMAGES_PATH = path.join(__dirname, "../public/catalogue_images");
      const stores = ["coles", "woolworths"];
      let imageList = [];
      for (const store of stores) {
        const dir = path.join(IMAGES_PATH, store);
        if (fs.existsSync(dir)) {
          const files = fs
            .readdirSync(dir)
            .filter((f: string) => f.endsWith(".jpg") || f.endsWith(".jpeg"))
            .sort();
          imageList.push(
            ...files.map((file: string, index: number) => ({
              id: `catalogue_${store}_${index}`,
              url: `/catalogue_images/${store}/${file}`,
              filename: file,
              store,
              title: `${store.toUpperCase()} 打折信息`,
              content: `${store.toUpperCase()} 每周打折信息`,
              content_preview: `${store.toUpperCase()} 每周打折信息`,
              category: "help",
              sub_category: "",
              price: "0",
              updated_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              city_code: "通用",
              status: "published",
              images: [`/catalogue_images/${store}/${file}`],
              cover_image: `/catalogue_images/${store}/${file}`,
              is_pinned: true,
              is_weekly_deal: false,
              users: {
                id: 1,
                nickname: "系统",
                avatar_url: "https://example.com/default-avatar.png",
                gender: "unknown",
                city: "通用",
              },
            }))
          );
        }
      }
      finalPinnedContent = imageList;
    }
    // ===== END =====

    return {
      posts: processedPosts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        limit,
      },
      pinned_content: finalPinnedContent,
    };
  }

  /**
   * 创建帖子
   */
  static async create(data: PostCreateInput): Promise<posts> {
    const now = new Date();
    return await prisma.posts.create({
      data: {
        ...data,
        price: data.price || null,
        images: data.images ? JSON.stringify(data.images) : null,
        created_at: now,
        last_polished_at: now,
      },
    });
  }

  /**
   * 根据ID查找帖子
   */
  static async findById(id: number): Promise<any> {
    try {
      // 尝试从缓存获取
      const cacheKey = `post:${id}`;
      const cachedPost = await RedisService.getCache(cacheKey);

      if (cachedPost) {
        return JSON.parse(cachedPost);
      }

      // 从数据库获取
      const post = await prisma.posts.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              openid: true,
              nickname: true,
              avatar_url: true,
              gender: true,
              city: true,
            },
          },
        },
      });

      if (!post) {
        return null;
      }

      // 处理图片数据
      const processedPost = processPostImages(post);

      // 缓存结果（5分钟）
      await RedisService.setCache(cacheKey, JSON.stringify(processedPost));

      return processedPost;
    } catch (error) {
      console.error("Error in findById:", error);
      throw error;
    }
  }

  /**
   * 更新帖子
   */
  static async update(id: number, data: Partial<posts>): Promise<posts> {
    const currentTimestamp = Date.now();
    return await prisma.posts.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(currentTimestamp),
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
    } catch (error) {
      console.error("Error deleting post:", error);
      return false;
    }
  }

  /**
   * 增加帖子浏览量
   */
  static async incrementViewCount(postId: number): Promise<void> {
    try {
      await prisma.posts.update({
        where: { id: postId },
        data: {
          view_count: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      console.error("Error incrementing view count:", error);
      throw new Error("Failed to increment view count");
    }
  }

  /**
   * 切换帖子收藏状态
   */
  static async toggleFavorite(
    userId: number,
    postId: number
  ): Promise<boolean> {
    try {
      // 检查是否已收藏
      const existingFavorite = await prisma.favorite.findFirst({
        where: {
          user_id: userId,
          post_id: postId,
        },
      });

      if (existingFavorite) {
        // 如果已收藏，则取消收藏
        await prisma.favorite.delete({
          where: {
            id: existingFavorite.id,
          },
        });
        return false;
      } else {
        // 如果未收藏，则添加收藏
        await prisma.favorite.create({
          data: {
            user_id: userId,
            post_id: postId,
          },
        });
        return true;
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      throw new Error("Failed to toggle favorite");
    }
  }

  /**
   * 获取帖子列表
   */
  static async findPosts(options: {
    page: number;
    limit: number;
    category?: string;
    city?: string;
    status?: posts_status;
  }): Promise<{
    posts: any[];
    total: number;
  }> {
    const { page, limit, category, city, status } = options;
    const skip = (page - 1) * limit;

    const where = {
      ...(category && { category }),
      ...(city && { city_code: city }),
      ...(status && { status }),
    };

    const [posts, total] = await Promise.all([
      prisma.posts.findMany({
        where,
        orderBy: { last_polished_at: "desc" },
        skip,
        take: limit,
        include: {
          users: {
            select: {
              id: true,
              openid: true,
              nickname: true,
              avatar_url: true,
              gender: true,
              city: true,
            },
          },
        },
      }),
      prisma.posts.count({ where }),
    ]);

    // 处理图片数据
    const processedPosts = posts.map(processPostImages);

    return {
      posts: processedPosts,
      total,
    };
  }
}

function processPostImages(post: any) {
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
