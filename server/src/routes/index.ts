import { Router } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { uploadSingle } from "../controllers/upload";
import { getCities, getRecommendations } from "../controllers/home";
import { PostController } from "../controllers/post";
import { UserController } from "../controllers/user";
import conversationRouter from "./conversation";
import adminRouter from "./admin";
import feedbackRouter from "./feedback";
import statisticsRouter from "./statistics";
import exportRouter from "./export";
import { log } from "../utils/logger";

import { prisma } from "../lib/prisma";

console.log("==== index.ts loaded ====");

const router = Router();

// 公开路由
router.get("/home/cities", getCities);
router.get("/home/recommendations", getRecommendations);
router.get("/posts", PostController.getPosts);
router.get("/posts/:id", PostController.getPostDetail);
router.get("/catalogue/:store", (req, res) => {
  // 获取指定商店的catalogue图片列表
  const { store } = req.params;
  const fs = require("fs");
  const path = require("path");

  try {
    const IMAGES_PATH = path.join(__dirname, "../public/catalogue_images");
    const storeDir = path.join(IMAGES_PATH, store);

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
      .sort();

    res.json({
      code: 0,
      message: "获取成功",
      data: files,
    });
  } catch (error) {
    log("error", "getCatalogueImages: Error", {
      message: error instanceof Error ? error.message : String(error),
      store,
    });
    res.status(500).json({
      code: 1,
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// 添加PDF文件查看路由
router.get("/catalogue-pdf/:store", (req, res) => {
  const { store } = req.params;
  const fs = require("fs");
  const path = require("path");

  try {
    const IMAGES_PATH = path.join(__dirname, "../public/catalogue_images");
    const storeDir = path.join(IMAGES_PATH, store);

    if (!fs.existsSync(storeDir)) {
      return res.status(404).json({
        code: 1,
        message: "目录不存在",
      });
    }

    // 查找最新的PDF文件
    const files = fs
      .readdirSync(storeDir)
      .filter((f: string) => f.endsWith(".pdf"))
      .sort()
      .reverse(); // 最新的在前面

    if (files.length === 0) {
      return res.status(404).json({
        code: 1,
        message: "没有找到PDF文件",
      });
    }

    const latestPdf = files[0];
    const pdfPath = path.join(storeDir, latestPdf);

    // 设置响应头
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${latestPdf}"`);

    // 发送PDF文件
    const pdfStream = fs.createReadStream(pdfPath);
    pdfStream.pipe(res);
  } catch (error) {
    log("error", "getCataloguePDF: Error", {
      message: error instanceof Error ? error.message : String(error),
      store,
    });
    res.status(500).json({
      code: 1,
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// 需要认证的路由
router.post("/posts/upload", requireAuth, uploadSingle);
router.post("/posts", requireAuth, PostController.createPost);
router.put("/posts/:id", requireAuth, PostController.updatePost);
router.delete("/posts/:id", requireAuth, PostController.deletePost);

// 临时添加反馈路由到主路由文件
router.post("/feedback-submit", async (req, res) => {
  try {
    console.log("收到反馈：", req.body);

    const { content, type = "advice", image } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "反馈内容不能为空",
      });
    }

    // 这里暂时使用默认用户ID，实际应该从认证中获取
    const userId = 1; // TODO: 从 req.user 获取真实用户ID

    const feedback = await prisma.feedback.create({
      data: {
        user_id: userId,
        content: content.trim(),
        type: type,
        image: image || null,
        status: 0, // 未处理
      },
    });

    console.log("反馈已保存到数据库：", feedback);

    res.json({
      success: true,
      message: "反馈提交成功",
      data: { id: feedback.id },
    });
  } catch (error) {
    console.error("保存反馈失败：", error);
    res.status(500).json({
      success: false,
      message: "提交失败，请稍后重试",
    });
  }
});

// 用户相关路由
router.get("/user/info", requireAuth, UserController.getUserInfo);
router.put("/user/info", requireAuth, UserController.updateUserInfo);
router.post("/user/logout", requireAuth, UserController.logout);

// 会话相关路由
router.use("/conversations", conversationRouter);

// 反馈相关路由
// router.use("/feedback", feedbackRouter);

// 管理员路由
router.use("/admin", adminRouter);

// 统计路由
router.use("/statistics", statisticsRouter);

// 导出路由
router.use("/export", exportRouter);

export default router;
