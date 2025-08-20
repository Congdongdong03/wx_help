import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ConversationService {
  /**
   * 查找或创建对话
   */
  async findOrCreateConversation(
    postId: number,
    currentUserId: string,
    otherUserId: string
  ) {
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

    return conversation;
  }

  /**
   * 获取用户的对话列表
   */
  async getConversations(currentUserId: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: currentUserId },
          { participant2Id: currentUserId },
        ],
      },
      orderBy: { updatedAt: "desc" },
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
      },
    });

    return conversations.map((conv) => {
      const otherUserId =
        conv.participant1Id === currentUserId
          ? conv.participant2Id
          : conv.participant1Id;

      return {
        id: conv.id,
        postId: conv.postId,
        postTitle: conv.post.title,
        otherUserId,
        updatedAt: conv.updatedAt,
        post: conv.post,
      };
    });
  }

  /**
   * 获取对话详情
   */
  async getConversationById(conversationId: string, currentUserId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
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
      },
    });

    if (!conversation) {
      throw new Error("对话不存在或无权限访问");
    }

    return conversation;
  }

  /**
   * 删除对话
   */
  async deleteConversation(conversationId: string, currentUserId: string) {
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
      throw new Error("对话不存在或无权限删除");
    }

    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    return { success: true };
  }

  /**
   * 获取对话列表（别名方法）
   */
  async fetchConversations(currentUserId: string) {
    return this.getConversations(currentUserId);
  }

  /**
   * 获取消息列表
   */
  async fetchMessages(
    conversationId: string,
    currentUserId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const offset = (page - 1) * limit;

    // 验证用户是否有权限访问此对话
    await this.getConversationById(conversationId, currentUserId);

    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversationId,
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    });

    const total = await prisma.message.count({
      where: {
        conversationId: conversationId,
      },
    });

    return {
      messages: messages.reverse(), // 返回时按时间正序
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalMessages: total,
        limit,
      },
    };
  }

  /**
   * 标记消息为已读
   */
  async markMessagesAsRead(conversationId: string, currentUserId: string) {
    // 验证用户是否有权限访问此对话
    await this.getConversationById(conversationId, currentUserId);

    await prisma.message.updateMany({
      where: {
        conversationId: conversationId,
        senderId: { not: currentUserId },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { success: true };
  }

  /**
   * 发送消息
   */
  async sendMessage(conversationId: string, senderId: string, content: string) {
    // 验证用户是否有权限访问此对话
    const conversation = await this.getConversationById(
      conversationId,
      senderId
    );

    // 确定接收者ID
    const receiverId =
      conversation.participant1Id === senderId
        ? conversation.participant2Id
        : conversation.participant1Id;

    const message = await prisma.message.create({
      data: {
        conversationId: conversationId,
        senderId: senderId,
        receiverId: receiverId,
        content: content,
        type: "text",
        createdAt: new Date(),
        isRead: false,
      },
    });

    // 更新对话的最后更新时间
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  /**
   * 获取单条消息
   */
  async fetchSingleMessage(messageId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error("消息不存在");
    }

    return message;
  }

  /**
   * 获取未读消息数量
   */
  async getUnreadCount(currentUserId: string) {
    const unreadCount = await prisma.message.count({
      where: {
        senderId: { not: currentUserId },
        isRead: false,
        conversation: {
          OR: [
            { participant1Id: currentUserId },
            { participant2Id: currentUserId },
          ],
        },
      },
    });

    return unreadCount;
  }
}

export const conversationService = new ConversationService();
