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
    const result = await db.run(
      "INSERT INTO users (username, password, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [
        user.username,
        user.password,
        user.email,
        new Date().toISOString(),
        new Date().toISOString(),
      ]
    );
    // SQLite insertId 在 result.lastID
    const insertId = result.lastID;
    // 查询新插入的用户以返回完整信息（虽然这里通常不需要，但为了和 find 方法保持一致性）
    const newUser = await db.get("SELECT * FROM users WHERE id = ?", [
      insertId,
    ]);
    return newUser as User;
  }

  static async findByUsername(username: string): Promise<User | null> {
    const db = getDb();
    const row = await db.get("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    return (row as User) || null;
  }

  static async findById(id: number): Promise<User | null> {
    const db = getDb();
    const row = await db.get("SELECT * FROM users WHERE id = ?", [id]);
    return (row as User) || null;
  }
}
