import Taro from "@tarojs/taro";
import { API_CONFIG } from "../config/api";
import { Conversation, Message } from "../types/message";

// REMOVED: Mock data for demonstration purposes
// let mockConversations: Conversation[] = [...];
// let mockMessages: Message[] = [...];

// REMOVED: Helper to simulate network delay
// const simulateDelay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// Helper function to get current user ID
const getCurrentUserId = (): string => {
  // In a real app, this would come from user authentication
  // For now, we'll use a development user ID
  return "dev_openid_123";
};

export const messageService = {
  /**
   * Fetches a list of conversations for the current user.
   * @returns A promise that resolves with an array of Conversation objects.
   */
  fetchConversations: async (): Promise<Conversation[]> => {
    try {
      const res = await Taro.request({
        url: API_CONFIG.getApiUrl("/conversations/list"),
        method: "GET",
        header: {
          "content-type": "application/json",
          "x-openid": getCurrentUserId(),
        },
      });

      if (
        res.statusCode === 200 &&
        res.data.code === 0 &&
        Array.isArray(res.data.data)
      ) {
        return res.data.data as Conversation[];
      } else {
        console.error("API returned error or invalid data:", res);
        throw new Error("Failed to fetch conversations");
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      throw err;
    }
  },

  /**
   * Fetches messages for a specific conversation.
   * @param conversationId The ID of the conversation.
   * @returns A promise that resolves with an array of Message objects.
   */
  fetchMessages: async (conversationId: string): Promise<Message[]> => {
    try {
      const res = await Taro.request({
        url: API_CONFIG.getApiUrl(`/conversations/${conversationId}/messages`),
        method: "GET",
        header: {
          "content-type": "application/json",
          "x-openid": getCurrentUserId(),
        },
      });

      if (
        res.statusCode === 200 &&
        res.data.code === 0 &&
        Array.isArray(res.data.data)
      ) {
        return res.data.data as Message[];
      } else {
        console.error("API returned error or invalid data:", res);
        throw new Error("Failed to fetch messages");
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      throw err;
    }
  },

  /**
   * Sends a new message.
   * @param conversationId The ID of the conversation.
   * @param senderId The ID of the sender.
   * @param receiverId The ID of the receiver.
   * @param content The content of the message.
   * @returns A promise that resolves with the newly created Message object.
   */
  sendMessage: async (
    conversationId: string,
    senderId: string,
    receiverId: string,
    content: string
  ): Promise<Message> => {
    try {
      const res = await Taro.request({
        url: API_CONFIG.getApiUrl(`/conversations/${conversationId}/messages`),
        method: "POST",
        header: {
          "content-type": "application/json",
          "x-openid": getCurrentUserId(),
        },
        data: {
          content,
        },
      });

      if (res.statusCode === 200 && res.data.code === 0 && res.data.data) {
        return res.data.data as Message;
      } else {
        console.error("API returned error or invalid data:", res);
        throw new Error("Failed to send message");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      throw err;
    }
  },

  /**
   * Marks messages in a conversation as read.
   * @param conversationId The ID of the conversation.
   * @param userId The ID of the user marking messages as read.
   * @returns A promise that resolves when the operation is complete.
   */
  markMessagesAsRead: async (
    conversationId: string,
    userId: string
  ): Promise<void> => {
    try {
      const res = await Taro.request({
        url: API_CONFIG.getApiUrl(`/conversations/${conversationId}/mark-read`),
        method: "POST",
        header: {
          "content-type": "application/json",
          "x-openid": getCurrentUserId(),
        },
        data: {
          userId,
        },
      });

      if (res.statusCode === 200 && res.data.code === 0) {
        console.log("Messages marked as read successfully");
      } else {
        console.error("API returned error or invalid data:", res);
        throw new Error("Failed to mark messages as read");
      }
    } catch (err) {
      console.error("Error marking messages as read:", err);
      throw err;
    }
  },

  findOrCreateConversation: async (
    postId: string,
    otherUserId: string
  ): Promise<string> => {
    try {
      const res = await Taro.request({
        url: API_CONFIG.getApiUrl("/conversations/find-or-create"),
        method: "POST",
        header: {
          "content-type": "application/json",
          "x-openid": getCurrentUserId(),
        },
        data: {
          postId,
          otherUserId,
        },
      });

      if (res.statusCode === 200 && res.data) {
        if (res.data.code === 0 && res.data.data) {
          return res.data.data.conversationId;
        } else {
          throw new Error(res.data.message || "创建对话失败");
        }
      } else {
        throw new Error("网络请求失败");
      }
    } catch (error) {
      console.error("Error finding or creating conversation:", error);
      throw error;
    }
  },
};
