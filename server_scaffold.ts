// Placeholder for server_scaffold.ts - This content should be manually split into respective files.

// --- server/src/server.ts ---
import app from "./app";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// --- server/src/app.ts ---
import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { sendSuccess, sendError } from "./utils/responseHandler"; // Assuming responseHandler.ts is created

// Import main router
import apiRouter from "./api/routes"; // This will be the main router aggregating all resource routes

dotenv.config();

const app: Express = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Basic Route
app.get("/", (req: Request, res: Response) => {
  sendSuccess(res, { message: "Welcome to BangBang API" });
});

// API Routes
app.use("/api", apiRouter);

// Global Error Handler (should be last middleware)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Global Error Handler:", err.stack);
  sendError(res, 500, err.message || "Internal Server Error");
});

// 404 Handler for unkown routes
app.use((req: Request, res: Response) => {
  sendError(res, 404, "Resource not found");
});

export default app;

// --- server/src/api/routes.ts ---
// This file will aggregate all resource-specific routers
import { Router } from "express";
import userRoutes from "./users/user.routes";
import postRoutes from "./posts/post.routes";
import categoryRoutes from "./categories/category.routes";
import favoriteRoutes from "./favorites/favorite.routes";
import feedbackRoutes from "./feedback/feedback.routes";
import uploadRoutes from "./upload/upload.routes";
import homeRoutes from "./home/home.routes";
import faqRoutes from "./faq/faq.routes";
// Import other resource routers here as they are created

const router = Router();

router.use("/user", userRoutes); // Mount user routes under /api/user
router.use("/posts", postRoutes); // Mount post routes under /api/posts
router.use("/categories", categoryRoutes); // /api/categories
router.use("/favorites", favoriteRoutes); // /api/favorites
router.use("/feedback", feedbackRoutes); // /api/feedback
router.use("/upload", uploadRoutes); // /api/upload
router.use("/home", homeRoutes); // /api/home
router.use("/faq", faqRoutes); // /api/faq

// Mount other resource routers here

export default router;

// --- server/src/utils/responseHandler.ts ---
import { Response } from "express";

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  error?: string;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = "Success",
  statusCode: number = 200
): void => {
  const response: ApiResponse<T> = {
    code: 0, // 0 for success as per user spec
    message,
    data,
  };
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errorCode?: number
): void => {
  // User spec error codes: 401, 403, 404, 422, 500. 'code' in response seems to be always 0 for success.
  // For errors, we might use the HTTP status code directly or a custom error code system if 'code' field needs to reflect errors.
  // Sticking to HTTP status codes for now for simplicity in this response wrapper. The main 'code' in JSON is for success.
  const response: ApiResponse<null> = {
    code: errorCode || statusCode, // Or a more specific error code system if needed
    message,
    error: message, // Redundant but common
  };
  res.status(statusCode).json(response);
};

// --- server/src/utils/errorHandler.ts ---
// (Basic error handler is already part of app.ts global error handler)
// This file could contain custom error classes if needed, e.g.:
export class ApiError extends Error {
  public statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
export class NotFoundError extends ApiError {
  constructor(message: string = "Resource not found") {
    super(404, message);
  }
}
// Add more custom errors like BadRequestError, UnauthorizedError etc.

// --- server/src/middleware/auth.middleware.ts ---
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { sendError } from "../utils/responseHandler";

const JWT_SECRET = process.env.JWT_SECRET || "your-very-secret-key"; // Replace with env variable

export interface AuthenticatedRequest extends Request {
  user?: { id: number; openid: string; [key: string]: any }; // Define based on what JWT payload contains
}

export const protect = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const bearer = req.headers.authorization;

  if (!bearer || !bearer.startsWith("Bearer ")) {
    return sendError(res, 401, "Unauthorized: No token provided");
  }

  const token = bearer.split("Bearer ")[1].trim();
  if (!token) {
    return sendError(res, 401, "Unauthorized: Invalid token format");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      openid: string;
      [key: string]: any;
    }; // Adjust payload type
    req.user = decoded; // Attach user to request object
    next();
  } catch (error) {
    console.error("Auth Error:", error);
    return sendError(res, 401, "Unauthorized: Invalid token");
  }
};

