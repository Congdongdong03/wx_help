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
}
