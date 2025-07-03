// src/controllers/home.ts
import { Request, Response } from "express";
import { HomeService } from "../services/homeService";
import { AuthenticatedRequest } from "../middleware/auth";

export const getCities = async (req: Request, res: Response) => {
  try {
    const cities = await HomeService.getAllCities();

    res.json({
      code: 0,
      message: "获取城市列表成功",
      data: cities,
    });
  } catch (error) {
    console.error("Failed to get cities:", error);
    res.status(500).json({
      code: 1,
      message: "获取城市列表失败",
    });
  }
};

export const getRecommendations = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { category, city } = req.query;

    if (!city) {
      return res.status(400).json({
        code: 1,
        message: "城市参数不能为空",
      });
    }

    // 查询所有帖子
    let allPosts: any[] = [];
    if (category && category !== "recommend") {
      allPosts = await HomeService.getPostsByCityAndCategory(
        city as string,
        category as string
      );
    } else {
      allPosts = await HomeService.getAllPosts();
    }

    // 处理图片数据
    const processImages = (images: string | null) => {
      if (!images) return [];
      try {
        return typeof images === "string" ? JSON.parse(images) : images;
      } catch {
        return [];
      }
    };

    // 格式化函数
    const formatPost = (post: any) => ({
      id: post.id,
      isPinned: post.is_pinned,
      post: {
        id: post.id,
        title: post.title,
        city: post.city_code,
        category: post.category,
        price: post.price,
        images: processImages(post.images),
        user: post.users && {
          nickname: post.users.nickname,
          avatar_url: post.users.avatar_url,
        },
      },
    });

    // 分离置顶和普通帖子
    const pinned = allPosts.filter((post) => post.is_pinned).map(formatPost);
    const list = allPosts.filter((post) => !post.is_pinned).map(formatPost);

    res.json({
      code: 0,
      message: "获取推荐内容成功",
      data: {
        pinned,
        list,
      },
    });
  } catch (error) {
    console.error("Failed to get recommendations:", error);
    res.status(500).json({
      code: 1,
      message: "获取推荐内容失败",
    });
  }
};

// 新增：调试API - 查看数据库状态
export const debugDatabase = async (req: Request, res: Response) => {
  try {
    const cities = await HomeService.getAllCitiesInDatabase();
    const allData = await HomeService.getAllPosts();

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
      code: 1,
      message: "调试失败",
    });
  }
};
