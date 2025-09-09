import Taro from "@tarojs/taro";
import { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, Button } from "@tarojs/components";
import { Conversation } from "../../types/message";
import { messageService } from "../../services/messageService";
import { useUser } from "../../store/user/hooks";
import "./index.scss";

interface ConversationItemProps {
  conversation: Conversation;
  onClick: (conversation: Conversation) => void;
}

const ConversationItem = ({ conversation, onClick }: ConversationItemProps) => {
  const {
    otherUserAvatar,
    otherUserNickname,
    lastMessagePreview,
    lastMessageTime,
    unreadCount,
  } = conversation;

  const handleClick = () => {
    onClick(conversation);
  };

  return (
    <View className="conversation-item" onClick={handleClick}>
      <Image
        className="avatar"
        src={otherUserAvatar || "https://via.placeholder.com/50"}
      />
      <View className="content">
        <Text className="nickname">{otherUserNickname}</Text>
        <Text className="last-message">{lastMessagePreview}</Text>
      </View>
      <View className="meta">
        <Text className="updated-at">{lastMessageTime}</Text>
        {unreadCount > 0 && <View className="unread-badge">{unreadCount}</View>}
      </View>
    </View>
  );
};

const Message = () => {
  const { currentUser } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (currentUser?.openid) {
      fetchConversations();
    }
  }, [currentUser]);

  const fetchConversations = async () => {
    if (!currentUser?.openid) return;

    setLoading(true);
    setError(false);
    try {
      const data = await messageService.fetchConversations(currentUser.openid);
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
      )}&avatar=${encodeURIComponent(conversation.otherUserAvatar || "")}`,
    });
  };

  if (!currentUser?.openid) {
    return (
      <View className="message-list-page">
        <View className="login-prompt">
          <Text>请先登录以查看会话</Text>
          <Button
            className="login-button"
            onClick={() => Taro.navigateTo({ url: "/pages/my/index" })}
          >
            去登录
          </Button>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="message-list-page">
        <View className="loading-state">
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="message-list-page">
        <View className="error-state">
          <Text>加载失败，请重试。</Text>
          <Button className="retry-button" onClick={fetchConversations}>
            重新加载
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className="message-list-page">
      <View className="header">
        <Text>我的消息</Text>
      </View>
      <ScrollView scrollY className="conversations-list">
        {conversations.length > 0 ? (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              onClick={handleConversationClick}
            />
          ))
        ) : (
          <View className="empty-state">
            <Text>暂无会话</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Message;
