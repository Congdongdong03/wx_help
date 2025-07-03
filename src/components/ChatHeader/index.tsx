import React from "react";
import { View, Text, Image } from "@tarojs/components";
import "./index.scss";

interface ChatHeaderProps {
  chatTitle: string;
  otherUserAvatar: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  chatTitle,
  otherUserAvatar,
}) => {
  return (
    <View className="chat-header">
      <Image
        className="avatar"
        src={otherUserAvatar || "https://via.placeholder.com/40"}
        onError={(e) => console.log("Avatar image error:", e)}
        onLoad={() => console.log("Avatar image loaded successfully")}
      />
      <Text className="title">{chatTitle || "聊天"}</Text>
    </View>
  );
};

export default ChatHeader;
