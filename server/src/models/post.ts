import { getDb } from "../config/database";
import { FavoriteModel } from "./favorite";
import { RedisService } from "../services/redis";
import { DatabaseError } from "../utils/errors";

export type PostStatus = "draft" | "pending" | "published" | "failed";

// Helper log function specific to this model, or use a shared one if you have
const modelLog = (
  level: "info" | "error" | "warn" | "debug",
  message: string,
  data?: any
) => {
  const timestamp = new Date().toISOString();
  console[level](
    `[${timestamp}] [PostModel] ${message}`,
    data !== undefined ? data : ""
  );
};

export interface Post {
  id?: number;
  user_id: number;
  title: string;
  category?: string; // e.g., 'help', 'rent', 'used', 'jobs'
  sub_category?: string;
  content?: string; // Main description of the post
  price?: number;
  price_unit?: string;
  city_code?: string;
  wechat_id: string; // Added wechat_id
  images?: string[];
  city?: string; // 👈 添加这一行
  view_count?: number;
  favorite_count?: number;
  status: PostStatus; // Use the new PostStatus type
  is_favorited?: boolean;
  // Potentially add category-specific fields later, e.g.:
  // room_type?: string;
  // rent_amount?: string;
  // item_price?: string; // Renamed to avoid conflict if 'price' is a common field
  // item_condition?: string;
  // job_position?: string;
  // job_salary_range?: string;
  // audit_status?: "pending" | "approved" | "rejected"; // Separate field for moderation
  created_at?: Date;
  updated_at?: Date;
}

interface FindPostsOptions {
  status?: PostStatus;
  page: number;
  limit: number;
}

interface FindPostsResult {
  posts: Post[];
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

export class PostModel {
  private static readonly CACHE_TTL = 5 * 60; // 5分钟缓存
  private static readonly BATCH_SIZE = 100; // 批量操作大小

