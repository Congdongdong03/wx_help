import { getDb } from "../config/database";
import { DatabaseError } from "../utils/errors";

export type PostStatus = "draft" | "pending" | "published" | "failed";

export interface Post {
  id?: number;
  user_id: number;
  title: string;
  category?: string;
  sub_category?: string;
  content?: string;
  price?: number;
  price_unit?: string;
  city_code?: string;
  images?: string[];
  city?: string;
  view_count?: number;
  favorite_count?: number;
  status: PostStatus;
  is_favorited?: boolean;
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
  /**
   * 创建帖子
   */
  static async create(postData: Omit<Post, "id">): Promise<Post> {
    try {
      const db = getDb();
      const [result] = await db.execute(
        `INSERT INTO posts (
          user_id, title, category, sub_category, content, price, price_unit, 
          city_code, images, city, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          postData.user_id,
          postData.title,
          postData.category || null,
          postData.sub_category || null,
          postData.content || null,
          postData.price || null,
          postData.price_unit || null,
          postData.city_code || null,
          postData.images ? JSON.stringify(postData.images) : null,
          postData.city || null,
          postData.status,
        ]
      );

      const postId = (result as any).insertId;
      return { ...postData, id: postId };
    } catch (error) {
      throw new DatabaseError("创建帖子失败", error);
    }
  }

  /**
   * 根据ID查找帖子
   */
  static async findById(id: number): Promise<Post | null> {
    try {
      const db = getDb();
      const [rows] = await db.execute("SELECT * FROM posts WHERE id = ?", [id]);

      const posts = rows as Post[];
      if (posts.length === 0) return null;

      const post = posts[0];
      return {
        ...post,
        images: post.images ? JSON.parse(post.images) : [],
      };
    } catch (error) {
      throw new DatabaseError("查找帖子失败", error);
    }
  }

  /**
   * 查找用户的帖子
   */
  static async findByUserId(
    userId: number,
    options: FindPostsOptions
  ): Promise<FindPostsResult> {
    try {
      const db = getDb();
      const { status, page, limit } = options;
      const offset = (page - 1) * limit;

      let whereClause = "WHERE user_id = ?";
      const params = [userId];

      if (status) {
        whereClause += " AND status = ?";
        params.push(status);
      }

      // 获取帖子列表
      const [rows] = await db.execute(
        `SELECT * FROM posts ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      // 获取总数
      const [countRows] = await db.execute(
        `SELECT COUNT(*) as total FROM posts ${whereClause}`,
        params
      );

      const totalPosts = (countRows as any)[0].total;
      const totalPages = Math.ceil(totalPosts / limit);

      // 获取统计信息
      const [statsRows] = await db.execute(
        `SELECT 
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draftCount,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingCount,
          SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as publishedCount,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failedCount,
          COUNT(*) as totalCount
        FROM posts WHERE user_id = ?`,
        [userId]
      );

      const stats = (statsRows as any)[0];

      return {
        posts: (rows as Post[]).map((post) => ({
          ...post,
          images: post.images ? JSON.parse(post.images) : [],
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalPosts,
          limit,
        },
        stats: {
          draftCount: stats.draftCount || 0,
          pendingCount: stats.pendingCount || 0,
          publishedCount: stats.publishedCount || 0,
          failedCount: stats.failedCount || 0,
          totalCount: stats.totalCount || 0,
        },
      };
    } catch (error) {
      throw new DatabaseError("查找用户帖子失败", error);
    }
  }

  /**
   * 更新帖子
   */
  static async update(id: number, updateData: Partial<Post>): Promise<boolean> {
    try {
      const db = getDb();
      const allowedFields = [
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

      const updates: string[] = [];
      const values: any[] = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = ?`);
          values.push(key === "images" ? JSON.stringify(value) : value);
        }
      }

      if (updates.length === 0) return false;

      updates.push("updated_at = NOW()");
      values.push(id);

      const [result] = await db.execute(
        `UPDATE posts SET ${updates.join(", ")} WHERE id = ?`,
        values
      );

      return (result as any).affectedRows > 0;
    } catch (error) {
      throw new DatabaseError("更新帖子失败", error);
    }
  }

  /**
   * 删除帖子
   */
  static async delete(id: number): Promise<boolean> {
    try {
      const db = getDb();
      const [result] = await db.execute("DELETE FROM posts WHERE id = ?", [id]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      throw new DatabaseError("删除帖子失败", error);
    }
  }
}
