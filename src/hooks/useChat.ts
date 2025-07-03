import React, { useState, useEffect, useCallback } from "react";
import Taro from "@tarojs/taro";
import { Message, PaginationInfo } from "../types/message";
import { messageService } from "../services/messageService";
import { API_CONFIG } from "../config/api";
import { uploadFile } from "../utils/request";
import { debounce } from "../utils/debounce";
import { useUser } from "../store/user/hooks";

interface UseChatProps {
  postId: string | undefined;
  paramConversationId: string | undefined;
  otherUserId: string | undefined;
  otherUserNickname: string | undefined;
  otherUserAvatarParam: string | undefined;
  // Passed from useWebSocket hook
  isWebSocketConnected: () => boolean;
  emitWebSocketEvent: (event: string, data: any) => void;
  setMessageCallback: (callback: (msg: any) => void) => void;
  removeMessageCallback: () => void;
}

interface UseChatReturn {
  currentConversationId: string | null;
  chatTitle: string;
  messages: Message[];
  messageInput: string;
  loading: boolean;
  loadingMore: boolean;
  error: boolean;
  isOtherUserTyping: boolean;
  isOtherUserOnline: boolean;
  pagination: PaginationInfo | null;
  scrollToViewId: string;
  otherUserAvatar: string;
  currentUserAvatar: string;
  setMessageInput: (input: string) => void;
  loadMoreMessages: () => Promise<void>;
  handleSendMessage: () => Promise<void>;
  handleChooseImage: () => void;
  handleInputChange: (e: any) => void;
  handleRetryMessage: (message: Message) => void;
}

