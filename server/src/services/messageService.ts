import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const messageService = {
  /**
   * Sends a new message and saves it to the database.
   * @param conversationId The ID of the conversation.
   * @param senderId The ID of the sender.
   * @param receiverId The ID of the receiver.
   * @param content The content of the message.
   * @returns A promise that resolves with the newly created Message object from the database.
   */
  sendMessage: async (
    conversationId: string,
    senderId: string,
    receiverId: string,
    content: string
  ) => {
    try {
      const newMessage = await prisma.message.create({
        data: {
          conversationId,
          senderId,
          receiverId,
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
};
