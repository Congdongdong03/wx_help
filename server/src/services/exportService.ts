import { PrismaClient, posts_status } from "@prisma/client";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

const prisma = new PrismaClient();

export interface ExportOptions {
  format: "csv" | "excel";
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: {
    category?: string;
    status?: posts_status;
    userId?: number;
  };
}

export class ExportService {
  // 导出用户数据
  async exportUsers(options: ExportOptions): Promise<string> {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        username: true,
        nickname: true,
        phone: true,
        email: true,
        city: true,
        province: true,
        status: true,
        created_at: true,
        last_login_at: true,
        _count: {
          select: {
            posts: true,
            favorite: true,
            feedback: true,
          },
        },
      },
      where: {
        ...(options.dateRange && {
          created_at: {
            gte: startOfDay(options.dateRange.start),
            lte: endOfDay(options.dateRange.end),
          },
        }),
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const headers = [
      "用户ID",
      "用户名",
      "昵称",
      "手机号",
      "邮箱",
      "城市",
      "省份",
      "状态",
      "注册时间",
      "最后登录",
      "发帖数",
      "收藏数",
      "反馈数",
    ];

    const rows = users.map((user) => [
      user.id,
      user.username,
      user.nickname || "",
      user.phone || "",
      user.email || "",
      user.city || "",
      user.province || "",
      user.status,
      format(user.created_at, "yyyy-MM-dd HH:mm:ss"),
      user.last_login_at
        ? format(user.last_login_at, "yyyy-MM-dd HH:mm:ss")
        : "从未登录",
      user._count.posts,
      user._count.favorite,
      user._count.feedback,
    ]);

    return this.generateCSV(headers, rows);
  }

  // 导出帖子数据
  async exportPosts(options: ExportOptions): Promise<string> {
    const posts = await prisma.posts.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        sub_category: true,
        city_code: true,
        price: true,
        status: true,
        review_status: true,
        view_count: true,
        favorite_count: true,
        created_at: true,
        updated_at: true,
        users: {
          select: {
            username: true,
            nickname: true,
          },
        },
      },
      where: {
        ...(options.dateRange && {
          created_at: {
            gte: startOfDay(options.dateRange.start),
            lte: endOfDay(options.dateRange.end),
          },
        }),
        ...(options.filters?.category && {
          category: options.filters.category,
        }),
        ...(options.filters?.status && { status: options.filters.status }),
        ...(options.filters?.userId && { user_id: options.filters.userId }),
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const headers = [
      "帖子ID",
      "标题",
      "内容",
      "分类",
      "子分类",
      "城市",
      "价格",
      "状态",
      "审核状态",
      "浏览量",
      "收藏数",
      "发布者",
      "发布者昵称",
      "创建时间",
      "更新时间",
    ];

    const rows = posts.map((post) => [
      post.id,
      post.title,
      post.content || "",
      post.category || "",
      post.sub_category || "",
      post.city_code || "",
      post.price || "",
      post.status,
      post.review_status || "",
      post.view_count || 0,
      post.favorite_count || 0,
      post.users.username,
      post.users.nickname || post.users.username,
      format(post.created_at, "yyyy-MM-dd HH:mm:ss"),
      format(post.updated_at, "yyyy-MM-dd HH:mm:ss"),
    ]);

    return this.generateCSV(headers, rows);
  }

  // 导出反馈数据
  async exportFeedback(options: ExportOptions): Promise<string> {
    const feedbacks = await prisma.feedback.findMany({
      select: {
        id: true,
        content: true,
        type: true,
        status: true,
        created_at: true,
        users: {
          select: {
            username: true,
            nickname: true,
          },
        },
      },
      where: {
        ...(options.dateRange && {
          created_at: {
            gte: startOfDay(options.dateRange.start),
            lte: endOfDay(options.dateRange.end),
          },
        }),
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const headers = [
      "反馈ID",
      "内容",
      "类型",
      "状态",
      "提交者",
      "提交者昵称",
      "提交时间",
    ];

    const rows = feedbacks.map((feedback) => [
      feedback.id,
      feedback.content,
      feedback.type,
      feedback.status === 0 ? "未处理" : "已处理",
      feedback.users.username,
      feedback.users.nickname || feedback.users.username,
      format(feedback.created_at, "yyyy-MM-dd HH:mm:ss"),
    ]);

    return this.generateCSV(headers, rows);
  }

  // 导出统计数据
  async exportStatistics(options: ExportOptions): Promise<string> {
    const { start, end } = options.dateRange || {
      start: subDays(new Date(), 30),
      end: new Date(),
    };

    const stats = await this.generateDailyStats(start, end);

    const headers = [
      "日期",
      "新增用户数",
      "新增帖子数",
      "新增反馈数",
      "审核通过数",
      "审核拒绝数",
      "活跃用户数",
    ];

    const rows = stats.map((stat) => [
      stat.date,
      stat.newUsers,
      stat.newPosts,
      stat.newFeedback,
      stat.approvedPosts,
      stat.rejectedPosts,
      stat.activeUsers,
    ]);

    return this.generateCSV(headers, rows);
  }

  // 生成每日统计数据
  private async generateDailyStats(start: Date, end: Date) {
    const stats = [];
    let currentDate = new Date(start);

    while (currentDate <= end) {
      const startOfDate = startOfDay(currentDate);
      const endOfDate = endOfDay(currentDate);

      const [
        newUsers,
        newPosts,
        newFeedback,
        approvedPosts,
        rejectedPosts,
        activeUsers,
      ] = await Promise.all([
        prisma.users.count({
          where: {
            created_at: { gte: startOfDate, lte: endOfDate },
            status: "active",
          },
        }),
        prisma.posts.count({
          where: { created_at: { gte: startOfDate, lte: endOfDate } },
        }),
        prisma.feedback.count({
          where: { created_at: { gte: startOfDate, lte: endOfDate } },
        }),
        prisma.posts.count({
          where: {
            review_status: "approved",
            updated_at: { gte: startOfDate, lte: endOfDate },
          },
        }),
        prisma.posts.count({
          where: {
            review_status: "rejected",
            updated_at: { gte: startOfDate, lte: endOfDate },
          },
        }),
        prisma.users.count({
          where: {
            last_login_at: { gte: startOfDate, lte: endOfDate },
            status: "active",
          },
        }),
      ]);

      stats.push({
        date: format(currentDate, "yyyy-MM-dd"),
        newUsers,
        newPosts,
        newFeedback,
        approvedPosts,
        rejectedPosts,
        activeUsers,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return stats;
  }

  // 生成CSV内容
  private generateCSV(headers: string[], rows: any[][]): string {
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) =>
            typeof cell === "string" && cell.includes(",")
              ? `"${cell.replace(/"/g, '""')}"`
              : cell
          )
          .join(",")
      ),
    ].join("\n");

    return csvContent;
  }

  // 获取导出文件信息
  async getExportInfo(): Promise<{
    users: { total: number; lastExport?: Date };
    posts: { total: number; lastExport?: Date };
    feedback: { total: number; lastExport?: Date };
  }> {
    const [userCount, postCount, feedbackCount] = await Promise.all([
      prisma.users.count(),
      prisma.posts.count(),
      prisma.feedback.count(),
    ]);

    return {
      users: { total: userCount },
      posts: { total: postCount },
      feedback: { total: feedbackCount },
    };
  }
}

export default new ExportService();
