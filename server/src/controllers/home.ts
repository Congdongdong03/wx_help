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

export const getHotCities = async (req: Request, res: Response) => {
  try {
    const hotCities = await CityModel.findHot();
    res.json({
      code: 0,
      data: hotCities.map((city) => ({
        name: city.name,
        code: city.code,
        is_hot: city.is_hot,
      })),
      message: "获取热门城市成功",
    });
  } catch (error) {
    console.error("Failed to get hot cities:", error);
    res.status(500).json({
      code: 500,
      message: "获取热门城市失败",
    });
  }
};

export const getRecommendations = async (req: Request, res: Response) => {
  try {
    const { category, city } = req.query;
    let recommendations;

    if (category) {
      recommendations = await RecommendationModel.findByCategory(
        category as string
      );
    } else if (city) {
      recommendations = await RecommendationModel.findByCity(city as string);
    } else {
      recommendations = await RecommendationModel.findAll();
    }

    // 获取置顶内容
    const pinnedRecommendations = await RecommendationModel.findPinned();

    res.json({
      code: 0,
      data: {
        pinned: pinnedRecommendations,
        list: recommendations,
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