  static async findByUserId(userId: number): Promise<Post[]> {
    const db = getDb();
    const [rows]: any = await db.execute(
      "SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    return rows as Post[];
  }

  static async findByUserIdWithFilters(
    userId: number,
    options: FindPostsOptions
  ): Promise<FindPostsResult> {
    modelLog("info", "findByUserIdWithFilters: Called", { userId, options });
    const { status, page, limit } = options;
    const pageNumber = parseInt(page.toString(), 10) || 1;
    const limitNumber = parseInt(limit.toString(), 10) || 10;

    const safeLimit = Math.max(1, Math.min(100, limitNumber)); // Clamp limit
    const safeOffset = (pageNumber - 1) * safeLimit;
    const db = getDb();

    let postsQuery = "SELECT * FROM posts WHERE user_id = ?";
    let countQuery = "SELECT COUNT(*) as total FROM posts WHERE user_id = ?";
    const queryParams: any[] = [userId];
    const countParams: any[] = [userId];

    if (status) {
      postsQuery += " AND status = ?";
      countQuery += " AND status = ?";
      queryParams.push(status);
      countParams.push(status);
    }

    postsQuery += ` ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

    modelLog("debug", "findByUserIdWithFilters: Executing postsQuery", {
      postsQuery,
      queryParams,
    });
    const [postsRows]: any = await db.execute(postsQuery, queryParams);
    const posts = postsRows as Post[];

    modelLog("debug", "findByUserIdWithFilters: Executing countQuery", {
      countQuery,
      countParams,
    });
    const [countRows]: any = await db.execute(countQuery, countParams);
    const totalPosts = countRows[0].total;
    const totalPages = Math.ceil(totalPosts / safeLimit);

    // Fetch stats
    const statsQuery = `
      SELECT
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draftCount,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingCount,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as publishedCount,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failedCount,
        COUNT(*) as totalCount
      FROM posts
      WHERE user_id = ?
    `;
    modelLog("debug", "findByUserIdWithFilters: Executing statsQuery", {
      statsQuery,
      userId,
    });
    const [statsRows]: any = await db.execute(statsQuery, [userId]);
    const statsData = statsRows[0];

    const result: FindPostsResult = {
      posts,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalPosts,
        limit: safeLimit,
      },
      stats: {
        draftCount: Number(statsData.draftCount) || 0,
        pendingCount: Number(statsData.pendingCount) || 0,
        publishedCount: Number(statsData.publishedCount) || 0,
        failedCount: Number(statsData.failedCount) || 0,
        totalCount: Number(statsData.totalCount) || 0,
      },
    };
    modelLog("info", "findByUserIdWithFilters: Returning result", { result });
    return result;
  }

  static async create(
    postInput: Omit<Post, "id" | "created_at" | "updated_at">
  ): Promise<Post> {
    modelLog("info", "create: Received input", { postInput });

    try {
      const db = getDb();
      const connection = await db.getConnection();

      try {
        await connection.beginTransaction();

        // 详细的数据库连接测试
        try {
          const [connectionTest] = await connection.execute("SELECT 1 as test");
          modelLog("info", "Database connection successful", {
            connectionTest,
          });
        } catch (connectionError) {
          modelLog("error", "Database connection failed", { connectionError });
          throw new Error(`数据库连接失败: ${connectionError}`);
        }

        const {
          user_id,
          title,
          category,
          content,
          wechat_id,
          images,
          city,
          status: intentStatus,
        } = postInput;

        // 验证输入数据
        if (!user_id || !title || !wechat_id || !category || !intentStatus) {
          const missingFields = {
            user_id: !user_id,
            title: !title,
            wechat_id: !wechat_id,
            category: !category,
            status: !intentStatus,
          };
          modelLog("error", "Missing required fields", { missingFields });
          throw new Error("缺少必要字段");
        }

        // 插入帖子数据
        const [result] = await connection.execute(
          `INSERT INTO posts (
            user_id, title, category, content, wechat_id, 
            images, city, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            user_id,
            title,
            category,
            content || null,
            wechat_id,
            images ? JSON.stringify(images) : null,
            city || null,
            intentStatus,
          ]
        );

        const postId = (result as any).insertId;

        // 获取完整的帖子数据
        const [rows] = await connection.execute(
          "SELECT * FROM posts WHERE id = ?",
          [postId]
        );

        await connection.commit();
        connection.release();

        const post = (rows as any[])[0];
        modelLog("info", "create: Success", { postId, post });
        return post;
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      modelLog("error", "create: Failed", { error });
      throw new DatabaseError(`创建帖子失败: ${(error as Error).message}`);
    }
  }

