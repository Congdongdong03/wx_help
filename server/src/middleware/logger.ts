import { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import { config } from "../config";

// 自定义日志格式
const logFormat = (tokens: any, req: Request, res: Response) => {
  const method = tokens.method(req, res);
  const url = tokens.url(req, res);
  const status = tokens.status(req, res);
  const responseTime = tokens["response-time"](req, res);
  const userAgent = tokens["user-agent"](req, res);
  const ip = tokens["remote-addr"](req, res);
  const openid = req.headers["x-openid"] || "anonymous";

  return JSON.stringify({
    timestamp: new Date().toISOString(),
    method,
    url,
    status,
    responseTime: `${responseTime}ms`,
    userAgent,
    ip,
    openid,
  });
};

// 创建 Morgan 中间件
export const morganMiddleware = morgan(logFormat, {
  skip: (req: Request, res: Response) => {
    // 跳过静态文件请求
    return req.path.startsWith("/uploads/");
  },
});

// 请求日志中间件
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  // 请求完成时的回调
  res.on("finish", () => {
    const duration = Date.now() - start;
    const message = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      openid: req.headers["x-openid"] || "anonymous",
      userAgent: req.get("user-agent"),
    };

    // 根据状态码选择日志级别
    if (res.statusCode >= 500) {
      console.error("Request Error:", message);
    } else if (res.statusCode >= 400) {
      console.warn("Request Warning:", message);
    } else {
      console.info("Request Info:", message);
    }
  });

  next();
};

// 错误日志中间件
export const errorLogger = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const message = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    error: {
      name: err.name,
      message: err.message,
      stack: config.nodeEnv === "development" ? err.stack : undefined,
    },
    ip: req.ip,
    openid: req.headers["x-openid"] || "anonymous",
    userAgent: req.get("user-agent"),
  };

  console.error("Error Log:", message);
  next(err);
};
