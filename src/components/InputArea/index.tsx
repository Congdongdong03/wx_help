import React from "react";
import { View, Input, Button, Text } from "@tarojs/components";
import "./index.scss";

interface InputAreaProps {
  messageInput: string;
  handleInputChange: (e: any) => void;
  handleSendMessage: () => Promise<void>;
  handleChooseImage: () => void;
  isSendButtonDisabled: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({
  messageInput,
  handleInputChange,
  handleSendMessage,
  handleChooseImage,
  isSendButtonDisabled,
}) => {
  return (
    <View className="input-area">
      {/* 图片选择按钮 */}
      <Button onClick={handleChooseImage} className="image-button">
        <Text className="icon">📷</Text>
      </Button>

      <Input
        type="text"
        className="message-input"
        placeholder="输入消息"
        value={messageInput}
        onInput={handleInputChange}
      />
      <Button
        onClick={handleSendMessage}
        disabled={isSendButtonDisabled}
        className={`send-button ${isSendButtonDisabled ? "disabled" : ""}`}
      >
        发送
      </Button>
    </View>
  );
};

export default InputArea;
