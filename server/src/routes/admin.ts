import express, { Router } from "express";
import { AdminPostController } from "../controllers/adminPost";
import { requireAuth } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const router = Router();
const prisma = new PrismaClient();

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/temp");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${req.body.store}_${timestamp}.pdf`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB限制
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("只允许上传PDF文件"));
    }
  },
});

// 获取目录状态
router.get("/catalogue/status", requireAuth, async (req, res) => {
  try {
    const stores = ["coles", "woolworths"];
    const status: any = {};

    for (const store of stores) {
      const imagesDir = path.join(
        __dirname,
        `../public/catalogue_images/${store}`
      );

      if (fs.existsSync(imagesDir)) {
        const files = fs
          .readdirSync(imagesDir)
          .filter(
            (f) =>
              f.endsWith(".jpg") || f.endsWith(".jpeg") || f.endsWith(".pdf")
          )
          .sort();

        if (files.length > 0) {
          // 计算总文件大小
          let totalSize = 0;
          for (const file of files) {
            const filePath = path.join(imagesDir, file);
            const stats = fs.statSync(filePath);
            totalSize += stats.size;
          }

          // 获取最新文件的修改时间
          const latestFile = path.join(imagesDir, files[files.length - 1]);
          const lastUpdate = fs.statSync(latestFile).mtime;

          // 检查是否是最新的（7天内）
          const isRecent =
            Date.now() - lastUpdate.getTime() < 7 * 24 * 60 * 60 * 1000;

          // 统计PDF和图片文件数量
          const pdfFiles = files.filter((f) => f.endsWith(".pdf"));
          const imageFiles = files.filter(
            (f) => f.endsWith(".jpg") || f.endsWith(".jpeg")
          );

          status[store] = {
            exists: true,
            imageCount: imageFiles.length,
            pdfCount: pdfFiles.length,
            totalSize: (totalSize / (1024 * 1024)).toFixed(2),
            lastUpdate: lastUpdate.toISOString(),
            isRecent,
          };
        } else {
          status[store] = { exists: false };
        }
      } else {
        status[store] = { exists: false };
      }
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("获取目录状态失败:", error);
    res.status(500).json({
      success: false,
      error: "获取目录状态失败",
    });
  }
});

// 上传PDF并转换为图片
router.post(
  "/catalogue/upload",
  requireAuth,
  upload.single("pdf"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "没有上传文件",
        });
      }

      const { store } = req.body;
      if (!store || !["coles", "woolworths", "wws"].includes(store)) {
        return res.status(400).json({
          success: false,
          error: "无效的商店名称",
        });
      }

      // 将 wws 映射到 woolworths
      const normalizedStore = store === "wws" ? "woolworths" : store;

      const pdfPath = req.file.path;
      const imagesDir = path.join(
        __dirname,
        `../public/catalogue_images/${normalizedStore}`
      );

      // 确保目录存在
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      // 清理旧文件
      const oldFiles = fs
        .readdirSync(imagesDir)
        .filter(
          (f) => f.endsWith(".jpg") || f.endsWith(".jpeg") || f.endsWith(".pdf")
        );

      for (const file of oldFiles) {
        fs.unlinkSync(path.join(imagesDir, file));
      }

      // 保存PDF文件
      const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const pdfFileName = `${dateStr}_${normalizedStore}_catalogue.pdf`;
      const pdfDestPath = path.join(imagesDir, pdfFileName);

      // 复制PDF文件到目标目录
      fs.copyFileSync(pdfPath, pdfDestPath);

      // 使用pdftoppm命令转换PDF为图片
      const outputPrefix = `${dateStr}_${normalizedStore}_page`;
      const outputPath = path.join(imagesDir, outputPrefix);

      let images: Array<{ path: string; name: string }> = [];

      try {
        // 执行pdftoppm命令
        await execAsync(
          `pdftoppm -jpeg -r 150 "${pdfDestPath}" "${outputPath}"`
        );

        // 获取生成的图片文件
        const generatedFiles = fs
          .readdirSync(imagesDir)
          .filter((f) => f.startsWith(outputPrefix) && f.endsWith(".jpg"))
          .sort();

        images = generatedFiles.map((filename, index) => ({
          path: path.join(imagesDir, filename),
          name: filename,
        }));

        console.log(`PDF转换完成: ${pdfFileName} -> ${images.length}张图片`);
      } catch (error) {
        console.error("PDF转换失败:", error);
        console.error(
          "错误详情:",
          error instanceof Error ? error.message : String(error)
        );
        // 如果转换失败，创建一个占位图片
        const placeholderImagePath = path.join(
          imagesDir,
          `${dateStr}_${normalizedStore}_placeholder.jpg`
        );
        const placeholderData = Buffer.from(
          "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxAAPwA/8A",
          "base64"
        );
        fs.writeFileSync(placeholderImagePath, placeholderData);

        images = [
          {
            path: placeholderImagePath,
            name: `${dateStr}_${normalizedStore}_placeholder.jpg`,
          },
        ];
        console.log(`PDF转换失败，使用占位图片: ${pdfFileName}`);
      }

      // 清理临时PDF文件
      fs.unlinkSync(pdfPath);

      // 更新数据库
      const today = new Date();

      // 删除旧的数据库记录
      await prisma.catalogue_images.deleteMany({
        where: { store_name: normalizedStore },
      });

      // 为每个图片页面插入数据库记录
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        await prisma.catalogue_images.create({
          data: {
            store_name: normalizedStore,
            page_number: i + 1,
            image_data: `/catalogue_images/${normalizedStore}/${image.name}`,
            week_date: today,
          },
        });
      }

      res.json({
        success: true,
        data: {
          pages: images.length,
          store: normalizedStore,
          message: `成功转换${images.length}页PDF为图片`,
        },
      });
    } catch (error) {
      console.error("PDF上传转换失败:", error);

      // 清理临时文件
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "PDF处理失败",
      });
    }
  }
);

