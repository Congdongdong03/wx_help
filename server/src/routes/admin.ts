import express, { Router } from "express";
import { AdminPostController } from "../controllers/adminPost";

const router = Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// 获取待审核帖子
router.get("/posts/pending", AdminPostController.getPendingPosts);

// 审核单个帖子 - 注意这里是 POST，不是 PUT
router.post("/posts/:id/review", AdminPostController.reviewPost);

// 批量审核帖子
router.post("/posts/batch-review", AdminPostController.batchReviewPosts);

// 获取所有帖子（管理员视图）
router.get("/posts", AdminPostController.getAllPosts);

// 管理员删除帖子
router.delete("/posts/:id", AdminPostController.deletePost);

// 获取统计数据
router.get("/posts/stats", AdminPostController.getReviewStats);

export default router;
