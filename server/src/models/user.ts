import { pool } from "../config/database";

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
    const [result] = await pool.execute(
      "INSERT INTO users (username, password, email) VALUES (?, ?, ?)",
      [user.username, user.password, user.email]
    );
    return user;
  }

  static async findByUsername(username: string): Promise<User | null> {
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    return (rows as User[])[0] || null;
  }

  static async findById(id: number): Promise<User | null> {
    const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [id]);
    return (rows as User[])[0] || null;
  }
}
