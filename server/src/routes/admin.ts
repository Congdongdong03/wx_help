import express, { Router } from "express";
import { AdminPostController } from "../controllers/adminPost"; // 重命名导入

const router = Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// 管理员专用路由
router.get("/posts/pending", AdminPostController.getPendingPosts);
router.put("/posts/:id/review", AdminPostController.reviewPost);

export default router;
