import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bangbang",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let poolInstance: mysql.Pool | null = null;

export const initializeDatabase = async (): Promise<mysql.Pool> => {
  if (poolInstance) {
    return poolInstance;
  }

  try {
    const pool = mysql.createPool(dbConfig);
    console.log("MySQL connection pool created successfully.");

    // 测试连接
    const connection = await pool.getConnection();
    console.log("MySQL database connected successfully.");

    connection.release();
    poolInstance = pool;
    return poolInstance;
  } catch (error) {
    console.error("Failed to initialize MySQL database:", error);
    process.exit(1);
  }
};

// 获取数据库实例
export const getDb = (): mysql.Pool => {
  if (!poolInstance) {
    throw new Error("Database not initialized. Call initializeDatabase first.");
  }
  return poolInstance;
};
