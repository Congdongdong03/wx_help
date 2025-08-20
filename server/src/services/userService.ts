// src/services/userService.ts
import { prisma } from "../lib/prisma";
import { users } from "@prisma/client";

export interface UserCreateInput {
  openid: string;
  username?: string;
  nickname?: string;
  avatar_url?: string;
  phone?: string;
  email?: string;
  city?: string;
  province?: string;
  country?: string;
}

export class UserService {
  /**
   * 根据 openid 查找用户
   */
  static async findByOpenid(openid: string): Promise<users | null> {
    return await prisma.users.findUnique({
      where: { openid },
    });
  }

  /**
   * 根据用户ID查找用户
   */
  static async findById(id: number): Promise<users | null> {
    return await prisma.users.findUnique({
      where: { id },
    });
  }

  /**
   * 创建新用户
   */
  static async create(userData: UserCreateInput): Promise<users> {
    const data: any = {
      openid: userData.openid,
      status: "active",
      last_login_at: new Date(),
    };

    // 只添加有值的字段
    if (userData.nickname !== undefined) data.nickname = userData.nickname;
    if (userData.avatar_url !== undefined)
      data.avatar_url = userData.avatar_url;
    if (userData.phone !== undefined) data.phone = userData.phone;
    if (userData.email !== undefined) data.email = userData.email;
    if (userData.city !== undefined) data.city = userData.city;
    if (userData.province !== undefined) data.province = userData.province;
    if (userData.country !== undefined) data.country = userData.country;

    return await prisma.users.create({ data });
  }

  /**
   * 更新用户信息
   */
  static async update(id: number, userData: Partial<users>): Promise<users> {
    return await prisma.users.update({
      where: { id },
      data: {
        ...userData,
        updated_at: new Date(),
      },
    });
  }

  /**
   * 更新用户最后登录时间
   */
  static async updateLastLogin(id: number): Promise<users> {
    return await prisma.users.update({
      where: { id },
      data: {
        last_login_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  /**
   * 验证微信登录
   */
  static async validateWechatLogin(openid: string): Promise<users | null> {
    const user = await this.findByOpenid(openid);

    if (user && user.status === "active") {
      await this.updateLastLogin(user.id);
      return user;
    }

    return null;
  }

  /**
   * 获取用户统计信息
   */
  static async getUserStats(userId: number) {
    const [postsCount, favoritesCount] = await Promise.all([
      prisma.posts.count({ where: { user_id: userId } }),
      prisma.favorite.count({ where: { user_id: userId } }),
    ]);

    return { postsCount, favoritesCount };
  }
}
