export const config = {
  // 服务器配置
  port: parseInt(process.env.PORT || "3000"),
  nodeEnv: process.env.NODE_ENV || "development",

  // 数据库配置
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "bangbang",
  },

  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || "",
  },

  // 文件上传配置
  upload: {
    dir: process.env.UPLOAD_DIR || "src/public/uploads",
    maxSize: parseInt(process.env.MAX_FILE_SIZE || "5242880"), // 5MB
    allowedTypes: ["image/jpeg", "image/png", "image/gif"],
  },

  // 安全配置
  security: {
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || "15") * 60 * 1000, // 15分钟
      max: parseInt(process.env.RATE_LIMIT_MAX || "100"), // 100次请求
    },
  },

  // 日志配置
  logtailToken: process.env.LOGTAIL_TOKEN || "",
};
