import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.cities.createMany({
    data: [
      {
        name: "悉尼",
        code: "sydney",
        is_hot: true,
        sort_order: 1,
        is_active: true,
      },
      {
        name: "墨尔本",
        code: "melbourne",
        is_hot: true,
        sort_order: 2,
        is_active: true,
      },
      {
        name: "布里斯班",
        code: "brisbane",
        is_hot: true,
        sort_order: 3,
        is_active: true,
      },
      {
        name: "珀斯",
        code: "perth",
        is_hot: false,
        sort_order: 4,
        is_active: true,
      },
      {
        name: "阿德莱德",
        code: "adelaide",
        is_hot: false,
        sort_order: 5,
        is_active: true,
      },
    ],
  });
  console.log("城市数据已插入");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
