import { WebSocket } from "ws";
import { WebSocketService } from "../services/websocketService";

// 扩展 WebSocket 类型，支持 userId
interface ExtWebSocket extends WebSocket {
  userId?: string;
}

export class WebSocketController {
  /**
   * 处理用户认证
   */
  static async handleAuth(ws: ExtWebSocket, data: any) {
    console.log("🔐 用户认证:", data.userId);
    ws.userId = data.userId;
    WebSocketService.addUser(data.userId, ws);

    // 发送认证成功响应
    ws.send(
      JSON.stringify({
        type: "auth_success",
        userId: data.userId,
        timestamp: Date.now(),
      })
    );

    // 推送未读消息
    await this.pushUnreadMessages(ws, data.userId);
  }

  /**
   * 推送未读消息
   */
  private static async pushUnreadMessages(ws: ExtWebSocket, userId: string) {
    try {
      const unreadMessages = await WebSocketService.getUnreadMessages(userId);

      for (const msg of unreadMessages) {
        ws.send(
          JSON.stringify({
            type: "chat",
            content: msg.content,
            senderId: msg.senderId,
            toUserId: msg.receiverId,
            conversationId: msg.conversationId,
            messageType: msg.type || "text",
            timestamp: msg.createdAt,
            messageId: msg.id,
            offline: true, // 标记为离线消息
          })
        );
      }

      // 推送后批量标记为已读
      if (unreadMessages.length > 0) {
        await WebSocketService.markMessagesAsRead(
          unreadMessages.map((m: any) => m.id)
        );
      }
    } catch (err) {
      console.error("推送未读消息失败:", err);
    }
  }

  /**
   * 处理发送消息（统一处理 text、image、sendMessage）
   */
  static async handleSendMessage(ws: ExtWebSocket, data: any) {
    console.log("📤 处理发送消息:", data);

    const {
      conversationId,
      toUserId,
      content,
      messageType = "text", // 默认类型
      clientTempId,
    } = data;

    if (!conversationId || !toUserId || !content) {
      console.error("❌ 消息格式不完整，缺少必要字段");
      return;
    }

    try {
      await WebSocketService.sendMessage(
        conversationId,
        ws.userId!,
        toUserId,
        content,
        messageType,
        clientTempId
      );
    } catch (error) {
      console.error("❌ 发送消息失败:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          content: "消息发送失败",
          timestamp: Date.now(),
        })
      );
    }
  }

  /**
   * 处理输入状态
   */
  static handleTyping(ws: ExtWebSocket, data: any) {
    console.log("⌨️ 用户正在输入:", data.conversationId);
    try {
      const toUserId = data.toUserId;
      if (!toUserId) return;
      WebSocketService.sendToUser(toUserId, {
        type: "typing",
        conversationId: data.conversationId,
        fromUserId: ws.userId,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.error("typing 推送失败", e);
    }
  }

  /**
   * 处理停止输入状态
   */
  static handleStopTyping(ws: ExtWebSocket, data: any) {
    console.log("⌨️ 用户停止输入:", data.conversationId);
    try {
      const toUserId = data.toUserId;
      if (!toUserId) return;
      WebSocketService.sendToUser(toUserId, {
        type: "stopTyping",
        conversationId: data.conversationId,
        fromUserId: ws.userId,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.error("stopTyping 推送失败", e);
    }
  }

  /**
   * 处理加入房间
   */
  static handleJoinRoom(ws: ExtWebSocket, data: any) {
    console.log("🚪 加入房间:", data.conversationId);
    ws.send(
      JSON.stringify({
        type: "room_joined",
        conversationId: data.conversationId,
        timestamp: Date.now(),
      })
    );
  }

  /**
   * 处理离开房间
   */
  static handleLeaveRoom(ws: ExtWebSocket, data: any) {
    console.log("🚪 离开房间:", data.conversationId);
    ws.send(
      JSON.stringify({
        type: "room_left",
        conversationId: data.conversationId,
        timestamp: Date.now(),
      })
    );
  }

  /**
   * 处理在线状态请求
   */
  static handleRequestOnlineStatus(ws: ExtWebSocket, data: any) {
    console.log("📊 请求在线状态:", data.conversationId);
    const onlineCount = WebSocketService.getOnlineCount();
    ws.send(
      JSON.stringify({
        type: "onlineStatus",
        conversationId: data.conversationId,
        onlineCount: onlineCount,
        timestamp: Date.now(),
      })
    );
  }

  /**
   * 处理未知消息类型
   */
  static handleUnknownMessage(ws: ExtWebSocket, data: any) {
    console.log("❓ 未知消息类型:", data.type);
    ws.send(
      JSON.stringify({
        type: "error",
        content: "未知的消息类型",
        timestamp: Date.now(),
      })
    );
  }

  /**
   * 处理连接断开
   */
  static handleDisconnect(ws: ExtWebSocket) {
    console.log("🔌 WebSocket 客户端断开连接");
    if (ws.userId) {
      WebSocketService.removeUser(ws.userId);
    }
  }

  /**
   * 处理连接错误
   */
  static handleError(ws: ExtWebSocket, error: any) {
    console.error("❌ WebSocket 错误:", error);
    if (ws.userId) {
      WebSocketService.removeUser(ws.userId);
    }
  }

  /**
   * 获取在线用户数量
   */
  static getOnlineCount() {
    return WebSocketService.getOnlineCount();
  }
}
