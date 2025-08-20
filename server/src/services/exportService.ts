import { PrismaClient, posts_status } from "@prisma/client";

const prisma = new PrismaClient();

export interface ExportOptions {
  format: "csv" | "excel";
  filters?: {
    category?: string;
    status?: posts_status;
  };
}

export class ExportService {
  /**
   * 导出用户数据
   */
  async exportUsers(): Promise<string> {
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
