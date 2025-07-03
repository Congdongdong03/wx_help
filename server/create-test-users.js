const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// 测试用户数据
const TEST_USERS = [
  {
    openid: "dev_openid_123",
    username: "user_a",
    nickname: "用户A（卖家）",
    avatar_url:
      "https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132",
    gender: 1,
    city: "Sydney",
    province: "NSW",
    country: "Australia",
    language: "zh_CN",
    status: "active",
  },
  {
    openid: "dev_openid_456",
    username: "user_b",
    nickname: "用户B（买家）",
    avatar_url:
      "https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132",
    gender: 2,
    city: "Melbourne",
    province: "VIC",
    country: "Australia",
    language: "zh_CN",
    status: "active",
  },
];

async function createTestUsers() {
  try {
    console.log("Creating test users...");

    for (const userData of TEST_USERS) {
      // 使用 upsert 操作，如果存在则更新，不存在则创建
      const user = await prisma.users.upsert({
        where: { openid: userData.openid },
        update: userData,
        create: userData,
      });
      console.log(`Upserted user: ${user.nickname} (ID: ${user.id})`);
    }

    console.log("Test users setup completed!");

    // 显示所有用户
    const allUsers = await prisma.users.findMany();
    console.log("\nAll users in database:");
    allUsers.forEach((user) => {
      console.log(
        `- ID: ${user.id}, OpenID: ${user.openid}, Nickname: ${user.nickname}`
      );
    });
  } catch (error) {
    console.error("Error creating test users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
