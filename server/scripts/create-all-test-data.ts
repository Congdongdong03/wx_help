import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createAllTestData() {
  try {
    console.log("开始为所有表创建测试数据...\n");

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
    const category = await prisma.category.create({
      data: {
        name: "测试分类",
        code: "test_category",
      },
    });
    console.log("✅ 分类创建成功:", category.id);

    // 3. 创建城市
    console.log("创建城市...");
    const city = await prisma.cities.create({
      data: {
        name: "悉尼",
        code: "SYD",
        is_hot: true,
        sort_order: 1,
        is_active: true,
      },
    });
    console.log("✅ 城市创建成功:", city.id);

    // 4. 创建用户
    console.log("创建用户...");
    const user = await prisma.users.create({
      data: {
        username: "test_user",
        openid: "test_openid_123",
        unionid: "test_unionid_123",
        session_key: "test_session_key_123",
        nickname: "测试用户",
        avatar_url: "https://example.com/avatar.jpg",
        phone: "0412345678",
        email: "test@example.com",
        gender: 1,
        city: "悉尼",
        province: "新南威尔士",
        country: "澳大利亚",
        language: "zh_CN",
        status: "active",
        last_login_at: new Date(),
      },
    });
    console.log("✅ 用户创建成功:", user.id);

    // 5. 创建帖子
    console.log("创建帖子...");
    const post = await prisma.posts.create({
      data: {
        user_id: user.id,
        title: "测试帖子标题",
        content: "这是一个测试帖子内容",
        category: "help",
        city_code: "SYD",
        images: '["image1.jpg", "image2.jpg"]',
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
    console.log("✅ 帖子创建成功:", post.id);

    // 6. 创建收藏
    console.log("创建收藏...");
    const favorite = await prisma.favorite.create({
      data: {
        user_id: user.id,
        post_id: post.id,
      },
    });
    console.log("✅ 收藏创建成功:", favorite.id);

    // 7. 创建反馈
    console.log("创建反馈...");
    const feedback = await prisma.feedback.create({
      data: {
        user_id: user.id,
        content: "这是一个测试反馈内容",
        image: "feedback_image.jpg",
        type: "advice",
        status: 0,
      },
    });
    console.log("✅ 反馈创建成功:", feedback.id);

    // 8. 创建擦亮日志
    console.log("创建擦亮日志...");
    const polishLog = await prisma.polish_log.create({
      data: {
        user_id: user.id,
        post_id: post.id,
      },
    });
    console.log("✅ 擦亮日志创建成功:", polishLog.id);

    // 9. 创建每周特价
    console.log("创建每周特价...");
    const weeklyDeal = await prisma.weekly_deals.create({
      data: {
        title: "测试每周特价",
        image_url: "https://example.com/deal.jpg",
        week_start_date: new Date(),
        is_active: true,
      },
    });
    console.log("✅ 每周特价创建成功:", weeklyDeal.id);

    // 10. 创建目录图片
    console.log("创建目录图片...");
    const catalogueImage = await prisma.catalogue_images.create({
      data: {
        store_name: "Woolworths",
        page_number: 1,
        image_data: "base64_encoded_image_data_here",
        week_date: new Date(),
      },
    });
    console.log("✅ 目录图片创建成功:", catalogueImage.id);

    // 11. 创建数据验证规则
    console.log("创建数据验证规则...");
    const validationRule = await prisma.validationRule.create({
      data: {
        table_name: "posts",
        field_name: "title",
        rule_type: "required",
        rule_value: "true",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    console.log("✅ 数据验证规则创建成功:", validationRule.id);

    // 12. 创建系统配置
    console.log("创建系统配置...");
    const systemConfig = await prisma.systemConfig.create({
      data: {
        key: "max_post_length",
        value: "1000",
        description: "帖子最大长度限制",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    console.log("✅ 系统配置创建成功:", systemConfig.id);

    // 13. 创建对话
    console.log("创建对话...");
    const conversation = await prisma.conversation.create({
      data: {
        postId: post.id,
        participant1Id: user.id.toString(),
        participant2Id: "2",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log("✅ 对话创建成功:", conversation.id);

    // 14. 创建消息
    console.log("创建消息...");
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id.toString(),
        receiverId: "2",
        type: "text",
        content: "这是一条测试消息",
        isRead: false,
      },
    });
    console.log("✅ 消息创建成功:", message.id);

    console.log("\n🎉 所有测试数据创建完成！");
    console.log("\n创建的数据汇总:");
    console.log("- 管理员用户: 1条");
    console.log("- 分类: 1条");
    console.log("- 城市: 1条");
    console.log("- 用户: 1条");
    console.log("- 帖子: 1条");
    console.log("- 收藏: 1条");
    console.log("- 反馈: 1条");
    console.log("- 擦亮日志: 1条");
    console.log("- 每周特价: 1条");
    console.log("- 目录图片: 1条");
    console.log("- 数据验证规则: 1条");
    console.log("- 系统配置: 1条");
    console.log("- 对话: 1条");
    console.log("- 消息: 1条");
  } catch (error) {
    console.error("❌ 创建测试数据时出错:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAllTestData();
