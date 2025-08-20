import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function quickVerify() {
  try {
    console.log("🚀 快速验证 Prisma Studio 状态...\n");

    // 测试 favorite 表（之前出问题的表）
    const favoriteCount = await prisma.favorite.count();
    console.log(`✅ favorite 表: ${favoriteCount} 条记录`);

    // 测试关联查询
    const favoriteWithRelations = await prisma.favorite.findFirst({
      include: {
        users: true,
        posts: true,
      },
    });

    if (favoriteWithRelations) {
      console.log("✅ 关联查询正常");
      console.log(`   - 用户: ${favoriteWithRelations.users.nickname}`);
      console.log(`   - 帖子: ${favoriteWithRelations.posts.title}`);
    }

    // 检查所有表的数据
    const tables = [
      "admin_user",
      "category",
      "cities",
      "users",
      "posts",
      "favorite",
      "feedback",
    ];
    for (const table of tables) {
      const count = await (prisma as any)[table].count();
      console.log(`✅ ${table}: ${count} 条记录`);
    }

    console.log("\n🎉 Prisma Studio 现在应该完全正常！");
    console.log("📱 访问: http://localhost:5555");
    console.log("🔍 在 Prisma Studio 中查看 favorite 表应该能看到数据");
  } catch (error: any) {
    console.error("❌ 验证失败:", error.message);
    console.log(
      "💡 如果还有问题，请运行: ./scripts/fix-database-permanently.sh"
    );
  } finally {
    await prisma.$disconnect();
  }
}

quickVerify();