// --- STUBS for User ---
// --- server/src/api/users/user.routes.ts ---
import { Router } from "express";
import * as userController from "./user.controller";
import { protect } from "../../../middleware/auth.middleware"; // Auth middleware

const router = Router();

router.post("/wx-login", userController.wxLogin);
router.get("/info", protect, userController.getUserInfo); // Protected
router.put("/profile", protect, userController.updateUserProfile); // Protected
router.post("/logout", protect, userController.logout); // Protected
router.get("/posts", protect, userController.getMyPosts); // For API 2.6 Get My Posts
router.get("/favorites", protect, userController.getMyFavorites); // For API 3.3 Get Favorite List

export default router;

// --- server/src/api/users/user.controller.ts ---
import { Request, Response } from "express";
import * as userService from "./user.service";
import { sendSuccess, sendError } from "../../../utils/responseHandler";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";

export const wxLogin = async (req: Request, res: Response) => {
  try {
    // const { code, nickName, avatarUrl } = req.body; // Validation needed
    // const result = await userService.handleWxLogin(code, nickName, avatarUrl);
    sendSuccess(
      res,
      {
        token: "mockToken",
        userInfo: { id: 1, openid: "mockOpenId", nickname: req.body.nickName },
      },
      "Login successful"
    );
  } catch (error: any) {
    sendError(res, error.statusCode || 500, error.message || "Login failed");
  }
};
export const getUserInfo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // const userId = req.user?.id;
    // const userInfo = await userService.fetchUserInfo(userId);
    sendSuccess(
      res,
      { id: req.user?.id, openid: "mockOpenId", nickname: "Mock User" },
      "User info fetched"
    );
  } catch (error: any) {
    sendError(
      res,
      error.statusCode || 500,
      error.message || "Failed to fetch user info"
    );
  }
};
export const updateUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    // const userId = req.user?.id;
    // const profileData = req.body;
    // await userService.updateUserProfile(userId, profileData);
    sendSuccess(res, null, "Profile updated successfully");
  } catch (error: any) {
    sendError(
      res,
      error.statusCode || 500,
      error.message || "Failed to update profile"
    );
  }
};
export const logout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Potentially invalidate token on server-side if using a blacklist
    sendSuccess(res, null, "Logout successful");
  } catch (error: any) {
    sendError(res, error.statusCode || 500, error.message || "Logout failed");
  }
};
export const getMyPosts = async (req: AuthenticatedRequest, res: Response) => {
  // API 2.6
  // const userId = req.user?.id;
  // const { page, pageSize, status } = req.query;
  sendSuccess(
    res,
    { list: [], total: 0, page: 1, pageSize: 20 },
    "User posts fetched"
  );
};
export const getMyFavorites = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  // API 3.3
  // const userId = req.user?.id;
  // const { page, pageSize, type } = req.query;
  sendSuccess(
    res,
    { list: [], total: 0, page: 1, pageSize: 20 },
    "User favorites fetched"
  );
};

// --- server/src/api/users/user.service.ts ---
// Placeholder user service - replace with actual database logic
// import db from '../../../config/db.config'; // Example DB import
// import jwt from 'jsonwebtoken';
// const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key';

export const handleWxLogin = async (
  code: string,
  nickName: string,
  avatarUrl: string
) => {
  // 1. Get openid from WeChat using code (via an HTTP request to WeChat API)
  // 2. Check if user with openid exists in DB
  // 3. If not, create user. If yes, update nickname/avatarUrl if changed.
  // 4. Generate JWT token
  // 5. Return { token, userInfo }
  console.log(code, nickName, avatarUrl); // Keep ESLint happy for now
  return {
    token: "mockGeneratedToken",
    userInfo: {
      id: 1,
      openid: "generatedOpenId",
      nickname: nickName,
      avatarUrl: avatarUrl,
      status: 0,
    },
  };
};
// Add other service functions like fetchUserInfo, updateUserProfile, etc.

