import React, { useEffect } from "react";
import Taro, { useRouter } from "@tarojs/taro";
import { View, Text, Button } from "@tarojs/components";
import { useUser } from "../../../store/user/hooks";
import ChatHeader from "../../../components/ChatHeader";
import MessageList from "../../../components/MessageList";
import InputArea from "../../../components/InputArea";
import { useWebSocket } from "../../../hooks/useWebSocket";
import { useChat } from "../../../hooks/useChat";
import UserSwitcher from "../../../components/UserSwitcher";
import "./index.scss"; // Import the SCSS file

const ChatWindowPage: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useUser();

  const {
    postId,
    conversationId: paramConversationId,
    otherUserId,
    nickname: otherUserNickname,
    avatar: otherUserAvatarParam,
  } = router.params;

  // WebSocket hook
  const {
    socketConnected,
    isConnecting,
    connectionError,
    connect: connectWebSocketService,
    disconnect: disconnectWebSocketService,
    isConnected: isWebSocketConnectedService,
    emit: emitWebSocketEventService,
    setMsgCallback: setWebSocketMessageCallback,
    removeMsgCallback: removeWebSocketMessageCallback,
  } = useWebSocket({ openid: currentUser?.openid });

  // Chat logic hook
  const {
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
  } = useChat({
    postId,
    paramConversationId,
    otherUserId,
    otherUserNickname,
    otherUserAvatarParam,
    isWebSocketConnected: isWebSocketConnectedService,
    emitWebSocketEvent: emitWebSocketEventService,
    setMessageCallback: setWebSocketMessageCallback,
    removeMessageCallback: removeWebSocketMessageCallback,
  });

  // Debug logs (can be removed later)
  console.log("Chat page params:", router.params);
  console.log("Current user info:", {
    currentUser,
    currentUserId: currentUser?.id,
    currentUserOpenid: currentUser?.openid,
    hasOpenid: !!currentUser?.openid,
  });
  console.log("Chat page final values (from useChat):", {
    chatTitle,
    otherUserAvatar,
    decodedNickname: otherUserNickname
      ? decodeURIComponent(otherUserNickname)
      : null,
    socketConnected,
    isConnecting,
    connectionError,
  });

  // Conditional rendering based on user and conversation status
  if (!currentUser || !currentUser.openid || !otherUserId) {
    return (
      <View className="chat-window-page center-content">
        <Text>{!currentUser?.openid ? "请先登录" : "加载中..."}</Text>
        {!currentUser?.openid && (
          <Button
            onClick={() => Taro.navigateTo({ url: "/pages/my/index" })}
            className="login-button"
          >
            去登录
          </Button>
        )}
      </View>
    );
  }

  if (!currentConversationId && !postId) {
    return (
      <View className="chat-window-page center-content">
        <Text>缺少必要参数</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="chat-window-page center-content">
        <Text>加载中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="chat-window-page center-content error-message">
        <Text>加载失败，请重试。</Text>
        <Button
          onClick={() => loadMoreMessages()} // Re-use loadMoreMessages as a general fetch for retry
          className="reload-button"
        >
          重新加载
        </Button>
      </View>
    );
  }

  return (
    <View className="chat-window-page">
      <ChatHeader chatTitle={chatTitle} otherUserAvatar={otherUserAvatar} />

      {process.env.NODE_ENV === "development" && (
        <UserSwitcher isVisible={false} onClose={() => {}} />
      )}

      <MessageList
        messages={messages}
        currentUserOpenid={currentUser.openid}
        otherUserAvatar={otherUserAvatar}
        currentUserAvatar={currentUserAvatar}
        loadingMore={loadingMore}
        pagination={pagination}
        isOtherUserTyping={isOtherUserTyping}
        loadMoreMessages={loadMoreMessages}
        scrollToViewId={scrollToViewId}
      />

      <InputArea
        messageInput={messageInput}
        handleInputChange={handleInputChange}
        handleSendMessage={handleSendMessage}
        handleChooseImage={handleChooseImage}
        isSendButtonDisabled={!messageInput.trim()}
      />
    </View>
  );
};

export default ChatWindowPage;
