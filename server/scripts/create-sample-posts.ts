import { PrismaClient, posts_status } from "@prisma/client";

const prisma = new PrismaClient();

async function createSamplePosts() {
  try {
    console.log("开始创建示例帖子...");

    // 获取或创建测试用户
    const testUser = await prisma.users.upsert({
      where: { openid: "dev_openid_123" },
      update: {},
      create: {
        username: "test_user",
        openid: "dev_openid_123",
        nickname: "测试用户",
        avatar_url: "https://via.placeholder.com/40/007AFF/FFFFFF?text=U",
        city: "Sydney",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log("测试用户:", testUser);

    // 创建示例帖子数据
    const samplePosts = [
      {
        user_id: testUser.id,
        title: "悉尼市中心求租一室一厅",
        content:
          "本人在悉尼市中心工作，希望租一个一室一厅的公寓，预算每周500-600澳元，希望有家具，交通便利。有意者请联系。",
        category: "rent",
        city_code: "SYD",
        price: "550",
        price_unit: "week",
        status: posts_status.published,
        is_pinned: false,
        images: JSON.stringify([
          "https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=Apartment1",
          "https://via.placeholder.com/400x300/2196F3/FFFFFF?text=Apartment2",
        ]),
        created_at: new Date(),
        updated_at: new Date(),
        last_polished_at: new Date(),
      },
      {
        user_id: testUser.id,
        title: "转让二手iPhone 13",
        content:
          "去年买的iPhone 13，128GB，黑色，无划痕，配件齐全，原价1200澳元，现价800澳元转让。",
        category: "used",
        city_code: "SYD",
        price: "800",
        price_unit: "total",
        status: posts_status.published,
        is_pinned: false,
        images: JSON.stringify([
          "https://via.placeholder.com/400x300/FF9800/FFFFFF?text=iPhone",
        ]),
        created_at: new Date(),
        updated_at: new Date(),
        last_polished_at: new Date(),
      },
      {
        user_id: testUser.id,
        title: "寻找周末兼职工作",
        content:
          "大学生，寻找周末兼职工作，可以从事餐饮、零售、客服等工作，有责任心，学习能力强。",
        category: "jobs",
        city_code: "SYD",
        price: "25",
        price_unit: "hour",
        status: posts_status.published,
        is_pinned: false,
        images: JSON.stringify([]),
        created_at: new Date(),
        updated_at: new Date(),
        last_polished_at: new Date(),
      },
      {
        user_id: testUser.id,
        title: "求助：搬家需要帮助",
        content:
          "下周末需要搬家，从Chatswood到Parramatta，需要2-3个人帮忙，有偿，每人50澳元，大约需要4小时。",
        category: "help",
        city_code: "SYD",
        price: "50",
        price_unit: "person",
        status: posts_status.published,
        is_pinned: true, // 置顶帖子
        images: JSON.stringify([]),
        created_at: new Date(),
        updated_at: new Date(),
        last_polished_at: new Date(),
      },
      {
        user_id: testUser.id,
        title: "墨尔本市中心公寓出租",
        content:
          "墨尔本市中心CBD一室一厅公寓出租，家具齐全，交通便利，步行到火车站5分钟，月租1800澳元。",
        category: "rent",
        city_code: "MEL",
        price: "1800",
        price_unit: "month",
        status: posts_status.published,
        is_pinned: false,
        images: JSON.stringify([
          "https://via.placeholder.com/400x300/9C27B0/FFFFFF?text=Melbourne",
        ]),
        created_at: new Date(),
        updated_at: new Date(),
        last_polished_at: new Date(),
      },
      {
        user_id: testUser.id,
        title: "转让健身卡",
        content:
          "Anytime Fitness健身卡转让，还有8个月有效期，原价600澳元，现价400澳元，可以转卡。",
        category: "used",
        city_code: "SYD",
        price: "400",
        price_unit: "total",
        status: posts_status.published,
        is_pinned: false,
        images: JSON.stringify([]),
        created_at: new Date(),
        updated_at: new Date(),
        last_polished_at: new Date(),
      },
      {
        user_id: testUser.id,
        title: "寻找中文家教",
        content:
          "孩子需要中文家教，每周2次，每次2小时，时薪30澳元，要求有教学经验，有耐心。",
        category: "jobs",
        city_code: "SYD",
        price: "30",
        price_unit: "hour",
        status: posts_status.published,
        is_pinned: false,
        images: JSON.stringify([]),
        created_at: new Date(),
        updated_at: new Date(),
        last_polished_at: new Date(),
      },
      {
        user_id: testUser.id,
        title: "求助：电脑维修",
        content:
          "笔记本电脑无法开机，可能是硬件问题，有懂电脑维修的朋友吗？有偿求助，预算100澳元。",
        category: "help",
        city_code: "SYD",
        price: "100",
        price_unit: "total",
        status: posts_status.published,
        is_pinned: false,
        images: JSON.stringify([
          "https://via.placeholder.com/400x300/607D8B/FFFFFF?text=Laptop",
        ]),
        created_at: new Date(),
        updated_at: new Date(),
        last_polished_at: new Date(),
      },
    ];

    // 批量创建帖子
    for (const postData of samplePosts) {
      const post = await prisma.posts.create({
        data: postData,
      });
      console.log(`✅ 创建帖子成功: ${post.title} (ID: ${post.id})`);
    }

    console.log("🎉 所有示例帖子创建完成！");

    // 统计帖子数量
    const totalPosts = await prisma.posts.count();
    const publishedPosts = await prisma.posts.count({
      where: { status: posts_status.published },
    });
    const pinnedPosts = await prisma.posts.count({
      where: { is_pinned: true },
    });

    console.log(`📊 数据库统计:`);
    console.log(`   - 总帖子数: ${totalPosts}`);
    console.log(`   - 已发布帖子: ${publishedPosts}`);
    console.log(`   - 置顶帖子: ${pinnedPosts}`);
  } catch (error) {
    console.error("❌ 创建示例帖子失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createSamplePosts();
