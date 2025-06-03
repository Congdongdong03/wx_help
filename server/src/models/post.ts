import { getDb } from "../config/database";

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
  content?: string; // Main description of the post
  wechat_id: string; // Added wechat_id
  images?: string | null; // Allow null for images
  status: PostStatus; // Use the new PostStatus type
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

      // 详细的数据库连接测试
      try {
        const [connectionTest] = await db.execute("SELECT 1 as test");
        modelLog("info", "Database connection successful", { connectionTest });
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
        status: intentStatus,
      } = postInput;

      // 验证输入数据
      if (!user_id || !title || !wechat_id || !category || !intentStatus) {
        const missingFields = {
          user_id: !user_id,
          title: !title,
          wechat_id: !wechat_id,
          category: !category,
          intentStatus: !intentStatus,
        };
        throw new Error(`缺少必要字段: ${JSON.stringify(missingFields)}`);
      }

      const actualDbStatus: PostStatus =
        intentStatus === "published" ? "pending" : "draft";
      modelLog("info", "create: Determined actualDbStatus", {
        intentStatus,
        actualDbStatus,
      });

      const sql =
        "INSERT INTO posts (user_id, title, category, content, wechat_id, images, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
      const params = [
        user_id,
        title,
        category,
        content,
        wechat_id,
        images,
        actualDbStatus,
        new Date(),
        new Date(),
      ];

      // 验证参数中没有undefined
      const hasUndefined = params.some((param) => param === undefined);
      if (hasUndefined) {
        modelLog("error", "Found undefined in params", { params });
        throw new Error("参数中包含undefined值");
      }

      modelLog("info", "create: Executing SQL", { sql, params });

      const [result]: any = await db.execute(sql, params);
      modelLog("info", "create: SQL execution result", { result });

      const insertId = result.insertId;
      if (!insertId) {
        throw new Error("插入记录失败，未获取到ID");
      }

      const [rows]: any = await db.execute("SELECT * FROM posts WHERE id = ?", [
        insertId,
      ]);

      if (!rows || rows.length === 0) {
        throw new Error(`查询新创建的记录失败，ID: ${insertId}`);
      }

      modelLog("info", "create: Successfully created and fetched post", {
        post: rows[0],
      });
      return rows[0] as Post;
    } catch (error: any) {
      modelLog("error", "create: Operation failed", {
        error: error.message,
        stack: error.stack,
        input: postInput,
      });
      throw error;
    }
  }

  static async update(id: number, post: Partial<Post>): Promise<boolean> {
    const db = getDb();
    const updates = Object.keys(post)
      .filter((key) => key !== "id") // Ensure 'id' is not in SET clause
      .map((key) => `${key} = ?`);
    const values = Object.values(post).filter(
      (value, index) => Object.keys(post)[index] !== "id"
    );

    if (updates.length === 0) return false;

    values.push(id);

    const statement = `UPDATE posts SET ${updates.join(
      ", "
    )}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    const [result]: any = await db.execute(statement, values);
    return result.affectedRows > 0;
  }

  static async delete(id: number): Promise<boolean> {
    const db = getDb();
    const [result]: any = await db.execute("DELETE FROM posts WHERE id = ?", [
      id,
    ]);
    return result.affectedRows > 0;
  }
}
