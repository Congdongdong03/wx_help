import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { messageService as backendMessageService } from "../services/messageService";
import { AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// 辅助函数：安全地获取 currentUserId
const getCurrentUserId = (req: Request): string | null => {
  console.log(`[getCurrentUserId] All headers:`, req.headers);
  console.log(`[getCurrentUserId] x-openid header:`, req.headers["x-openid"]);
  console.log(
    `[getCurrentUserId] x-openid type:`,
    typeof req.headers["x-openid"]
  );
  const openid = req.headers["x-openid"] as string;
  console.log(`[getCurrentUserId] Final openid:`, openid);
  return openid || null;
};

// 创建或找到对话
router.post("/find-or-create", async (req: Request, res: Response) => {
  try {
    const { postId, otherUserId } = req.body;
    const currentUserId = getCurrentUserId(req);

    console.log(
      `[POST /find-or-create] Received: postId = ${postId}, otherUserId = ${otherUserId}, currentUserId = ${currentUserId}`
    );

    if (!currentUserId) {
      console.log(`[POST /find-or-create] Error: currentUserId is null`);
      return res.status(401).json({
        code: 1,
        message: "未授权：缺少 x-openid 头部",
      });
    }

    if (!postId || !otherUserId) {
      console.log(`[POST /find-or-create] Error: Missing required parameters`);
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

    // 查找是否已存在对话
    console.log(
      `[POST /find-or-create] Searching for existing conversation with postId: ${postIdNum}, participant1Id: ${currentUserId}, participant2Id: ${otherUserOpenid}`
    );
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            postId: postIdNum,
            participant1Id: currentUserId,
            participant2Id: otherUserOpenid,
          },
          {
            postId: postIdNum,
            participant1Id: otherUserOpenid,
            participant2Id: currentUserId,
          },
        ],
      },
    });

    console.log(
      `[POST /find-or-create] Existing conversation found: ${!!conversation}`
    );
    if (conversation) {
      console.log(
        `[POST /find-or-create] Existing conversation ID: ${conversation.id}`
      );
    }

    // 如果不存在，创建新对话
    if (!conversation) {
      console.log(`[POST /find-or-create] Creating new conversation`);
      conversation = await prisma.conversation.create({
        data: {
          postId: postIdNum,
          participant1Id: currentUserId,
          participant2Id: otherUserOpenid,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(
        `[POST /find-or-create] New conversation created with ID: ${conversation.id}`
      );
    }

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
      `[POST /find-or-create] Sending response: ${JSON.stringify(responseData)}`
    );
    res.json(responseData);
  } catch (error) {
    console.error("Error finding or creating conversation:", error);
    res.status(500).json({
      code: 1,
      message: "服务器错误",
    });
  }
});