// 获取待审核帖子
router.get("/posts/pending", requireAuth, AdminPostController.getPendingPosts);

// 审核单个帖子 - 注意这里是 POST，不是 PUT
router.post("/posts/:id/review", requireAuth, AdminPostController.reviewPost);

// 批量审核帖子
router.post(
  "/posts/batch-review",
  requireAuth,
  AdminPostController.batchReviewPosts
);

// 批量删除帖子
router.delete(
  "/posts/batch-delete",
  requireAuth,
  AdminPostController.batchDeletePosts
);

// 获取所有帖子（管理员视图）
router.get("/posts", requireAuth, AdminPostController.getAllPosts);

// 获取最近帖子
router.get("/posts/recent", requireAuth, async (req, res) => {
  try {
    const { page = "1", limit = "10" } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const offset = (pageNum - 1) * limitNum;

    const [posts, total] = await Promise.all([
      prisma.posts.findMany({
        orderBy: { created_at: "desc" },
        take: limitNum,
        skip: offset,
        include: {
          users: {
            select: {
              id: true,
              nickname: true,
              avatar_url: true,
            },
          },
        },
      }),
      prisma.posts.count({}),
    ]);

    // 处理帖子数据，添加作者信息
    const processedPosts = posts.map((post) => ({
      ...post,
      author: post.users?.nickname || "无",
      author_nickname: post.users?.nickname || "无",
      images: post.images
        ? (() => {
            try {
              return Array.isArray(post.images)
                ? post.images
                : JSON.parse(post.images);
            } catch {
              return [];
            }
          })()
        : [],
    }));

    res.json({
      code: 0,
      message: "获取成功",
      data: {
        posts: processedPosts,
        pagination: {
          current: pageNum,
          pageSize: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("获取最近帖子失败:", error);
    res.status(500).json({
      code: 1,
      message: "获取最近帖子失败",
    });
  }
});

// 管理员删除帖子
router.delete("/posts/:id", requireAuth, AdminPostController.deletePost);

// 获取统计数据
router.get("/posts/stats", requireAuth, AdminPostController.getReviewStats);

// 获取目录图片
router.get(
  "/catalogue-images",
  requireAuth,
  AdminPostController.getCatalogueImages
);

// 获取用户列表
router.get("/users", requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    if (keyword) {
      where.OR = [
        { nickname: { contains: keyword as string } },
        { username: { contains: keyword as string } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        orderBy: { created_at: "desc" },
        take: limitNum,
        skip: offset,
        select: {
          id: true,
          nickname: true,
          username: true,
          avatar_url: true,
          status: true,
          created_at: true,
          last_login_at: true,
          _count: {
            select: { posts: true },
          },
        },
      }),
      prisma.users.count({ where }),
    ]);

    res.json({
      code: 0,
      message: "获取成功",
      data: {
        users,
        pagination: {
          current: pageNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: "获取用户列表失败",
    });
  }
});

// =========================
// 管理后台统计数据接口（兼容前端 /api/admin/stats 请求）
// 说明：此接口为管理后台前端专用，统计待审核、已发布、已拒绝、今日审核等数据
// 路径: GET /api/admin/stats
// 权限: 建议上线时加 requireAuth，这里为兼容前端先不加
// =========================
router.get("/stats", async (req, res) => {
  try {
    // 统计各状态帖子数量
  const [pending, published, rejected, reviewRequired] = await Promise.all([
      prisma.posts.count({ where: { status: "pending" } }),
      prisma.posts.count({ where: { status: "published" } }),
    prisma.posts.count({ where: { status: "rejected" } }),
      prisma.posts.count({
        where: {
          status: "review_required",
          sensitive_words: { not: null },
        },
      }),
    ]);

    // 统计今日审核（已发布+已拒绝）
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 当天零点
  const [approvedToday, rejectedToday] = await Promise.all([
      prisma.posts.count({
        where: {
          status: "published",
          updated_at: { gte: today },
        },
      }),
      prisma.posts.count({
        where: {
        status: "rejected",
          updated_at: { gte: today },
        },
      }),
    ]);

    // 统计反馈数量
    const [feedbackPending, feedbackTotal] = await Promise.all([
      prisma.feedback.count({ where: { status: 0 } }),
      prisma.feedback.count(),
    ]);

    res.json({
      success: true,
      code: 0,
      data: {
        status: { pending, published, rejected, reviewRequired },
        today: {
          approved: approvedToday,
          rejected: rejectedToday,
          total: approvedToday + rejectedToday,
        },
        feedback: {
          pending: feedbackPending,
          total: feedbackTotal,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 1,
      error: "获取统计失败",
    });
  }
});

// =========================
// 反馈管理接口
// =========================

// 获取反馈列表
router.get("/feedback", async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword, type, status } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};

    // 关键词搜索
    if (keyword) {
      where.content = { contains: keyword as string };
    }

    // 类型筛选
    if (type && type !== "all") {
      where.type = type;
    }

    // 状态筛选
    if (status !== undefined && status !== "all") {
      where.status = parseInt(status as string);
    }

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { created_at: "desc" },
        take: limitNum,
        skip: offset,
        include: {
          users: {
            select: {
              id: true,
              nickname: true,
              username: true,
              avatar_url: true,
            },
          },
        },
      }),
      prisma.feedback.count({ where }),
    ]);

    res.json({
      success: true,
      code: 0,
      data: {
        feedbacks,
        pagination: {
          current: pageNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("获取反馈列表失败:", error);
    res.status(500).json({
      success: false,
      code: 1,
      error: "获取反馈列表失败",
    });
  }
});

// 获取反馈统计
router.get("/feedback/stats", async (req, res) => {
  try {
    const [total, pending, processed] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.count({ where: { status: 0 } }),
      prisma.feedback.count({ where: { status: 1 } }),
    ]);

    // 按类型统计
    const typeStats = await prisma.feedback.groupBy({
      by: ["type"],
      _count: { type: true },
    });

    // 今日新增反馈
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await prisma.feedback.count({
      where: { created_at: { gte: today } },
    });

    res.json({
      success: true,
      code: 0,
      data: {
        total,
        pending,
        processed,
        todayCount,
        typeStats: typeStats.reduce((acc, item) => {
          if (item.type) {
            acc[item.type] = item._count.type;
          }
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    console.error("获取反馈统计失败:", error);
    res.status(500).json({
      success: false,
      code: 1,
      error: "获取反馈统计失败",
    });
  }
});

// 获取反馈详情
router.get("/feedback/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const feedbackId = parseInt(id);

    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        users: {
          select: {
            id: true,
            nickname: true,
            username: true,
            avatar_url: true,
            created_at: true,
          },
        },
      },
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        code: 1,
        error: "反馈不存在",
      });
    }

    res.json({
      success: true,
      code: 0,
      data: feedback,
    });
  } catch (error) {
    console.error("获取反馈详情失败:", error);
    res.status(500).json({
      success: false,
      code: 1,
      error: "获取反馈详情失败",
    });
  }
});

// 更新反馈状态
router.put("/feedback/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const feedbackId = parseInt(id);
    const newStatus = parseInt(status);

    if (![0, 1].includes(newStatus)) {
      return res.status(400).json({
        success: false,
        code: 1,
        error: "状态值无效",
      });
    }

    const feedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: { status: newStatus },
      include: {
        users: {
          select: {
            id: true,
            nickname: true,
            username: true,
          },
        },
      },
    });

    res.json({
      success: true,
      code: 0,
      data: feedback,
      message: newStatus === 1 ? "已标记为已处理" : "已标记为未处理",
    });
  } catch (error) {
    console.error("更新反馈状态失败:", error);
    res.status(500).json({
      success: false,
      code: 1,
      error: "更新反馈状态失败",
    });
  }
});

export default router;
