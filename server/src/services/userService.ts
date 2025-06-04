// src/services/userService.ts
import { prisma } from "../lib/prisma";
import { users } from "@prisma/client";

export interface UserCreateInput {
  username: string;
  email?: string;
  nickname?: string;
  avatar_url?: string;
  phone?: string;
  city?: string;
  province?: string;
  country?: string;
}

export interface UserLoginInput {
  username: string;
  password: string;
}

export class UserService {
  /**
   * 根据用户名查找用户
   */
  static async findByUsername(username: string): Promise<users | null> {
    return await prisma.users.findUnique({
      where: {
        username: username,
      },
    });
  }

  /**
   * 根据用户ID查找用户
   */
  static async findById(id: number): Promise<users | null> {
    return await prisma.users.findUnique({
      where: {
        id: id,
      },
    });
  }

  /**
   * 根据 openid 查找用户
   */
  static async findByOpenid(openid: string): Promise<users | null> {
    return await prisma.users.findUnique({
      where: {
        openid: openid,
      },
    });
  }

  /**
   * 创建新用户
   */
  /**
   * 创建新用户
   */
  static async create(userData: UserCreateInput): Promise<users> {
    // 过滤掉 undefined 值
    const data: any = {
      username: userData.username,
      status: "active",
    };

    // 只添加有值的字段
    if (userData.email !== undefined) data.email = userData.email;
    if (userData.nickname !== undefined) data.nickname = userData.nickname;
    if (!data.nickname) data.nickname = userData.username;
    if (userData.avatar_url !== undefined)
      data.avatar_url = userData.avatar_url;
    if (userData.phone !== undefined) data.phone = userData.phone;
    if (userData.city !== undefined) data.city = userData.city;
    if (userData.province !== undefined) data.province = userData.province;
    if (userData.country !== undefined) data.country = userData.country;

    return await prisma.users.create({
      data,
    });
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
  // 替换为微信登录验证
  static async validateWechatLogin(openid: string): Promise<users | null> {
    const user = await this.findByOpenid(openid);

    if (user && user.status === "active") {
      // 更新最后登录时间
      await this.updateLastLogin(user.id);
      return user;
    }

    return null;
  }
  /**
   * 检查用户名是否已存在
   */
  static async isUsernameExists(username: string): Promise<boolean> {
    const user = await this.findByUsername(username);
    return !!user;
  }

  /**
   * 检查邮箱是否已存在
   */
  static async isEmailExists(email: string): Promise<boolean> {
    const user = await prisma.users.findFirst({
      where: {
        email: email,
      },
    });
    return !!user;
  }

  /**
   * 获取用户统计信息
   */
  static async getUserStats(userId: number) {
    const [postsCount, favoritesCount] = await Promise.all([
      // 用户发布的帖子数量
      prisma.posts.count({
        where: { user_id: userId },
      }),
      // 用户收藏的帖子数量
      prisma.favorite.count({
        where: { user_id: userId },
      }),
    ]);

    return {
      postsCount,
      favoritesCount,
    };
  }

  /**
   * 软删除用户（设置为不活跃状态）
   */
  static async softDelete(id: number): Promise<users> {
    return await prisma.users.update({
      where: { id },
      data: {
        status: "inactive",
        updated_at: new Date(),
      },
    });
  }

  /**
   * 获取用户的安全信息（不包含密码）
   */
  static async getSafeUserInfo(id: number) {
    return await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar_url: true,
        email: true,
        phone: true,
        city: true,
        province: true,
        country: true,
        language: true,
        status: true,
        last_login_at: true,
        created_at: true,
        updated_at: true,
      },
    });
  }
}
