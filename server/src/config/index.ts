export const config = {
  port: process.env.PORT || 3000,
  logtailToken: process.env.LOGTAIL_TOKEN || "",
  jwtSecret: process.env.JWT_SECRET || "your-secret-key",
};
