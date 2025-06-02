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

  static async findPinned(): Promise<Recommendation[]> {
    const db = getDb();
    const [rows]: any = await db.execute(
      "SELECT * FROM recommendations WHERE is_pinned = true AND is_active = true ORDER BY sort_order ASC"
    );
    return withDefaultImageUrl(rows as Recommendation[]);
  }
}
