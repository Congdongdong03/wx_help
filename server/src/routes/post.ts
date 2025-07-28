import express, { Router } from "express";
import { PostController } from "../controllers/post";
import { uploadSingle } from "../controllers/upload";
import { requireAuth, optionalAuth } from "../middleware/auth";

const router = Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// ============ 具体路由要放在参数路由之前 ============

// 用户路由（需要认证）
router.get("/my", requireAuth, PostController.getMyPosts);

// 公开路由
router.get("/", PostController.getPosts);

// 新增：分离的帖子接口
router.get("/pinned", PostController.getPinnedPosts);
router.get("/normal", PostController.getNormalPosts);

// 帖子操作路由（需要认证）
router.post("/", requireAuth, PostController.createPost);
router.put("/:id", requireAuth, PostController.updatePost);
router.delete("/:id", requireAuth, PostController.deletePost);
router.post("/:id/polish", requireAuth, PostController.polishPost);
router.post("/:id/resubmit", requireAuth, PostController.resubmitPost);

// 图片上传接口（需要认证）
router.post("/upload", requireAuth, uploadSingle);

// ============ 参数路由放在最后 ============
// 帖子详情路由（可选认证）
router.get("/:id", optionalAuth, PostController.getPostDetail);

// 收藏操作路由（需要认证）
router.post("/:id/favorite", requireAuth, PostController.toggleFavorite);

export default router;
