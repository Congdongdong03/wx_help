import express, { Request, Response, NextFunction } from "express";
// import { Logtail } from "@logtail/node";
import cors from "cors";
import { config } from "./config";
import userRoutes from "./routes/user";
import postRoutes from "./routes/post";
import homeRoutes from "./routes/home";
import adminRoutes from "./routes/admin";
// 移除旧的数据库初始化
// import { initializeDatabase } from "./config/database";

// 添加 Prisma 优雅关闭处理
import { disconnectPrisma } from "./lib/prisma";

const app = express();
// const logtail = new Logtail(config.logtailToken);

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
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  log("error", "Error occurred", { error: err.message, stack: err.stack });
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = Number(config.port);

// 优雅关闭处理
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Graceful shutdown...`);
  try {
    await disconnectPrisma();
    console.log("Database connections closed.");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
};

// 监听关闭信号
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// 直接启动服务器（不需要数据库初始化）
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT} (0.0.0.0)`);
  console.log("Using Prisma for database connections");
});
