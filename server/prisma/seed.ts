import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 创建城市
  let city = await prisma.cities.findUnique({
    where: { code: "beijing" },
  });
  if (!city) {
    city = await prisma.cities.create({
      data: {
        name: "北京",
        code: "beijing",
        is_hot: true,
        sort_order: 1,
        is_active: true,
      },
    });
  }

  // 创建用户
  let user = await prisma.users.findUnique({
    where: { username: "testuser" },
  });
  if (!user) {
    user = await prisma.users.create({
      data: {
        username: "testuser",
        openid: "openid_test",
        nickname: "测试用户",
        avatar_url: "https://example.com/avatar.png",
        phone: "13800000000",
        email: "test@example.com",
        status: "active",
        last_login_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  // 创建帖子
  await prisma.posts.create({
    data: {
      user_id: user.id,
      title: "测试帖子",
      category: "help",
      sub_category: "生活",
      content: "这是一个测试帖子内容",
      city_code: city.code,
      status: "published",
      created_at: new Date(),
      updated_at: new Date(),
      price: 100.0,
      price_unit: "AUD",
      contact_info: "微信: testwx",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      last_polished_at: new Date(),
      view_count: 10,
      favorite_count: 2,
      recommend_score: 4.5,
      quality_score: 3.8,
      pinned_until: null,
      is_pinned: false,
      images: JSON.stringify([
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg",
      ]),
    },
  });

  // 你可以根据需要继续添加更多种子数据
  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
