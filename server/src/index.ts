import express, { Request, Response, NextFunction } from "express";
// import { Logtail } from "@logtail/node";
import cors from "cors";
import { config } from "./config";
import userRoutes from "./routes/user";
import postRoutes from "./routes/post";
import { initializeDatabase } from "./config/database";

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
app.use(cors());
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

// User routes
app.use("/api/users", userRoutes);

// Post routes
app.use("/api/posts", postRoutes);

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  log("error", "Error occurred", { error: err.message, stack: err.stack });
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = config.port;

// 在启动服务器之前初始化数据库
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database and start server:", error);
    process.exit(1);
  });
