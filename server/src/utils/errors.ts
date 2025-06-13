import { v4 as uuidv4 } from "uuid";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly trackingId: string;
  public readonly timestamp: Date;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.trackingId = uuidv4();
    this.timestamp = new Date();

    // 确保错误堆栈被正确捕获
    Error.captureStackTrace(this, this.constructor);

    // 记录错误
    this.logError();
  }

  private logError(): void {
    const errorLog = {
      trackingId: this.trackingId,
      timestamp: this.timestamp.toISOString(),
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      stack: this.stack,
    };

    // 根据环境选择日志输出方式
    if (process.env.NODE_ENV === "production") {
      // 在生产环境中，可以使用专门的日志服务
      console.error(JSON.stringify(errorLog));
    } else {
      // 在开发环境中，输出更详细的日志
      console.error("Error Details:", errorLog);
    }
  }

  public toJSON(): object {
    return {
      trackingId: this.trackingId,
      timestamp: this.timestamp.toISOString(),
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
    };
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 500, "DATABASE_ERROR");
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string) {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, "NOT_FOUND_ERROR");
  }
}

// 错误处理中间件
export const errorHandler = (err: Error, req: any, res: any, next: any) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.toJSON(),
    });
  }

  // 处理未知错误
  const unknownError = new AppError(
    "An unexpected error occurred",
    500,
    "INTERNAL_SERVER_ERROR"
  );

  return res.status(500).json({
    error: unknownError.toJSON(),
  });
};
