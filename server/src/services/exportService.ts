import { PrismaClient } from "@prisma/client";

type PostStatus = "draft" | "pending" | "published" | "rejected" | "failed";

const prisma = new PrismaClient();

export interface ExportOptions {
  format: "csv" | "excel";
  filters?: {
    category?: string;
    status?: PostStatus;
  };
}

export class ExportService {
  /**
   * 获取导出信息
   */
  async getExportInfo(): Promise<any> {
    try {
      const [userCount, postCount, feedbackCount] = await Promise.all([
        prisma.users.count(),
        prisma.posts.count(),
        prisma.feedback.count(),
      ]);

      return {
        available_exports: ["users", "posts", "feedback"],
        total_users: userCount,
        total_posts: postCount,
        total_feedback: feedbackCount,
        supported_formats: ["csv", "excel"],
      };
    } catch (error) {
      console.error("获取导出信息失败:", error);
      throw error;
    }
  }

  /**
   * 导出用户数据
   */
  async exportUsers(options?: ExportOptions): Promise<string> {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        username: true,
        nickname: true,
        city: true,
        status: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
    });

    const headers = ["用户ID", "用户名", "昵称", "城市", "状态", "注册时间"];
    const rows = users.map((user) => [
      user.id,
      user.username,
      user.nickname || "",
      user.city || "",
      user.status,
      user.created_at.toISOString(),
    ]);

    return this.generateCSV(headers, rows);
  }

  /**
   * 导出帖子数据
   */
  async exportPosts(options: ExportOptions): Promise<string> {
    const where: any = {};
    if (options.filters?.category) {
      where.category = options.filters.category;
    }
    if (options.filters?.status) {
      where.status = options.filters.status;
    }

    const posts = await prisma.posts.findMany({
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        created_at: true,
        users: {
          select: {
            nickname: true,
          },
        },
      },
      where,
      orderBy: { created_at: "desc" },
    });

    const headers = ["帖子ID", "标题", "分类", "状态", "作者", "创建时间"];
    const rows = posts.map((post) => [
      post.id,
      post.title,
      post.category || "",
      post.status,
      post.users?.nickname || "",
      post.created_at.toISOString(),
    ]);

    return this.generateCSV(headers, rows);
  }

  /**
   * 导出反馈数据
   */
  async exportFeedback(options: ExportOptions): Promise<string> {
    const feedback = await prisma.feedback.findMany({
      select: {
        id: true,
        content: true,
        type: true,
        status: true,
        created_at: true,
        users: {
          select: {
            nickname: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const headers = ["反馈ID", "内容", "类型", "状态", "用户", "创建时间"];
    const rows = feedback.map((item) => [
      item.id,
      item.content,
      item.type,
      item.status,
      item.users?.nickname || "",
      item.created_at.toISOString(),
    ]);

    return this.generateCSV(headers, rows);
  }

  /**
   * 导出统计数据
   */
  async exportStatistics(options: ExportOptions): Promise<string> {
    // 这里实现统计数据导出逻辑
    const headers = ["统计类型", "数值", "日期"];
    const rows = [
      ["用户总数", "0", new Date().toISOString()],
      ["帖子总数", "0", new Date().toISOString()],
      ["反馈总数", "0", new Date().toISOString()],
    ];

    return this.generateCSV(headers, rows);
  }

  /**
   * 生成CSV格式数据
   */
  private generateCSV(headers: string[], rows: any[][]): string {
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return csvContent;
  }
}

export const exportService = new ExportService();
