import { Router } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { uploadSingle } from "../controllers/upload";
import { getCities, getRecommendations } from "../controllers/home";
import { PostController } from "../controllers/post";
import { UserController } from "../controllers/user";
import conversationRouter from "./conversation";

const router = Router();

// 公开路由
router.get("/home/cities", getCities);
router.get("/home/recommendations", getRecommendations);
router.get("/posts", PostController.getPosts);
router.get("/posts/:id", PostController.getPostDetail);

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

export default router;
