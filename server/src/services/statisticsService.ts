import { PrismaClient } from "@prisma/client";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subWeeks,
  subMonths,
  format,
} from "date-fns";

const prisma = new PrismaClient();

export interface StatisticsData {
  date: string;
  period_type: "daily" | "weekly" | "monthly";
  metrics: {
    [key: string]: number;
  };
}

export interface DashboardStats {
  overview: {
    total_users: number;
    total_posts: number;
    total_feedback: number;
    pending_reviews: number;
  };
  today: {
    new_users: number;
    new_posts: number;
    new_feedback: number;
    approved_posts: number;
    rejected_posts: number;
  };
  trends: {
    user_growth: Array<{ date: string; value: number }>;
    post_growth: Array<{ date: string; value: number }>;
    feedback_growth: Array<{ date: string; value: number }>;
  };
  categories: Array<{ name: string; count: number; pending: number }>;
  top_users: Array<{
    id: number;
    username: string;
    nickname: string;
    post_count: number;
    last_active: string;
  }>;
}

export class StatisticsService {
  // 获取仪表盘统计数据
  async getDashboardStats(): Promise<DashboardStats> {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    // 获取概览数据
    const [totalUsers, totalPosts, totalFeedback, pendingReviews] =
      await Promise.all([
        prisma.users.count({ where: { status: "active" } }),
        prisma.posts.count(),
        prisma.feedback.count(),
        prisma.posts.count({ where: { review_status: "pending" } }),
      ]);

    // 获取今日数据
    const [newUsers, newPosts, newFeedback, approvedPosts, rejectedPosts] =
      await Promise.all([
        prisma.users.count({
          where: {
            created_at: { gte: startOfToday, lte: endOfToday },
            status: "active",
          },
        }),
        prisma.posts.count({
          where: { created_at: { gte: startOfToday, lte: endOfToday } },
        }),
        prisma.feedback.count({
          where: { created_at: { gte: startOfToday, lte: endOfToday } },
        }),
        prisma.posts.count({
          where: {
            review_status: "approved",
            updated_at: { gte: startOfToday, lte: endOfToday },
          },
        }),
        prisma.posts.count({
          where: {
            review_status: "rejected",
            updated_at: { gte: startOfToday, lte: endOfToday },
          },
        }),
      ]);

    // 获取趋势数据（最近7天）
    const trends = await this.getTrendsData(7);

    // 获取分类统计
    const categories = await this.getCategoryStats();

    // 获取活跃用户排行
    const topUsers = await this.getTopActiveUsers(10);

    return {
      overview: {
        total_users: totalUsers,
        total_posts: totalPosts,
        total_feedback: totalFeedback,
        pending_reviews: pendingReviews,
      },
      today: {
        new_users: newUsers,
        new_posts: newPosts,
        new_feedback: newFeedback,
        approved_posts: approvedPosts,
        rejected_posts: rejectedPosts,
      },
      trends,
      categories,
      top_users: topUsers,
    };
  }

  // 获取趋势数据
  async getTrendsData(days: number = 7): Promise<DashboardStats["trends"]> {
    const userGrowth: Array<{ date: string; value: number }> = [];
    const postGrowth: Array<{ date: string; value: number }> = [];
    const feedbackGrowth: Array<{ date: string; value: number }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const startOfDate = startOfDay(date);
      const endOfDate = endOfDay(date);
      const dateStr = date.toISOString().split("T")[0];

      const [userCount, postCount, feedbackCount] = await Promise.all([
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
      ]);

      userGrowth.push({ date: dateStr, value: userCount });
      postGrowth.push({ date: dateStr, value: postCount });
      feedbackGrowth.push({ date: dateStr, value: feedbackCount });
    }

