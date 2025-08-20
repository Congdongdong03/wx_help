import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { config } from "./config";
import userRoutes from "./routes/user";
import postRoutes from "./routes/post";
import homeRoutes from "./routes/home";
import adminRoutes from "./routes/admin";
import authRoutes from "./routes/auth";
import wxRoutes from "./routes/wx";
import conversationRoutes from "./routes/conversation";
import indexRoutes from "./routes/index";
// 移除旧的数据库初始化
// import { initializeDatabase } from "./config/database";

// 添加 Prisma 优雅关闭处理
import { disconnectPrisma } from "./lib/prisma";
import path from "path";
import fs from "fs";
import { requireAuth } from "./middleware/auth";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { RedisService } from "./services/redis";
import { createServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { WebSocketRouter } from "./routes/websocketRouter";
import { WebSocketController } from "./controllers/websocketController";
import { WebSocketService } from "./services/websocketService";

const app = express();
const server = createServer(app);
const PORT = Number(config.port); // 移到这里，在使用之前定义

// 扩展 WebSocket 类型，支持 userId
interface ExtWebSocket extends WebSocket {
  userId?: string;
}

// 初始化 WebSocket 服务
const wss = new WebSocketServer({ server });

// WebSocket 连接处理
wss.on("connection", function connection(ws: ExtWebSocket, req) {
  console.log("🔌 新 WebSocket 客户端连接:", req.socket.remoteAddress);

  // 处理连接建立
  WebSocketRouter.handleConnection(ws);

  // 处理消息
  ws.on("message", async function incoming(message) {
    await WebSocketRouter.routeMessage(ws, message.toString());
  });

  // 处理连接断开
  ws.on("close", function close() {
    WebSocketRouter.handleDisconnect(ws);
  });

  // 处理连接错误
  ws.on("error", function error(err) {
    WebSocketRouter.handleError(ws, err);
  });
});

// 注意：移除了定时清理任务
// 依赖 WebSocket 的 close 和 error 事件进行即时清理
// 这些事件应该能够准确捕捉到所有连接断开情况

import { log } from "./utils/logger";

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
// const IMAGES_PATH = path.join(PROJECT_ROOT, "public", "catalogue_images");
const IMAGES_PATH = path.join(__dirname, "../src/public/catalogue_images");

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
  express.static(path.join(__dirname, "public/catalogue_images"))
);

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
app.use("/api/conversations", conversationRoutes);
app.use("/api", indexRoutes);

// 添加 catalogue 路由
app.get("/api/catalogue/:store", (req: Request, res: Response) => {
  const { store } = req.params;
  const fs = require("fs");
  const path = require("path");
  const IMAGES_PATH = path.join(__dirname, "public", "catalogue_images");
  const storeDir = path.join(IMAGES_PATH, store);
  const PORT = process.env.PORT || 3000;
  const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

  try {
    if (!fs.existsSync(storeDir)) {
      return res.json({
        code: 0,
        message: "获取成功",
        data: [],
      });
    }

    const files = fs
      .readdirSync(storeDir)
      .filter((f: string) => f.endsWith(".jpg") || f.endsWith(".jpeg"))
      .sort()
      .map((file: string) => `${baseUrl}/catalogue_images/${store}/${file}`);

    res.json({
      code: 0,
      message: "获取成功",
      data: files,
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

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

// 添加从数据库获取目录图片的API路由
app.get("/api/catalogue-images", async (req: Request, res: Response) => {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    // 获取最新的目录图片，按商店和页码排序
    const images = await prisma.catalogue_images.findMany({
      orderBy: [
        { store_name: "asc" }, // coles在前，woolworths在后
        { page_number: "asc" }, // 页码从小到大
      ],
      select: {
        id: true,
        store_name: true,
        page_number: true,
        image_data: true,
        week_date: true,
      },
    });

    console.log("catalogue_images 查询结果:", images);

    console.log(`找到 ${images.length} 张目录图片`);

    // 只返回图片数据数组，按顺序排列
    const imageDataArray = images.map((img: any) => img.image_data);

    res.json({
      success: true,
      code: 0,
      message: "获取目录图片成功",
      data: imageDataArray,
      meta: {
        total: images.length,
        stores: [...new Set(images.map((img: any) => img.store_name))],
        lastUpdate: images.length > 0 ? images[0].week_date : null,
      },
    });

    await prisma.$disconnect();
  } catch (error: any) {
    console.error("获取目录图片失败:", error);
    res.status(500).json({
      success: false,
      code: 1,
      error: "获取目录图片失败",
      message: error.message,
      data: [],
    });
  }
});

// 健康检查接口
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// WebSocket 状态检查接口
app.get("/api/socket/status", (req, res) => {
  const clientCount = wss.clients.size;
  const onlineCount = WebSocketController.getOnlineCount();
  const diagnostics = WebSocketService.getConnectionDiagnostics();

  res.status(200).json({
    status: "running",
    clientCount,
    onlineCount,
    diagnostics,
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// WebSocket 手动清理接口（仅用于诊断和调试）
app.post("/api/socket/cleanup", (req, res) => {
  const beforeCount = WebSocketService.getOnlineCount();
  WebSocketService.cleanupDisconnectedUsers();
  const afterCount = WebSocketService.getOnlineCount();

  res.status(200).json({
    message: "手动清理完成",
    beforeCount,
    afterCount,
    cleanedCount: beforeCount - afterCount,
    timestamp: Date.now(),
  });
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
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT} (0.0.0.0)`);
  console.log("Using Prisma for database connections");
  console.log("✅ 图片服务已启用");
  console.log("🔗 测试链接:");
  console.log(
    `   - 调试API: http://localhost:${PORT}/api/debug/catalogue-images`
  );
  console.log(`   - 图片目录: http://localhost:${PORT}/catalogue_images/`);
});