  static async update(id: number, post: Partial<Post>): Promise<Post> {
    const db = getDb();
    const updates = Object.keys(post)
      .filter((key) => key !== "id")
      .map((key) => `${key} = ?`);
    const values = Object.values(post).filter(
      (value, index) => Object.keys(post)[index] !== "id"
    );

    if (updates.length === 0) {
      // 如果没有更新，返回原帖子
      const [rows]: any = await db.execute("SELECT * FROM posts WHERE id = ?", [
        id,
      ]);
      return rows[0] as Post;
    }

    values.push(id);

    const statement = `UPDATE posts SET ${updates.join(
      ", "
    )}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    await db.execute(statement, values);

    // 返回更新后的帖子
    const [rows]: any = await db.execute("SELECT * FROM posts WHERE id = ?", [
      id,
    ]);
    return rows[0] as Post;
  }

  static async delete(id: number): Promise<boolean> {
    const db = getDb();
    const [result]: any = await db.execute("DELETE FROM posts WHERE id = ?", [
      id,
    ]);
    return result.affectedRows > 0;
  }
  // 在 PostModel 类中添加这些方法

  static async findById(id: number): Promise<Post | null> {
    const db = getDb();
    const [rows]: any = await db.execute(
      `SELECT p.*, 
        COALESCE(p.favorite_count, 0) as favorite_count,
        false as is_favorited
       FROM posts p
       WHERE p.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as Post;
  }
  static async findWithFilters(filters: {
    category?: string;
    city?: string;
    keyword?: string;
    page: number;
    limit: number;
    status?: PostStatus;
  }): Promise<FindPostsResult> {
    console.log("DEBUG: findWithFilters called with:", filters);

    const {
      category,
      city,
      keyword,
      page,
      limit,
      status = "published",
    } = filters;
    const db = getDb();
    const offset = (page - 1) * limit;

    try {
      // 临时使用最简单的固定查询
      const fixedQuery =
        "SELECT * FROM posts WHERE status = 'published' ORDER BY updated_at DESC LIMIT 10 OFFSET 0";
      console.log("DEBUG: Using fixed query:", fixedQuery);

      const [postsRows]: any = await db.execute(fixedQuery, []);
      const posts = postsRows as Post[];

      console.log("DEBUG: Fixed query successful, got", posts.length, "posts");

      // 简单的 count 查询
      const [countRows]: any = await db.execute(
        "SELECT COUNT(*) as total FROM posts WHERE status = 'published'",
        []
      );
      const totalPosts = countRows[0].total;
      const totalPages = Math.ceil(totalPosts / 10); // 固定每页10条

      console.log("DEBUG: Count query successful, total:", totalPosts);

      // 简单的统计查询
      const [statsRows]: any = await db.execute(
        `
        SELECT
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draftCount,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingCount,
          SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as publishedCount,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failedCount,
          COUNT(*) as totalCount
        FROM posts
      `,
        []
      );

      const statsData = statsRows[0];
      console.log("DEBUG: Stats query successful");

      const result = {
        posts,
        pagination: {
          currentPage: 1, // 固定为第1页
          totalPages,
          totalPosts,
          limit: 10, // 固定每页10条
        },
        stats: {
          draftCount: Number(statsData.draftCount) || 0,
          pendingCount: Number(statsData.pendingCount) || 0,
          publishedCount: Number(statsData.publishedCount) || 0,
          failedCount: Number(statsData.failedCount) || 0,
          totalCount: Number(statsData.totalCount) || 0,
        },
      };

      console.log("DEBUG: Returning result with", result.posts.length, "posts");
      return result;
    } catch (error: any) {
      console.error("DEBUG: Error in findWithFilters:", error.message);
      console.error("DEBUG: Error stack:", error.stack);
      throw error;
    }
  }

