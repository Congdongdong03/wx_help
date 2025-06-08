import express, { Router } from "express";
import { PostController } from "../controllers/post";
import { uploadSingle } from "../controllers/upload";

const router = Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// ============ 具体路由要放在参数路由之前 ============

// 用户路由（需要认证，暂时先不加认证中间件）
router.get("/my", PostController.getMyPosts); // 我的发布 - 放在最前面

// 公开路由
router.get("/", PostController.getPosts); // 获取帖子列表（公开）

// 帖子操作路由
router.post("/", PostController.createPost); // 创建帖子
router.put("/:id", PostController.updatePost); // 更新帖子
router.delete("/:id", PostController.deletePost); // 删除帖子
router.post("/:id/polish", PostController.polishPost); // 擦亮帖子
router.post("/:id/resubmit", PostController.resubmitPost); // 重新提交

// 图片上传接口
// POST /api/upload
router.post("/upload", uploadSingle);

// ============ 参数路由放在最后 ============
router.get("/:id", PostController.getPostById); // 获取帖子详情 - 放在最后

export default router;
