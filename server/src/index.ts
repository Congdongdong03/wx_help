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
import conversationRoutes from "./routes/conversation";
// 移除旧的数据库初始化
// import { initializeDatabase } from "./config/database";

// 添加 Prisma 优雅关闭处理
import { disconnectPrisma } from "./lib/prisma";
import path from "path";
import fs from "fs";
import { requireAuth } from "./middleware/auth";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { RedisService } from "./services/redis";
// import { socketService } from "./services/socket"; // 已移除 socket.io 相关代码
import { createServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { messageService } from "./services/messageService";
import { prisma } from "./lib/prisma";

const app = express();
const server = createServer(app);
const PORT = Number(config.port); // 移到这里，在使用之前定义

// 扩展 WebSocket 类型，支持 userId
interface ExtWebSocket extends WebSocket {
  userId?: string;
}

// 初始化 WebSocket 服务
const wss = new WebSocketServer({ server });

// 维护用户映射：userId => ws
const userMap = new Map<string, ExtWebSocket>();

// WebSocket 连接处理
wss.on("connection", function connection(ws: ExtWebSocket, req) {
  console.log("🔌 新 WebSocket 客户端连接:", req.socket.remoteAddress);

  // 为每个连接添加 userId 属性
  ws.userId = undefined;

  // 发送欢迎消息
  ws.send(
    JSON.stringify({
      type: "system",
      content: "欢迎连接 WebSocket 服务器！",
      timestamp: Date.now(),
    })
  );

  ws.on("message", async function incoming(message) {
    try {
      const data = JSON.parse(message.toString());
      console.log("📨 收到 WebSocket 消息:", data);

      // 处理不同类型的消息
      switch (data.type) {
        case "auth":
          console.log("🔐 用户认证:", data.userId);
          ws.userId = data.userId;
          userMap.set(data.userId, ws);
          ws.send(
            JSON.stringify({
              type: "auth_success",
              userId: data.userId,
              timestamp: Date.now(),
            })
          );
          console.log("📊 当前在线用户:", Array.from(userMap.keys()));

          // === 新增：推送未读消息 ===
          if (
            data.userId === "dev_openid_123" ||
            data.userId === "test_user_2"
          ) {
            try {
              const unreadMessages = await prisma.message.findMany({
                where: {
                  receiverId: data.userId,
                  isRead: false,
                },
                orderBy: { createdAt: "asc" },
              });

              for (const msg of unreadMessages) {
                ws.send(
                  JSON.stringify({
                    type: "chat",
                    content: msg.content,
                    senderId: msg.senderId,
                    toUserId: msg.receiverId,
                    conversationId: msg.conversationId,
                    messageType: msg.type || "text", // 添加消息类型
                    timestamp: msg.createdAt,
                    messageId: msg.id,
                    offline: true, // 标记为离线消息
                  })
                );
              }

              // 推送后批量标记为已读
              if (unreadMessages.length > 0) {
                await prisma.message.updateMany({
                  where: {
                    id: { in: unreadMessages.map((m) => m.id) },
                  },
                  data: { isRead: true },
                });
              }
            } catch (err) {
              console.error("推送未读消息失败:", err);
            }
          }
          break;

        case "sendMessage":
          console.log("📤 处理发送消息:", data);
          // 1. 保存消息到数据库
          const savedMsg = await messageService.sendMessage(
            data.conversationId, // 会话ID
            ws.userId!, // 发送者
            data.toUserId, // 接收者
            data.content, // 内容
            data.messageType || data.type || "text" // 消息类型，支持messageType和type字段
          );

          // 2. 如果对方在线，推送
          const targetWs = userMap.get(data.toUserId);
          if (targetWs && targetWs.readyState === 1) {
            targetWs.send(
              JSON.stringify({
                type: "chat",
                content: data.content,
                senderId: ws.userId,
                toUserId: data.toUserId,
                conversationId: data.conversationId,
                messageType: data.messageType || data.type || "text", // 添加消息类型
                timestamp: savedMsg.createdAt,
                messageId: savedMsg.id,
                clientTempId: data.clientTempId || null,
              })
            );
            console.log(`✅ 消息已发送给用户: ${data.toUserId}`);
          } else {
            console.log(`💾 目标用户 ${data.toUserId} 不在线，消息已存数据库`);
            // 不推送，只写库
          }

          // 3. 推送给自己（发送者）——回显
          if (ws.readyState === 1) {
            ws.send(
              JSON.stringify({
                type: "chat",
                content: data.content,
                senderId: ws.userId,
                toUserId: data.toUserId,
                conversationId: data.conversationId,
                messageType: data.messageType || data.type || "text", // 添加消息类型
                timestamp: savedMsg.createdAt,
                messageId: savedMsg.id,
                clientTempId: data.clientTempId || null,
              })
            );
          }
          break;

        // 处理直接发送的消息类型（text, image）
        case "text":
        case "image":
          console.log(`📤 处理直接发送的${data.type}消息:`, data);
          if (data.conversationId && data.toUserId && data.content) {
            // 1. 保存消息到数据库
            const savedMsg = await messageService.sendMessage(
              data.conversationId,
              ws.userId!,
              data.toUserId,
              data.content,
              data.type
            );

            // 2. 如果对方在线，推送
            const targetWs = userMap.get(data.toUserId);
            if (targetWs && targetWs.readyState === 1) {
              targetWs.send(
                JSON.stringify({
                  type: "chat",
                  content: data.content,
                  senderId: ws.userId,
                  toUserId: data.toUserId,
                  conversationId: data.conversationId,
                  messageType: data.type,
                  timestamp: savedMsg.createdAt,
                  messageId: savedMsg.id,
                  clientTempId: data.clientTempId || null,
                })
              );
              console.log(`✅ ${data.type}消息已发送给用户: ${data.toUserId}`);
            } else {
              console.log(
                `💾 目标用户 ${data.toUserId} 不在线，${data.type}消息已存数据库`
              );
            }

            // 3. 推送给自己（发送者）——回显
            if (ws.readyState === 1) {
              ws.send(
                JSON.stringify({
                  type: "chat",
                  content: data.content,
                  senderId: ws.userId,
                  toUserId: data.toUserId,
                  conversationId: data.conversationId,
                  messageType: data.type,
                  timestamp: savedMsg.createdAt,
                  messageId: savedMsg.id,
                  clientTempId: data.clientTempId || null,
                })
              );
            }
          } else {
            console.error("❌ 消息格式不完整，缺少必要字段");
          }
          break;

        case "typing":
          console.log("⌨️ 用户正在输入:", data.conversationId);
          // 可以在这里实现输入状态推送
          break;

        case "stopTyping":
          console.log("⌨️ 用户停止输入:", data.conversationId);
          // 可以在这里实现停止输入状态推送
          break;

        case "joinRoom":
          console.log("🚪 加入房间:", data.conversationId);
          ws.send(
            JSON.stringify({
              type: "room_joined",
              conversationId: data.conversationId,
              timestamp: Date.now(),
            })
          );
          break;

        case "leaveRoom":
          console.log("🚪 离开房间:", data.conversationId);
          ws.send(
            JSON.stringify({
              type: "room_left",
              conversationId: data.conversationId,
              timestamp: Date.now(),
            })
          );
          break;

        case "requestOnlineStatus":
          console.log("📊 请求在线状态:", data.conversationId);
          // 计算当前在线用户数量
          const onlineCount = userMap.size;
          ws.send(
            JSON.stringify({
              type: "onlineStatus",
              conversationId: data.conversationId,
              onlineCount: onlineCount,
              timestamp: Date.now(),
            })
          );
          break;

        default:
          console.log("❓ 未知消息类型:", data.type);
      }
    } catch (e) {
      console.error("❌ WebSocket 消息解析失败:", e);
      ws.send(
        JSON.stringify({
          type: "error",
          content: "消息格式错误",
          timestamp: Date.now(),
        })
      );
    }
  });

  ws.on("close", function close() {
    console.log("🔌 WebSocket 客户端断开连接");
    if (ws.userId) {
      userMap.delete(ws.userId);
      console.log(`👤 用户 ${ws.userId} 已离线`);
      console.log("📊 当前在线用户:", Array.from(userMap.keys()));
    }
  });

  ws.on("error", function error(err) {
    console.error("❌ WebSocket 错误:", err);
    if (ws.userId) {
      userMap.delete(ws.userId);
    }
  });
});

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
app.use("/api/conversations", conversationRoutes);

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

// WebSocket 状态检查接口
app.get("/api/socket/status", (req, res) => {
  const clientCount = wss.clients.size;
  res.status(200).json({
    status: "running",
    clientCount,
    uptime: process.uptime(),
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
