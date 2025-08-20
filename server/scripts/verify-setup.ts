import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifySetup() {
  try {
    console.log("🔍 验证数据库设置...\n");

    // 测试关联查询
    const postWithRelations = await prisma.posts.findFirst({
      include: {
        users: true,
        favorite: true,
        conversations: true,
      },
    });

    if (postWithRelations) {
      console.log("✅ 找到帖子:", postWithRelations.title);
      console.log("✅ 作者:", postWithRelations.users.nickname);
      console.log("✅ 收藏数:", postWithRelations.favorite.length);
      console.log("✅ 对话数:", postWithRelations.conversations.length);
    }

    // 测试复杂查询
    const userWithPosts = await prisma.users.findFirst({
      include: {
        posts: true,
        favorite: {
          include: {
            posts: true,
          },
        },
      },
    });

    if (userWithPosts) {
      console.log("\n✅ 用户:", userWithPosts.nickname);
      console.log("✅ 发布帖子数:", userWithPosts.posts.length);
      console.log("✅ 收藏帖子数:", userWithPosts.favorite.length);
    }

    console.log("\n🎉 数据库设置验证成功！");
    console.log("📋 现在可以：");
    console.log("  1. 使用 Prisma Studio 查看数据：npx prisma studio");
    console.log("  2. 运行应用程序");
    console.log("  3. 进行开发和测试");
  } catch (error) {
    console.error("❌ 验证失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySetup();