    return {
      user_growth: userGrowth,
      post_growth: postGrowth,
      feedback_growth: feedbackGrowth,
    };
  }

  // 获取分类统计
  async getCategoryStats(): Promise<
    Array<{ name: string; count: number; pending: number }>
  > {
    const categories = await prisma.posts.groupBy({
      by: ["category"],
      _count: {
        id: true,
      },
      where: {
        category: { not: null },
      },
    });

    const pendingByCategory = await prisma.posts.groupBy({
      by: ["category"],
      _count: {
        id: true,
      },
      where: {
        category: { not: null },
        review_status: "pending",
      },
    });

    const pendingMap = new Map(
      pendingByCategory.map((item) => [item.category, item._count.id])
    );

    return categories.map((cat) => ({
      name: cat.category || "未分类",
      count: cat._count.id,
      pending: pendingMap.get(cat.category) || 0,
    }));
  }

  // 获取活跃用户排行
  async getTopActiveUsers(limit: number = 10): Promise<
    Array<{
      id: number;
      username: string;
      nickname: string;
      post_count: number;
      last_active: string;
    }>
  > {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        username: true,
        nickname: true,
        last_login_at: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
      where: {
        status: "active",
      },
      orderBy: {
        posts: {
          _count: "desc",
        },
      },
      take: limit,
    });

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      nickname: user.nickname || user.username,
      post_count: user._count.posts,
      last_active: user.last_login_at
        ? user.last_login_at.toISOString()
        : "从未登录",
    }));
  }

  // 获取时间范围统计数据
  async getTimeRangeStats(
    startDate: Date,
    endDate: Date,
    periodType: "daily" | "weekly" | "monthly" = "daily"
  ): Promise<StatisticsData[]> {
    const results: StatisticsData[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      let periodStart: Date;
      let periodEnd: Date;
      let nextDate: Date;

      switch (periodType) {
        case "daily":
          periodStart = startOfDay(currentDate);
          periodEnd = endOfDay(currentDate);
          nextDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
          break;
        case "weekly":
          periodStart = startOfWeek(currentDate, { weekStartsOn: 1 });
          periodEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
          nextDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case "monthly":
          periodStart = startOfMonth(currentDate);
          periodEnd = endOfMonth(currentDate);
          nextDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            1
          );
          break;
      }

      const [newUsers, newPosts, newFeedback, approvedPosts, rejectedPosts] =
        await Promise.all([
          prisma.users.count({
            where: {
              created_at: { gte: periodStart, lte: periodEnd },
              status: "active",
            },
          }),
          prisma.posts.count({
            where: { created_at: { gte: periodStart, lte: periodEnd } },
          }),
          prisma.feedback.count({
            where: { created_at: { gte: periodStart, lte: periodEnd } },
          }),
          prisma.posts.count({
            where: {
              review_status: "approved",
              updated_at: { gte: periodStart, lte: periodEnd },
            },
          }),
          prisma.posts.count({
            where: {
              review_status: "rejected",
              updated_at: { gte: periodStart, lte: periodEnd },
            },
          }),
        ]);

      results.push({
        date: currentDate.toISOString().split("T")[0],
        period_type: periodType,
        metrics: {
          new_users: newUsers,
          new_posts: newPosts,
          new_feedback: newFeedback,
          approved_posts: approvedPosts,
          rejected_posts: rejectedPosts,
        },
      });

      currentDate = nextDate;
    }

    return results;
  }

  // 记录用户行为统计
  async recordUserBehavior(
    userId: number,
    actionType: string,
    targetType?: string,
    targetId?: number,
    metadata?: any
  ): Promise<void> {
    await prisma.user_behavior_stats.create({
      data: {
        user_id: userId,
        action_type: actionType,
        target_type: targetType,
        target_id: targetId,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  }

  // 获取用户行为分析
  async getUserBehaviorAnalysis(days: number = 30): Promise<any> {
    const startDate = subDays(new Date(), days);

    const behaviors = await prisma.user_behavior_stats.groupBy({
      by: ["action_type"],
      _count: {
        id: true,
      },
      where: {
        created_at: { gte: startDate },
      },
    });

    const activeUsers = await prisma.user_behavior_stats.groupBy({
      by: ["user_id"],
      _count: {
        id: true,
      },
      where: {
        created_at: { gte: startDate },
      },
    });

    return {
      action_distribution: behaviors.map((b) => ({
        action: b.action_type,
        count: b._count.id,
      })),
      active_users_count: activeUsers.length,
      total_actions: behaviors.reduce((sum, b) => sum + b._count.id, 0),
    };
  }

  // 获取用户留存分析
  async getUserRetentionAnalysis(days: number = 30): Promise<any> {
    const startDate = subDays(new Date(), days);
    const endDate = new Date();

    // 获取每日新增用户数
    const dailyNewUsers = await this.getDailyNewUsers(startDate, endDate);

    // 计算留存率（简化版本）
    const retentionData = [];
    for (let i = 1; i <= 7; i++) {
      const retentionRate = await this.calculateRetentionRate(
        i,
        startDate,
        endDate
      );
      retentionData.push({
        day: i,
        rate: retentionRate,
      });
    }

    return {
      daily_new_users: dailyNewUsers,
      retention_rates: retentionData,
    };
  }

  // 获取内容质量分析
  async getContentQualityAnalysis(days: number = 30): Promise<any> {
    const startDate = subDays(new Date(), days);

    // 获取帖子质量指标
    const qualityMetrics = await prisma.posts.groupBy({
      by: ["review_status"],
      _count: {
        id: true,
      },
      _avg: {
        view_count: true,
        favorite_count: true,
      },
      where: {
        created_at: { gte: startDate },
      },
    });

    // 获取热门内容
    const hotContent = await prisma.posts.findMany({
      select: {
        id: true,
        title: true,
        category: true,
        view_count: true,
        favorite_count: true,
        created_at: true,
      },
      where: {
        created_at: { gte: startDate },
        status: "published",
      },
      orderBy: [{ view_count: "desc" }, { favorite_count: "desc" }],
      take: 10,
    });

    return {
      quality_metrics: qualityMetrics.map((metric) => ({
        status: metric.review_status,
        count: metric._count.id,
        avg_views: metric._avg.view_count || 0,
        avg_favorites: metric._avg.favorite_count || 0,
      })),
      hot_content: hotContent,
    };
  }

  // 获取地域分析
  async getGeographicAnalysis(): Promise<any> {
    const userDistribution = await prisma.users.groupBy({
      by: ["city"],
      _count: {
        id: true,
      },
      where: {
        city: { not: null },
      },
    });

    const postDistribution = await prisma.posts.groupBy({
      by: ["city_code"],
      _count: {
        id: true,
      },
      where: {
        city_code: { not: null },
      },
    });

    return {
      user_distribution: userDistribution.map((item) => ({
        city: item.city,
        count: item._count.id,
      })),
      post_distribution: postDistribution.map((item) => ({
        city: item.city_code,
        count: item._count.id,
      })),
    };
  }

  // 获取时间分析
  async getTimeAnalysis(days: number = 30): Promise<any> {
    const startDate = subDays(new Date(), days);

    // 获取每小时活跃度
    const hourlyActivity = await this.getHourlyActivity(startDate);

    // 获取每周活跃度
    const weeklyActivity = await this.getWeeklyActivity(startDate);

    return {
      hourly_activity: hourlyActivity,
      weekly_activity: weeklyActivity,
    };
  }

  // 私有方法：获取每日新增用户
  private async getDailyNewUsers(startDate: Date, endDate: Date) {
    const users = await prisma.users.groupBy({
      by: ["created_at"],
      _count: {
        id: true,
      },
      where: {
        created_at: { gte: startDate, lte: endDate },
        status: "active",
      },
    });

    return users.map((user) => ({
      date: format(user.created_at, "yyyy-MM-dd"),
      count: user._count.id,
    }));
  }

  // 私有方法：计算留存率
  private async calculateRetentionRate(
    day: number,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // 简化版本的留存率计算
    const targetDate = subDays(endDate, day);

    const newUsersOnDay = await prisma.users.count({
      where: {
        created_at: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) },
        status: "active",
      },
    });

    if (newUsersOnDay === 0) return 0;

    const retainedUsers = await prisma.users.count({
      where: {
        created_at: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) },
        last_login_at: { gte: subDays(endDate, day - 1) },
        status: "active",
      },
    });

    return Math.round((retainedUsers / newUsersOnDay) * 100);
  }

  // 私有方法：获取每小时活跃度
  private async getHourlyActivity(startDate: Date) {
    const activity = [];
    for (let hour = 0; hour < 24; hour++) {
      const count = await prisma.posts.count({
        where: {
          created_at: { gte: startDate },
        },
      });
      activity.push({
        hour,
        count: Math.floor(count / 24), // 简化计算
      });
    }
    return activity;
  }

  // 私有方法：获取每周活跃度
  private async getWeeklyActivity(startDate: Date) {
    const activity = [];
    for (let hour = 0; hour < 7; hour++) {
      const count = await prisma.posts.count({
        where: {
          created_at: { gte: startDate },
        },
      });
      activity.push({
        day: hour + 1,
        count: Math.floor(count / 7), // 简化计算
      });
    }
    return activity;
  }
}

export default new StatisticsService();
