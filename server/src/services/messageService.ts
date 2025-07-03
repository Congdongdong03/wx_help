import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const messageService = {
  /**
   * Sends a new message and saves it to the database.
   * @param conversationId The ID of the conversation.
   * @param senderId The ID of the sender.
   * @param receiverId The ID of the receiver.
   * @param content The content of the message.
   * @param type The type of the message (text or image).
   * @returns A promise that resolves with the newly created Message object from the database.
   */
  sendMessage: async (
    conversationId: string,
    senderId: string,
    receiverId: string,
    content: string,
    type: "text" | "image" = "text"
  ) => {
    try {
      const newMessage = await prisma.message.create({
        data: {
          conversationId,
          senderId,
          receiverId,
          type,
          content,
          isRead: false,
          createdAt: new Date(),
        },
      });

      // Update conversation's updatedAt timestamp
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return newMessage;
    } catch (error) {
      console.error("Error saving message to database:", error);
      throw new Error("Failed to save message to database.");
    }
  },

  /**
   * Fetches messages for a specific conversation with pagination.
   * @param conversationId The ID of the conversation.
   * @param page The page number.
   * @param limit The number of messages per page.
   * @param before Optional timestamp to get messages before this time (for older messages).
   * @returns A promise that resolves with an object containing messages and pagination info.
   */
  fetchMessages: async (
    conversationId: string,
    page: number,
    limit: number,
    before?: number
  ) => {
    const offset = (page - 1) * limit;
    const where: any = { conversationId };

    if (before) {
      where.createdAt = { lt: new Date(before) };
    }

    try {
      const messages = await prisma.message.findMany({
        where,
        orderBy: {
          createdAt: "desc", // 最新消息在前面
        },
        skip: offset,
        take: limit,
      });

      const totalMessages = await prisma.message.count({
        where: { conversationId },
      });

      const hasMore = offset + messages.length < totalMessages;
      const nextPage = hasMore ? page + 1 : null;

      return {
        messages: messages.reverse(), // 返回时反转，使最新消息在列表底部
        pagination: {
          total: totalMessages,
          page,
          limit,
          hasMore,
          nextPage,
        },
      };
    } catch (error) {
      console.error("Error fetching messages from database:", error);
      throw new Error("Failed to fetch messages from database.");
    }
  },

  /**
   * Marks all messages in a conversation as read for a specific user.
   * @param conversationId The ID of the conversation.
   * @param receiverId The ID of the user for whom messages should be marked as read.
   * @returns A promise that resolves when messages are marked as read.
   */
  markMessagesAsRead: async (conversationId: string, receiverId: string) => {
    try {
      await prisma.message.updateMany({
        where: {
          conversationId: conversationId,
          receiverId: receiverId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
      console.log(
        `Marked messages in conversation ${conversationId} as read for user ${receiverId}`
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
      throw new Error("Failed to mark messages as read.");
    }
  },
};