  static async findByStatus(
    status: PostStatus,
    options: {
      page: number;
      limit: number;
    }
  ): Promise<FindPostsResult> {
    const { page, limit } = options;
    const db = getDb();
    const offset = (page - 1) * limit;

    // 获取指定状态的帖子
    const postsQuery = `
    SELECT * FROM posts 
    WHERE status = ? 
    ORDER BY created_at ASC 
    LIMIT ? OFFSET ?
  `;

    const [postsRows]: any = await db.execute(postsQuery, [
      status,
      limit,
      offset,
    ]);
    const posts = postsRows as Post[];

    // 获取总数
    const [countRows]: any = await db.execute(
      "SELECT COUNT(*) as total FROM posts WHERE status = ?",
      [status]
    );
    const totalPosts = countRows[0].total;
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
        draftCount: 0,
        pendingCount: 0,
        publishedCount: 0,
        failedCount: 0,
        totalCount: totalPosts,
      },
    };
  }

  static async findByIdWithDetails(
    id: number,
    userId?: number
  ): Promise<Post | null> {
    try {
      const cacheKey = `post:${id}:${userId || "anonymous"}`;

      // 尝试从缓存获取
      const cachedPost = await RedisService.getCache(cacheKey);
      if (cachedPost) {
        return JSON.parse(cachedPost);
      }

      const db = getDb();
      const [rows]: any = await db.execute(
        `SELECT p.*, 
          CASE WHEN f.id IS NOT NULL THEN true ELSE false END as is_favorited
         FROM posts p
         LEFT JOIN favorites f ON p.id = f.post_id AND f.user_id = ?
         WHERE p.id = ?`,
        [userId || 0, id]
      );

      if (!rows || rows.length === 0) {
        return null;
      }

      const post = rows[0] as Post;

      // 设置缓存
      await RedisService.setCache(
        cacheKey,
        JSON.stringify(post),
        this.CACHE_TTL
      );

      return post;
    } catch (error) {
      console.error("Error in findByIdWithDetails:", error);
      throw new DatabaseError("Failed to fetch post details");
    }
  }

  static async toggleFavorite(
    postId: number,
    userId: number
  ): Promise<{ is_favorited: boolean; favorite_count: number }> {
    const pool = getDb();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 检查收藏状态
      const [favoriteRows]: any = await connection.execute(
        "SELECT id FROM favorites WHERE post_id = ? AND user_id = ?",
        [postId, userId]
      );

      let is_favorited: boolean;

      if (favoriteRows.length > 0) {
        // 取消收藏
        await connection.execute(
          "DELETE FROM favorites WHERE post_id = ? AND user_id = ?",
          [postId, userId]
        );
        await connection.execute(
          "UPDATE posts SET favorite_count = favorite_count - 1 WHERE id = ?",
          [postId]
        );
        is_favorited = false;
      } else {
        // 添加收藏
        await connection.execute(
          "INSERT INTO favorites (post_id, user_id) VALUES (?, ?)",
          [postId, userId]
        );
        await connection.execute(
          "UPDATE posts SET favorite_count = favorite_count + 1 WHERE id = ?",
          [postId]
        );
        is_favorited = true;
      }

      // 获取更新后的收藏数
      const [countRows]: any = await connection.execute(
        "SELECT favorite_count FROM posts WHERE id = ?",
        [postId]
      );
      const favorite_count = countRows[0].favorite_count;

      await connection.commit();

      // 清除相关缓存
      await RedisService.deleteCache(`post:${postId}:*`);

      return { is_favorited, favorite_count };
    } catch (error) {
      await connection.rollback();
      console.error("Error in toggleFavorite:", error);
      throw new DatabaseError("Failed to toggle favorite status");
    } finally {
      connection.release();
    }
  }

  static async incrementViewCount(
    postId: number,
    userId?: number
  ): Promise<void> {
    try {
      if (userId) {
        const shouldIncrement = await RedisService.shouldIncrementViewCount(
          userId,
          postId
        );
        if (!shouldIncrement) {
          return;
        }
      }

      await RedisService.incrementViewCount(postId);

      // 清除相关缓存
      await RedisService.deleteCache(`post:${postId}:*`);
    } catch (error) {
      console.error("Error in incrementViewCount:", error);
      // 不抛出错误，避免影响主流程
    }
  }

  // 批量获取帖子
  static async findBatch(ids: number[], userId?: number): Promise<Post[]> {
    if (!ids.length) return [];

    const db = getDb();
    const posts: Post[] = [];
    const batchSize = this.BATCH_SIZE;

    for (let i = 0; i < ids.length; i += batchSize) {
      const batchIds = ids.slice(i, i + batchSize);
      const [batchRows]: any = await db.execute(
        `SELECT p.*, 
          CASE WHEN f.id IS NOT NULL THEN true ELSE false END as is_favorited
         FROM posts p
         LEFT JOIN favorites f ON p.id = f.post_id AND f.user_id = ?
         WHERE p.id IN (?)`,
        [userId || 0, batchIds]
      );

      if (batchRows && batchRows.length > 0) {
        posts.push(...(batchRows as Post[]));
      }
    }

    return posts;
  }

  // 批量更新帖子状态
  static async updateBatchStatus(ids: number[], status: string): Promise<void> {
    if (!ids.length) return;

    const pool = getDb();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.execute(
        "UPDATE posts SET status = ?, updated_at = NOW() WHERE id IN (?)",
        [status, ids]
      );

      await connection.commit();

      // 清除相关缓存
      await Promise.all(
        ids.map((id) => RedisService.deleteCache(`post:${id}:*`))
      );
    } catch (error) {
      await connection.rollback();
      console.error("Error in updateBatchStatus:", error);
      throw new DatabaseError("Failed to update batch status");
    } finally {
      connection.release();
    }
  }
}
