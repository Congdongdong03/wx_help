import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import { AuthenticatedRequest } from "../middleware/auth";
import fs from "fs";

// 设置上传目录
const UPLOAD_DIR = path.join(__dirname, "../public/uploads");

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log("Created upload directory:", UPLOAD_DIR);
  } catch (error) {
    console.error("Failed to create upload directory:", error);
    throw new Error("Failed to create upload directory");
  }
}

// 检查目录权限
try {
  fs.accessSync(UPLOAD_DIR, fs.constants.W_OK);
} catch (error) {
  console.error("Upload directory is not writable:", error);
  throw new Error("Upload directory is not writable");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      cb(null, UPLOAD_DIR);
    } catch (error) {
      console.error("Storage destination error:", error);
      cb(error as Error, UPLOAD_DIR);
    }
  },
  filename: (req, file, cb) => {
    try {
      const ext = path.extname(file.originalname);
      const filename = `${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}${ext}`;
      cb(null, filename);
    } catch (error) {
      console.error("Storage filename error:", error);
      cb(error as Error, "");
    }
  },
});

// 文件类型验证
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  try {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("只允许上传 JPG、PNG 和 GIF 格式的图片"));
    }
  } catch (error) {
    console.error("File filter error:", error);
    cb(error as Error);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export const uploadSingle = [
  upload.single("file"),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log("Upload request received:", {
        headers: req.headers,
        file: req.file,
        user: req.user,
      });

      // 开发环境判断
      const isDevelopment =
        process.env.NODE_ENV === "development" || !process.env.NODE_ENV;

      if (isDevelopment) {
        // 模拟一个开发环境的用户，只包含必要的属性
        req.user = {
          openid: "dev_openid_123",
          id: 1,
        };
        console.log("Development mode: Using mock user");
      } else {
        // 生产环境下检查 openid
        if (!req.user?.openid) {
          console.log("Production mode: No openid provided");
          return res.status(401).json({
            code: 401,
            message: "未提供 openid",
          });
        }
      }

      if (!req.file) {
        console.log("No file uploaded");
        return res.status(400).json({
          code: 1,
          message: "请选择要上传的图片",
        });
      }

      // 验证文件是否真实存在
      const filePath = path.join(UPLOAD_DIR, req.file.filename);
      if (!fs.existsSync(filePath)) {
        console.error("File not found after upload:", filePath);
        return res.status(500).json({
          code: 500,
          message: "文件上传失败",
        });
      }

      // 静态服务路径
      const url = `/uploads/${req.file.filename}`;
      console.log("File uploaded successfully:", {
        filename: req.file.filename,
        url: url,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: filePath,
      });

      res.json({
        code: 0,
        message: "上传成功",
        data: { url },
      });
    } catch (error) {
      console.error("Upload handler error:", error);
      // 如果文件已上传但处理失败，尝试删除文件
      if (req.file) {
        try {
          const filePath = path.join(UPLOAD_DIR, req.file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log("Cleaned up file after error:", filePath);
          }
        } catch (cleanupError) {
          console.error("Failed to cleanup file after error:", cleanupError);
        }
      }

      res.status(500).json({
        code: 500,
        message: "服务器内部错误",
        error: error instanceof Error ? error.message : "未知错误",
      });
    }
  },
];
