export interface Conversation {
  id: string;
  otherUserId: string;
  otherUserNickname: string;
  otherUserAvatar: string;
  postTitle: string;
  lastMessagePreview: string;
  lastMessageTime: string; // Already formatted, e.g., "昨天 17:30" or "06-25"
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string; // The user ID who sent the message
  receiverId: string; // The user ID who received the message
  content: string;
  timestamp: string; // ISO string for precise sorting, will be formatted for display
  isRead: boolean;
  status?: "pending" | "sent" | "failed";
  clientTempId?: string; // 客户端临时ID，用于乐观更新
}

export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

export interface MessagesResponse {
  messages: Message[];
  pagination: PaginationInfo;
}
