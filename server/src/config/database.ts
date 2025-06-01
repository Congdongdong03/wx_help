import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

const dbPath = "./wx_help.sqlite"; // SQLite数据库文件路径

let dbInstance: Database | null = null; // 用于存储数据库实例

export const initializeDatabase = async (): Promise<Database> => {
  if (dbInstance) {
    return dbInstance; // 如果已初始化，直接返回现有实例
  }

  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    console.log("SQLite database opened successfully.");

    // 创建用户表（如果不存在）
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Users table checked/created.");

    // 创建帖子表（如果不存在）
    await db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        category TEXT,
        content TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log("Posts table checked/created.");

    dbInstance = db; // 存储数据库实例
    return dbInstance;
  } catch (error) {
    console.error("Failed to initialize SQLite database:", error);
    process.exit(1);
  }
};

// 在应用程序启动时调用这个函数来获取数据库实例
// let dbInstance: any; // 这里先用 any，后续如果需要可以在使用的地方定义更精确的类型
// initializeDatabase().then(db => { dbInstance = db; });

// 获取数据库实例
export const getDb = (): Database => {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initializeDatabase first.");
  }
  return dbInstance;
};
