const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.users.findMany();
    console.log("Current users in database:");
    users.forEach((user) => {
      console.log(
        `- ID: ${user.id}, OpenID: ${user.openid}, Nickname: ${user.nickname}`
      );
    });
  } catch (error) {
    console.error("Error checking users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
