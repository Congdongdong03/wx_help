import express from "express";
import { PrismaClient } from "@prisma/client";
import statisticsService from "../services/statisticsService";
import { requireAuth } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// 获取仪表盘统计数据
router.get("/dashboard", requireAuth, async (req, res) => {
  try {
    const stats = await statisticsService.getDashboardStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("获取仪表盘统计数据失败:", error);
    res.status(500).json({
      success: false,
      error: "获取统计数据失败",
    });
  }
});

// 获取趋势数据
router.get("/trends", requireAuth, async (req, res) => {
  try {
    const { days = "7" } = req.query;
    const daysNum = parseInt(days as string);

    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      return res.status(400).json({
        success: false,
        error: "天数参数无效，应在1-365之间",
      });
    }

    const trends = await statisticsService.getTrendsData(daysNum);
    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error("获取趋势数据失败:", error);
    res.status(500).json({
      success: false,
      error: "获取趋势数据失败",
    });
  }
});

// 获取分类统计
router.get("/categories", requireAuth, async (req, res) => {
  try {
    const categories = await statisticsService.getCategoryStats();
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("获取分类统计失败:", error);
    res.status(500).json({
      success: false,
      error: "获取分类统计失败",
    });
  }
});

// 获取活跃用户排行
router.get("/top-users", requireAuth, async (req, res) => {
  try {
    const { limit = "10" } = req.query;
    const limitNum = parseInt(limit as string);

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: "限制参数无效，应在1-100之间",
      });
    }

    const topUsers = await statisticsService.getTopActiveUsers(limitNum);
    res.json({
      success: true,
      data: topUsers,
    });
  } catch (error) {
    console.error("获取活跃用户排行失败:", error);
    res.status(500).json({
      success: false,
      error: "获取活跃用户排行失败",
    });
  }
});

// 获取时间范围统计数据
router.get("/time-range", requireAuth, async (req, res) => {
  try {
    const { start_date, end_date, period_type = "daily" } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: "开始日期和结束日期是必需的",
      });
    }

    const startDate = new Date(start_date as string);
    const endDate = new Date(end_date as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: "日期格式无效",
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        error: "开始日期不能晚于结束日期",
      });
    }

    const validPeriodTypes = ["daily", "weekly", "monthly"];
    if (!validPeriodTypes.includes(period_type as string)) {
      return res.status(400).json({
        success: false,
        error: "时间周期类型无效",
      });
    }

    const stats = await statisticsService.getTimeRangeStats(
      startDate,
      endDate,
      period_type as "daily" | "weekly" | "monthly"
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("获取时间范围统计数据失败:", error);
    res.status(500).json({
      success: false,
      error: "获取时间范围统计数据失败",
    });
  }
});

// 获取用户行为分析
router.get("/user-behavior", requireAuth, async (req, res) => {
  try {
    const { days = "30" } = req.query;
    const daysNum = parseInt(days as string);

    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      return res.status(400).json({
        success: false,
        error: "天数参数无效，应在1-365之间",
      });
    }

    const analysis = await statisticsService.getUserBehaviorAnalysis(daysNum);
    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("获取用户行为分析失败:", error);
    res.status(500).json({
      success: false,
      error: "获取用户行为分析失败",
    });
  }
});

// 记录用户行为（用于前端调用）
router.post("/record-behavior", requireAuth, async (req, res) => {
  try {
    const { action_type, target_type, target_id, metadata } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "用户未认证",
      });
    }

    if (!action_type) {
      return res.status(400).json({
        success: false,
        error: "行为类型是必需的",
      });
    }

    await statisticsService.recordUserBehavior(
      userId,
      action_type,
      target_type,
      target_id,
      metadata
    );

    res.json({
      success: true,
      message: "行为记录成功",
    });
  } catch (error) {
    console.error("记录用户行为失败:", error);
    res.status(500).json({
      success: false,
      error: "记录用户行为失败",
    });
  }
});

