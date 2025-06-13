import { Router } from "express";
import { revokeOpenid, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// 登出
router.post("/logout", async (req, res, next) => {
  const { openid } = (req as AuthenticatedRequest).user!;
  if (!openid) {
    return res.status(400).json({
      code: 1,
      message: "缺少 openid",
    });
  }

  try {
    await revokeOpenid(openid);
    res.json({
      code: 0,
      message: "登出成功",
    });
  } catch (error: any) {
    res.status(500).json({
      code: 1,
      message: error.message || "登出失败",
    });
  }
});

export default router;
