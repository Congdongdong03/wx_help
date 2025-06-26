import React, { useState, useEffect } from "react";
import Taro from "@tarojs/taro";
import { View, Text, ScrollView, Image, Button } from "@tarojs/components";
import { Conversation } from "../../types/message";
import { messageService } from "../../services/messageService";

import "./index.scss";

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
        padding: "20rpx",
        borderBottom: "2rpx solid #eee",
      }}
      onClick={handleClick}
    >
      <Image
        className="avatar"
        src={otherUserAvatar || "https://via.placeholder.com/50"}
        style={{
          width: "100rpx",
          height: "100rpx",
          borderRadius: "50%",
          backgroundColor: "#ddd",
          marginRight: "20rpx",
        }}
      />
      <View className="content" style={{ flex: 1 }}>
        <Text className="nickname" style={{ fontWeight: "bold" }}>
          {nickname}
        </Text>
        <Text
          className="last-message"
          style={{ color: "#666", fontSize: "24rpx" }}
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
          style={{ fontSize: "20rpx", color: "#999" }}
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
              width: "36rpx",
              height: "36rpx",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "20rpx",
              marginTop: "10rpx",
            }}
          >
            {unreadCount}
          </View>
        )}
      </View>
    </View>
  );
};

const Message: React.FC = () => {
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
        conversation.nickname
      )}`,
    });
  };

  if (loading) {
    return (
      <View
        className="message-list-page"
        style={{ textAlign: "center", padding: "40rpx" }}
      >
        <Text>加载中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        className="message-list-page"
        style={{ textAlign: "center", padding: "40rpx", color: "red" }}
      >
        <Text>加载失败，请重试。</Text>
        <Button onClick={fetchConversations} style={{ marginTop: "20rpx" }}>
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
          padding: "30rpx",
          borderBottom: "2rpx solid #eee",
          fontWeight: "bold",
        }}
      >
        <Text>我的消息</Text>
      </View>
      <ScrollView scrollY style={{ height: "calc(100vh - 100rpx)" }}>
        {conversations.length > 0 ? (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              onClick={handleConversationClick}
            />
          ))
        ) : (
          <View
            style={{ textAlign: "center", padding: "40rpx", color: "#999" }}
          >
            <Text>暂无会话</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Message;
