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
import { Message } from "../../../types/message";
import { messageService } from "../../../services/messageService";
import {
  connectWebSocket,
  disconnectWebSocket,
  isWebSocketConnected,
  emitWebSocketEvent,
  setMessageCallback,
  removeMessageCallback,
} from "../../../services/wsService";
import { debounce } from "../../../utils/debounce";

interface MessageBubbleProps {
  message: Message;
  isMyMessage: boolean;
  otherUserAvatar: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMyMessage,
  otherUserAvatar,
}) => {
  const { content, status } = message;

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
        <Text style={{ fontSize: "28rpx", lineHeight: "1.4" }}>{content}</Text>
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
      </View>
      {isMyMessage && (
        <Image
          className="avatar"
          src="https://via.placeholder.com/40/007AFF/FFFFFF?text=ME"
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

// 1. 定义调试用户列表（放在组件外部）
const debugUsers = [
  {
    id: "dev_openid_123",
    name: "用户A",
    avatar: "https://via.placeholder.com/40/007AFF/FFFFFF?text=A",
  },
  {
    id: "test_user_2",
    name: "用户B",
    avatar: "https://via.placeholder.com/40/FF5722/FFFFFF?text=B",
  },
];

const ChatWindowPage: React.FC = () => {
  const router = useRouter();
  const {
    conversationId,
    otherUserId,
    nickname: otherUserNickname,
  } = router.params;

  const [chatTitle, setChatTitle] = useState(otherUserNickname || "聊天");
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const scrollViewRef = useRef<any>(null);
  const [scrollToViewId, setScrollToViewId] = useState<string>("");
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 将 currentUser 的 useState 移到这里
  const [currentUser, setCurrentUser] = useState(debugUsers[0]);

  // 替换 currentUserId 相关逻辑
  // const currentUserId = "dev_openid_123"; // 删除原有写死的currentUserId
  const otherUserAvatar = "https://via.placeholder.com/40";

  // Debounced function to emit typing event
  const debouncedTyping = useCallback(
    debounce(() => {
      if (isWebSocketConnected() && conversationId) {
        console.log("Emitting stopTyping");
        emitWebSocketEvent("stopTyping", { conversationId });
      }
    }, 1000),
    [conversationId]
  );

  // 连接管理
  const handleConnect = useCallback(async () => {
    if (isWebSocketConnected()) return;
    setIsConnecting(true);
    setConnectionError(null);
    try {
      await connectWebSocket();
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
  }, []);

  // 加入房间
  const handleJoinRoom = useCallback(() => {
    if (!conversationId || !isWebSocketConnected()) return;

    try {
      // joinRoom(conversationId);
      console.log(`加入房间: ${conversationId}`);

      // 请求在线状态
      emitWebSocketEvent("requestOnlineStatus", { conversationId });
    } catch (error) {
      console.error("加入房间失败:", error);
    }
  }, [conversationId]);

  // 离开房间
  const handleLeaveRoom = useCallback(() => {
    if (!conversationId) return;

    try {
      // leaveRoom(conversationId);
      console.log(`离开房间: ${conversationId}`);
    } catch (error) {
      console.error("离开房间失败:", error);
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId && currentUser.id) {
      // 1. 建立WebSocket连接
      connectWebSocket(currentUser.id);

      // 2. 加载历史消息
      fetchChatMessages();

      // 3. 标记消息为已读
      markConversationAsRead();

      setMessageCallback((msg) => {
        if (msg.conversationId === conversationId && msg.type === "chat") {
          setMessages((prev) => {
            // 首先检查是否是服务器回显的消息（通过clientTempId匹配）
            if (msg.clientTempId) {
              const existingIndex = prev.findIndex(
                (m) => m.clientTempId === msg.clientTempId
              );
              if (existingIndex !== -1) {
                // 更新现有的乐观更新消息
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

            // 检查是否已经存在相同的messageId（防止重复）
            if (msg.messageId && prev.some((m) => m.id === msg.messageId)) {
              return prev;
            }

            // 添加新消息
            return [
              ...prev,
              {
                ...msg,
                id: msg.messageId || Date.now().toString(),
                status: "sent",
              },
            ];
          });
          setLoading(false);
        }
        if (msg.type === "auth_success") {
          setLoading(false);
        }
        // 处理在线状态消息
        if (msg.type === "onlineStatus") {
          setIsOtherUserOnline(msg.onlineCount >= 2);
        }
        // 处理错误消息
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
      });

      // 监听重试消息事件
      const handleRetryMessage = (message: Message) => {
        if (!conversationId || !otherUserId) return;

        // 更新消息状态为pending
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === message.id ? { ...msg, status: "pending" } : msg
          )
        );

        // 重新发送消息
        if (isWebSocketConnected()) {
          emitWebSocketEvent("sendMessage", {
            conversationId,
            toUserId: otherUserId,
            content: message.content,
            timestamp: Date.now(),
            clientTempId: message.clientTempId,
          });
        } else {
          // fallback 到 HTTP API
          messageService
            .sendMessage(
              conversationId,
              currentUser.id,
              otherUserId,
              message.content
            )
            .then((sent) => {
              setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                  msg.id === message.id
                    ? { ...msg, ...sent, status: "sent" }
                    : msg
                )
              );
            })
            .catch((err) => {
              console.error("Error retrying message via HTTP API:", err);
              setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                  msg.id === message.id ? { ...msg, status: "failed" } : msg
                )
              );
              Taro.showToast({ title: "重试失败", icon: "none" });
            });
        }
      };

      Taro.eventCenter.on("retryMessage", handleRetryMessage);

      return () => {
        removeMessageCallback();
        disconnectWebSocket();
        Taro.eventCenter.off("retryMessage", handleRetryMessage);
      };
    }
  }, [conversationId, currentUser.id]);

  // 当Socket连接状态改变时，自动加入房间
  useEffect(() => {
    if (socketConnected && conversationId) {
      handleJoinRoom();
    }
  }, [socketConnected, conversationId, handleJoinRoom]);

  const fetchChatMessages = async () => {
    if (!conversationId) return;

    try {
      setLoading(true);
      const fetchedMessages = await messageService.fetchMessages(
        conversationId
      );
      setMessages(fetchedMessages);
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
    }
  };

  const markConversationAsRead = async () => {
    if (!conversationId || !currentUser.id) return;
    try {
      await messageService.markMessagesAsRead(conversationId, currentUser.id);
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  };

  const handleInputChange = (e: any) => {
    setMessageInput(e.detail.value);
    if (isWebSocketConnected() && conversationId) {
      console.log("Emitting typing");
      emitWebSocketEvent("typing", { conversationId });
      debouncedTyping();
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !conversationId || !otherUserId) return;
    const clientTempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: clientTempId,
      clientTempId,
      conversationId,
      senderId: currentUser.id,
      receiverId: otherUserId,
      content: messageInput.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
      status: "pending",
    };
    setMessages((prevMessages) => [...prevMessages, optimisticMessage]);
    setMessageInput("");
    if (isWebSocketConnected()) {
      emitWebSocketEvent("sendMessage", {
        conversationId,
        toUserId: otherUserId,
        content: optimisticMessage.content,
        timestamp: Date.now(),
        clientTempId,
      });
    } else {
      // fallback 到 HTTP API
      try {
        const sent = await messageService.sendMessage(
          conversationId,
          currentUser.id,
          otherUserId,
          optimisticMessage.content
        );
        // 更新消息为 sent
        console.log("HTTP fallback sent:", sent);
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.content === sent.content &&
            msg.senderId === sent.senderId &&
            msg.status === "pending"
              ? { ...msg, ...sent, status: "sent" }
              : msg
          )
        );
      } catch (err) {
        console.error("Error sending message via HTTP API:", err);
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === clientTempId ? { ...msg, status: "failed" } : msg
          )
        );
        Taro.showToast({ title: "发送失败", icon: "none" });
      }
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.keyCode === 13) {
      handleSendMessage();
    }
  };

  const handleRetryConnection = () => {
    handleConnect();
  };

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
        <Button onClick={fetchChatMessages} style={{ marginTop: "20rpx" }}>
          重新加载
        </Button>
      </View>
    );
  }

  return (
    <View
      className="chat-window-page"
      style={{ display: "flex", flexDirection: "column", height: "100vh" }}
    >
      {/* 开发环境下显示切换用户面板 */}
      {process.env.NODE_ENV === "development" && (
        <View
          style={{ margin: "20rpx 0", display: "flex", alignItems: "center" }}
        >
          <Text style={{ marginRight: "10rpx" }}>切换用户：</Text>
          {debugUsers.map((user) => (
            <Button
              key={user.id}
              size="mini"
              style={{
                marginRight: "10rpx",
                backgroundColor:
                  currentUser.id === user.id ? "#007AFF" : "#eee",
                color: currentUser.id === user.id ? "#fff" : "#333",
              }}
              onClick={() => setCurrentUser(user)}
            >
              {user.name}
            </Button>
          ))}
        </View>
      )}
      {/* 头部 */}
      <View
        className="header"
        style={{
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
        />
        <Text style={{ fontSize: "32rpx", fontWeight: "bold" }}>
          {chatTitle}
        </Text>
      </View>

      {/* 连接错误提示 */}
      {connectionError && (
        <View
          style={{
            backgroundColor: "#f8d7da",
            color: "#721c24",
            padding: "20rpx",
            textAlign: "center",
            borderBottom: "1px solid #f5c6cb",
          }}
        >
          <Text style={{ fontSize: "24rpx" }}>{connectionError}</Text>
          <Button
            onClick={handleRetryConnection}
            style={{
              marginTop: "10rpx",
              backgroundColor: "#dc3545",
              color: "white",
              fontSize: "20rpx",
              padding: "5rpx 15rpx",
            }}
          >
            重试连接
          </Button>
        </View>
      )}

      {/* 消息列表 */}
      <ScrollView
        scrollY
        style={{ flex: 1, padding: "20rpx" }}
        ref={scrollViewRef}
        scrollIntoView={scrollToViewId}
        scrollWithAnimation
      >
        {isOtherUserTyping && (
          <View style={{ padding: "10rpx 20rpx", color: "#888" }}>
            <Text style={{ fontSize: "24rpx" }}>对方正在输入...</Text>
          </View>
        )}
        {messages.length > 0 ? (
          messages.map((message) => (
            <View key={message.id} id={`msg-${message.id}`}>
              <MessageBubble
                message={message}
                isMyMessage={message.senderId === currentUser.id}
                otherUserAvatar={otherUserAvatar}
              />
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

      {/* 输入区域 */}
      <View
        className="input-area"
        style={{
          display: "flex",
          padding: "20rpx",
          borderTop: "2rpx solid #eee",
          alignItems: "center",
          backgroundColor: "white",
        }}
      >
        <Input
          type="text"
          className="message-input"
          placeholder="输入消息"
          value={messageInput}
          onInput={handleInputChange}
          onKeyPress={handleKeyPress}
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
