import mysql from "mysql2/promise";

const dbConfig = {
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "970325",
  database: "bangbang",
};

let dbInstance: mysql.Connection | null = null;

export const initializeDatabase = async (): Promise<mysql.Connection> => {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("MySQL database connected successfully.");

    // 创建用户表（如果不存在）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
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
        category VARCHAR(50),
        content TEXT,
        status VARCHAR(20) DEFAULT 'pending',
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

    // 自动补充 cities 表字段
    const [cityCols]: any = await connection.execute(
      "SHOW COLUMNS FROM cities LIKE 'is_active';"
    );
    if (cityCols.length === 0) {
      await connection.execute(
        "ALTER TABLE cities ADD COLUMN is_active BOOLEAN DEFAULT true;"
      );
      console.log("Added missing column 'is_active' to cities table.");
    }

    // 自动补充 recommendations 表字段
    const [recPinned]: any = await connection.execute(
      "SHOW COLUMNS FROM recommendations LIKE 'is_pinned';"
    );
    if (recPinned.length === 0) {
      await connection.execute(
        "ALTER TABLE recommendations ADD COLUMN is_pinned BOOLEAN DEFAULT false;"
      );
      console.log("Added missing column 'is_pinned' to recommendations table.");
    }
    const [recPrice]: any = await connection.execute(
      "SHOW COLUMNS FROM recommendations LIKE 'price';"
    );
    if (recPrice.length === 0) {
      await connection.execute(
        "ALTER TABLE recommendations ADD COLUMN price VARCHAR(50);"
      );
      console.log("Added missing column 'price' to recommendations table.");
    }
    const [recCity]: any = await connection.execute(
      "SHOW COLUMNS FROM recommendations LIKE 'city';"
    );
    if (recCity.length === 0) {
      await connection.execute(
        "ALTER TABLE recommendations ADD COLUMN city VARCHAR(50) DEFAULT '通用';"
      );
      console.log("Added missing column 'city' to recommendations table.");
    }

    // 插入一些初始城市数据
    await connection.execute(`
      INSERT IGNORE INTO cities (name, code, is_hot, sort_order, is_active) VALUES
      ('悉尼', 'sydney', true, 1, true),
      ('墨尔本', 'melbourne', true, 2, true),
      ('卧龙岗', 'wollongong', true, 3, true),
      ('布里斯班', 'brisbane', false, 4, true),
      ('珀斯', 'perth', false, 5, true),
      ('阿德莱德', 'adelaide', false, 6, true),
      ('堪培拉', 'canberra', false, 7, true),
      ('黄金海岸', 'goldcoast', false, 8, true),
      ('纽卡斯尔', 'newcastle', false, 9, true),
      ('霍巴特', 'hobart', false, 10, true);
    `);
    console.log("Initial cities data inserted.");

    // 插入一些初始推荐内容数据
    await connection.execute(`
      INSERT IGNORE INTO recommendations (title, description, image_url, category, sort_order, is_active, is_pinned, price, city) VALUES
      ('Coles & WWS 本周特价汇总', '点击查看本周Coles和Woolworths的最新折扣信息，省钱攻略不容错过！', '/images/recommendations/coles-wws.jpg', 'recommend', 1, true, true, '查看折扣', '通用'),
      ('校园跑腿', '校园内快速配送服务，帮你解决各种跑腿需求', '/images/recommendations/campus-delivery.jpg', 'help', 2, true, false, null, '悉尼'),
      ('代取快递', '帮你取快递，省时省力', '/images/recommendations/express.jpg', 'help', 3, true, false, null, '墨尔本'),
      ('代买早餐', '早起困难户的福音', '/images/recommendations/breakfast.jpg', 'help', 4, true, false, null, '卧龙岗'),
      ('代打印', '打印资料不用愁', '/images/recommendations/printing.jpg', 'help', 5, true, false, null, '悉尼');
    `);
    console.log("Initial recommendations data inserted.");

    dbInstance = connection;
    return dbInstance;
  } catch (error) {
    console.error("Failed to initialize MySQL database:", error);
    process.exit(1);
  }
};

// 在应用程序启动时调用这个函数来获取数据库实例
// let dbInstance: any; // 这里先用 any，后续如果需要可以在使用的地方定义更精确的类型
// initializeDatabase().then(db => { dbInstance = db; });

// 获取数据库实例
export const getDb = (): mysql.Connection => {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initializeDatabase first.");
  }
  return dbInstance;
};
