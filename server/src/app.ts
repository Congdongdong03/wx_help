import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { RedisService } from "./services/redis";
import routes from "./routes";

const app = express();

// 基础中间件
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use(
  "/catalogue_images",
  express.static(path.join(__dirname, "public/catalogue_images"))
);

// API 路由
app.use("/api", routes);

// 错误处理中间件
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      code: 500,
      message: "服务器内部错误",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
);

// 启动 Redis 同步任务
RedisService.startSyncJob();

// 优雅关闭
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await RedisService.shutdown();
  process.exit(0);
});

export default app;
