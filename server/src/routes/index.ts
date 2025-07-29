import { Router } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { uploadSingle } from "../controllers/upload";
import { getCities, getRecommendations } from "../controllers/home";
import { PostController } from "../controllers/post";
import { UserController } from "../controllers/user";
import conversationRouter from "./conversation";
import adminRouter from "./admin";
import { log } from "../utils/monitor";

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

// 需要认证的路由
router.post("/posts/upload", requireAuth, uploadSingle);
router.post("/posts", requireAuth, PostController.createPost);
router.put("/posts/:id", requireAuth, PostController.updatePost);
router.delete("/posts/:id", requireAuth, PostController.deletePost);

// 用户相关路由
router.get("/user/info", requireAuth, UserController.getUserInfo);
router.put("/user/info", requireAuth, UserController.updateUserInfo);
router.post("/user/logout", requireAuth, UserController.logout);

// 会话相关路由
router.use("/conversations", conversationRouter);

// 管理员路由
router.use("/admin", adminRouter);

export default router;
