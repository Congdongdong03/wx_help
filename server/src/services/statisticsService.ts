import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface DashboardStats {
  overview: {
    total_users: number;
    total_posts: number;
    total_feedback: number;
    pending_reviews: number;
  };
  categories: Array<{ name: string; count: number; pending: number }>;
  top_users: Array<{
    id: number;
    nickname: string;
    post_count: number;
  }>;
}

export class StatisticsService {
  /**
   * 获取仪表盘统计数据
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // 获取概览数据
      const [totalUsers, totalPosts, totalFeedback, pendingReviews] =
        await Promise.all([
          prisma.users.count({ where: { status: "active" } }),
          prisma.posts.count(),
          prisma.feedback.count(),
          prisma.posts.count({ where: { status: "pending" } }),
        ]);

      // 获取分类统计
      const categories = await this.getCategoryStats();

      // 获取活跃用户排行
      const topUsers = await this.getTopActiveUsers();

      return {
        overview: {
          total_users: totalUsers,
          total_posts: totalPosts,
          total_feedback: totalFeedback,
          pending_reviews: pendingReviews,
        },
        categories,
        top_users: topUsers,
      };
    } catch (error) {
      console.error("获取仪表盘统计数据失败:", error);
      throw error;
    }
  }

  /**
   * 获取分类统计
   */
  async getCategoryStats(): Promise<
    Array<{ name: string; count: number; pending: number }>
  > {
    try {
      const categories = await prisma.posts.groupBy({
        by: ["category"],
        _count: {
          id: true,
        },
        where: {
          status: "pending",
        },
      });

      const allCategories = await prisma.posts.groupBy({
        by: ["category"],
        _count: {
          id: true,
        },
      });

      return allCategories.map((cat) => {
        const pending =
          categories.find((p) => p.category === cat.category)?._count.id || 0;
        return {
          name: cat.category || "未分类",
          count: cat._count.id,
          pending,
        };
      });
    } catch (error) {
      console.error("获取分类统计失败:", error);
      return [];
    }
  }

  /**
   * 获取活跃用户排行
   */
  async getTopActiveUsers(
    limit: number = 10
  ): Promise<Array<{ id: number; nickname: string; post_count: number }>> {
    try {
      const topUsers = await prisma.users.findMany({
        select: {
          id: true,
          nickname: true,
          _count: {
            select: {
              posts: true,
            },
          },
        },
        orderBy: {
          posts: {
            _count: "desc",
          },
        },
        take: 10,
      });

      return topUsers.map((user) => ({
        id: user.id,
        nickname: user.nickname || "未知用户",
        post_count: user._count.posts,
      }));
    } catch (error) {
      console.error("获取活跃用户排行失败:", error);
      return [];
    }
  }

  /**
   * 获取时间范围统计数据
   */
  async getTimeRangeStats(
    startDate: string,
    endDate: string,
    periodType: string = "daily"
  ): Promise<any> {
    try {
      // 这里实现时间范围统计逻辑
      return {
        period_type: periodType,
        start_date: startDate,
        end_date: endDate,
        data: [],
      };
    } catch (error) {
      console.error("获取时间范围统计数据失败:", error);
      throw error;
    }
  }

  /**
   * 获取用户行为分析
   */
  async getUserBehaviorAnalysis(days: number = 7): Promise<any> {
    try {
      // 这里实现用户行为分析逻辑
      return {
        days,
        analysis: [],
      };
    } catch (error) {
      console.error("获取用户行为分析失败:", error);
      throw error;
    }
  }

  /**
   * 记录用户行为
   */
  async recordUserBehavior(
    userId: number,
    action: string,
    data?: any
  ): Promise<void> {
    try {
      // 这里实现用户行为记录逻辑
      console.log(`记录用户行为: ${userId} - ${action}`, data);
    } catch (error) {
      console.error("记录用户行为失败:", error);
    }
  }

  /**
   * 获取用户留存分析
   */
  async getUserRetentionAnalysis(days: number = 30): Promise<any> {
    try {
      // 这里实现用户留存分析逻辑
      return {
        days,
        retention: [],
      };
    } catch (error) {
      console.error("获取用户留存分析失败:", error);
      throw error;
    }
  }

  /**
   * 获取内容质量分析
   */
  async getContentQualityAnalysis(days: number = 30): Promise<any> {
    try {
      // 这里实现内容质量分析逻辑
      return {
        days,
        quality: [],
      };
    } catch (error) {
      console.error("获取内容质量分析失败:", error);
      throw error;
    }
  }

  /**
   * 获取地理分析
   */
  async getGeographicAnalysis(): Promise<any> {
    try {
      // 这里实现地理分析逻辑
      return {
        geographic: [],
      };
    } catch (error) {
      console.error("获取地理分析失败:", error);
      throw error;
    }
  }

  /**
   * 获取时间分析
   */
  async getTimeAnalysis(days: number = 30): Promise<any> {
    try {
      // 这里实现时间分析逻辑
      return {
        days,
        time_analysis: [],
      };
    } catch (error) {
      console.error("获取时间分析失败:", error);
      throw error;
    }
  }

  /**
   * 获取趋势数据
   */
  async getTrendsData(days: number = 7): Promise<{
    user_growth: Array<{ date: string; value: number }>;
    post_growth: Array<{ date: string; value: number }>;
  }> {
    try {
      const userGrowth = await this.getDailyStats("users", days);
      const postGrowth = await this.getDailyStats("posts", days);

      return {
        user_growth: userGrowth,
        post_growth: postGrowth,
      };
    } catch (error) {
      console.error("获取趋势数据失败:", error);
      return {
        user_growth: [],
        post_growth: [],
      };
    }
  }

  /**
   * 获取每日统计数据
   */
  private async getDailyStats(
    table: "users" | "posts",
    days: number
  ): Promise<Array<{ date: string; value: number }>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const results = await prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as value
        FROM ${table}
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date
      `;

      return results as Array<{ date: string; value: number }>;
    } catch (error) {
      console.error(`获取${table}每日统计失败:`, error);
      return [];
    }
  }
}

export const statisticsService = new StatisticsService();
