import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker/locale/en_AU";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding...");

  // Clear existing data (optional, uncomment if you want to clear data on each run)
  await prisma.favorite.deleteMany();
  await prisma.polish_log.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.posts.deleteMany();
  await prisma.users.deleteMany();
  await prisma.admin_user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.cities.deleteMany();
  await prisma.weekly_deals.deleteMany();
  await prisma.catalogue_images.deleteMany();
  await prisma.validationRule.deleteMany();
  await prisma.systemConfig.deleteMany();

  // Seed admin_user
  const adminUser = await prisma.admin_user.create({
    data: {
      username: "admin",
      password_hash: "hashed_password_for_admin", // In a real app, use a strong hash
      role: "admin",
    },
  });
  console.log(`Created admin user with id: \${adminUser.id}`);

  // Seed category
  const categories = [];
  const categoryNames = [
    "Help",
    "Secondhand",
    "Housing",
    "Jobs",
    "Events",
    "Cars",
  ];
  for (const name of categoryNames) {
    const category = await prisma.category.create({
      data: {
        name: name,
        code: name.toLowerCase(),
      },
    });
    categories.push(category);
    console.log(`Created category with id: \${category.id}`);
  }

  // Seed cities (Australian cities)
  const cities = [];
  const australianCities = [
    {
      name: "Sydney",
      code: "sydney",
      is_hot: true,
      sort_order: 1,
      is_active: true,
    },
    {
      name: "Melbourne",
      code: "melbourne",
      is_hot: true,
      sort_order: 2,
      is_active: true,
    },
    {
      name: "Brisbane",
      code: "brisbane",
      is_hot: false,
      sort_order: 3,
      is_active: true,
    },
    {
      name: "Perth",
      code: "perth",
      is_hot: false,
      sort_order: 4,
      is_active: true,
    },
    {
      name: "Adelaide",
      code: "adelaide",
      is_hot: false,
      sort_order: 5,
      is_active: true,
    },
  ];

  for (const cityData of australianCities) {
    const city = await prisma.cities.create({ data: cityData });
    cities.push(city);
    console.log(`Created city with id: \${city.id}`);
  }

  // Seed users
  const users = [];
  // Add a specific development user
  const devUser = await prisma.users.create({
    data: {
      username: "devuser",
      openid: "dev_openid_123",
      nickname: "Development User",
      avatar_url: faker.image.avatar(),
      phone: faker.phone.number(),
      email: "dev@example.com",
      gender: 1,
      city: "Sydney",
      province: "New South Wales",
      country: "Australia",
      language: "en_AU",
      status: "active",
      last_login_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  users.push(devUser);
  console.log(
    `Created development user with id: \${devUser.id} and openid: \${devUser.openid}`
  );

  for (let i = 0; i < 9; i++) {
    // Changed loop count from 10 to 9 to add 9 more random users, total 10 users including devUser
    const user = await prisma.users.create({
      data: {
        username: faker.internet.userName(),
        openid: faker.string.uuid(),
        nickname: faker.person.fullName(),
        avatar_url: faker.image.avatar(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
        gender: faker.helpers.arrayElement([0, 1, 2]), // 0: unknown, 1: male, 2: female
        city: faker.helpers.arrayElement(australianCities).name,
        province: faker.location.state(),
        country: "Australia",
        language: "en_AU",
        status: faker.helpers.arrayElement(["active", "inactive", "banned"]),
        last_login_at: faker.date.recent(),
        created_at: faker.date.past(),
        updated_at: faker.date.recent(),
      },
    });
    users.push(user);
    console.log(`Created user with id: \${user.id}`);
  }

  // Seed posts
  const posts = [];
  for (let i = 0; i < 20; i++) {
    const randomUser = faker.helpers.arrayElement(users);
    const randomCity = faker.helpers.arrayElement(cities);
    const randomCategory = faker.helpers.arrayElement(categories);

    const post = await prisma.posts.create({
      data: {
        user_id: randomUser.id,
        title: faker.lorem.sentence(),
        category: randomCategory.code,
        sub_category: faker.lorem.word(),
        content: faker.lorem.paragraphs(2),
        city_code: randomCity.code,
        status: faker.helpers.arrayElement([
          "draft",
          "pending",
          "published",
          "failed",
        ]),
        created_at: faker.date.past(),
        updated_at: faker.date.recent(),
        price: parseFloat(
          faker.number
            .float({ min: 10, max: 1000, fractionDigits: 2 })
            .toFixed(2)
        ),
        price_unit: "AUD",
        contact_info: faker.helpers.arrayElement([
          `WeChat: ${faker.internet.userName()}`,
          `Phone: ${faker.phone.number()}`,
        ]),
        expires_at: faker.date.future(),
        last_polished_at: faker.date.recent(),
        view_count: faker.number.int({ min: 0, max: 1000 }),
        favorite_count: faker.number.int({ min: 0, max: 100 }),
        recommend_score: parseFloat(
          faker.number.float({ min: 0, max: 5, fractionDigits: 2 }).toFixed(2)
        ),
        quality_score: parseFloat(
          faker.number.float({ min: 0, max: 5, fractionDigits: 2 }).toFixed(2)
        ),
        pinned_until: faker.helpers.arrayElement([null, faker.date.future()]),
        is_pinned: faker.datatype.boolean(),
        images: JSON.stringify(
          Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () =>
            faker.image.urlLoremFlickr({ category: "technics" })
          )
        ),
      },
    });
    posts.push(post);
    console.log(`Created post with id: \${post.id}`);
  }

  // Seed favorite
  for (let i = 0; i < 30; i++) {
    const randomUser = faker.helpers.arrayElement(users);
    const randomPost = faker.helpers.arrayElement(posts);

    try {
      await prisma.favorite.create({
        data: {
          user_id: randomUser.id,
          post_id: randomPost.id,
          created_at: faker.date.past(),
        },
      });
      console.log(
        `Created favorite for user \${randomUser.id} and post \${randomPost.id}`
      );
    } catch (error: any) {
      // Handle unique constraint violation if a user already favorited a post
      if (error.code === "P2002") {
        console.log(
          `Skipping duplicate favorite for user \${randomUser.id} and post \${randomPost.id}`
        );
      } else {
        throw error;
      }
    }
  }

  // Seed feedback
  for (let i = 0; i < 15; i++) {
    const randomUser = faker.helpers.arrayElement(users);
    await prisma.feedback.create({
      data: {
        user_id: randomUser.id,
        content: faker.lorem.paragraph(),
        image: faker.helpers.arrayElement([
          null,
          faker.image.urlLoremFlickr({ category: "technics" }),
        ]),
        type: faker.helpers.arrayElement(["advice", "bug", "report"]),
        status: faker.helpers.arrayElement([0, 1]), // 0: pending, 1: resolved
        created_at: faker.date.past(),
      },
    });
    console.log(`Created feedback for user \${randomUser.id}`);
  }

  // Seed polish_log
  for (let i = 0; i < 25; i++) {
    const randomUser = faker.helpers.arrayElement(users);
    const randomPost = faker.helpers.arrayElement(posts);
    await prisma.polish_log.create({
      data: {
        user_id: randomUser.id,
        post_id: randomPost.id,
        polished_at: faker.date.recent(),
      },
    });
    console.log(
      `Created polish log for user \${randomUser.id} and post \${randomPost.id}`
    );
  }

  // Seed weekly_deals
  for (let i = 0; i < 5; i++) {
    await prisma.weekly_deals.create({
      data: {
        title: `Weekly Deal ${i + 1}: ${faker.lorem.words(3)}`,
        image_url: faker.image.urlLoremFlickr({ category: "food" }),
        week_start_date: faker.date.past(),
        is_active: faker.datatype.boolean(),
        created_at: faker.date.past(),
        updated_at: faker.date.recent(),
      },
    });
    console.log(`Created weekly deal \${i + 1}`);
  }

  // Seed catalogue_images
  for (let i = 0; i < 10; i++) {
    await prisma.catalogue_images.create({
      data: {
        store_name: faker.helpers.arrayElement(["Coles", "Woolworths", "Aldi"]),
        page_number: faker.number.int({ min: 1, max: 50 }),
        image_data: faker.image.urlLoremFlickr({ category: "business" }),
        week_date: faker.date.past(),
        created_at: faker.date.past(),
        updated_at: faker.date.recent(),
      },
    });
    console.log(`Created catalogue image \${i + 1}`);
  }

  // Seed ValidationRule
  await prisma.validationRule.createMany({
    data: [
      {
        table_name: "posts",
        field_name: "title",
        rule_type: "minLength",
        rule_value: "5",
      },
      {
        table_name: "users",
        field_name: "email",
        rule_type: "isEmail",
        rule_value: "true",
      },
    ],
  });
  console.log("Created ValidationRule data.");

  // Seed SystemConfig
  await prisma.systemConfig.createMany({
    data: [
      {
        key: "min_post_length",
        value: "10",
        description: "Minimum length for post content",
      },
      {
        key: "max_images_per_post",
        value: "5",
        description: "Maximum number of images allowed per post",
      },
    ],
  });
  console.log("Created SystemConfig data.");

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
