import { Router } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { uploadSingle } from "../controllers/upload";
import { getCities, getRecommendations } from "../controllers/home";
import {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
} from "../controllers/post";
import { getUserInfo, updateUserInfo, logout } from "../controllers/user";

const router = Router();

// 公开路由
router.get("/home/cities", getCities);
router.get("/home/recommendations", getRecommendations);
router.get("/posts", getPosts);
router.get("/posts/:id", getPostById);

// 需要认证的路由
router.post("/posts/upload", requireAuth, uploadSingle);
router.post("/posts", requireAuth, createPost);
router.put("/posts/:id", requireAuth, updatePost);
router.delete("/posts/:id", requireAuth, deletePost);

// 用户相关路由
router.get("/user/info", requireAuth, getUserInfo);
router.put("/user/info", requireAuth, updateUserInfo);
router.post("/user/logout", requireAuth, logout);

export default router;
