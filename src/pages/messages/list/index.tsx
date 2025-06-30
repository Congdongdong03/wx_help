import React, { useState, useEffect } from "react";
import Taro from "@tarojs/taro";
import { View, Text, ScrollView, Image } from "@tarojs/components";
import { Conversation } from "../../../types/message";
import { messageService } from "../../../services/messageService";

interface ConversationItemProps {
  conversation: Conversation;
  onClick: (conversation: Conversation) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  onClick,
}) => {
  const {
    otherUserAvatar,
    nickname,
    lastMessagePreview,
    lastMessageTime,
    unreadCount,
  } = conversation;

  const handleClick = () => {
    onClick(conversation);
  };

  return (
    <View
      className="conversation-item"
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px",
        borderBottom: "1px solid #eee",
      }}
      onClick={handleClick}
    >
      <Image
        className="avatar"
        src={otherUserAvatar || "https://via.placeholder.com/50"}
        style={{
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          backgroundColor: "#ddd",
          marginRight: "10px",
        }}
      />
      <View className="content" style={{ flex: 1 }}>
        <Text className="nickname" style={{ fontWeight: "bold" }}>
          {nickname}
        </Text>
        <Text
          className="last-message"
          style={{ color: "#666", fontSize: "12px" }}
        >
          {lastMessagePreview}
        </Text>
      </View>
      <View
        className="meta"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        <Text
          className="updated-at"
          style={{ fontSize: "10px", color: "#999" }}
        >
          {lastMessageTime}
        </Text>
        {unreadCount > 0 && (
          <View
            className="unread-badge"
            style={{
              backgroundColor: "red",
              color: "white",
              borderRadius: "50%",
              width: "18px",
              height: "18px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "10px",
              marginTop: "5px",
            }}
          >
            {unreadCount}
          </View>
        )}
      </View>
    </View>
  );
};

const MessageListPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await messageService.fetchConversations();
      setConversations(data);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError(true);
      Taro.showToast({
        title: "加载会话失败",
        icon: "none",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (conversation: Conversation) => {
    Taro.navigateTo({
      url: `/pages/messages/chat/index?conversationId=${
        conversation.id
      }&otherUserId=${conversation.otherUserId}&nickname=${encodeURIComponent(
        conversation.otherUserNickname
      )}&avatar=${encodeURIComponent(conversation.otherUserAvatar)}`,
    });
  };

  if (loading) {
    return (
      <View
        className="message-list-page"
        style={{ textAlign: "center", padding: "20px" }}
      >
        <Text>加载中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        className="message-list-page"
        style={{ textAlign: "center", padding: "20px", color: "red" }}
      >
        <Text>加载失败，请重试。</Text>
        <Button onClick={fetchConversations} style={{ marginTop: "10px" }}>
          重新加载
        </Button>
      </View>
    );
  }

  return (
    <View className="message-list-page">
      <View
        className="header"
        style={{
          textAlign: "center",
          padding: "15px",
          borderBottom: "1px solid #eee",
          fontWeight: "bold",
        }}
      >
        <Text>我的消息</Text>
      </View>
      <ScrollView scrollY style={{ height: "calc(100vh - 50px)" }}>
        {conversations.length > 0 ? (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              onClick={handleConversationClick}
            />
          ))
        ) : (
          <View style={{ textAlign: "center", padding: "20px", color: "#999" }}>
            <Text>暂无会话</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default MessageListPage;
