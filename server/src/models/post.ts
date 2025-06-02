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
    const db = getDb();
    const [rows]: any = await db.execute(
      "SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    return rows as Post[];
  }

  static async create(
    post: Omit<Post, "id" | "created_at" | "updated_at" | "status">
  ): Promise<Post> {
    const db = getDb();
    const [result]: any = await db.execute(
      "INSERT INTO posts (user_id, title, category, content, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        post.user_id,
        post.title,
        post.category,
        post.content,
        "pending",
        new Date(),
        new Date(),
      ]
    );
    const insertId = result.insertId;
    // 查询新插入的帖子以返回完整信息
    const [rows]: any = await db.execute("SELECT * FROM posts WHERE id = ?", [
      insertId,
    ]);
    return rows[0] as Post;
  }

  static async update(id: number, post: Partial<Post>): Promise<boolean> {
    const db = getDb();
    // 构建更新语句，只更新传入的字段
    const updates = Object.keys(post).map((key) => `${key} = ?`);
    const values = Object.values(post);
    if (updates.length === 0) return false; // 没有需要更新的字段

    values.push(id); // 添加id作为WHERE条件的参数

    const statement = `UPDATE posts SET ${updates.join(
      ", "
    )}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    const [result]: any = await db.execute(statement, values);
    // MySQL 中检查 affectedRows 是否大于 0
    return result.affectedRows > 0;
  }

  static async delete(id: number): Promise<boolean> {
    const db = getDb();
    const [result]: any = await db.execute("DELETE FROM posts WHERE id = ?", [
      id,
    ]);
    // MySQL 中检查 affectedRows 是否大于 0
    return result.affectedRows > 0;
  }
}