// --- STUBS for Posts ---
// --- server/src/api/posts/post.routes.ts ---
import { Router } from "express";
import * as postController from "./post.controller";
import { protect } from "../../../middleware/auth.middleware";

const router = Router();
router.get("/", postController.getPosts); // 2.1
router.get("/:postId", postController.getPostDetail); // 2.2
router.post("/", protect, postController.createPost); // 2.3 (Protected)
router.put("/:postId", protect, postController.updatePost); // 2.4 (Protected)
router.delete("/:postId", protect, postController.deletePost); // 2.5 (Protected)
router.post("/:postId/polish", protect, postController.polishPost); // 2.7 (Protected)
export default router;

// --- server/src/api/posts/post.controller.ts ---
import { Request, Response } from "express";
import { sendSuccess, sendError } from "../../../utils/responseHandler";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";

export const getPosts = async (req: Request, res: Response) => {
  // 2.1
  // const { page, pageSize, type, city, keyword } = req.query;
  sendSuccess(
    res,
    { list: [], total: 0, page: 1, pageSize: 20 },
    "Posts fetched"
  );
};
export const getPostDetail = async (req: Request, res: Response) => {
  // 2.2
  // const { postId } = req.params;
  sendSuccess(
    res,
    { id: req.params.postId, title: "Mock Post" },
    "Post detail fetched"
  );
};
export const createPost = async (req: AuthenticatedRequest, res: Response) => {
  // 2.3
  // const userId = req.user?.id;
  // const postData = req.body; // Validate this
  sendSuccess(res, { id: Date.now(), ...req.body }, "Post created", 201);
};
export const updatePost = async (req: AuthenticatedRequest, res: Response) => {
  // 2.4
  // const userId = req.user?.id; // Check ownership
  // const { postId } = req.params;
  // const postData = req.body;
  sendSuccess(res, { id: req.params.postId, ...req.body }, "Post updated");
};
export const deletePost = async (req: AuthenticatedRequest, res: Response) => {
  // 2.5
  // const userId = req.user?.id; // Check ownership
  // const { postId } = req.params;
  sendSuccess(res, null, "Post deleted");
};
export const polishPost = async (req: AuthenticatedRequest, res: Response) => {
  // 2.7
  // const { postId } = req.params;
  sendSuccess(
    res,
    { success: true, message: "擦亮成功", nextPolishTime: new Date() },
    "Post polished"
  );
};

// --- server/src/api/posts/post.service.ts ---
// Placeholder post service
export const examplePostService = async () => {
  return {};
};

// --- STUBS for Categories ---
// --- server/src/api/categories/category.routes.ts ---
import { Router } from "express";
import * as categoryController from "./category.controller";
const router = Router();
router.get("/", categoryController.getCategories); // 5.1
export default router;

// --- server/src/api/categories/category.controller.ts ---
import { Request, Response } from "express";
import { sendSuccess, sendError } from "../../../utils/responseHandler";
export const getCategories = async (req: Request, res: Response) => {
  // 5.1
  sendSuccess(
    res,
    [{ id: 1, name: "房屋租赁", code: "rent", icon: "🏠" }],
    "Categories fetched"
  );
};
// --- server/src/api/categories/category.service.ts ---
export const exampleCategoryService = async () => {
  return {};
};

// --- STUBS for Favorites ---
// --- server/src/api/favorites/favorite.routes.ts ---
import { Router } from "express";
import * as favoriteController from "./favorite.controller";
import { protect } from "../../../middleware/auth.middleware";
const router = Router();
router.post("/", protect, favoriteController.addFavorite); // 3.1
router.delete("/:postId", protect, favoriteController.removeFavorite); // 3.2
// Note: GET /api/user/favorites is in user.routes.ts
export default router;

// --- server/src/api/favorites/favorite.controller.ts ---
import { Request, Response } from "express";
import { sendSuccess, sendError } from "../../../utils/responseHandler";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";
export const addFavorite = async (req: AuthenticatedRequest, res: Response) => {
  // 3.1
  sendSuccess(res, { postId: req.body.postId }, "Post favorited");
};
export const removeFavorite = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  // 3.2
  sendSuccess(res, { postId: req.params.postId }, "Post unfavorited");
};
// --- server/src/api/favorites/favorite.service.ts ---
export const exampleFavoriteService = async () => {
  return {};
};