// 获取用户的对话列表
router.get("/list", async (req: Request, res: Response) => {
  try {
    const currentUserId = getCurrentUserId(req);

    if (!currentUserId) {
      return res.status(401).json({
        code: 1,
        message: "未授权：缺少 x-openid 头部",
      });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: currentUserId },
          { participant2Id: currentUserId },
        ],
      },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            users: {
              select: {
                id: true,
                nickname: true,
                avatar_url: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: {
                  not: currentUserId,
                },
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const formattedConversations = conversations.map((conv) => {
      const otherUserId =
        conv.participant1Id === currentUserId
          ? conv.participant2Id
          : conv.participant1Id;
      const otherUser = conv.post.users;
      const lastMessage = conv.messages[0];
      const unreadCount = conv._count.messages;

      // 根据消息类型生成预览文本
      let lastMessagePreview = "暂无消息";
      if (lastMessage) {
        if (lastMessage.type === "image") {
          lastMessagePreview = "[图片]";
        } else {
          lastMessagePreview = lastMessage.content;
        }
      }

      return {
        id: conv.id,
        postId: conv.post.id,
        otherUserId: otherUserId,
        otherUserNickname: otherUser.nickname,
        otherUserAvatar: otherUser.avatar_url,
        postTitle: conv.post.title,
        lastMessagePreview: lastMessagePreview,
        lastMessageTime: lastMessage?.createdAt
          ? formatTime(lastMessage.createdAt)
          : "",
        unreadCount: unreadCount,
      };
    });

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
router.get("/:conversationId/messages", async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { page = "1", limit = "20", before } = req.query;
    const currentUserId = getCurrentUserId(req);

    console.log(
      `[GET /:conversationId/messages] conversationId: ${conversationId}, currentUserId: ${currentUserId}`
    );

    if (!currentUserId) {
      console.log(
        `[GET /:conversationId/messages] Error: currentUserId is null`
      );
      return res.status(401).json({
        code: 1,
        message: "未授权：缺少 x-openid 头部",
      });
    }

    // 验证用户是否有权限访问这个对话
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { participant1Id: currentUserId },
          { participant2Id: currentUserId },
        ],
      },
    });

    console.log(
      `[GET /:conversationId/messages] Conversation found: ${!!conversation}`
    );
    if (conversation) {
      console.log(
        `[GET /:conversationId/messages] Conversation details: ${JSON.stringify(
          conversation
        )}`
      );
    }

    if (!conversation) {
      console.log(
        `[GET /:conversationId/messages] Error: Conversation not found or unauthorized`
      );
      return res.status(404).json({
        code: 1,
        message: "对话不存在或无权限访问",
      });
    }

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

    const messagesResult = await backendMessageService.fetchMessages(
      conversationId,
      parsedPage,
      parsedLimit,
      before ? parseInt(before as string) : undefined
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
});

// 标记对话中的消息为已读
router.post(
  "/:conversationId/mark-read",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { conversationId } = req.params;
      const currentUserId = getCurrentUserId(req);

      console.log(
        `[POST /mark-read] Received: conversationId = ${conversationId}, currentUserId = ${currentUserId}`
      );

      if (!currentUserId) {
        return res.status(401).json({
          code: 1,
          message: "未授权：缺少 x-openid 头部",
        });
      }

      if (!conversationId) {
        return res.status(400).json({
          code: 1,
          message: "缺少必要参数: conversationId",
        });
      }

      // 验证用户是否有权限操作此对话
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [
            { participant1Id: currentUserId }, // participant1Id and participant2Id are openid strings
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

      // 标记消息为已读
      await backendMessageService.markMessagesAsRead(
        conversationId,
        currentUserId
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
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { conversationId } = req.params;
      const { content, type, receiverId } = req.body;
      const currentUserId = getCurrentUserId(req);

      if (!currentUserId) {
        return res.status(401).json({
          code: 1,
          message: "未授权：缺少 x-openid 头部",
        });
      }

      if (!receiverId) {
        return res.status(400).json({
          code: 1,
          message: "缺少必要参数: receiverId",
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

      // 验证 receiverId 是否为对话的参与者
      if (
        conversation.participant1Id !== receiverId &&
        conversation.participant2Id !== receiverId
      ) {
        return res.status(403).json({
          code: 1,
          message: "接收者不是此对话的参与者",
        });
      }

      const newMessage = await backendMessageService.sendMessage(
        conversationId,
        currentUserId,
        receiverId,
        content,
        type
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
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { messageId } = req.params;
      const currentUserId = getCurrentUserId(req);

      if (!currentUserId) {
        return res.status(401).json({
          code: 1,
          message: "未授权：缺少 x-openid 头部",
        });
      }

      const message = await prisma.message.findUnique({
        where: { id: messageId },
      });

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
router.get(
  "/unread-count",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const currentUserId = getCurrentUserId(req);

      if (!currentUserId) {
        return res.status(401).json({
          code: 1,
          message: "未授权：缺少 x-openid 头部",
        });
      }

      const unreadCount = await prisma.message.count({
        where: {
          receiverId: currentUserId,
          isRead: false,
        },
      });

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
  }
);

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} 天前`;
  } else if (hours > 0) {
    return `${hours} 小时前`;
  } else if (minutes > 0) {
    return `${minutes} 分钟前`;
  } else {
    return "刚刚";
  }
}

export default router;
