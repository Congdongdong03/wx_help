import express from "express";
import { getCities, getRecommendations } from "../controllers/home";
import { optionalAuth } from "../middleware/auth";

const router = express.Router();

// 获取所有城市
router.get("/cities", getCities);

// 获取推荐内容
router.get("/recommendations", optionalAuth, getRecommendations);

export default router;
