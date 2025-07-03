import React, { useRef, useEffect } from "react";
import Taro from "@tarojs/taro";
import { View, Text, ScrollView, Image, Button } from "@tarojs/components";
import { Message, PaginationInfo } from "../../types/message";
import "./index.scss";

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
      className={`message-bubble-container ${
        isMyMessage ? "my-message" : "other-message"
      }`}
    >
      {!isMyMessage && (
        <Image
          className="avatar other-avatar"
          src={otherUserAvatar || "https://via.placeholder.com/40"}
        />
      )}
      <View
        className={`message-content-wrapper ${
          isMyMessage ? "my-message-bubble" : "other-message-bubble"
        }`}
      >
        {type === "text" ? (
          <Text className="text-content">{decodeURIComponent(content)}</Text>
        ) : type === "image" ? (
          <Image
            src={content}
            mode="widthFix"
            className="image-content"
            onClick={handleImageClick}
          />
        ) : null}
        {/* 消息状态指示器 */}
        {isMyMessage && (
          <View className="message-status my-message-status">
            {status === "pending" && (
              <Text className="status-text">发送中...</Text>
            )}
            {status === "sent" && <Text className="sent-indicator">✓</Text>}
            {status === "failed" && (
              <View className="failed-status-container">
                <Text className="failed-indicator">✗</Text>
                <Button
                  size="mini"
                  className="retry-button"
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
            className={`timestamp ${
              isMyMessage ? "my-timestamp" : "other-timestamp"
            }`}
          >
            {new Date(message.timestamp).toLocaleString()}
          </Text>
        )}
      </View>
      {isMyMessage && (
        <Image className="avatar my-avatar" src={currentUserAvatar} />
      )}
    </View>
  );
};

interface MessageListProps {
  messages: Message[];
  currentUserOpenid: string;
  otherUserAvatar: string;
  currentUserAvatar: string;
  loadingMore: boolean;
  pagination: PaginationInfo | null;
  isOtherUserTyping: boolean;
  loadMoreMessages: () => void;
  scrollToViewId: string;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserOpenid,
  otherUserAvatar,
  currentUserAvatar,
  loadingMore,
  pagination,
  isOtherUserTyping,
  loadMoreMessages,
  scrollToViewId,
}) => {
  const scrollViewRef = useRef<any>(null);

  return (
    <ScrollView
      scrollY
      className="message-list"
      ref={scrollViewRef}
      scrollIntoView={scrollToViewId}
      scrollWithAnimation
      onScrollToUpper={loadMoreMessages}
      upperThreshold={50}
      enableFlex
    >
      {/* 加载更多提示 */}
      {loadingMore && (
        <View className="loading-more">
          <Text>加载更多消息...</Text>
        </View>
      )}

      {/* 没有更多消息提示 */}
      {!loadingMore &&
        pagination &&
        !pagination.hasMore &&
        messages.length > 0 && (
          <View className="no-more-messages">
            <Text>没有更多消息了</Text>
          </View>
        )}

      {isOtherUserTyping && (
        <View className="other-user-typing">
          <Text>对方正在输入...</Text>
        </View>
      )}

      {messages.length > 0 ? (
        messages.map((message, idx, arr) => (
          <View key={message.id} id={`msg-${message.id}`}>
            <MessageBubble
              message={message}
              isMyMessage={message.senderId === currentUserOpenid}
              otherUserAvatar={otherUserAvatar}
              currentUserAvatar={currentUserAvatar}
            />
            {/* 滚动锚点：只在最后一条消息后渲染 */}
            {idx === arr.length - 1 && <View id="chat-bottom-anchor" />}
          </View>
        ))
      ) : (
        <View className="no-messages">
          <Text className="main-text">暂无消息</Text>
          <Text className="sub-text">开始聊天吧！</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default MessageList;
