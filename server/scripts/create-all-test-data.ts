import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface TestDataConfig {
  users?: number;
  posts?: number;
  categories?: number;
  cities?: number;
  feedback?: number;
}

async function createAllTestData(config: TestDataConfig = {}) {
  const {
    users = 1,
    posts = 1,
    categories = 1,
    cities = 1,
    feedback = 1,
  } = config;

  try {
    console.log("开始创建测试数据...\n");

    // 1. 创建管理员用户
    console.log("创建管理员用户...");
    const adminUser = await prisma.admin_user.create({
      data: {
        username: "admin_test",
        password_hash: "hashed_password_123",
        role: "admin",
      },
    });
    console.log("✅ 管理员用户创建成功:", adminUser.id);

    // 2. 创建分类
    console.log("创建分类...");
    const categoriesData = [];
    for (let i = 0; i < categories; i++) {
      const category = await prisma.category.create({
        data: {
          name: `测试分类${i + 1}`,
          code: `test_category_${i + 1}`,
        },
      });
      categoriesData.push(category);
      console.log(`✅ 分类${i + 1}创建成功:`, category.id);
    }

    // 3. 创建城市
    console.log("创建城市...");
    const citiesData = [];
    for (let i = 0; i < cities; i++) {
      const city = await prisma.cities.create({
        data: {
          name: `悉尼${i + 1}`,
          code: `SYD${i + 1}`,
          is_hot: true,
          sort_order: i + 1,
          is_active: true,
        },
      });
      citiesData.push(city);
      console.log(`✅ 城市${i + 1}创建成功:`, city.id);
    }

    // 4. 创建用户
    console.log("创建用户...");
    const usersData = [];
    for (let i = 0; i < users; i++) {
      const user = await prisma.users.create({
        data: {
          username: `test_user_${i + 1}`,
          openid: `test_openid_${i + 1}`,
          unionid: `test_unionid_${i + 1}`,
          session_key: `test_session_key_${i + 1}`,
          nickname: `测试用户${i + 1}`,
          avatar_url: "https://example.com/avatar.jpg",
          phone: "0412345678",
          email: `test${i + 1}@example.com`,
          gender: 1,
          city: "悉尼",
          province: "新南威尔士",
          country: "澳大利亚",
          language: "zh_CN",
          status: "active",
          last_login_at: new Date(),
        },
      });
      usersData.push(user);
      console.log(`✅ 用户${i + 1}创建成功:`, user.id);
    }

    // 5. 创建帖子
    console.log("创建帖子...");
    const postsData = [];
    for (let i = 0; i < posts; i++) {
      const post = await prisma.posts.create({
        data: {
          user_id: usersData[i % usersData.length].id,
          title: `测试帖子标题${i + 1}`,
          content: `这是一个测试帖子内容${i + 1}`,
          category: "help",
          city_code: citiesData[i % citiesData.length].code,
          images: JSON.stringify([`image${i + 1}.jpg`]),
          contact_info: "0412345678",
          price: "100",
          price_unit: "澳元",
          status: "published",
          view_count: 10,
          favorite_count: 2,
          recommend_score: "8.5",
          is_pinned: false,
        },
      });
      postsData.push(post);
      console.log(`✅ 帖子${i + 1}创建成功:`, post.id);
    }

    // 6. 创建收藏
    console.log("创建收藏...");
    for (let i = 0; i < Math.min(users, posts); i++) {
      const favorite = await prisma.favorite.create({
        data: {
          user_id: usersData[i].id,
          post_id: postsData[i].id,
        },
      });
      console.log(`✅ 收藏${i + 1}创建成功:`, favorite.id);
    }

    // 7. 创建反馈
    console.log("创建反馈...");
    for (let i = 0; i < feedback; i++) {
      const feedbackItem = await prisma.feedback.create({
        data: {
          user_id: usersData[i % usersData.length].id,
          type: "bug",
          title: `测试反馈${i + 1}`,
          content: `这是一个测试反馈内容${i + 1}`,
          status: "pending",
        },
      });
      console.log(`✅ 反馈${i + 1}创建成功:`, feedbackItem.id);
    }

    console.log("\n🎉 所有测试数据创建完成！");

    // 显示统计信息
    const stats = await getDataStats();
    console.log("\n📊 数据统计:");
    console.log(`   用户总数: ${stats.users}`);
    console.log(`   帖子总数: ${stats.posts}`);
    console.log(`   分类总数: ${stats.categories}`);
    console.log(`   城市总数: ${stats.cities}`);
    console.log(`   反馈总数: ${stats.feedback}`);
  } catch (error) {
    console.error("❌ 创建测试数据失败:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function getDataStats() {
  const [users, posts, categories, cities, feedback] = await Promise.all([
    prisma.users.count(),
    prisma.posts.count(),
    prisma.category.count(),
    prisma.cities.count(),
    prisma.feedback.count(),
  ]);

  return { users, posts, categories, cities, feedback };
}

// 如果直接运行此脚本，使用默认配置
if (require.main === module) {
  createAllTestData();
}

export { createAllTestData, getDataStats, TestDataConfig };
