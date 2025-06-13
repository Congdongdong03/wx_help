import { Router } from "express";
import { UserController } from "../controllers/user";
import { requireAuth } from "../middleware/auth";

const router = Router();

// 用户注册
router.post("/register", UserController.register);

// 微信登录
router.post("/login", UserController.wechatLogin);

// 获取用户信息
router.get("/info", requireAuth, UserController.getUserInfo);

// 更新用户信息
router.put("/info", requireAuth, UserController.updateUserInfo);

export default router;
