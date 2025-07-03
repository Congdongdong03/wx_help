import { Request, Response, NextFunction } from "express";

// Extend the Request type to include currentUserId
declare global {
  namespace Express {
    interface Request {
      currentUserId?: string;
    }
  }
}

const authUserId = (req: Request, res: Response, next: NextFunction) => {
  const openid = req.headers["x-openid"] as string;

  if (!openid) {
    return res.status(401).json({
      code: 1,
      message: "未授权：缺少 x-openid 头部",
    });
  }

  req.currentUserId = openid;
  next();
};

export default authUserId;
