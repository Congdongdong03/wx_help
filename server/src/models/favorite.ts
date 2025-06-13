import { getDb } from "../config/database";

export interface Favorite {
  id?: number;
  user_id: number;
  post_id: number;
  created_at?: Date;
}

export class FavoriteModel {
  static async create(userId: number, postId: number): Promise<Favorite> {
    const db = getDb();
    const [result]: any = await db.execute(
      "INSERT INTO favorites (user_id, post_id, created_at) VALUES (?, ?, ?)",
      [userId, postId, new Date()]
    );

    const [rows]: any = await db.execute(
      "SELECT * FROM favorites WHERE id = ?",
      [result.insertId]
    );

    return rows[0] as Favorite;
  }

  static async delete(userId: number, postId: number): Promise<boolean> {
    const db = getDb();
    const [result]: any = await db.execute(
      "DELETE FROM favorites WHERE user_id = ? AND post_id = ?",
      [userId, postId]
    );
    return result.affectedRows > 0;
  }

  static async findByUserAndPost(
    userId: number,
    postId: number
  ): Promise<Favorite | null> {
    const db = getDb();
    const [rows]: any = await db.execute(
      "SELECT * FROM favorites WHERE user_id = ? AND post_id = ?",
      [userId, postId]
    );
    return (rows[0] as Favorite) || null;
  }

  static async countByPost(postId: number): Promise<number> {
    const db = getDb();
    const [rows]: any = await db.execute(
      "SELECT COUNT(*) as count FROM favorites WHERE post_id = ?",
      [postId]
    );
    return rows[0].count;
  }
}
