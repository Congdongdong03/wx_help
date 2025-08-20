import { WebSocket } from "ws";

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
      this.removeUser(userId);
    }

    userMap.set(userId, ws);
    console.log(`👤 用户 ${userId} 已连接`);
  }

  /**
   * 移除用户连接
   */
  static removeUser(userId: string) {
    const wasRemoved = userMap.delete(userId);
    if (wasRemoved) {
      console.log(`👤 用户 ${userId} 已离线`);
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
      this.removeUser(userId);
      return false;
    }

    return true;
  }

  /**
   * 向指定用户发送消息
   */
  static sendToUser(userId: string, message: any): boolean {
    const ws = userMap.get(userId);
    if (!ws || ws.readyState !== 1) {
      return false;
    }

    try {
      ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`发送消息给用户 ${userId} 失败:`, error);
      this.removeUser(userId);
      return false;
    }
  }

  /**
   * 广播消息给所有在线用户
   */
  static broadcast(message: any, excludeUserId?: string): number {
    let successCount = 0;
    const offlineUsers: string[] = [];

    for (const [userId, ws] of userMap.entries()) {
      if (excludeUserId && userId === excludeUserId) {
        continue;
      }

      if (this.sendToUser(userId, message)) {
        successCount++;
      } else {
        offlineUsers.push(userId);
      }
    }

    // 清理离线用户
    offlineUsers.forEach((userId) => this.removeUser(userId));

    return successCount;
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
   * 获取连接诊断信息
   */
  static getConnectionDiagnostics() {
    const onlineUsers = this.getOnlineUsers();
    const offlineUsers: string[] = [];

    // 检查每个用户的连接状态
    for (const userId of onlineUsers) {
      if (!this.isUserOnline(userId)) {
        offlineUsers.push(userId);
      }
    }

    return {
      totalConnections: userMap.size,
      onlineUsers: onlineUsers.length,
      offlineUsers: offlineUsers.length,
      userMapSize: userMap.size,
      timestamp: Date.now(),
    };
  }

  /**
   * 清理断开的用户连接
   */
  static cleanupDisconnectedUsers(): number {
    const beforeCount = userMap.size;
    const offlineUsers: string[] = [];

    // 检查所有用户的连接状态
    for (const [userId, ws] of userMap.entries()) {
      if (ws.readyState !== 1) {
        offlineUsers.push(userId);
      }
    }

    // 移除断开的用户
    offlineUsers.forEach((userId) => this.removeUser(userId));

    const afterCount = userMap.size;
    const cleanedCount = beforeCount - afterCount;

    if (cleanedCount > 0) {
      console.log(`🧹 清理了 ${cleanedCount} 个断开的连接`);
    }

    return cleanedCount;
  }

  /**
   * 获取未读消息
   */
  static async getUnreadMessages(userId: string): Promise<any[]> {
    try {
      // 这里应该从数据库获取未读消息
      // 暂时返回空数组
      return [];
    } catch (error) {
      console.error("获取未读消息失败:", error);
      return [];
    }
  }

  /**
   * 标记消息为已读
   */
  static async markMessagesAsRead(messageIds: number[]): Promise<void> {
    try {
      // 这里应该更新数据库中的消息状态
      console.log("标记消息为已读:", messageIds);
    } catch (error) {
      console.error("标记消息为已读失败:", error);
    }
  }

  /**
   * 发送消息
   */
  static async sendMessage(
    conversationId: string,
    senderId: string,
    receiverId: string,
    content: string,
    messageType: string = "text",
    clientTempId?: string
  ): Promise<void> {
    try {
      // 这里应该保存消息到数据库
      console.log("发送消息:", {
        conversationId,
        senderId,
        receiverId,
        content,
        messageType,
        clientTempId,
      });

      // 如果接收者在线，直接发送
      if (this.isUserOnline(receiverId)) {
        this.sendToUser(receiverId, {
          type: "chat",
          content,
          senderId,
          toUserId: receiverId,
          conversationId,
          messageType,
          timestamp: Date.now(),
          messageId: Date.now(), // 临时ID
          clientTempId,
        });
      }
    } catch (error) {
      console.error("发送消息失败:", error);
      throw error;
    }
  }
}
