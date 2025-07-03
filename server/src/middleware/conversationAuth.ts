import { Request, Response, NextFunction } from "express";
import { PrismaClient, Conversation } from "@prisma/client";

const prisma = new PrismaClient();

declare global {
  namespace Express {
    interface Request {
      conversation?: Conversation;
    }
  }
}

const conversationAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { conversationId } = req.params;
  const currentUserId = req.currentUserId;

  if (!currentUserId) {
    return res.status(401).json({
      code: 1,
      message: "未授权：缺少用户ID",
    });
  }

  if (!conversationId) {
    return res.status(400).json({
      code: 1,
      message: "缺少必要参数: conversationId",
    });
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [
        { participant1Id: currentUserId },
        { participant2Id: currentUserId },
      ],
    },
  });

  if (!conversation) {
    return res.status(404).json({
      code: 1,
      message: "对话不存在或无权限访问",
    });
  }

  req.conversation = conversation;
  next();
};

export default conversationAuth;
