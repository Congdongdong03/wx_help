import { getDb } from "../config/database";

export interface Recommendation {
  id?: number;
  title: string;
  description: string;
  image_url: string;
  category: string;
  sort_order: number;
  is_active: boolean;
  is_pinned: boolean;
  price?: string;
  city: string;
  created_at?: Date;
  updated_at?: Date;
}

const DEFAULT_IMAGE_URL =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb";

function withDefaultImageUrl(list: Recommendation[]): Recommendation[] {
  return list.map((item) => ({
    ...item,
    image_url: item.image_url || DEFAULT_IMAGE_URL,
  }));
}

export class RecommendationModel {
  static async findAll(): Promise<Recommendation[]> {
    const db = getDb();
    const [rows]: any = await db.execute(
      "SELECT * FROM recommendations WHERE is_active = true ORDER BY sort_order ASC"
    );
    return withDefaultImageUrl(rows as Recommendation[]);
  }

  static async findByCategory(category: string): Promise<Recommendation[]> {
    const db = getDb();
    const [rows]: any = await db.execute(
      "SELECT * FROM recommendations WHERE category = ? AND is_active = true ORDER BY sort_order ASC",
      [category]
    );
    return withDefaultImageUrl(rows as Recommendation[]);
  }

  static async findByCity(city: string): Promise<Recommendation[]> {
    const db = getDb();
    const [rows]: any = await db.execute(
      "SELECT * FROM recommendations WHERE (city = ? OR city = '通用') AND is_active = true ORDER BY sort_order ASC",
      [city]
    );
    return withDefaultImageUrl(rows as Recommendation[]);
  }

  // 新增：同时按城市和分类过滤（用于具体分类页面）
  static async findByCityAndCategory(
    city: string,
    category: string
  ): Promise<Recommendation[]> {
    const db = getDb();
    const [rows]: any = await db.execute(
      `SELECT * FROM recommendations 
       WHERE (city = ? OR city = '通用') 
       AND category = ? 
       AND is_active = true 
       ORDER BY sort_order ASC`,
      [city, category]
    );
    console.log(
      `城市+分类查询: city=${city}, category=${category}, 结果数量=${rows.length}`
    );
    return withDefaultImageUrl(rows as Recommendation[]);
  }

  // 获取所有置顶帖子（不受城市限制）
  static async findPinned(): Promise<Recommendation[]> {
    const db = getDb();
    const [rows]: any = await db.execute(
      "SELECT * FROM recommendations WHERE is_pinned = true AND is_active = true ORDER BY sort_order ASC"
    );
    console.log(`置顶帖子查询: 结果数量=${rows.length}`);
    return withDefaultImageUrl(rows as Recommendation[]);
  }

  // 新增：获取某城市的普通帖子（非置顶）
  static async findNormalPostsByCity(city: string): Promise<Recommendation[]> {
    const db = getDb();
    const [rows]: any = await db.execute(
      `SELECT * FROM recommendations 
       WHERE (city = ? OR city = '通用') 
       AND is_pinned = false 
       AND is_active = true 
       ORDER BY sort_order ASC`,
      [city]
    );
    console.log(`城市普通帖子查询: city=${city}, 结果数量=${rows.length}`);
    return withDefaultImageUrl(rows as Recommendation[]);
  }

  // 调试方法：查看数据库中的城市数据
  static async getCitiesInDatabase(): Promise<string[]> {
    const db = getDb();
    const [rows]: any = await db.execute(
      "SELECT DISTINCT city FROM recommendations WHERE is_active = true"
    );
    return (rows as any[]).map((row) => row.city);
  }

  // 调试方法：查看置顶帖子
  static async debugPinnedPosts(): Promise<any[]> {
    const db = getDb();
    const [rows]: any = await db.execute(
      "SELECT id, title, city, category, is_pinned, is_active FROM recommendations WHERE is_pinned = true"
    );
    console.log("数据库中的置顶帖子:", rows);
    return rows;
  }
}
