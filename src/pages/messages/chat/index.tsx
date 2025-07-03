import React, { useState, useEffect, useRef, useCallback } from "react";
import Taro, { useRouter } from "@tarojs/taro";
import {
  View,
  Text,
  Input,
  Button,
  ScrollView,
  Image,
} from "@tarojs/components";
import { Message, PaginationInfo } from "../../../types/message";
import { messageService } from "../../../services/messageService";
import { API_CONFIG } from "../../../config/api";
import {
  connectWebSocket,
  disconnectWebSocket,
  isWebSocketConnected,
  emitWebSocketEvent,
  setMessageCallback,
  removeMessageCallback,
} from "../../../services/wsService";
import { debounce } from "../../../utils/debounce";
import { uploadFile } from "../../../utils/request";
import UserSwitcher from "../../../components/UserSwitcher";
import { useUser } from "../../../store/user/hooks";

interface User {
  id: number;
  nickname: string;
  avatar: string;
  openid: string;
}

interface MessageBubbleProps {
  message: Message;
  isMyMessage: boolean;
  otherUserAvatar: string;
  currentUserAvatar: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMyMessage,
  otherUserAvatar,
  currentUserAvatar,
}) => {
  const { content, status, type } = message;

  const handleImageClick = () => {
    if (type === "image") {
      Taro.previewImage({
        urls: [content],
        current: content,
      });
    }
  };

  return (
    <View
      style={{
        display: "flex",
        justifyContent: isMyMessage ? "flex-end" : "flex-start",
        margin: "10rpx 20rpx",
        alignItems: "flex-end",
      }}
    >
      {!isMyMessage && (
        <Image
          className="avatar"
          src={otherUserAvatar || "https://via.placeholder.com/40"}
          style={{
            width: "80rpx",
            height: "80rpx",
            borderRadius: "50%",
            backgroundColor: "#ddd",
            marginRight: "20rpx",
            flexShrink: 0,
          }}
        />
      )}
      <View
        style={{
          backgroundColor: isMyMessage ? "#007AFF" : "#F0F0F0",
          color: isMyMessage ? "white" : "black",
          padding: "20rpx",
          borderRadius: "20rpx",
          maxWidth: "70%",
          position: "relative",
        }}
      >
        {type === "text" ? (
          <Text style={{ fontSize: "28rpx", lineHeight: "1.4" }}>
            {decodeURIComponent(content)}
          </Text>
        ) : type === "image" ? (
          <Image
            src={content}
            mode="widthFix"
            style={{
              maxWidth: "400rpx",
              borderRadius: "10rpx",
            }}
            onClick={handleImageClick}
          />
        ) : null}
        {/* 消息状态指示器 */}
        {isMyMessage && (
          <View
            style={{
              position: "absolute",
              bottom: "-30rpx",
              right: "0",
              fontSize: "20rpx",
              color: "#999",
              display: "flex",
              alignItems: "center",
            }}
          >
            {status === "pending" && (
              <Text style={{ color: "#888" }}>发送中...</Text>
            )}
            {status === "sent" && <Text style={{ color: "#28a745" }}>✓</Text>}
            {status === "failed" && (
              <View style={{ display: "flex", alignItems: "center" }}>
                <Text style={{ color: "#dc3545", marginRight: "10rpx" }}>
                  ✗
                </Text>
                <Button
                  size="mini"
                  style={{
                    backgroundColor: "#dc3545",
                    color: "white",
                    fontSize: "18rpx",
                    padding: "5rpx 10rpx",
                    borderRadius: "10rpx",
                  }}
                  onClick={() => {
                    // 触发重试事件
                    Taro.eventCenter.trigger("retryMessage", message);
                  }}
                >
                  重试
                </Button>
              </View>
            )}
          </View>
        )}
        {/* 本地时间显示 */}
        {message.timestamp && (
          <Text
            style={{
              display: "block",
              fontSize: "20rpx",
              color: "#bbb",
              marginTop: "8rpx",
              textAlign: isMyMessage ? "right" : "left",
            }}
          >
            {new Date(message.timestamp).toLocaleString()}
          </Text>
        )}
      </View>
      {isMyMessage && (
        <Image
          className="avatar"
          src={currentUserAvatar}
          style={{
            width: "80rpx",
            height: "80rpx",
            borderRadius: "50%",
            backgroundColor: "#ddd",
            marginLeft: "20rpx",
            flexShrink: 0,
          }}
        />
      )}
    </View>
  );
};

