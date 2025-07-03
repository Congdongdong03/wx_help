import { PrismaClient } from "@prisma/client";
import { messageService as backendMessageService } from "./messageService";

const prisma = new PrismaClient();

class ConversationService {
  /**
   * Finds an existing conversation or creates a new one.
   * @param postId The ID of the post associated with the conversation.
   * @param currentUserId The ID of the current authenticated user.
   * @param otherUserId The ID of the other participant in the conversation.
   * @returns The conversation object.
   */
  public async findOrCreateConversation(
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
   * Fetches a list of conversations for the current user, optimizing for N+1 query problem.
   * @param currentUserId The ID of the current authenticated user.
   * @returns A formatted list of conversations.
   */
  public async fetchConversations(currentUserId: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: currentUserId },
          { participant2Id: currentUserId },
        ],
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const postIds = [...new Set(conversations.map((conv) => conv.postId))];
    const userIds = [
      ...new Set(
        conversations.flatMap((conv) => [
          conv.participant1Id,
          conv.participant2Id,
        ])
      ),
    ];

    const [posts, users, latestMessages, unreadCounts] = await Promise.all([
      prisma.post.findMany({
        where: { id: { in: postIds } },
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
      }),
      prisma.users.findMany({
        where: { openid: { in: userIds } },
        select: { openid: true, nickname: true, avatar_url: true },
      }),
      prisma.message.findMany({
        where: {
          conversationId: { in: conversations.map((c) => c.id) },
        },
        distinct: ["conversationId"],
        orderBy: { createdAt: "desc" },
      }),
      Promise.all(
        conversations.map((conv) =>
          prisma.message.count({
            where: {
              conversationId: conv.id,
              isRead: false,
              senderId: { not: currentUserId },
            },
          })
        )
      ),
    ]);

    const postsMap = new Map(posts.map((post) => [post.id, post]));
    const usersMap = new Map(users.map((user) => [user.openid, user]));
    const latestMessagesMap = new Map(
      latestMessages.map((msg) => [msg.conversationId, msg])
    );

    const formattedConversations = conversations.map((conv, index) => {
      const otherParticipantId =
        conv.participant1Id === currentUserId
          ? conv.participant2Id
          : conv.participant1Id;
      const otherUser = usersMap.get(otherParticipantId);
      const post = postsMap.get(conv.postId);
      const lastMessage = latestMessagesMap.get(conv.id);
      const unreadCount = unreadCounts[index]; // Assuming order is preserved

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
        postId: conv.postId,
        otherUserId: otherParticipantId,
        otherUserNickname: otherUser?.nickname || "未知用户",
        otherUserAvatar: otherUser?.avatar_url || "",
        postTitle: post?.title || "",
        lastMessagePreview: lastMessagePreview,
        lastMessageTime: lastMessage?.createdAt
          ? this.formatTime(lastMessage.createdAt)
          : "",
        unreadCount: unreadCount,
      };
    });

    return formattedConversations;
  }

  /**
   * Fetches messages for a given conversation with pagination.
   * @param conversationId The ID of the conversation.
   * @param page The page number for pagination.
   * @param limit The number of messages per page.
   * @param before Optional: message ID to fetch messages before (for infinite scrolling).
   * @returns An object containing messages and pagination details.
   */
  public async fetchMessages(
    conversationId: string,
    page: number,
    limit: number,
    before?: number
  ) {
    return await backendMessageService.fetchMessages(
      conversationId,
      page,
      limit,
      before
    );
  }

  /**
   * Marks messages in a conversation as read for a specific user.
   * @param conversationId The ID of the conversation.
   * @param currentUserId The ID of the user for whom to mark messages as read.
   */
  public async markMessagesAsRead(
    conversationId: string,
    currentUserId: string
  ) {
    await backendMessageService.markMessagesAsRead(
      conversationId,
      currentUserId
    );
  }

  /**
   * Sends a new message in a conversation.
   * @param conversationId The ID of the conversation.
   * @param senderId The ID of the sender.
   * @param receiverId The ID of the receiver.
   * @param content The content of the message.
   * @param type The type of the message (e.g., 'text', 'image').
   * @returns The newly created message object.
   */
  public async sendMessage(
    conversationId: string,
    senderId: string,
    receiverId: string,
    content: string,
    type: "text" | "image"
  ) {
    return await backendMessageService.sendMessage(
      conversationId,
      senderId,
      receiverId,
      content,
      type
    );
  }

  /**
   * Fetches a single message by its ID.
   * @param messageId The ID of the message to fetch.
   * @returns The message object.
   */
  public async fetchSingleMessage(messageId: string) {
    return await prisma.message.findUnique({
      where: { id: messageId },
    });
  }

  /**
   * Gets the total unread message count for a user.
   * @param currentUserId The ID of the current authenticated user.
   * @returns The count of unread messages.
   */
  public async getUnreadCount(currentUserId: string) {
    return await prisma.message.count({
      where: {
        receiverId: currentUserId,
        isRead: false,
      },
    });
  }

  private formatTime(date: Date): string {
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
}

export const conversationService = new ConversationService();
