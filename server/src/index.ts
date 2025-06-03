import express, { Request, Response, NextFunction } from "express";
// import { Logtail } from "@logtail/node";
import cors from "cors";
import { config } from "./config";
import userRoutes from "./routes/user";
import postRoutes from "./routes/post";
import homeRoutes from "./routes/home";
import { initializeDatabase } from "./config/database";
import adminRoutes from "./routes/admin"; // 👈 新增这行
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
app.use("/api/admin", adminRoutes); // 👈 新增这行

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

// User routes
app.use("/api/users", userRoutes);

// Post routes
app.use("/api/posts", postRoutes);

// Home routes
app.use("/api/home", homeRoutes);

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  log("error", "Error occurred", { error: err.message, stack: err.stack });
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = Number(config.port);

// 在启动服务器之前初始化数据库
initializeDatabase()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT} (0.0.0.0)`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database and start server:", error);
    process.exit(1);
  });