export const useChat = ({
  postId,
  paramConversationId,
  otherUserId,
  otherUserNickname,
  otherUserAvatarParam,
  isWebSocketConnected,
  emitWebSocketEvent,
  setMessageCallback,
  removeMessageCallback,
}: UseChatProps): UseChatReturn => {
  const { currentUser } = useUser();

  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(paramConversationId || null);
  const [chatTitle, setChatTitle] = useState(
    otherUserNickname ? decodeURIComponent(otherUserNickname) : "聊天"
  );
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false); // Keep this state to manage initial data load
  const [scrollToViewId, setScrollToViewId] = useState<string>("");

  const otherUserAvatar = otherUserAvatarParam
    ? decodeURIComponent(otherUserAvatarParam)
    : "https://via.placeholder.com/40";

  const currentUserAvatar = currentUser?.avatarUrl || "";

  // Get or create conversation, and set conversationId
  const initConversation = useCallback(async () => {
    console.log("initConversation called with:", {
      postId,
      currentConversationId,
      otherUserId,
      currentUserOpenid: currentUser?.openid,
      hasAllRequired: !!(
        currentConversationId ||
        (postId && otherUserId && currentUser?.openid)
      ),
    });

    // If there is already a conversationId, use it directly
    if (currentConversationId) {
      console.log("✅ Using existing conversationId:", currentConversationId);
      setLoading(false);
      return;
    }

    // Check user login status and openid
    if (!currentUser?.openid) {
      console.error("❌ initConversation: currentUser.openid is missing!");
      console.log("currentUser:", currentUser);

      // Try to get openid from local cache
      const cachedOpenid = Taro.getStorageSync("openid");
      console.log("cachedOpenid:", cachedOpenid);

      if (cachedOpenid) {
        console.log("✅ Found openid in cache, using it");
        // If there is openid in the cache, use it
        try {
          const convId = await messageService.findOrCreateConversation(
            postId as string,
            otherUserId as string,
            cachedOpenid
          );
          setCurrentConversationId(convId);
          console.log("Initialized conversation ID:", convId);
        } catch (err) {
          console.error("Error initializing conversation:", err);
          setError(true);
          Taro.showToast({ title: "获取对话失败", icon: "none" });
        }
        return;
      } else {
        Taro.showToast({ title: "请先登录", icon: "none" });
        return;
      }
    }

    if (!postId || !otherUserId) {
      console.log("initConversation: Missing postId or otherUserId");
      return;
    }

    try {
      setLoading(true);
      console.log("Calling findOrCreateConversation with:", {
        postId: postId as string,
        otherUserId: otherUserId as string,
        currentUserOpenid: currentUser.openid,
      });
      const convId = await messageService.findOrCreateConversation(
        postId as string,
        otherUserId as string,
        currentUser.openid
      );
      setCurrentConversationId(convId);
      console.log("Initialized conversation ID:", convId);
    } catch (err) {
      console.error("Error initializing conversation:", err);
      setError(true);
      Taro.showToast({ title: "获取对话失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  }, [postId, currentConversationId, otherUserId, currentUser.openid]);

  // Debounced function to emit typing event
  const debouncedTyping = useCallback(
    debounce(() => {
      if (isWebSocketConnected() && currentConversationId) {
        console.log("Emitting stopTyping");
        emitWebSocketEvent("stopTyping", {
          conversationId: currentConversationId,
        });
      }
    }, 1000),
    [isWebSocketConnected, currentConversationId, emitWebSocketEvent]
  );

  const sortMessages = useCallback(
    (arr: Message[]) =>
      arr
        .slice()
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ),
    []
  );

  const fetchChatMessages = useCallback(
    async (page: number = 1, isLoadMore: boolean = false) => {
      if (!currentConversationId || !currentUser.openid) return;

      console.log(
        `[fetchChatMessages] Calling fetchMessages with currentConversationId: ${currentConversationId}, currentUser.openid: ${currentUser.openid}`
      );

      try {
        if (isLoadMore) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const response = await messageService.fetchMessages(
          currentConversationId,
          currentUser.openid,
          page
        );

        if (isLoadMore) {
          setMessages((prev) => sortMessages([...response.messages, ...prev]));
        } else {
          setMessages(sortMessages(response.messages));
          setHasInitialized(true);
        }

        setPagination(response.pagination);
        setError(false);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError(true);
        Taro.showToast({
          title: "加载消息失败",
          icon: "none",
        });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [currentConversationId, currentUser.openid, sortMessages]
  );

  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !pagination?.hasMore) {
      return;
    }

    const nextPage = pagination.nextPage;
    if (!nextPage) {
      return;
    }

    const firstMessageId = messages[0]?.id;

    try {
      await fetchChatMessages(nextPage, true);

      if (firstMessageId) {
        setTimeout(() => {
          setScrollToViewId(`msg-${firstMessageId}`);
        }, 100);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
      Taro.showToast({
        title: "加载更多消息失败",
        icon: "none",
      });
    }
  }, [
    loadingMore,
    pagination?.hasMore,
    pagination?.nextPage,
    messages,
    fetchChatMessages,
  ]);

  const markConversationAsRead = useCallback(async () => {
    if (!currentConversationId || !currentUser.openid) return;

    console.log(
      `[markConversationAsRead] Calling markMessagesAsRead with currentConversationId: ${currentConversationId}, currentUser.openid: ${currentUser.openid}`
    );

    try {
      await messageService.markMessagesAsRead(
        currentConversationId,
        currentUser.openid
      );
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  }, [currentConversationId, currentUser.openid]);

  // Message handler
  const messageHandler = useCallback(
    (msg: any) => {
      if (msg.conversationId === currentConversationId && msg.type === "chat") {
        setMessages((prev) => {
          if (msg.clientTempId) {
            const existingIndex = prev.findIndex(
              (m) => m.clientTempId === msg.clientTempId
            );
            if (existingIndex !== -1) {
              const updatedMessages = [...prev];
              updatedMessages[existingIndex] = {
                ...updatedMessages[existingIndex],
                id: msg.messageId || updatedMessages[existingIndex].id,
                status: "sent",
                timestamp:
                  msg.timestamp || updatedMessages[existingIndex].timestamp,
              };
              return updatedMessages;
            }
          }

          // Only add new message if it doesn't already exist by messageId
          if (msg.messageId && prev.some((m) => m.id === msg.messageId)) {
            return prev;
          }

          // Append new message directly without sorting the whole array
          return [
            ...prev,
            {
              ...msg,
              id: msg.messageId || Date.now().toString(),
              status: "sent",
              type: msg.messageType || "text",
            },
          ];
        });
        setLoading(false);
      }
      if (msg.type === "auth_success") {
        setLoading(false);
      }
      if (msg.type === "onlineStatus") {
        setIsOtherUserOnline(msg.onlineCount >= 2);
      }
      if (msg.type === "error" && msg.clientTempId) {
        setMessages((prev) => {
          const existingIndex = prev.findIndex(
            (m) => m.clientTempId === msg.clientTempId
          );
          if (existingIndex !== -1) {
            const updatedMessages = [...prev];
            updatedMessages[existingIndex] = {
              ...updatedMessages[existingIndex],
              status: "failed",
            };
            return updatedMessages;
          }
          return prev;
        });
        Taro.showToast({ title: "发送失败", icon: "none" });
      }
    },
    [currentConversationId]
  );

  // Retry message handler
  const handleRetryMessage = useCallback(
    (message: Message) => {
      if (!currentConversationId || !otherUserId || !currentUser.openid) return;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id ? { ...msg, status: "pending" } : msg
        )
      );

      if (isWebSocketConnected()) {
        try {
          emitWebSocketEvent("sendMessage", {
            conversationId: currentConversationId,
            toUserId: otherUserId,
            type: message.type,
            content: message.content,
            timestamp: Date.now(),
            clientTempId: message.clientTempId,
          });
        } catch (error) {
          console.error("WebSocket发送消息失败:", error);
        }
      }
    },
    [
      currentConversationId,
      otherUserId,
      currentUser.openid,
      isWebSocketConnected,
      emitWebSocketEvent,
    ]
  );

  const handleInputChange = (e: any) => {
    setMessageInput(e.detail.value);
    if (isWebSocketConnected() && currentConversationId) {
      try {
        console.log("Emitting typing");
        emitWebSocketEvent("typing", { conversationId: currentConversationId });
        debouncedTyping();
      } catch (error) {
        console.error("发送typing事件失败:", error);
      }
    }
  };

  const handleSendMessage = async () => {
    if (
      !messageInput.trim() ||
      !currentConversationId ||
      !otherUserId ||
      !currentUser.openid
    )
      return;

    if (currentUser.openid === otherUserId) {
      Taro.showToast({ title: "不能给自己发送消息", icon: "none" });
      return;
    }

    const clientTempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: clientTempId,
      clientTempId,
      conversationId: currentConversationId,
      senderId: currentUser.openid,
      receiverId: otherUserId,
      type: "text",
      content: messageInput.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
      status: "pending",
    };
    setMessages(
      (prevMessages) => [...prevMessages, optimisticMessage] // Directly append without sorting
    );
    setMessageInput("");

    try {
      if (isWebSocketConnected()) {
        emitWebSocketEvent("sendMessage", {
          conversationId: currentConversationId,
          toUserId: otherUserId,
          type: "text",
          content: optimisticMessage.content,
          timestamp: Date.now(),
          clientTempId,
        });
      } else {
        throw new Error("WebSocket not connected, falling back to HTTP");
      }
    } catch (error) {
      console.error("Sending message via WebSocket failed:", error);
      try {
        console.log(
          `[handleSendMessage] HTTP fallback calling sendMessage with currentConversationId: ${currentConversationId}, currentUser.openid: ${currentUser.openid}`
        );
        const sent = await messageService.sendMessage(
          currentConversationId,
          currentUser.openid,
          otherUserId,
          optimisticMessage.content,
          "text"
        );
        console.log("HTTP fallback sent:", sent);
        setMessages(
          (prevMessages) =>
            prevMessages.map((msg) =>
              msg.content === sent.content &&
              msg.senderId === sent.senderId &&
              msg.status === "pending"
                ? { ...msg, ...sent, status: "sent" }
                : msg
            ) // Update specific message, no full sort
        );
      } catch (err) {
        console.error("Error sending message via HTTP API:", err);
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === clientTempId ? { ...msg, status: "failed" } : msg
          )
        ); // Update specific message, no full sort
        Taro.showToast({ title: "发送失败", icon: "none" });
      }
    }
  };

  const handleChooseImage = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ["original", "compressed"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        handleSendImage(tempFilePath);
      },
      fail: (err) => {
        if (err.errMsg && !err.errMsg.includes("cancel")) {
          Taro.showToast({ title: "选择图片失败", icon: "none" });
        }
      },
    });
  };

  const handleSendImage = async (tempFilePath: string) => {
    if (!currentConversationId || !otherUserId || !currentUser.openid) return;

    if (currentUser.openid === otherUserId) {
      Taro.showToast({ title: "不能给自己发送消息", icon: "none" });
      return;
    }

    const clientTempId = `image-${Date.now()}`;
    const optimisticMessage: Message = {
      id: clientTempId,
      conversationId: currentConversationId,
      senderId: currentUser.openid,
      receiverId: otherUserId,
      type: "image",
      content: tempFilePath,
      timestamp: new Date().toISOString(),
      isRead: false,
      status: "pending",
    };

    setMessages(
      (prevMessages) => [...prevMessages, optimisticMessage] // Directly append without sorting
    );

    try {
      Taro.showLoading({ title: "发送中..." });
      console.log("开始上传图片:", tempFilePath);
      console.log("上传URL:", API_CONFIG.getApiUrl("/posts/upload"));

      const uploadResult = await uploadFile<{
        code: number;
        message: string;
        data: { url: string };
      }>(API_CONFIG.getApiUrl("/posts/upload"), tempFilePath, {
        name: "file",
        retryCount: 3,
        retryDelay: 1000,
      });

      console.log("上传结果:", uploadResult);

      if (uploadResult.code !== 0) {
        throw new Error(uploadResult.message || "上传失败");
      }

      if (!uploadResult.data || !uploadResult.data.url) {
        throw new Error("上传响应格式错误");
      }

      const imageUrl = API_CONFIG.getImageUrl(uploadResult.data.url);
      console.log("图片URL:", imageUrl);

      setMessages(
        (prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === clientTempId
              ? { ...msg, content: imageUrl, status: "sent" }
              : msg
          ) // Update specific message, no full sort
      );

      if (isWebSocketConnected()) {
        try {
          emitWebSocketEvent("sendMessage", {
            conversationId: currentConversationId,
            toUserId: otherUserId,
            type: "image",
            content: imageUrl,
            timestamp: Date.now(),
            clientTempId,
          });
        } catch (error) {
          console.error("WebSocket发送图片失败:", error);
          const sent = await messageService.sendMessage(
            currentConversationId,
            currentUser.openid,
            otherUserId,
            imageUrl,
            "image"
          );

          setMessages(
            (prevMessages) =>
              prevMessages.map((msg) =>
                msg.id === clientTempId
                  ? { ...msg, ...sent, status: "sent" }
                  : msg
              ) // Update specific message, no full sort
          );
        }
      } else {
        console.log(
          `[handleSendImage] HTTP fallback calling sendMessage (for currentConversationId: ${currentConversationId}, currentUser.openid: ${currentUser.openid}`
        );
        const sent = await messageService.sendMessage(
          currentConversationId,
          currentUser.openid,
          otherUserId,
          imageUrl,
          "image"
        );

        setMessages(
          (prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === clientTempId
                ? { ...msg, ...sent, status: "sent" }
                : msg
            ) // Update specific message, no full sort
        );
      }
      Taro.hideLoading();
    } catch (error) {
      console.error("Error sending image:", error);
      Taro.hideLoading();
      setMessages(
        (prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === clientTempId ? { ...msg, status: "failed" } : msg
          ) // Update specific message, no full sort
      );
      Taro.showToast({ title: "发送失败", icon: "none" });
    }
  };

  // Effect for initializing conversation and fetching data
  useEffect(() => {
    if (
      currentUser.openid &&
      otherUserId &&
      (currentConversationId || postId)
    ) {
      initConversation();
    }
  }, [
    currentUser.openid,
    currentConversationId,
    postId,
    otherUserId,
    initConversation,
  ]);

  // Effect for fetching messages and marking as read
  useEffect(() => {
    if (!currentConversationId || !currentUser.openid) return;

    fetchChatMessages();
    markConversationAsRead();
  }, [
    currentConversationId,
    currentUser.openid,
    fetchChatMessages,
    markConversationAsRead,
  ]);

  // Effect for setting up message handlers and event listeners
  useEffect(() => {
    if (!currentConversationId) return;

    // Set navigation bar title
    if (otherUserNickname) {
      const decodedNickname = decodeURIComponent(otherUserNickname);
      Taro.setNavigationBarTitle({
        title: decodedNickname,
      });
    }

    setMessageCallback(messageHandler);
    Taro.eventCenter.on("retryMessage", handleRetryMessage);

    return () => {
      Taro.eventCenter.off("retryMessage", handleRetryMessage);
      removeMessageCallback();
    };
  }, [
    currentConversationId,
    otherUserNickname,
    messageHandler,
    handleRetryMessage,
    setMessageCallback,
    removeMessageCallback,
  ]);

  // Auto-scroll to bottom on new messages (moved into useChat)
  useEffect(() => {
    if (messages.length > 0) {
      setScrollToViewId("");
      setTimeout(() => {
        setScrollToViewId("chat-bottom-anchor");
      }, 100);
    }
  }, [messages]);

  return {
    currentConversationId,
    chatTitle,
    messages,
    messageInput,
    loading,
    loadingMore,
    error,
    isOtherUserTyping,
    isOtherUserOnline,
    pagination,
    scrollToViewId,
    otherUserAvatar,
    currentUserAvatar,
    setMessageInput,
    loadMoreMessages,
    handleSendMessage,
    handleChooseImage,
    handleInputChange,
    handleRetryMessage,
  };
};
