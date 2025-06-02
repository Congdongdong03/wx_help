import { Request, Response } from "express";
import { CityModel } from "../models/city";
import { RecommendationModel } from "../models/recommendation";

export const getCities = async (req: Request, res: Response) => {
  try {
    const cities = await CityModel.findAll();
    res.json({
      code: 0,
      data: cities.map((city) => ({
        name: city.name,
        code: city.code,
        is_hot: city.is_hot,
      })),
      message: "获取城市列表成功",
    });
  } catch (error) {
    console.error("Failed to get cities:", error);
    res.status(500).json({
      code: 500,
      message: "获取城市列表失败",
    });
  }
};
export const getRecommendations = async (req: Request, res: Response) => {
  try {
    const { category, city } = req.query;

    console.log("API接收参数:", { category, city });

    if (!city) {
      return res.status(400).json({
        code: 400,
        message: "城市参数不能为空",
      });
    }

    let pinnedPosts: any[] = [];
    let normalPosts = [];

    if (category && category !== "recommend") {
      // 具体分类页面：按城市和分类过滤，不显示置顶
      console.log(`具体分类查询: 城市=${city}, 分类=${category}`);
      normalPosts = await RecommendationModel.findByCityAndCategory(
        city as string,
        category as string
      );
      pinnedPosts = []; // 具体分类页面不显示置顶
    } else {
      // 推荐页面：置顶不受城市限制，普通帖子按城市过滤
      console.log(`推荐页面查询: 城市=${city}`);

      // 获取所有置顶帖子（不受城市限制）
      pinnedPosts = await RecommendationModel.findPinned();

      // 获取该城市的普通帖子（非置顶）
      normalPosts = await RecommendationModel.findNormalPostsByCity(
        city as string
      );
    }

    console.log("查询结果:", {
      pinnedCount: pinnedPosts.length,
      normalCount: normalPosts.length,
    });

    res.json({
      code: 0,
      data: {
        pinned: pinnedPosts,
        list: normalPosts,
      },
      message: "获取推荐内容成功",
    });
  } catch (error) {
    console.error("Failed to get recommendations:", error);
    res.status(500).json({
      code: 500,
      message: "获取推荐内容失败",
    });
  }
};
// 新增：调试API - 查看数据库状态
export const debugDatabase = async (req: Request, res: Response) => {
  try {
    const cities = await RecommendationModel.getCitiesInDatabase();
    const allData = await RecommendationModel.findAll();

    res.json({
      code: 0,
      message: "调试信息",
      data: {
        cities,
        totalRecords: allData.length,
        records: allData.map((item) => ({
          id: item.id,
          title: item.title,
          city: item.city,
          category: item.category,
          is_pinned: item.is_pinned,
          is_active: item.is_active,
        })),
      },
    });
  } catch (error) {
    console.error("Debug failed:", error);
    res.status(500).json({
      code: 500,
      message: "调试失败",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
