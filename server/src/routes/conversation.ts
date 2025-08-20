import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { messageService as backendMessageService } from "../services/messageService";
import { conversationService } from "../services/conversationService";
import authUserId from "../middleware/authUserId";
import conversationAuth from "../middleware/conversationAuth";

const router = express.Router();
const prisma = new PrismaClient();

// 创建或找到对话
router.post(
  "/find-or-create",
  authUserId,
  async (req: Request, res: Response) => {
    try {
      const { postId, otherUserId } = req.body;
      const currentUserId = req.currentUserId;

      console.log(
        `[POST /find-or-create] Received: postId = ${postId}, otherUserId = ${otherUserId}, currentUserId = ${currentUserId}`
      );

      if (!postId || !otherUserId) {
        console.log(
          `[POST /find-or-create] Error: Missing required parameters`
        );
        return res.status(400).json({
          code: 1,
          message: "缺少必要参数",
        });
      }

      // 验证 postId 是否为有效数字
      const postIdNum = parseInt(postId);
      if (isNaN(postIdNum)) {
        return res.status(400).json({
          code: 1,
          message: "postId 必须是有效数字",
        });
      }

      // 验证 otherUserId 是否为有效的 openid 格式
      if (typeof otherUserId !== "string" || otherUserId.trim() === "") {
        return res.status(400).json({
          code: 1,
          message: "otherUserId 必须是有效的 openid",
        });
      }

      const otherUserOpenid = otherUserId.trim();
      console.log(
        `[POST /find-or-create] Using otherUserOpenid directly: ${otherUserOpenid}`
      );

      // 验证对方用户是否存在
      const otherUser = await prisma.users.findUnique({
        where: { openid: otherUserOpenid },
        select: { id: true, openid: true },
      });

      if (!otherUser) {
        console.log(
          `[POST /find-or-create] Error: Other user not found with openid: ${otherUserOpenid}`
        );
        return res.status(404).json({
          code: 1,
          message: "对方用户不存在",
        });
      }

      // Use service layer to find or create conversation
      const conversation = await conversationService.findOrCreateConversation(
        postIdNum,
        currentUserId as string,
        otherUserOpenid
      );

      const responseData = {
        code: 0,
        message: "成功",
        data: {
          conversationId: conversation.id,
          postId: conversation.postId,
          participant1Id: conversation.participant1Id,
          participant2Id: conversation.participant2Id,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        },
      };

      console.log(
        `[POST /find-or-create] Sending response: ${JSON.stringify(
          responseData
        )}`
      );
      res.json(responseData);
    } catch (error) {
      console.error("Error finding or creating conversation:", error);
      res.status(500).json({
        code: 1,
        message: "服务器错误",
      });
    }
  }
);

// 获取用户的对话列表
router.get("/list", authUserId, async (req: Request, res: Response) => {
  try {
    const currentUserId = req.currentUserId;

    const formattedConversations = await conversationService.fetchConversations(
      currentUserId as string
    );

    console.log(
      "Backend formattedConversations sent to frontend:",
      formattedConversations
    );

    res.json({
      code: 0,
      message: "成功",
      data: formattedConversations,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({
      code: 1,
      message: "服务器错误",
    });
  }
});

// 获取对话的消息列表（支持分页）
router.get(
  "/:conversationId/messages",
  authUserId,
  conversationAuth,
  async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const { page = "1", limit = "20", before } = req.query;
      const currentUserId = req.currentUserId;
      const conversation = req.conversation;

      console.log(
        `[GET /:conversationId/messages] conversationId: ${conversationId}, currentUserId: ${currentUserId}`
      );

      // 解析分页参数
      const parsedPage = parseInt(page as string);
      const parsedLimit = parseInt(limit as string);

      if (isNaN(parsedPage) || parsedPage <= 0) {
        return res.status(400).json({
          code: 1,
          message: "page 参数无效",
        });
      }
      if (isNaN(parsedLimit) || parsedLimit <= 0) {
        return res.status(400).json({
          code: 1,
          message: "limit 参数无效",
        });
      }

      const messagesResult = await conversationService.fetchMessages(
        conversationId,
        currentUserId as string,
        parsedPage,
        parsedLimit
      );

      console.log(
        `[GET /:conversationId/messages] Fetched messages count: ${messagesResult.messages.length}`
      );

      // 修正返回格式，data 为对象，包含 messages 和 pagination
      res.json({
        code: 0,
        message: "成功",
        data: {
          messages: messagesResult.messages,
          pagination: messagesResult.pagination,
        },
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({
        code: 1,
        message: "服务器错误",
      });
    }
  }
);

// 标记对话中的消息为已读
router.post(
  "/:conversationId/mark-read",
  authUserId,
  conversationAuth,
  async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const currentUserId = req.currentUserId;
      const conversation = req.conversation;

      console.log(
        `[POST /mark-read] Received: conversationId = ${conversationId}, currentUserId = ${currentUserId}`
      );

      // 标记消息为已读
      await conversationService.markMessagesAsRead(
        conversationId,
        currentUserId as string
      );

      res.json({
        code: 0,
        message: "消息已标记为已读",
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({
        code: 1,
        message: "服务器错误",
      });
    }
  }
);

// 发送消息的路由（WebSocket 部分）
// 此路由主要用于处理非 WebSocket 的消息发送回退，或者作为测试。
router.post(
  "/:conversationId/messages",
  authUserId,
  conversationAuth,
  async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const { content, type, receiverId } = req.body;
      const currentUserId = req.currentUserId;
      const conversation = req.conversation;

      if (!receiverId) {
        return res.status(400).json({
          code: 1,
          message: "缺少必要参数: receiverId",
        });
      }

      // 验证 receiverId 是否为对话的参与者
      if (
        conversation?.participant1Id !== receiverId &&
        conversation?.participant2Id !== receiverId
      ) {
        return res.status(403).json({
          code: 1,
          message: "接收者不是此对话的参与者",
        });
      }

      const newMessage = await conversationService.sendMessage(
        conversationId,
        currentUserId as string,
        content
      );

      res.json({
        code: 0,
        message: "消息发送成功",
        data: newMessage,
      });
    } catch (error) {
      console.error("Error sending message via HTTP route:", error);
      res.status(500).json({
        code: 1,
        message: "服务器错误",
      });
    }
  }
);

// 获取单条消息（如果需要）
router.get(
  "/messages/:messageId",
  authUserId,
  async (req: Request, res: Response) => {
    try {
      const { messageId } = req.params;
      const currentUserId = req.currentUserId;

      const message = await conversationService.fetchSingleMessage(messageId);

      if (!message) {
        return res.status(404).json({
          code: 1,
          message: "消息不存在",
        });
      }

      // 验证用户是否有权限查看这条消息
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: message.conversationId,
          OR: [
            { participant1Id: currentUserId },
            { participant2Id: currentUserId },
          ],
        },
      });

      if (!conversation) {
        return res.status(403).json({
          code: 1,
          message: "禁止访问：您无权查看此消息",
        });
      }

      res.json({
        code: 0,
        message: "成功",
        data: message,
      });
    } catch (error) {
      console.error("Error fetching single message:", error);
      res.status(500).json({
        code: 1,
        message: "服务器错误",
      });
    }
  }
);

// 获取未读消息数量
router.get("/unread-count", authUserId, async (req: Request, res: Response) => {
  try {
    const currentUserId = req.currentUserId;

    const unreadCount = await conversationService.getUnreadCount(
      currentUserId as string
    );

    res.json({
      code: 0,
      message: "成功",
      data: { unreadCount },
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      code: 1,
      message: "服务器错误",
    });
  }
});

export default router;
