import express, { Router } from "express";
import { PostController } from "../controllers/post";

const router = Router();

// 确保添加JSON解析中间件（如果在app.js中没有全局配置的话）
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get("/my", PostController.getMyPosts);
router.post("/", PostController.createPost);
// TODO: Add routes for updating (e.g., PUT /:id), deleting posts (e.g., DELETE /:id)

export default router;