// --- STUBS for Feedback ---
// --- server/src/api/feedback/feedback.routes.ts ---
import { Router } from "express";
import * as feedbackController from "./feedback.controller";
import { protect } from "../../../middleware/auth.middleware";
const router = Router();
router.post("/", protect, feedbackController.submitFeedback); // 4.1
router.post("/report", protect, feedbackController.reportPost); // 4.2
export default router;

// --- server/src/api/feedback/feedback.controller.ts ---
import { Request, Response } from "express";
import { sendSuccess, sendError } from "../../../utils/responseHandler";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";
export const submitFeedback = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  // 4.1
  sendSuccess(res, req.body, "Feedback submitted");
};
export const reportPost = async (req: AuthenticatedRequest, res: Response) => {
  // 4.2
  sendSuccess(res, req.body, "Post reported");
};
// --- server/src/api/feedback/feedback.service.ts ---
export const exampleFeedbackService = async () => {
  return {};
};

// --- STUBS for Upload ---
// --- server/src/api/upload/upload.routes.ts ---
import { Router } from "express";
import * as uploadController from "./upload.controller";
import { protect } from "../../../middleware/auth.middleware";
import multer from "multer";
// Configure multer (e.g., for memory storage or disk storage)
const upload = multer({ storage: multer.memoryStorage() }); // Example: in-memory, for cloud upload next
// const upload = multer({ dest: 'uploads/' }); // Example: to disk
router.post(
  "/image",
  protect,
  upload.single("file"),
  uploadController.uploadImage
); // 6.1
export default router;

// --- server/src/api/upload/upload.controller.ts ---
import { Request, Response } from "express";
import { sendSuccess, sendError } from "../../../utils/responseHandler";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";
export const uploadImage = async (req: AuthenticatedRequest, res: Response) => {
  // 6.1
  if (!req.file) {
    return sendError(res, 400, "No file uploaded.");
  }
  // In a real scenario, upload req.file.buffer (if memoryStorage) or req.file.path (if diskStorage)
  // to a cloud storage service (S3, OSS, etc.) and get a URL.
  console.log("Uploaded file:", req.file);
  sendSuccess(
    res,
    {
      url: `https://cdn.example.com/images/${Date.now()}-${
        req.file.originalname
      }`,
    },
    "Image uploaded"
  );
};

// --- STUBS for Home ---
// --- server/src/api/home/home.routes.ts ---
import { Router } from "express";
import * as homeController from "./home.controller";
const router = Router();
router.get("/recommend", homeController.getHomeRecommendations); // 6.2
export default router;

// --- server/src/api/home/home.controller.ts ---
import { Request, Response } from "express";
import { sendSuccess, sendError } from "../../../utils/responseHandler";
export const getHomeRecommendations = async (req: Request, res: Response) => {
  // 6.2
  sendSuccess(
    res,
    { banners: [], hotPosts: [] },
    "Home recommendations fetched"
  );
};

// --- STUBS for FAQ ---
// --- server/src/api/faq/faq.routes.ts ---
import { Router } from "express";
import * as faqController from "./faq.controller";
const router = Router();
router.get("/", faqController.getFaqs); // 6.3
export default router;

// --- server/src/api/faq/faq.controller.ts ---
import { Request, Response } from "express";
import { sendSuccess, sendError } from "../../../utils/responseHandler";
export const getFaqs = async (req: Request, res: Response) => {
  // 6.3
  sendSuccess(res, [{ id: 1, question: "Q1", answer: "A1" }], "FAQs fetched");
};
// --- server/src/api/faq/faq.service.ts ---
export const exampleFaqService = async () => {
  return {};
};

// --- server/src/config/db.config.ts --- (Placeholder)
// import mysql from 'mysql2/promise';
// const pool = mysql.createPool({
//   host: process.env.DB_HOST || 'localhost',
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASSWORD || '',
//   database: process.env.DB_NAME || 'bangbang',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });
// export default pool;
console.log("DB config placeholder loaded");
