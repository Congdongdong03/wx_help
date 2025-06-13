import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
// import { Logtail } from "@logtail/node";
import cors from "cors";
import { config } from "./config";
import userRoutes from "./routes/user";
import postRoutes from "./routes/post";
import homeRoutes from "./routes/home";
import adminRoutes from "./routes/admin";
import authRoutes from "./routes/auth";
import wxRoutes from "./routes/wx";
// 移除旧的数据库初始化
// import { initializeDatabase } from "./config/database";

// 添加 Prisma 优雅关闭处理
import { disconnectPrisma } from "./lib/prisma";
import path from "path";
import fs from "fs";
import { requireAuth } from "./middleware/auth";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { RedisService } from "./services/redis";

const app = express();
const PORT = Number(config.port); // 移到这里，在使用之前定义

// 简单的日志辅助函数
const log = (
  level: "info" | "error" | "warn" | "debug",
  message: string,
  data?: any
) => {
  console[level](message, data);
};

// Middleware
app.use(
  cors({
    origin: "*", // 允许所有域名，生产环境建议指定具体域名
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-openid"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 添加图片服务配置
const PROJECT_ROOT = __dirname;
const IMAGES_PATH = path.join(PROJECT_ROOT, "public", "catalogue_images");

console.log("📁 项目根目录:", PROJECT_ROOT);
console.log("🖼️ 图片目录:", IMAGES_PATH);

// 确保目录存在
if (!fs.existsSync(IMAGES_PATH)) {
  fs.mkdirSync(IMAGES_PATH, { recursive: true });
  console.log("✅ 已创建图片目录");
}

// 静态文件服务
app.use(
  "/catalogue_images",
  express.static(IMAGES_PATH, {
    setHeaders: (res) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Cache-Control", "public, max-age=31536000");
    },
  })
);
// 新增上传图片静态服务
app.use(
  "/uploads",
  express.static(path.join(PROJECT_ROOT, "public", "uploads"), {
    setHeaders: (res) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Cache-Control", "public, max-age=31536000");
    },
  })
);

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  log("info", "Incoming request", {
    method: req.method,
    path: req.path,
    body: req.body,
  });
  next();
});

// Routes
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Welcome to the API" });
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/wx", wxRoutes);

// 添加图片调试路由
app.get("/api/debug/catalogue-images", (req: Request, res: Response) => {
  try {
    const colesDir = path.join(IMAGES_PATH, "coles");
    const woolworthsDir = path.join(IMAGES_PATH, "woolworths");

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      paths: {
        project_root: PROJECT_ROOT,
        images_path: IMAGES_PATH,
        coles_dir: colesDir,
        woolworths_dir: woolworthsDir,
      },
      stores: {} as any,
    };

    // 检查Coles目录
    if (fs.existsSync(colesDir)) {
      const colesFiles = fs
        .readdirSync(colesDir)
        .filter((file) => file.endsWith(".jpg") || file.endsWith(".jpeg"))
        .sort();

      result.stores.coles = {
        exists: true,
        count: colesFiles.length,
        files: colesFiles.map((file) => ({
          filename: file,
          url: `http://localhost:${PORT}/catalogue_images/coles/${file}`,
          size: fs.statSync(path.join(colesDir, file)).size,
        })),
      };
    } else {
      result.stores.coles = { exists: false, error: "Coles目录不存在" };
    }

    // 检查Woolworths目录
    if (fs.existsSync(woolworthsDir)) {
      const woolworthsFiles = fs
        .readdirSync(woolworthsDir)
        .filter((file) => file.endsWith(".jpg") || file.endsWith(".jpeg"))
        .sort();

      result.stores.woolworths = {
        exists: true,
        count: woolworthsFiles.length,
        files: woolworthsFiles.map((file) => ({
          filename: file,
          url: `http://localhost:${PORT}/catalogue_images/woolworths/${file}`,
          size: fs.statSync(path.join(woolworthsDir, file)).size,
        })),
      };
    } else {
      result.stores.woolworths = {
        exists: false,
        error: "Woolworths目录不存在",
      };
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 健康检查接口
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// 错误处理中间件
app.use(notFoundHandler);
app.use(errorHandler);

// 优雅关闭处理
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Graceful shutdown...`);
  try {
    await disconnectPrisma();
    console.log("Database connections closed.");
    await RedisService.shutdown();
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
};

// 监听关闭信号
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// 启动 Redis 同步任务
RedisService.startSyncJob();

// 直接启动服务器（不需要数据库初始化）
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT} (0.0.0.0)`);
  console.log("Using Prisma for database connections");
  console.log("✅ 图片服务已启用");
  console.log("🔗 测试链接:");
  console.log(
    `   - 调试API: http://localhost:${PORT}/api/debug/catalogue-images`
  );
  console.log(`   - 图片目录: http://localhost:${PORT}/catalogue_images/`);
});
