// src/controllers/home.ts
import { Request, Response } from "express";
import { HomeService } from "../services/homeService";

export const getCities = async (req: Request, res: Response) => {
  try {
    const cities = await HomeService.getAllCities();

    res.json({
      code: 0,
      data: cities,
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

    if (!city) {
      return res.status(400).json({
        code: 400,
        message: "城市参数不能为空",
      });
    }

    // 查询所有推荐（按 sort_order, created_at 排序）
    let allRecs: any[] = [];
    if (category && category !== "recommend") {
      allRecs = await HomeService.getRecommendationsByCityAndCategory(
        city as string,
        category as string
      );
    } else {
      allRecs = await HomeService.getAllRecommendations();
    }

    // pinned 只放第一条，list 放剩下的
    const pinned = allRecs.length > 0 ? [allRecs[0]] : [];
    const list = allRecs.slice(1);

    // 格式化函数
    const formatRec = (rec: any) => ({
      id: rec.id,
      isPinned: rec.is_pinned,
      sortOrder: rec.sort_order,
      post: rec.posts && {
        id: rec.posts.id,
        title: rec.posts.title,
        city: rec.posts.city,
        category: rec.posts.category,
        price: rec.posts.price,
        wechatId: rec.posts.wechat_id,
        user: rec.posts.users && {
          nickname: rec.posts.users.nickname,
          avatar_url: rec.posts.users.avatar_url,
        },
      },
    });

    res.json({
      code: 0,
      data: {
        pinned: pinned.map(formatRec),
        list: list.map(formatRec),
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
    const cities = await HomeService.getAllCitiesInDatabase();
    const allData = await HomeService.getAllRecommendations();

    res.json({
      code: 0,
      message: "调试信息",
      data: {
        cities,
        totalRecords: allData.length,
        records: allData,
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
