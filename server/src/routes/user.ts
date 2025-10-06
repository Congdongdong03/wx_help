import { Router } from "express";
import { UserController } from "../controllers/user";
import { requireAuth } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// 用户注册
router.post("/register", UserController.register);

// 微信登录
router.post("/login", UserController.wechatLogin);

// 获取用户信息
router.get("/info", requireAuth, UserController.getUserInfo);

// 更新用户信息
router.put("/info", requireAuth, UserController.updateUserInfo);

// 用户登出
router.post("/logout", requireAuth, UserController.logout);

// 获取我的收藏列表
router.get("/favorites", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ code: 401, message: "未登录" });
    }

    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit as string, 10) || 20, 1), 50);
    const offset = (pageNum - 1) * pageSize;

    const [items, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        skip: offset,
        take: pageSize,
        include: {
          posts: {
            include: {
              users: { select: { id: true, nickname: true, avatar_url: true } },
            },
          },
        },
      }),
      prisma.favorite.count({ where: { user_id: userId } }),
    ]);

    const favorites = items.map((fav: any) => {
      const post = fav.posts;
      return {
        id: post.id,
        title: post.title,
        content: post.content,
        category: { id: post.category || "", name: post.category || "", color: "#eee" },
        price: post.price,
        updated_at: post.updated_at?.toISOString?.() || post.updated_at,
        created_at: post.created_at?.toISOString?.() || post.created_at,
        city_code: post.city_code,
        status: post.status,
        images: post.images ? JSON.parse(post.images) : [],
        cover_image: (post.images ? JSON.parse(post.images)[0] : undefined) || "",
        users: post.users,
      };
    });

    res.json({
      code: 0,
      data: {
        favorites,
        pagination: {
          current: pageNum,
          limit: pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error: any) {
    console.error("get /user/favorites error:", error);
    res.status(500).json({ code: 1, message: "获取收藏列表失败" });
  }
});

export default router;
