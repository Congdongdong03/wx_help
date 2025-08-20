import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function finalCheck() {
  try {
    console.log("🎯 最终检查 - Prisma Studio 状态验证\n");

    // 1. 检查数据库连接
    console.log("🔌 检查数据库连接...");
    await prisma.$connect();
    console.log("✅ 数据库连接正常");

    // 2. 检查所有表的数据
    console.log("\n📊 检查所有表的数据:");
    const tables = [
      "admin_user",
      "category",
      "cities",
      "users",
      "posts",
      "favorite",
      "feedback",
      "polish_log",
      "weekly_deals",
      "catalogue_images",
      "ValidationRule",
      "SystemConfig",
      "Conversation",
      "Message",
    ];

    let allTablesOk = true;
    for (const table of tables) {
      try {
        const count = await (prisma as any)[table].count();
        console.log(`✅ ${table}: ${count} 条记录`);
        if (count === 0) {
          console.log(`⚠️  ${table} 表没有数据`);
          allTablesOk = false;
        }
      } catch (error: any) {
        console.log(`❌ ${table}: ${error.message}`);
        allTablesOk = false;
      }
    }

    // 3. 特别检查 favorite 表（之前出问题的表）
    console.log("\n🔍 特别检查 favorite 表:");
    try {
      const favorite = await prisma.favorite.findFirst({
        include: {
          users: true,
          posts: true,
        },
      });

      if (favorite) {
        console.log("✅ favorite 表数据正常");
        console.log(`   - 用户: ${favorite.users.nickname}`);
        console.log(`   - 帖子: ${favorite.posts.title}`);
        console.log(`   - 创建时间: ${favorite.created_at}`);
      } else {
        console.log("❌ favorite 表没有数据");
        allTablesOk = false;
      }
    } catch (error: any) {
      console.log(`❌ favorite 表查询失败: ${error.message}`);
      allTablesOk = false;
    }

    // 4. 检查关联查询
    console.log("\n🔗 检查关联查询:");
    try {
      const postWithRelations = await prisma.posts.findFirst({
        include: {
          users: true,
          favorite: true,
          conversations: true,
        },
      });

      if (postWithRelations) {
        console.log("✅ 关联查询正常");
        console.log(`   - 帖子: ${postWithRelations.title}`);
        console.log(`   - 作者: ${postWithRelations.users.nickname}`);
        console.log(`   - 收藏数: ${postWithRelations.favorite.length}`);
        console.log(`   - 对话数: ${postWithRelations.conversations.length}`);
      } else {
        console.log("❌ 没有找到帖子数据");
        allTablesOk = false;
      }
    } catch (error: any) {
      console.log(`❌ 关联查询失败: ${error.message}`);
      allTablesOk = false;
    }

    // 5. 总结
    console.log("\n📋 检查总结:");
    if (allTablesOk) {
      console.log("🎉 所有检查通过！");
      console.log("✅ 数据库连接正常");
      console.log("✅ 所有表都有数据");
      console.log("✅ 关联查询正常工作");
      console.log("✅ Prisma Studio 应该完全正常");
      console.log("\n📱 现在可以安全访问: http://localhost:5555");
      console.log("🔍 在 Prisma Studio 中查看所有表都应该有数据");
    } else {
      console.log("❌ 发现一些问题，请检查上面的错误信息");
      console.log("💡 建议重新运行: ./scripts/fix-database-permanently.sh");
    }
  } catch (error: any) {
    console.error("❌ 检查过程中出错:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

finalCheck();
