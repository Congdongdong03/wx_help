import { getDb } from "../config/database";

export interface Post {
  id?: number;
  user_id: number;
  title: string;
  category?: string;
  content?: string;
  status?: "pending" | "approved" | "rejected" | "taken_down";
  created_at?: Date;
  updated_at?: Date;
}

export class PostModel {
  static async findByUserId(userId: number): Promise<Post[]> {
    const db = getDb(); // 直接获取数据库实例
    const rows = await db.all(
      "SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    // SQLite 返回的row对象的属性名是区分大小写的，与数据库列名一致。
    // 转换为 Post 接口类型可能会需要一些映射，这里先直接断言。
    return rows as Post[];
  }

  static async create(
    post: Omit<Post, "id" | "created_at" | "updated_at" | "status">
  ): Promise<Post> {
    const db = getDb(); // 直接获取数据库实例
    const result = await db.run(
      "INSERT INTO posts (user_id, title, category, content, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        post.user_id,
        post.title,
        post.category,
        post.content,
        "pending",
        new Date().toISOString(),
        new Date().toISOString(),
      ]
    );
    const insertId = result.lastID;
    // 查询新插入的帖子以返回完整信息
    const newPost = await db.get("SELECT * FROM posts WHERE id = ?", [
      insertId,
    ]);
    return newPost as Post;
  }

  static async update(id: number, post: Partial<Post>): Promise<boolean> {
    const db = getDb(); // 直接获取数据库实例
    // 构建更新语句，只更新传入的字段
    const updates = Object.keys(post).map((key) => `${key} = ?`);
    const values = Object.values(post);
    if (updates.length === 0) return false; // 没有需要更新的字段

    values.push(id); // 添加id作为WHERE条件的参数

    const statement = `UPDATE posts SET ${updates.join(
      ", "
    )}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    const result = await db.run(statement, values);
    // 检查 result 是否存在且 changes 属性大于 0
    return (
      result !== null &&
      result !== undefined &&
      result.changes !== null &&
      result.changes !== undefined &&
      result.changes > 0
    );
  }

  static async delete(id: number): Promise<boolean> {
    const db = getDb(); // 直接获取数据库实例
    const result = await db.run("DELETE FROM posts WHERE id = ?", [id]);
    // 检查 result 是否存在且 changes 属性大于 0
    return (
      result !== null &&
      result !== undefined &&
      result.changes !== null &&
      result.changes !== undefined &&
      result.changes > 0
    );
  }
}
