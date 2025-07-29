import express, { Router } from "express";
import { AdminPostController } from "../controllers/adminPost";
import { requireAuth } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

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

// 获取所有帖子（管理员视图）
router.get("/posts", requireAuth, AdminPostController.getAllPosts);

// 获取最近帖子
router.get("/posts/recent", requireAuth, async (req, res) => {
  try {
    const { limit = 30 } = req.query;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));

    const posts = await prisma.posts.findMany({
      orderBy: { created_at: "desc" },
      take: limitNum,
      include: {
        users: {
          select: {
            id: true,
            nickname: true,
            avatar_url: true,
          },
        },
      },
    });

    res.json({
      code: 0,
      message: "获取成功",
      data: {
        posts,
        total: posts.length,
      },
    });
  } catch (error) {
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
    const [pending, published, failed] = await Promise.all([
      prisma.posts.count({ where: { status: "pending" } }),
      prisma.posts.count({ where: { status: "published" } }),
      prisma.posts.count({ where: { status: "failed" } }),
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
          status: "failed",
          updated_at: { gte: today },
        },
      }),
    ]);

    res.json({
      success: true,
      code: 0,
      data: {
        status: { pending, published, failed },
        today: {
          approved: approvedToday,
          rejected: rejectedToday,
          total: approvedToday + rejectedToday,
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

export default router;
