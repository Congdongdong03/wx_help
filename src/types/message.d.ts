export interface Conversation {
  id: string;
  postId: string;
  otherUserId: string;
  otherUserNickname: string;
  otherUserAvatar: string;
  postTitle: string;
  lastMessagePreview: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  type: "text" | "image";
  content: string;
  timestamp: string;
  isRead: boolean;
  status?: "pending" | "sent" | "failed";
  clientTempId?: string;
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