// 获取沉默用户列表
router.get("/silent-users", requireAuth, async (req, res) => {
  try {
    const { days = "30", limit = "50" } = req.query;
    const daysNum = parseInt(days as string);
    const limitNum = parseInt(limit as string);

    if (isNaN(daysNum) || daysNum < 1) {
      return res.status(400).json({
        success: false,
        error: "天数参数无效",
      });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysNum);

    const silentUsers = await prisma.users.findMany({
      select: {
        id: true,
        username: true,
        nickname: true,
        last_login_at: true,
        created_at: true,
        _count: {
          select: {
            posts: true,
            favorite: true,
          },
        },
      },
      where: {
        status: "active",
        OR: [{ last_login_at: { lt: cutoffDate } }, { last_login_at: null }],
      },
      orderBy: {
        last_login_at: "asc",
      },
      take: limitNum,
    });

    res.json({
      success: true,
      data: silentUsers.map((user) => ({
        id: user.id,
        username: user.username,
        nickname: user.nickname || user.username,
        last_login: user.last_login_at,
        created_at: user.created_at,
        post_count: user._count.posts,
        favorite_count: user._count.favorite,
        days_since_last_activity: user.last_login_at
          ? Math.floor(
              (Date.now() - user.last_login_at.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null,
      })),
    });
  } catch (error) {
    console.error("获取沉默用户列表失败:", error);
    res.status(500).json({
      success: false,
      error: "获取沉默用户列表失败",
    });
  }
});

// 获取内容热度分析
router.get("/content-heat", requireAuth, async (req, res) => {
  try {
    const { days = "7" } = req.query;
    const daysNum = parseInt(days as string);

    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      return res.status(400).json({
        success: false,
        error: "天数参数无效，应在1-365之间",
      });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysNum);

    // 获取热门帖子
    const hotPosts = await prisma.posts.findMany({
      select: {
        id: true,
        title: true,
        category: true,
        view_count: true,
        favorite_count: true,
        created_at: true,
        users: {
          select: {
            username: true,
            nickname: true,
          },
        },
      },
      where: {
        created_at: { gte: cutoffDate },
        status: "published",
      },
      orderBy: [{ view_count: "desc" }, { favorite_count: "desc" }],
      take: 20,
    });

    // 获取分类热度
    const categoryHeat = await prisma.posts.groupBy({
      by: ["category"],
      _count: {
        id: true,
      },
      _sum: {
        view_count: true,
        favorite_count: true,
      },
      where: {
        created_at: { gte: cutoffDate },
        status: "published",
      },
    });

    res.json({
      success: true,
      data: {
        hot_posts: hotPosts.map((post) => ({
          id: post.id,
          title: post.title,
          category: post.category,
          view_count: post.view_count || 0,
          favorite_count: post.favorite_count || 0,
          created_at: post.created_at,
          author: post.users.nickname || post.users.username,
        })),
        category_heat: categoryHeat.map((cat) => ({
          category: cat.category || "未分类",
          post_count: cat._count.id,
          total_views: cat._sum.view_count || 0,
          total_favorites: cat._sum.favorite_count || 0,
        })),
      },
    });
  } catch (error) {
    console.error("获取内容热度分析失败:", error);
    res.status(500).json({
      success: false,
      error: "获取内容热度分析失败",
    });
  }
});

// 获取用户留存分析
router.get("/user-retention", requireAuth, async (req, res) => {
  try {
    const { days = "30" } = req.query;
    const daysNum = parseInt(days as string);

    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      return res.status(400).json({
        success: false,
        error: "天数参数无效，应在1-365之间",
      });
    }

    const analysis = await statisticsService.getUserRetentionAnalysis(daysNum);
    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("获取用户留存分析失败:", error);
    res.status(500).json({
      success: false,
      error: "获取用户留存分析失败",
    });
  }
});

// 获取内容质量分析
router.get("/content-quality", requireAuth, async (req, res) => {
  try {
    const { days = "30" } = req.query;
    const daysNum = parseInt(days as string);

    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      return res.status(400).json({
        success: false,
        error: "天数参数无效，应在1-365之间",
      });
    }

    const analysis = await statisticsService.getContentQualityAnalysis(daysNum);
    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("获取内容质量分析失败:", error);
    res.status(500).json({
      success: false,
      error: "获取内容质量分析失败",
    });
  }
});

// 获取地域分析
router.get("/geographic", requireAuth, async (req, res) => {
  try {
    const analysis = await statisticsService.getGeographicAnalysis();
    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("获取地域分析失败:", error);
    res.status(500).json({
      success: false,
      error: "获取地域分析失败",
    });
  }
});

// 获取时间分析
router.get("/time-analysis", requireAuth, async (req, res) => {
  try {
    const { days = "30" } = req.query;
    const daysNum = parseInt(days as string);

    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      return res.status(400).json({
        success: false,
        error: "天数参数无效，应在1-365之间",
      });
    }

    const analysis = await statisticsService.getTimeAnalysis(daysNum);
    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("获取时间分析失败:", error);
    res.status(500).json({
      success: false,
      error: "获取时间分析失败",
    });
  }
});

export default router;
