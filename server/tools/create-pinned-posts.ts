import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface PinnedPostConfig {
  title: string;
  content: string;
  category: string;
  imageUrl: string;
}

async function createPinnedPosts(configs: PinnedPostConfig[] = []) {
  try {
    // 默认配置
    const defaultConfigs: PinnedPostConfig[] = [
      {
        title: "Coles 每周打折信息",
        content: "Coles 本周特价商品：新鲜蔬菜、肉类、日用品等都有大幅折扣！关注我们获取最新优惠信息，帮你省钱购物。",
        category: "help",
        imageUrl: "https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=Coles+Weekly+Deals"
      },
      {
        title: "Woolworths 每周打折信息", 
        content: "Woolworths 本周特价商品：水果、海鲜、零食等都有超值优惠！关注我们获取最新打折信息，让你购物更划算。",
        category: "help",
        imageUrl: "https://via.placeholder.com/400x300/2196F3/FFFFFF?text=WWS+Weekly+Deals"
      }
    ];

    const postsToCreate = configs.length > 0 ? configs : defaultConfigs;
    const createdPosts = [];

    for (const config of postsToCreate) {
      const post = await prisma.posts.create({
        data: {
          user_id: 1, // 使用管理员账号
          title: config.title,
          category: config.category,
          content: config.content,
          city_code: "通用",
          status: "published",
          images: JSON.stringify([config.imageUrl]),
          price: "0",
          is_pinned: true,
        },
      });
      
      createdPosts.push(post);
      console.log(`✅ 成功创建置顶帖子: ${post.title} (ID: ${post.id})`);
    }

    // 验证置顶帖子数量
    const pinnedPosts = await prisma.posts.findMany({
      where: { is_pinned: true },
      select: { id: true, title: true, is_pinned: true },
      orderBy: { created_at: "desc" },
      take: 10,
    });

    console.log(`📊 当前置顶帖子总数: ${pinnedPosts.length}`);
    pinnedPosts.forEach((post, index) => {
      console.log(`   ${index + 1}. ${post.title} (ID: ${post.id})`);
    });

    return createdPosts;
  } catch (error) {
    console.error("❌ 创建置顶帖子失败:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此脚本，使用默认配置
if (require.main === module) {
  createPinnedPosts();
}

export { createPinnedPosts, PinnedPostConfig };
