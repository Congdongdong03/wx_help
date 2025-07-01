import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { messageService as backendMessageService } from "../services/messageService";

const router = express.Router();
const prisma = new PrismaClient();

// 创建或找到对话
router.post("/find-or-create", async (req: Request, res: Response) => {
  try {
    const { postId, otherUserId } = req.body;
    const currentUserId =
      (req.headers["x-openid"] as string) || "dev_openid_123";

    if (!postId || !otherUserId) {
      return res.status(400).json({
        code: 1,
        message: "缺少必要参数",
      });
    }

    // 查找是否已存在对话
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            postId: postId,
            participant1Id: currentUserId,
            participant2Id: otherUserId,
          },
          {
            postId: postId,
            participant1Id: otherUserId,
            participant2Id: currentUserId,
          },
        ],
      },
    });

    // 如果不存在，创建新对话
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          postId: postId,
          participant1Id: currentUserId,
          participant2Id: otherUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    res.json({
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
    });
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
    const currentUserId =
      (req.headers["x-openid"] as string) || "dev_openid_123";

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
    const currentUserId =
      (req.headers["x-openid"] as string) || "dev_openid_123";

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

    if (!conversation) {
      return res.status(404).json({
        code: 1,
        message: "对话不存在或无权限访问",
      });
    }

    // 解析分页参数
    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 50); // 最大限制50条
    const offset = (pageNum - 1) * limitNum;

    // 构建查询条件
    const whereCondition: any = {
      conversationId: conversationId,
    };

    // 如果指定了before参数（时间戳），则只获取该时间之前的消息
    if (before) {
      whereCondition.createdAt = {
        lt: new Date(parseInt(before as string, 10)),
      };
    }

    // 获取消息总数
    const totalCount = await prisma.message.count({
      where: {
        conversationId: conversationId,
      },
    });

    // 获取分页消息
    const messages = await prisma.message.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: "desc", // 按时间倒序，最新的在前面
      },
      take: limitNum,
      skip: offset,
    });

    // 反转消息顺序，使其按时间正序排列
    const sortedMessages = messages.reverse();

    const formattedMessages = sortedMessages.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      type: msg.type,
      content: msg.content,
      timestamp: msg.createdAt.toISOString(),
      isRead: msg.isRead,
    }));

    // 计算分页信息
    const hasMore = offset + limitNum < totalCount;
    const nextPage = hasMore ? pageNum + 1 : null;
    const prevPage = pageNum > 1 ? pageNum - 1 : null;

    res.json({
      code: 0,
      message: "成功",
      data: {
        messages: formattedMessages,
        pagination: {
          currentPage: pageNum,
          pageSize: limitNum,
          totalCount,
          hasMore,
          nextPage,
          prevPage,
        },
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

// 发送消息
router.post(
  "/:conversationId/messages",
  async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const { content, type = "text" } = req.body;
      const currentUserId =
        (req.headers["x-openid"] as string) || "dev_openid_123";

      if (!content || content.trim() === "") {
        return res.status(400).json({
          code: 1,
          message: "消息内容不能为空",
        });
      }

      // 验证消息类型
      if (!["text", "image"].includes(type)) {
        return res.status(400).json({
          code: 1,
          message: "无效的消息类型",
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

      if (!conversation) {
        return res.status(404).json({
          code: 1,
          message: "对话不存在或无权限访问",
        });
      }

      // 确定接收者ID
      const receiverId =
        conversation.participant1Id === currentUserId
          ? conversation.participant2Id
          : conversation.participant1Id;

      // 调用 MessageService 来发送和保存消息
      const newMessage = await backendMessageService.sendMessage(
        conversationId,
        currentUserId,
        receiverId,
        content,
        type as "text" | "image"
      );

      res.status(201).json({
        code: 0,
        message: "消息发送成功",
        data: newMessage,
      });
    } catch (error) {
      console.error("Error sending message via API:", error);
      res.status(500).json({
        code: 1,
        message: "服务器错误",
      });
    }
  }
);

// 标记消息为已读
router.post(
  "/:conversationId/mark-read",
  async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const currentUserId =
        (req.headers["x-openid"] as string) || "dev_openid_123";

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

      if (!conversation) {
        return res.status(404).json({
          code: 1,
          message: "对话不存在或无权限访问",
        });
      }

      // 标记所有未读消息为已读
      await prisma.message.updateMany({
        where: {
          conversationId: conversationId,
          receiverId: currentUserId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      res.json({
        code: 0,
        message: "成功",
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

// 辅助函数：格式化时间
function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 0) {
    return `${days}天前`;
  } else if (hours > 0) {
    return `${hours}小时前`;
  } else if (minutes > 0) {
    return `${minutes}分钟前`;
  } else {
    return "刚刚";
  }
}

export default router;
