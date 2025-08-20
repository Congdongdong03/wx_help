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
        posts: {
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
        postTitle: conv.posts.title,
        otherUserId,
        updatedAt: conv.updatedAt,
        post: conv.posts,
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
        posts: {
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
}

export const conversationService = new ConversationService();
