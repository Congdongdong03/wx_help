import express from "express";
import {
  getCities,
  getHotCities,
  getRecommendations,
} from "../controllers/home";

const router = express.Router();

// 获取所有城市
router.get("/cities", getCities);

// 获取热门城市
router.get("/cities/hot", getHotCities);

// 获取推荐内容
router.get("/recommendations", getRecommendations);

export default router;
