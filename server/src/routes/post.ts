import { Router } from "express";
import { PostController } from "../controllers/post";

const router = Router();

router.get("/my", PostController.getMyPosts);

// TODO: Add routes for creating, updating, and deleting posts

export default router;
