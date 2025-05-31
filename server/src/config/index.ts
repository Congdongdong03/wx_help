export const config = {
  port: process.env.PORT || 3000,
  mysql: {
    host: process.env.MYSQL_HOST || "localhost",
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "wx_help",
  },
  logtailToken: process.env.LOGTAIL_TOKEN || "",
  jwtSecret: process.env.JWT_SECRET || "your-secret-key",
};
