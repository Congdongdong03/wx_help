import { Conversation, Message } from "../types/message";

// Mock data for demonstration purposes
let mockConversations: Conversation[] = [
  {
    id: "conv1",
    otherUserId: "user101",
    otherUserNickname: "张三",
    otherUserAvatar: "https://via.placeholder.com/50/FF5733/FFFFFF?text=ZS",
    lastMessagePreview: "你好，请问帖子还在吗？",
    lastMessageTime: "昨天 17:30",
    unreadCount: 2,
  },
  {
    id: "conv2",
    otherUserId: "user102",
    otherUserNickname: "李四",
    otherUserAvatar: "https://via.placeholder.com/50/33FF57/FFFFFF?text=LS",
    lastMessagePreview: "好的，我明天联系你。",
    lastMessageTime: "06-25",
    unreadCount: 0,
  },
  {
    id: "conv3",
    otherUserId: "user103",
    otherUserNickname: "王五",
    otherUserAvatar: "https://via.placeholder.com/50/3357FF/FFFFFF?text=WW",
    lastMessagePreview: "好的，我明天联系你。",
    lastMessageTime: "06-24",
    unreadCount: 1,
  },
];

let mockMessages: Message[] = [
  {
    id: "msg1",
    conversationId: "conv1",
    senderId: "user101", //张三
    receiverId: "currentUser",
    content: "你好，请问帖子还在吗？",
    timestamp: "2024-06-26T17:29:00Z",
    isRead: false,
  },
  {
    id: "msg2",
    conversationId: "conv1",
    senderId: "currentUser",
    receiverId: "user101",
    content: "还在的，请问有什么可以帮您的吗？",
    timestamp: "2024-06-26T17:30:00Z",
    isRead: true,
  },
  {
    id: "msg3",
    conversationId: "conv1",
    senderId: "user101",
    receiverId: "currentUser",
    content: "我想了解一下价格和使用情况。",
    timestamp: "2024-06-26T17:35:00Z",
    isRead: false,
  },
  {
    id: "msg4",
    conversationId: "conv2",
    senderId: "user102",
    receiverId: "currentUser",
    content: "好的，我明天联系你。",
    timestamp: "2024-06-25T10:00:00Z",
    isRead: true,
  },
  {
    id: "msg5",
    conversationId: "conv3",
    senderId: "user103",
    receiverId: "currentUser",
    content: "好的，我明天联系你。",
    timestamp: "2024-06-24T09:00:00Z",
    isRead: false,
  },
];

// Helper to simulate network delay
const simulateDelay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const messageService = {
  /**
   * Fetches a list of conversations for the current user.
   * @returns A promise that resolves with an array of Conversation objects.
   */
  fetchConversations: async (): Promise<Conversation[]> => {
    await simulateDelay(500);
    // In a real app, this would fetch from a backend API
    return mockConversations;
  },

  /**
   * Fetches messages for a specific conversation.
   * @param conversationId The ID of the conversation.
   * @returns A promise that resolves with an array of Message objects.
   */
  fetchMessages: async (conversationId: string): Promise<Message[]> => {
    await simulateDelay(500);
    // In a real app, this would fetch from a backend API based on conversationId
    return mockMessages.filter((msg) => msg.conversationId === conversationId);
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
    await simulateDelay(300);
    const newMessage: Message = {
      id: `msg${Date.now()}`,
      conversationId,
      senderId,
      receiverId,
      content,
      timestamp: new Date().toISOString(),
      isRead: false, // Sender's message is considered read by sender immediately
    };
    mockMessages.push(newMessage);

    // Update last message in conversation list
    const conversation = mockConversations.find((c) => c.id === conversationId);
    if (conversation) {
      conversation.lastMessagePreview = content;
      conversation.lastMessageTime = "刚刚"; // Simplified for mock
      // No unread count increase for sender's own message
    }

    return newMessage;
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
    await simulateDelay(200);
    mockMessages = mockMessages.map((msg) =>
      msg.conversationId === conversationId && msg.receiverId === userId
        ? { ...msg, isRead: true }
        : msg
    );
    // Reduce unread count for the conversation
    const conversation = mockConversations.find((c) => c.id === conversationId);
    if (conversation) {
      conversation.unreadCount = 0;
    }
  },
};
