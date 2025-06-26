import React, { useState, useEffect, useRef } from "react";
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
  const { content } = message;

  return (
    <View
      style={{
        display: "flex",
        justifyContent: isMyMessage ? "flex-end" : "flex-start",
        margin: "10rpx 20rpx",
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
        }}
      >
        <Text>{content}</Text>
      </View>
      {/* For self-sent messages, display your own avatar if needed */}
      {isMyMessage && (
        <Image
          className="avatar"
          src="https://via.placeholder.com/40/007AFF/FFFFFF?text=ME" // Placeholder for current user's avatar
          style={{
            width: "80rpx",
            height: "80rpx",
            borderRadius: "50%",
            backgroundColor: "#ddd",
            marginLeft: "20rpx",
          }}
        />
      )}
    </View>
  );
};

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

  const scrollViewRef = useRef<any>(null);
  const [scrollToViewId, setScrollToViewId] = useState<string>("");

  // Assume current user ID for mock purposes
  const currentUserId = "currentUser";

  useEffect(() => {
    if (conversationId) {
      fetchChatMessages();
      markConversationAsRead();
    } else {
      setError(true);
      setLoading(false);
      Taro.showToast({
        title: "会话ID缺失",
        icon: "none",
      });
    }
  }, [conversationId]);

  useEffect(() => {
    // Scroll to the bottom when messages update
    if (messages.length > 0) {
      const lastMessageId = messages[messages.length - 1].id;
      Taro.nextTick(() => {
        setScrollToViewId(`msg-${lastMessageId}`);
      });
    }
  }, [messages]);

  const fetchChatMessages = async () => {
    if (!conversationId) return;

    setLoading(true);
    setError(false);
    try {
      const data = await messageService.fetchMessages(conversationId);
      // Sort messages by timestamp to ensure chronological order
      const sortedMessages = data.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setMessages(sortedMessages);
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
    if (!conversationId || !currentUserId) return;
    try {
      await messageService.markMessagesAsRead(conversationId, currentUserId);
      // Optionally, refetch conversations list or update unread count in a global state here
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  };

  const handleSendMessage = async () => {
    if (messageInput.trim() && conversationId && otherUserId) {
      try {
        const newMessage = await messageService.sendMessage(
          conversationId,
          currentUserId,
          otherUserId,
          messageInput.trim()
        );
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        setMessageInput("");
        // The useEffect hook above will handle scrolling after new message is added
      } catch (err) {
        console.error("Error sending message:", err);
        Taro.showToast({
          title: "发送失败",
          icon: "none",
        });
      }
    }
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
      <View
        className="header"
        style={{
          textAlign: "center",
          padding: "30rpx",
          borderBottom: "2rpx solid #eee",
          fontWeight: "bold",
        }}
      >
        <Text>{chatTitle}</Text>
      </View>
      <ScrollView
        scrollY
        style={{ flex: 1, padding: "20rpx" }}
        ref={scrollViewRef}
        scrollIntoView={scrollToViewId}
        scrollWithAnimation
      >
        {messages.length > 0 ? (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isMyMessage={message.senderId === currentUserId}
              otherUserAvatar={otherUserAvatar || ""} // Pass other user's avatar
            />
          ))
        ) : (
          <View
            style={{ textAlign: "center", padding: "40rpx", color: "#999" }}
          >
            <Text>暂无消息</Text>
          </View>
        )}
        <View id={`msg-${messages[messages.length - 1]?.id}`} />
      </ScrollView>
      <View
        className="input-area"
        style={{
          display: "flex",
          padding: "20rpx",
          borderTop: "2rpx solid #eee",
          alignItems: "center",
        }}
      >
        <Input
          type="text"
          className="message-input"
          placeholder="输入消息"
          value={messageInput}
          onInput={(e) => setMessageInput(e.detail.value)}
          style={{
            flex: 1,
            border: "2rpx solid #ddd",
            borderRadius: "10rpx",
            padding: "16rpx",
          }}
        />
        <Button
          onClick={handleSendMessage}
          style={{
            marginLeft: "20rpx",
            backgroundColor: "#007AFF",
            color: "white",
            borderRadius: "10rpx",
            padding: "16rpx 30rpx",
          }}
        >
          发送
        </Button>
      </View>
    </View>
  );
};

export default ChatWindowPage;
