const { PrismaClient } = require("./server/node_modules/@prisma/client");

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log("🔍 查询SQLite数据库中的用户记录...");

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
        created_at: "desc",
      },
    });

    console.log(`📊 SQLite数据库中共有 ${users.length} 个用户:`);
    console.log("=".repeat(60));

    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   用户名: ${user.username}`);
      console.log(`   OpenID: ${user.openid}`);
      console.log(`   昵称: ${user.nickname}`);
      console.log(`   头像: ${user.avatar_url || "无"}`);
      console.log(`   创建时间: ${user.created_at}`);
      console.log(`   最后登录: ${user.last_login_at || "无"}`);
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

    console.log(
      "dev_openid_123:",
      testUser1
        ? `✅ 存在 (ID: ${testUser1.id}, 昵称: ${testUser1.nickname})`
        : "❌ 不存在"
    );
    console.log(
      "dev_openid_456:",
      testUser2
        ? `✅ 存在 (ID: ${testUser2.id}, 昵称: ${testUser2.nickname})`
        : "❌ 不存在"
    );

    // 检查最新的用户记录
    console.log("\n🔍 最新的用户记录:");
    const latestUsers = await prisma.users.findMany({
      take: 5,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        username: true,
        openid: true,
        nickname: true,
        created_at: true,
      },
    });

    latestUsers.forEach((user, index) => {
      console.log(
        `${index + 1}. ID: ${user.id} | ${user.username} | ${user.openid} | ${
          user.nickname
        } | ${user.created_at}`
      );
    });
  } catch (error) {
    console.error("❌ 查询失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
