const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log("🔍 查询数据库中的用户记录...");

    const users = await prisma.users.findMany({
      select: {
        id: true,
        username: true,
        openid: true,
        nickname: true,
        avatar_url: true,
        created_at: true,
        last_login_at: true,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    console.log(`📊 数据库中共有 ${users.length} 个用户:`);
    console.log("=".repeat(60));

    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   用户名: ${user.username}`);
      console.log(`   OpenID: ${user.openid}`);
      console.log(`   昵称: ${user.nickname}`);
      console.log(`   头像: ${user.avatar_url || "无"}`);
      console.log(`   创建时间: ${user.created_at}`);
      console.log(`   最后登录: ${user.last_login_at}`);
      console.log("-".repeat(40));
    });

    // 检查特定的测试用户
    console.log("\n🔍 检查测试用户:");

    const testUser1 = await prisma.users.findUnique({
      where: { openid: "dev_openid_123" },
    });

    const testUser2 = await prisma.users.findUnique({
      where: { openid: "dev_openid_456" },
    });

    console.log("dev_openid_123:", testUser1 ? "✅ 存在" : "❌ 不存在");
    console.log("dev_openid_456:", testUser2 ? "✅ 存在" : "❌ 不存在");
  } catch (error) {
    console.error("❌ 查询失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
