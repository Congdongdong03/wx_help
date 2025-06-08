import { Request, Response } from "express";
import multer from "multer";
import path from "path";

// 设置上传目录
const UPLOAD_DIR = path.join(__dirname, "../public/uploads");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}${ext}`;
    cb(null, filename);
  },
});
const upload = multer({ storage });

// 确保目录存在
import fs from "fs";
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const uploadSingle = [
  upload.single("file"),
  (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    // 静态服务路径
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  },
];
