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

  private static readonly ALLOWED_UPDATE_FIELDS = [
    "title",
    "category",
    "sub_category",
    "content",
    "price",
    "price_unit",
    "city_code",
    "images",
    "city",
    "status",
  ];

  // Private core method to execute find queries with various filters
  private static async _executeFindQuery(options: {
    userId?: number;
    status?: PostStatus;
    category?: string;
    city?: string;
    keyword?: string;
    page: number;
    limit: number;
  }): Promise<FindPostsResult> {
    const { userId, status, category, city, keyword, page, limit } = options;
    const db = getDb();
    const offset = (page - 1) * limit;

    let baseQuery = `SELECT * FROM posts`;
    let countBaseQuery = `SELECT COUNT(*) as total FROM posts`;
    let statsBaseQuery = `
      SELECT
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draftCount,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingCount,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as publishedCount,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failedCount,
        COUNT(*) as totalCount
      FROM posts
    `;

    const whereClauses: string[] = [];
    const queryParams: any[] = [];

    if (userId) {
      whereClauses.push("user_id = ?");
      queryParams.push(userId);
    }

    if (status) {
      whereClauses.push("status = ?");
      queryParams.push(status);
    }

    if (category) {
      whereClauses.push("category = ?");
      queryParams.push(category);
    }

    if (city) {
      whereClauses.push("city = ?");
      queryParams.push(city);
    }

    if (keyword) {
      whereClauses.push("(title LIKE ? OR content LIKE ?)");
      queryParams.push(`%${keyword}%`, `%${keyword}%`);
    }

    let whereClause = "";
    if (whereClauses.length > 0) {
      whereClause = ` WHERE ${whereClauses.join(" AND ")}`;
    }

    const postsQuery = `${baseQuery}${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const countQuery = `${countBaseQuery}${whereClause}`;
    const statsQuery = `${statsBaseQuery}${whereClause}`;

    const postsQueryParams = [...queryParams, limit, offset];
    const countQueryParams = [...queryParams];
    const statsQueryParams = [...queryParams];

    try {
      const [postsRowsResult, countRowsResult, statsRowsResult]: [
        any,
        any,
        any
      ] = await Promise.all([
        db.execute(postsQuery, postsQueryParams),
        db.execute(countQuery, countQueryParams),
        db.execute(statsQuery, statsQueryParams),
      ]);

      const posts = postsRowsResult[0] as Post[];
      const totalPosts = countRowsResult[0][0].total;
      const totalPages = Math.ceil(totalPosts / limit);
      const statsData = statsRowsResult[0][0];

      const result = {
        posts,
        pagination: {
          currentPage: page,
          totalPages,
          totalPosts,
          limit,
        },
        stats: {
          draftCount: Number(statsData.draftCount) || 0,
          pendingCount: Number(statsData.pendingCount) || 0,
          publishedCount: Number(statsData.publishedCount) || 0,
          failedCount: Number(statsData.failedCount) || 0,
          totalCount: Number(statsData.totalCount) || 0,
        },
      };

      modelLog("info", "_executeFindQuery: Returning result", { result });
      return result;
    } catch (error: any) {
      modelLog("error", "_executeFindQuery: Failed", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

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

    return this._executeFindQuery({
      userId,
      status,
      page: parseInt(page.toString(), 10) || 1,
      limit: parseInt(limit.toString(), 10) || 10,
    });
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
        // try {
        //   const [connectionTest] = await connection.execute("SELECT 1 as test");
        //   modelLog("info", "Database connection successful", { connectionTest });
        // } catch (connectionError) {
        //   modelLog("error", "Database connection failed", { connectionError });
        //   throw new Error(`数据库连接失败: ${connectionError}`);
        // }

        const {
          user_id,
          title,
          category,
          content,
          images,
          city,
          status: intentStatus,
        } = postInput;

        // 验证输入数据
        if (!user_id || !title || !category || !intentStatus) {
          const missingFields = {
            user_id: !user_id,
            title: !title,
            category: !category,
            status: !intentStatus,
          };
          modelLog("error", "Missing required fields", { missingFields });
          throw new Error("缺少必要字段");
        }

        // 插入帖子数据
        const [result] = await connection.execute(
          `INSERT INTO posts (
            user_id, title, category, content, 
            images, city, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            user_id,
            title,
            category,
            content || null,
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
    const updates: string[] = [];
    const values: any[] = [];

    for (const key of Object.keys(post)) {
      if (PostModel.ALLOWED_UPDATE_FIELDS.includes(key) && key !== "id") {
        updates.push(`${key} = ?`);
        const value = (post as any)[key];
        // Special handling for array fields like 'images'
        if (key === "images" && Array.isArray(value)) {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    }

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
    return { ...post, id, updated_at: new Date() } as Post;
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

    return this._executeFindQuery({
      category,
      city,
      keyword,
      page,
      limit,
      status,
    });
  }

  static async findByStatus(
    status: PostStatus,
    options: {
      page: number;
      limit: number;
    }
  ): Promise<FindPostsResult> {
    const { page, limit } = options;

    return this._executeFindQuery({
      status,
      page,
      limit,
    });
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
