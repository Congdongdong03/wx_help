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

    // 创建用户表（如果不存在）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        openid VARCHAR(100) UNIQUE NOT NULL,
        nickname VARCHAR(100),
        avatar_url VARCHAR(255),
        phone VARCHAR(20),
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log("Users table checked/created.");

    // 创建帖子表（如果不存在）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        images TEXT,
        price VARCHAR(50),
        contact_info VARCHAR(255),
        city_code VARCHAR(20),
        status VARCHAR(20) DEFAULT 'active',
        view_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log("Posts table checked/created.");

    // 创建城市表（如果不存在）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        code VARCHAR(20) NOT NULL,
        is_hot BOOLEAN DEFAULT false,
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log("Cities table checked/created.");

    // 创建推荐内容表（如果不存在）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS recommendations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image_url VARCHAR(255),
        category VARCHAR(50),
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        is_pinned BOOLEAN DEFAULT false,
        price VARCHAR(50),
        city VARCHAR(50) DEFAULT '通用',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log("Recommendations table checked/created.");

    // 检查并更新表结构
    await updateTableStructures(connection);

    connection.release();
    poolInstance = pool;
    return poolInstance;
  } catch (error) {
    console.error("Failed to initialize MySQL database:", error);
    process.exit(1);
  }
};

// 更新表结构
async function updateTableStructures(connection: mysql.Connection) {
  try {
    // 检查 users 表是否需要更新
    const [userCols]: any = await connection.execute(
      "SHOW COLUMNS FROM users LIKE 'openid';"
    );
    if (userCols.length === 0) {
      // 如果表存在但没有 openid 字段，需要迁移数据
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN openid VARCHAR(100) UNIQUE,
        ADD COLUMN nickname VARCHAR(100),
        ADD COLUMN avatar_url VARCHAR(255),
        ADD COLUMN phone VARCHAR(20);
      `);
      console.log("Updated users table structure.");
    }

    // 检查 posts 表是否需要更新
    const [postCols]: any = await connection.execute(
      "SHOW COLUMNS FROM posts LIKE 'images';"
    );
    if (postCols.length === 0) {
      await connection.execute(`
        ALTER TABLE posts 
        ADD COLUMN images TEXT,
        ADD COLUMN price VARCHAR(50),
        ADD COLUMN contact_info VARCHAR(255),
        ADD COLUMN city_code VARCHAR(20),
        ADD COLUMN view_count INT DEFAULT 0;
      `);
      console.log("Updated posts table structure.");
    }

    // 检查 cities 表是否需要更新
    const [cityCols]: any = await connection.execute(
      "SHOW COLUMNS FROM cities LIKE 'is_active';"
    );
    if (cityCols.length === 0) {
      await connection.execute(
        "ALTER TABLE cities ADD COLUMN is_active BOOLEAN DEFAULT true;"
      );
      console.log("Updated cities table structure.");
    }

    // 检查 recommendations 表是否需要更新
    const [recCols]: any = await connection.execute(
      "SHOW COLUMNS FROM recommendations LIKE 'is_pinned';"
    );
    if (recCols.length === 0) {
      await connection.execute(`
        ALTER TABLE recommendations 
        ADD COLUMN is_pinned BOOLEAN DEFAULT false,
        ADD COLUMN price VARCHAR(50),
        ADD COLUMN city VARCHAR(50) DEFAULT '通用';
      `);
      console.log("Updated recommendations table structure.");
    }
  } catch (error) {
    console.error("Error updating table structures:", error);
    throw error;
  }
}

// 获取数据库实例
export const getDb = (): mysql.Pool => {
  if (!poolInstance) {
    throw new Error("Database not initialized. Call initializeDatabase first.");
  }
  return poolInstance;
};
