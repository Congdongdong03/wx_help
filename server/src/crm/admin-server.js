// admin-server.js - 精简版管理后台（专注小程序用户管理）
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const PORT = 3000;
const prisma = new PrismaClient({
  log: ["error"], // 只记录错误日志
});

// 基础中间件
app.use(
  cors({
    origin: "*",
    allowedHeaders: ["Content-Type", "Authorization", "x-openid"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.static("public")); // 静态文件服务

// 简化的日志中间件
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    console.log(`${new Date().toLocaleTimeString()} ${req.method} ${req.path}`);
  }
  next();
});

// ===== 基础接口 =====

// 健康检查
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "服务运行正常",
    timestamp: new Date().toISOString(),
  });
});

// ===== 小程序接口（保持兼容） =====

// 获取城市列表
app.get("/api/home/cities", async (req, res) => {
  try {
    const cities = await prisma.cities.findMany({
      where: { is_active: true },
      orderBy: [{ is_hot: "desc" }, { sort_order: "asc" }],
      select: { name: true, code: true, is_hot: true },
    });

    res.json({
      code: 0,
      data: cities,
      message: "获取城市列表成功",
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      error: "获取城市列表失败",
      message: error.message,
    });
  }
});

// 用户登录/注册
app.post("/api/users/login", async (req, res) => {
  try {
    const { openid, userInfo } = req.body;

    if (!openid) {
      return res.status(400).json({
        code: 1,
        error: "缺少openid参数",
      });
    }

    // 查找或创建用户
    let user = await prisma.users.findUnique({
      where: { openid },
    });

    if (!user) {
      user = await prisma.users.create({
        data: {
          openid,
          username: `user_${Date.now()}`,
          nickname: userInfo?.nickName || "微信用户",
          avatar_url: userInfo?.avatarUrl,
          last_login_at: new Date(),
        },
      });
    } else {
      await prisma.users.update({
        where: { id: user.id },
        data: { last_login_at: new Date() },
      });
    }

    res.json({
      code: 0,
      message: "登录成功",
      data: {
        user: {
          id: user.id,
          nickname: user.nickname,
          avatar_url: user.avatar_url,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      code: 1,
      error: "登录失败",
      message: error.message,
    });
  }
});

// ===== 管理员接口（核心功能） =====

// 获取待审核帖子
app.get("/api/admin/posts/pending", async (req, res) => {
  try {
    const { page = 1, limit = 10, keyword } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const where = { status: "pending" };
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { content: { contains: keyword } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.posts.findMany({
        where,
        orderBy: { created_at: "asc" },
        take: limitNum,
        skip: offset,
        include: {
          users: {
            select: { nickname: true, avatar_url: true },
          },
        },
      }),
      prisma.posts.count({ where }),
    ]);

    const processedPosts = posts.map((post) => ({
      ...post,
      images: post.images
        ? (() => {
            try {
              return JSON.parse(post.images);
            } catch {
              return [];
            }
          })()
        : [],
      author_nickname: post.users?.nickname || "无",
    }));

    res.json({
      success: true,
      code: 0,
      data: {
        posts: processedPosts,
        pagination: {
          current: pageNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("获取待审核帖子失败:", error);
    res.status(500).json({
      success: false,
      code: 1,
      error: "获取数据失败",
      message: error.message,
    });
  }
});

// 审核帖子
app.post("/api/admin/posts/:id/review", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { action, reason } = req.body;

    if (!postId || !["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        code: 1,
        error: "参数错误",
      });
    }

    await prisma.$transaction(async (tx) => {
      const post = await tx.posts.findFirst({
        where: { id: postId, status: "pending" },
      });

      if (!post) {
        throw new Error("帖子不存在或已被处理");
      }

      if (action === "approve") {
        // 审核通过
        await tx.posts.update({
          where: { id: postId },
          data: { status: "published", updated_at: new Date() },
        });

        // 简化的推荐处理
        try {
          let imageUrl = null;
          if (post.images) {
            try {
              const images = JSON.parse(post.images);
              imageUrl = (Array.isArray(images) && images[0]) || null;
            } catch {}
          }

          await tx.recommendations.upsert({
            where: { post_id: postId },
            update: {
              title: post.title,
              description: post.content || post.title,
              category: post.category || "help",
              city: post.city || "通用",
              image_url: imageUrl,
              is_active: true,
              updated_at: new Date(),
            },
            create: {
              post_id: postId,
              title: post.title,
              description: post.content || post.title,
              category: post.category || "help",
              city: post.city || "通用",
              image_url: imageUrl,
              is_active: true,
            },
          });
        } catch (err) {
          console.warn("添加推荐失败:", err.message);
        }
      } else {
        // 审核拒绝
        await tx.posts.update({
          where: { id: postId },
          data: { status: "failed", updated_at: new Date() },
        });
      }
    });

    res.json({
      success: true,
      code: 0,
      message: action === "approve" ? "审核通过" : "审核拒绝",
      data: { id: postId, action },
    });
  } catch (error) {
    console.error("审核失败:", error);
    res.status(500).json({
      success: false,
      code: 1,
      error: error.message || "审核失败",
    });
  }
});

// 获取统计数据
app.get("/api/admin/stats", async (req, res) => {
  try {
    const [pending, published, failed] = await Promise.all([
      prisma.posts.count({ where: { status: "pending" } }),
      prisma.posts.count({ where: { status: "published" } }),
      prisma.posts.count({ where: { status: "failed" } }),
    ]);

    // 今日审核数
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    const [approvedToday, rejectedToday] = await Promise.all([
      prisma.posts.count({
        where: {
          status: "published",
          updated_at: { gte: startOfDay },
        },
      }),
      prisma.posts.count({
        where: {
          status: "failed",
          updated_at: { gte: startOfDay },
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

// 获取最近帖子（调试用）
app.get("/api/admin/posts/recent", async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const posts = await prisma.posts.findMany({
      orderBy: { created_at: "desc" },
      take: parseInt(limit),
      include: {
        users: { select: { nickname: true } },
      },
    });

    res.json({
      success: true,
      data: posts.map((post) => ({
        id: post.id,
        title: post.title,
        status: post.status,
        author: post.users?.nickname,
        created_at: post.created_at,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 获取用户列表
app.get("/api/admin/users", async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (keyword) {
      where.OR = [
        { nickname: { contains: keyword } },
        { username: { contains: keyword } },
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
      success: true,
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
      success: false,
      error: "获取用户列表失败",
    });
  }
});
// 获取目录图片 - 通用接口
app.get("/api/catalogue-images", async (req, res) => {
  try {
    const postId = req.query.postId;
    console.log(`API /api/catalogue-images 被调用，postId: ${postId}`);

    // 验证postId是否为置顶帖子
    if (postId) {
      const post = await prisma.posts.findUnique({
        where: { id: parseInt(postId) },
        select: { is_pinned: true },
      });

      if (!post || !post.is_pinned) {
        return res.json({
          success: false,
          code: 1,
          message: "该帖子不是目录帖子",
          data: [],
        });
      }
    }

    // 获取最新的目录图片，按商店和页码排序
    const images = await prisma.catalogue_images.findMany({
      orderBy: [
        { store_name: "asc" }, // coles在前，woolworths在后
        { page_number: "asc" }, // 页码从小到大
      ],
      select: {
        id: true,
        store_name: true,
        page_number: true,
        image_data: true,
        week_date: true,
      },
    });

    console.log(`找到 ${images.length} 张目录图片`);

    // 只返回图片数据数组，按顺序排列
    const imageDataArray = images.map((img) => img.image_data);

    res.json({
      success: true,
      code: 0,
      message: "获取目录图片成功",
      data: imageDataArray,
      meta: {
        total: images.length,
        stores: [...new Set(images.map((img) => img.store_name))],
        lastUpdate: images.length > 0 ? images[0].week_date : null,
      },
    });
  } catch (error) {
    console.error("获取目录图片失败:", error);
    res.status(500).json({
      success: false,
      code: 1,
      error: "获取目录图片失败",
      message: error.message,
      data: [],
    });
  }
});
// ===== 错误处理 =====

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "接口不存在",
    path: req.url,
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error("服务器错误:", error);
  res.status(500).json({
    success: false,
    error: "服务器内部错误",
    message: error.message,
  });
});

// ===== 启动服务器 =====

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`
=================================
🚀 精简管理后台服务已启动
=================================
📍 地址: http://localhost:${PORT}
🔗 管理界面: http://localhost:${PORT}/admin.html
🔗 待审核: http://localhost:${PORT}/api/admin/posts/pending
🔗 用户管理: http://localhost:${PORT}/api/admin/users
🔗 统计数据: http://localhost:${PORT}/api/admin/stats
=================================
✅ 小程序 + 管理后台统一服务
✅ 专注核心功能，代码精简
=================================
  `);

  // 测试数据库连接
  try {
    await prisma.$connect();
    const postsCount = await prisma.posts.count();
    const usersCount = await prisma.users.count();
    console.log(`✅ 数据库连接成功 (${postsCount} 帖子, ${usersCount} 用户)`);
  } catch (error) {
    console.error("❌ 数据库连接失败:", error.message);
  }
});

// 优雅关闭
process.on("SIGINT", async () => {
  console.log("\n正在关闭服务器...");
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = app;
