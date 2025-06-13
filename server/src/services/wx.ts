import { RedisService } from "./redis";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface WxLoginResponse {
  openid: string;
  session_key: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

export class WxService {
  private static readonly APPID = process.env.WX_APPID;
  private static readonly SECRET = process.env.WX_SECRET;
  private static readonly REQUEST_TIMEOUT = 5000; // 5秒超时

  static {
    if (!this.APPID || !this.SECRET) {
      throw new Error("缺少必要的环境变量: WX_APPID 或 WX_SECRET");
    }
  }

  // 微信登录
  static async login(code: string): Promise<{ openid: string }> {
    try {
      // 调用微信登录接口获取 openid
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.REQUEST_TIMEOUT
      );

      const response = await fetch(
        `https://api.weixin.qq.com/sns/jscode2session?appid=${this.APPID}&secret=${this.SECRET}&js_code=${code}&grant_type=authorization_code`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      const data = (await response.json()) as WxLoginResponse;

      if (data.errcode) {
        throw new Error(`微信登录失败: ${data.errmsg}`);
      }

      // 存储 session_key 到 Redis，有效期 7 天
      await RedisService.setCache(
        `session:${data.openid}`,
        data.session_key,
        7 * 24 * 60 * 60
      );

      // 检查用户是否存在，不存在则创建
      const user = await prisma.users.findUnique({
        where: { openid: data.openid },
      });

      if (!user) {
        await prisma.users.create({
          data: {
            openid: data.openid,
            nickname: `用户${data.openid.slice(-6)}`,
            avatar_url: "",
            gender: 0,
            city: "",
            username: data.openid,
          },
        });
      }

      return { openid: data.openid };
    } catch (error) {
      console.error("WeChat login error:", error);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("微信登录请求超时");
      }
      throw new Error("微信登录失败");
    }
  }

  // 获取用户信息
  static async getUserInfo(openid: string) {
    try {
      // 从数据库获取用户信息
      const userInfo = await prisma.users.findUnique({
        where: { openid },
        select: {
          id: true,
          nickname: true,
          avatar_url: true,
          gender: true,
          city: true,
        },
      });

      if (!userInfo) {
        throw new Error("用户不存在");
      }

      return userInfo;
    } catch (error) {
      console.error("Get user info error:", error);
      throw new Error("获取用户信息失败");
    }
  }

  // 更新用户信息
  static async updateUserInfo(
    openid: string,
    data: { nickname?: string; avatar_url?: string }
  ) {
    try {
      await prisma.users.update({
        where: { openid },
        data,
      });
    } catch (error) {
      console.error("Update user info error:", error);
      throw new Error("更新用户信息失败");
    }
  }

  static async logout(openid: string) {
    try {
      // 将 openid 加入黑名单
      await RedisService.addToOpenidBlacklist(openid, 7 * 24 * 60 * 60); // 7天
      // 删除 session_key
      await RedisService.deleteCache(`session:${openid}`);
    } catch (error) {
      console.error("Logout error:", error);
      throw new Error("登出失败");
    }
  }
}
