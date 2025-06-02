import { getDb } from "../config/database";

export interface User {
  id?: number;
  username: string;
  password: string;
  email: string;
  created_at?: Date;
  updated_at?: Date;
}

export class UserModel {
  static async create(user: User): Promise<User> {
    const db = getDb();
    const [result]: any = await db.execute(
      "INSERT INTO users (username, password, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [user.username, user.password, user.email, new Date(), new Date()]
    );
    // MySQL insertId 在 result.insertId
    const insertId = result.insertId;
    // 查询新插入的用户以返回完整信息
    const [rows]: any = await db.execute("SELECT * FROM users WHERE id = ?", [
      insertId,
    ]);
    return rows[0] as User;
  }

  static async findByUsername(username: string): Promise<User | null> {
    const db = getDb();
    const [rows]: any = await db.execute(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    return (rows[0] as User) || null;
  }

  static async findById(id: number): Promise<User | null> {
    const db = getDb();
    const [rows]: any = await db.execute("SELECT * FROM users WHERE id = ?", [
      id,
    ]);
    return (rows[0] as User) || null;
  }
}