// 连接状态指示器组件
const ConnectionStatus: React.FC<{
  isConnected: boolean;
  isConnecting: boolean;
}> = ({ isConnected, isConnecting }) => {
  if (isConnecting) {
    return (
      <View
        style={{
          backgroundColor: "#ffc107",
          color: "white",
          padding: "10rpx 20rpx",
          borderRadius: "20rpx",
          fontSize: "24rpx",
          display: "flex",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: "20rpx",
            height: "20rpx",
            borderRadius: "50%",
            backgroundColor: "white",
            marginRight: "10rpx",
            animation: "pulse 1s infinite",
          }}
        />
        <Text>连接中...</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: isConnected ? "#28a745" : "#dc3545",
        color: "white",
        padding: "10rpx 20rpx",
        borderRadius: "20rpx",
        fontSize: "24rpx",
        display: "flex",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: "20rpx",
          height: "20rpx",
          borderRadius: "50%",
          backgroundColor: "white",
          marginRight: "10rpx",
        }}
      />
      <Text>{isConnected ? "已连接" : "未连接"}</Text>
    </View>
  );
};

const ChatWindowPage: React.FC = () => {
  const router = useRouter();
  console.log("Chat page params:", router.params);
  const {
    postId,
    conversationId: paramConversationId,
    otherUserId,
    nickname: otherUserNickname,
    avatar: otherUserAvatarParam,
  } = router.params;

  const { currentUser } = useUser();

  // 新增 conversationId 状态
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(paramConversationId || null);

  // 调试信息
  console.log("Chat page params:", {
    postId,
    paramConversationId,
    otherUserId,
    otherUserNickname,
    otherUserAvatarParam,
  });

  // 调试当前用户信息
  console.log("Current user info:", {
    currentUser,
    currentUserId: currentUser?.id,
    currentUserOpenid: currentUser?.openid,
    hasOpenid: !!currentUser?.openid,
  });

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
  const [socketConnected, setSocketConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const scrollViewRef = useRef<any>(null);
  const [scrollToViewId, setScrollToViewId] = useState<string>("");
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const otherUserAvatar = otherUserAvatarParam
    ? decodeURIComponent(otherUserAvatarParam)
    : "https://via.placeholder.com/40";

  // 调试信息
  console.log("Chat page final values:", {
    chatTitle,
    otherUserAvatar,
    decodedNickname: otherUserNickname
      ? decodeURIComponent(otherUserNickname)
      : null,
  });

  // 如果没有当前用户或对话ID，则不渲染或显示加载状态
  if (!currentUser || !currentUser.openid || !otherUserId) {
    return (
      <View
        className="chat-window-page"
        style={{ textAlign: "center", padding: "40rpx" }}
      >
        <Text>{!currentUser?.openid ? "请先登录" : "加载中..."}</Text>
        {!currentUser?.openid && (
          <Button
            onClick={() => Taro.navigateTo({ url: "/pages/my/index" })}
            style={{ marginTop: "20rpx" }}
          >
            去登录
          </Button>
        )}
      </View>
    );
  }

  // 检查是否有必要的参数
  if (!currentConversationId && !postId) {
    return (
      <View
        className="chat-window-page"
        style={{ textAlign: "center", padding: "40rpx" }}
      >
        <Text>缺少必要参数</Text>
      </View>
    );
  }

  // 获取或创建对话，并设置 conversationId
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

    // 如果已经有 conversationId，直接使用
    if (currentConversationId) {
      console.log("✅ Using existing conversationId:", currentConversationId);
      setLoading(false);
      return;
    }

    // 检查用户登录状态和 openid
    if (!currentUser?.openid) {
      console.error("❌ initConversation: currentUser.openid is missing!");
      console.log("currentUser:", currentUser);

      // 尝试从本地缓存获取 openid
      const cachedOpenid = Taro.getStorageSync("openid");
      console.log("cachedOpenid:", cachedOpenid);

      if (cachedOpenid) {
        console.log("✅ Found openid in cache, using it");
        // 如果缓存中有 openid，使用它
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
    [currentConversationId]
  );

  // 连接管理
  const handleConnect = useCallback(async () => {
    if (isWebSocketConnected()) return;
    setIsConnecting(true);
    setConnectionError(null);
    try {
      await connectWebSocket(currentUser.openid);
      setSocketConnected(true);
      console.log("Socket连接成功");
    } catch (error) {
      console.error("Socket连接失败:", error);
      setConnectionError("连接失败，请检查网络");
      setSocketConnected(false);
      reconnectTimeoutRef.current = setTimeout(() => {
        handleConnect();
      }, 5000);
    } finally {
      setIsConnecting(false);
    }
  }, [currentUser.openid]);

  // 加入房间
  const handleJoinRoom = useCallback(() => {
    if (!currentConversationId || !isWebSocketConnected()) return;

    try {
      console.log(`加入房间: ${currentConversationId}`);
      emitWebSocketEvent("requestOnlineStatus", {
        conversationId: currentConversationId,
      });
    } catch (error) {
      console.error("加入房间失败:", error);
    }
  }, [currentConversationId]);

  // 离开房间
  const handleLeaveRoom = useCallback(() => {
    if (!currentConversationId) return;

    try {
      console.log(`离开房间: ${currentConversationId}`);
    } catch (error) {
      console.error("离开房间失败:", error);
    }
  }, [currentConversationId]);

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
    [currentConversationId, currentUser.openid]
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

  // 消息处理器
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

          if (msg.messageId && prev.some((m) => m.id === msg.messageId)) {
            return prev;
          }

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

  // 重试消息处理器
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
    [currentConversationId, otherUserId, currentUser.openid]
  );

  // Effect for initializing conversation and fetching data
  useEffect(() => {
    if (
      currentUser.openid &&
      otherUserId &&
      (currentConversationId || postId)
    ) {
      initConversation(); // First, initialize the conversation
    }
  }, [
    currentUser.openid,
    currentConversationId,
    postId,
    otherUserId,
    initConversation,
  ]);

  useEffect(() => {
    if (currentConversationId) {
      // Only proceed if conversationId is available
      // 1. 建立WebSocket连接
      handleConnect();

      // 2. 加载历史消息
      fetchChatMessages();

      // 3. 标记消息为已读
      markConversationAsRead();

      // 4. 设置导航栏标题
      if (otherUserNickname) {
        const decodedNickname = decodeURIComponent(otherUserNickname);
        Taro.setNavigationBarTitle({
          title: decodedNickname,
        });
      }

      // 5. 设置消息处理器
      setMessageCallback(messageHandler);

      // 6. 设置重试消息处理器
      Taro.eventCenter.on("retryMessage", handleRetryMessage);

      return () => {
        Taro.eventCenter.off("retryMessage", handleRetryMessage);
        removeMessageCallback();
      };
    }
  }, [
    currentConversationId,
    currentUser.openid,
    otherUserNickname,
    handleConnect,
    fetchChatMessages,
    markConversationAsRead,
    messageHandler,
    handleRetryMessage,
  ]);

  // 清理函数
  useEffect(() => {
    return () => {
      removeMessageCallback();
      Taro.eventCenter.off("retryMessage");
    };
  }, []);

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

    if (!isWebSocketConnected()) {
      Taro.showToast({ title: "连接中，请稍后重试", icon: "none" });
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
    setMessages((prevMessages) =>
      sortMessages([...prevMessages, optimisticMessage])
    );
    setMessageInput("");

    try {
      emitWebSocketEvent("sendMessage", {
        conversationId: currentConversationId,
        toUserId: otherUserId,
        type: "text",
        content: optimisticMessage.content,
        timestamp: Date.now(),
        clientTempId,
      });
    } catch (error) {
      console.error("发送消息失败:", error);
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
        setMessages((prevMessages) =>
          sortMessages(
            prevMessages.map((msg) =>
              msg.content === sent.content &&
              msg.senderId === sent.senderId &&
              msg.status === "pending"
                ? { ...msg, ...sent, status: "sent" }
                : msg
            )
          )
        );
      } catch (err) {
        console.error("Error sending message via HTTP API:", err);
        setMessages((prevMessages) =>
          sortMessages(
            prevMessages.map((msg) =>
              msg.id === clientTempId ? { ...msg, status: "failed" } : msg
            )
          )
        );
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

    setMessages((prevMessages) =>
      sortMessages([...prevMessages, optimisticMessage])
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

      setMessages((prevMessages) =>
        sortMessages(
          prevMessages.map((msg) =>
            msg.id === clientTempId
              ? { ...msg, content: imageUrl, status: "sent" }
              : msg
          )
        )
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

          setMessages((prevMessages) =>
            sortMessages(
              prevMessages.map((msg) =>
                msg.id === clientTempId
                  ? { ...msg, ...sent, status: "sent" }
                  : msg
              )
            )
          );
        }
      } else {
        console.log(
          `[handleSendImage] HTTP fallback calling sendMessage (for image) with currentConversationId: ${currentConversationId}, currentUser.openid: ${currentUser.openid}`
        );
        const sent = await messageService.sendMessage(
          currentConversationId,
          currentUser.openid,
          otherUserId,
          imageUrl,
          "image"
        );

        setMessages((prevMessages) =>
          sortMessages(
            prevMessages.map((msg) =>
              msg.id === clientTempId
                ? { ...msg, ...sent, status: "sent" }
                : msg
            )
          )
        );
      }
      Taro.hideLoading();
    } catch (error) {
      console.error("Error sending image:", error);
      Taro.hideLoading();
      setMessages((prevMessages) =>
        sortMessages(
          prevMessages.map((msg) =>
            msg.id === clientTempId ? { ...msg, status: "failed" } : msg
          )
        )
      );
      Taro.showToast({ title: "发送失败", icon: "none" });
    }
  };

  const handleRetryConnection = () => {
    handleConnect();
  };

  useEffect(() => {
    if (messages.length > 0) {
      setScrollToViewId("");
      setTimeout(() => {
        setScrollToViewId("chat-bottom-anchor");
      }, 100);
    }
  }, [messages]);

  if (loading) {
    return (
      <View
        className="chat-window-page"
        style={{ textAlign: "center", padding: "40rpx" }}
      >
        <Text>加载中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        className="chat-window-page"
        style={{ textAlign: "center", padding: "40rpx", color: "red" }}
      >
        <Text>加载失败，请重试。</Text>
        <Button
          onClick={() => fetchChatMessages()}
          style={{ marginTop: "20rpx" }}
        >
          重新加载
        </Button>
      </View>
    );
  }

  return (
    <View
      className="chat-window-page"
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        background: "#f8f9fa",
      }}
    >
      {/* Header 固定顶部 */}
      <View
        className="header"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "120rpx",
          zIndex: 1001,
          padding: "20rpx 30rpx",
          borderBottom: "2rpx solid #eee",
          backgroundColor: "white",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Image
          src={otherUserAvatar || "https://via.placeholder.com/40"}
          style={{
            width: "80rpx",
            height: "80rpx",
            borderRadius: "50%",
            marginRight: "20rpx",
            backgroundColor: "#eee",
          }}
          onError={(e) => console.log("Avatar image error:", e)}
          onLoad={() => console.log("Avatar image loaded successfully")}
        />
        <Text style={{ fontSize: "32rpx", fontWeight: "bold", color: "#000" }}>
          {chatTitle || "聊天"}
        </Text>
      </View>

      {/* 用户切换组件 - 仅在开发环境显示 */}
      {process.env.NODE_ENV === "development" && (
        <UserSwitcher isVisible={false} onClose={() => {}} />
      )}

      {/* Content 区域可滚动，绝对定位 */}
      <ScrollView
        scrollY
        style={{
          position: "absolute",
          top: "120rpx",
          bottom: "140rpx",
          left: 0,
          right: 0,
          width: "100vw",
          padding: "20rpx 0",
          background: "#f8f9fa",
        }}
        ref={scrollViewRef}
        scrollIntoView={scrollToViewId}
        scrollWithAnimation
        onScrollToUpper={loadMoreMessages}
        upperThreshold={50}
        enableFlex
      >
        {/* 加载更多提示 */}
        {loadingMore && (
          <View
            style={{
              textAlign: "center",
              padding: "20rpx",
              color: "#888",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: "24rpx" }}>加载更多消息...</Text>
          </View>
        )}

        {/* 没有更多消息提示 */}
        {!loadingMore &&
          pagination &&
          !pagination.hasMore &&
          messages.length > 0 && (
            <View
              style={{
                textAlign: "center",
                padding: "20rpx",
                color: "#999",
                borderTop: "1rpx solid #eee",
                marginTop: "10rpx",
              }}
            >
              <Text style={{ fontSize: "20rpx" }}>没有更多消息了</Text>
            </View>
          )}

        {isOtherUserTyping && (
          <View style={{ padding: "10rpx 20rpx", color: "#888" }}>
            <Text style={{ fontSize: "24rpx" }}>对方正在输入...</Text>
          </View>
        )}

        {messages.length > 0 ? (
          messages.map((message, idx, arr) => (
            <View key={message.id} id={`msg-${message.id}`}>
              <MessageBubble
                message={message}
                isMyMessage={message.senderId === currentUser.openid}
                otherUserAvatar={otherUserAvatar}
                currentUserAvatar={currentUser.avatarUrl}
              />
              {/* 滚动锚点：只在最后一条消息后渲染 */}
              {idx === arr.length - 1 && <View id="chat-bottom-anchor" />}
            </View>
          ))
        ) : (
          <View
            style={{ textAlign: "center", padding: "40rpx", color: "#999" }}
          >
            <Text style={{ fontSize: "28rpx" }}>暂无消息</Text>
            <Text style={{ fontSize: "24rpx", marginTop: "10rpx" }}>
              开始聊天吧！
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer 固定底部 */}
      <View
        className="input-area"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100vw",
          height: "140rpx",
          zIndex: 100,
          display: "flex",
          padding: "20rpx",
          borderTop: "2rpx solid #eee",
          alignItems: "center",
          backgroundColor: "white",
        }}
      >
        {/* 图片选择按钮 */}
        <Button
          onClick={handleChooseImage}
          style={{
            width: "60rpx",
            height: "60rpx",
            backgroundColor: "#f0f0f0",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: "20rpx",
            border: "none",
            padding: 0,
          }}
        >
          <Text style={{ fontSize: "32rpx", color: "#666" }}>📷</Text>
        </Button>

        <Input
          type="text"
          className="message-input"
          placeholder="输入消息"
          value={messageInput}
          onInput={handleInputChange}
          style={{
            flex: 1,
            border: "2rpx solid #ddd",
            borderRadius: "20rpx",
            padding: "16rpx 20rpx",
            fontSize: "28rpx",
            backgroundColor: "#f8f9fa",
          }}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!messageInput.trim()}
          style={{
            marginLeft: "20rpx",
            backgroundColor: messageInput.trim() ? "#007AFF" : "#ccc",
            color: "white",
            borderRadius: "20rpx",
            padding: "16rpx 30rpx",
            fontSize: "28rpx",
            border: "none",
          }}
        >
          发送
        </Button>
      </View>
    </View>
  );
};

export default ChatWindowPage;
