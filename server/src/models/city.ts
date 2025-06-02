import { getDb } from "../config/database";

export interface City {
  id?: number;
  name: string;
  code: string;
  is_hot: boolean;
  sort_order: number;
  created_at?: Date;
  updated_at?: Date;
}

export class CityModel {
  static async findAll(): Promise<City[]> {
    const db = getDb();
    const [rows]: any = await db.execute(
      "SELECT * FROM cities ORDER BY sort_order ASC"
    );
    return rows as City[];
  }

  static async findHot(): Promise<City[]> {
    const db = getDb();
    const [rows]: any = await db.execute(
      "SELECT * FROM cities WHERE is_hot = true ORDER BY sort_order ASC"
    );
    return rows as City[];
  }
}
