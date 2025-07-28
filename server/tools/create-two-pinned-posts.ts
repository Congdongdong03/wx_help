import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createTwoPinnedPosts() {
  try {
    // 1. 创建第一个置顶帖子 - Coles 每周打折信息
    const post1 = await prisma.posts.create({
      data: {
        user_id: 1, // 使用管理员账号
        title: "Coles 每周打折信息",
        category: "help",
        content:
          "Coles 本周特价商品：新鲜蔬菜、肉类、日用品等都有大幅折扣！关注我们获取最新优惠信息，帮你省钱购物。",
        city_code: "通用",
        status: "published",
        images: JSON.stringify([
          "https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=Coles+Weekly+Deals",
        ]),
        price: "0",
        is_pinned: true,
      },
    });

    // 2. 创建第二个置顶帖子 - WWS 每周打折信息
    const post2 = await prisma.posts.create({
      data: {
        user_id: 1, // 使用管理员账号
        title: "Woolworths 每周打折信息",
        category: "help",
        content:
          "Woolworths 本周特价商品：水果、海鲜、零食等都有超值优惠！关注我们获取最新打折信息，让你购物更划算。",
        city_code: "通用",
        status: "published",
        images: JSON.stringify([
          "https://via.placeholder.com/400x300/2196F3/FFFFFF?text=WWS+Weekly+Deals",
        ]),
        price: "0",
        is_pinned: true,
      },
    });

    console.log("✅ 成功创建两个置顶帖子:");
    console.log(`   1. ${post1.title} (ID: ${post1.id})`);
    console.log(`   2. ${post2.title} (ID: ${post2.id})`);

    // 验证置顶帖子数量
    const pinnedPosts = await prisma.posts.findMany({
      where: { is_pinned: true },
      select: { id: true, title: true, is_pinned: true },
      orderBy: { created_at: "desc" },
      take: 10, // 只显示最新的10个
    });

    console.log(`📊 当前置顶帖子总数: ${pinnedPosts.length}`);
    pinnedPosts.forEach((post, index) => {
      console.log(`   ${index + 1}. ${post.title} (ID: ${post.id})`);
    });
  } catch (error) {
    console.error("❌ 创建置顶帖子失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTwoPinnedPosts();
