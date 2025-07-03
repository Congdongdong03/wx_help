import { WebSocket } from "ws";
import { messageService } from "./messageService";
import { prisma } from "../lib/prisma";

// 扩展 WebSocket 类型，支持 userId
interface ExtWebSocket extends WebSocket {
  userId?: string;
}

// 用户映射：userId => ws
const userMap = new Map<string, ExtWebSocket>();

export class WebSocketService {
  /**
   * 添加用户连接
   */
  static addUser(userId: string, ws: ExtWebSocket) {
    // 如果用户已存在，先移除旧连接
    if (userMap.has(userId)) {
      console.log(`⚠️ 用户 ${userId} 已有连接，移除旧连接`);
      this.removeUser(userId);
    }

    userMap.set(userId, ws);
    console.log(`👤 用户 ${userId} 已连接`);
    console.log("📊 当前在线用户:", Array.from(userMap.keys()));
  }

  /**
   * 移除用户连接
   */
  static removeUser(userId: string) {
    const wasRemoved = userMap.delete(userId);
    if (wasRemoved) {
      console.log(`👤 用户 ${userId} 已离线`);
      console.log("📊 当前在线用户:", Array.from(userMap.keys()));
    } else {
      console.log(`⚠️ 尝试移除不存在的用户: ${userId}`);
    }
  }

  /**
   * 获取用户连接
   */
  static getUserConnection(userId: string): ExtWebSocket | undefined {
    return userMap.get(userId);
  }

  /**
   * 检查用户是否在线
   */
  static isUserOnline(userId: string): boolean {
    const ws = userMap.get(userId);
    if (!ws) {
      return false;
    }

    // 检查连接状态
    const isConnected = ws.readyState === 1;
    if (!isConnected) {
      // 如果连接状态不是 OPEN，自动清理
      console.log(
        `🔍 检测到用户 ${userId} 连接状态异常 (readyState: ${ws.readyState})，自动清理`
      );
      this.removeUser(userId);
      return false;
    }

    return true;
  }

  /**
   * 获取在线用户数量
   */
  static getOnlineCount(): number {
    return userMap.size;
  }

  /**
   * 获取所有在线用户ID
   */
  static getOnlineUsers(): string[] {
    return Array.from(userMap.keys());
  }

  /**
   * 向指定用户发送消息
   */
  static sendToUser(userId: string, message: any): boolean {
    const ws = userMap.get(userId);
    if (!ws) {
      return false;
    }

    // 检查连接状态
    if (ws.readyState === 1) {
      try {
        ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error(`❌ 向用户 ${userId} 发送消息失败:`, error);
        // 发送失败时清理连接
        this.removeUser(userId);
        return false;
      }
    } else {
      // 连接状态异常，清理并返回失败
      console.log(
        `🔍 用户 ${userId} 连接状态异常 (readyState: ${ws.readyState})，清理连接`
      );
      this.removeUser(userId);
      return false;
    }
  }

  /**
   * 向多个用户广播消息
   */
  static broadcastToUsers(userIds: string[], message: any): string[] {
    const sentTo: string[] = [];
    const failedTo: string[] = [];

    userIds.forEach((userId) => {
      if (this.sendToUser(userId, message)) {
        sentTo.push(userId);
      } else {
        failedTo.push(userId);
      }
    });

    if (sentTo.length > 0) {
      console.log(`✅ 消息已发送给用户: ${sentTo.join(", ")}`);
    }
    if (failedTo.length > 0) {
      console.log(`💾 以下用户不在线，消息已存数据库: ${failedTo.join(", ")}`);
    }

    return sentTo;
  }

  /**
   * 获取用户的未读消息
   */
  static async getUnreadMessages(userId: string) {
    try {
      return await prisma.message.findMany({
        where: {
          receiverId: userId,
          isRead: false,
        },
        orderBy: { createdAt: "asc" },
      });
    } catch (error) {
      console.error("获取未读消息失败:", error);
      return [];
    }
  }

  /**
   * 标记消息为已读
   */
  static async markMessagesAsRead(messageIds: string[]) {
    try {
      await prisma.message.updateMany({
        where: {
          id: { in: messageIds },
        },
        data: { isRead: true },
      });
    } catch (error) {
      console.error("标记消息为已读失败:", error);
    }
  }

  /**
   * 发送消息并处理在线状态
   */
  static async sendMessage(
    conversationId: string,
    senderId: string,
    receiverId: string,
    content: string,
    messageType: "text" | "image" = "text",
    clientTempId?: string
  ) {
    try {
      // 1. 保存消息到数据库
      const savedMsg = await messageService.sendMessage(
        conversationId,
        senderId,
        receiverId,
        content,
        messageType
      );

      const message = {
        type: "chat",
        content: content,
        senderId: senderId,
        toUserId: receiverId,
        conversationId: conversationId,
        messageType: messageType,
        timestamp: savedMsg.createdAt,
        messageId: savedMsg.id,
        clientTempId: clientTempId || null,
      };

      // 2. 发送给接收者
      const sentToReceiver = this.sendToUser(receiverId, message);
      if (sentToReceiver) {
        console.log(`✅ 消息已发送给用户: ${receiverId}`);
      } else {
        console.log(`💾 目标用户 ${receiverId} 不在线，消息已存数据库`);
      }

      // 3. 发送给发送者（回显）
      this.sendToUser(senderId, message);

      return savedMsg;
    } catch (error) {
      console.error("❌ 发送消息失败:", error);
      throw error;
    }
  }

  /**
   * 获取连接状态诊断信息
   */
  static getConnectionDiagnostics() {
    const diagnostics = {
      totalConnections: userMap.size,
      healthyConnections: 0,
      unhealthyConnections: 0,
      connectionStates: {} as Record<string, number>,
      users: [] as string[],
    };

    userMap.forEach((ws, userId) => {
      const readyState = ws.readyState;
      diagnostics.connectionStates[userId] = readyState;
      diagnostics.users.push(userId);

      if (readyState === 1) {
        diagnostics.healthyConnections++;
      } else {
        diagnostics.unhealthyConnections++;
      }
    });

    return diagnostics;
  }

  /**
   * 清理断开的连接（保留作为诊断工具）
   */
  static cleanupDisconnectedUsers() {
    const disconnectedUsers: string[] = [];

    userMap.forEach((ws, userId) => {
      if (ws.readyState !== 1) {
        disconnectedUsers.push(userId);
      }
    });

    disconnectedUsers.forEach((userId) => {
      this.removeUser(userId);
    });

    if (disconnectedUsers.length > 0) {
      console.log(`🧹 清理了 ${disconnectedUsers.length} 个断开的连接`);
    }
  }
}
