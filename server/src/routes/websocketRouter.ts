import { WebSocket } from "ws";
import { WebSocketController } from "../controllers/websocketController";

// 扩展 WebSocket 类型，支持 userId
interface ExtWebSocket extends WebSocket {
  userId?: string;
}

export class WebSocketRouter {
  /**
   * 路由消息到相应的处理器
   */
  static async routeMessage(ws: ExtWebSocket, message: string) {
    try {
      const data = JSON.parse(message);
      console.log("📨 收到 WebSocket 消息:", data);

      // 根据消息类型路由到相应的处理器
      switch (data.type) {
        case "auth":
          await WebSocketController.handleAuth(ws, data);
          break;

        case "sendMessage":
        case "text":
        case "image":
          // 统一处理所有发送消息的类型
          await WebSocketController.handleSendMessage(ws, {
            ...data,
            messageType:
              data.type === "sendMessage"
                ? data.messageType || "text"
                : data.type,
          });
          break;

        case "typing":
          WebSocketController.handleTyping(ws, data);
          break;

        case "stopTyping":
          WebSocketController.handleStopTyping(ws, data);
          break;

        case "joinRoom":
          WebSocketController.handleJoinRoom(ws, data);
          break;

        case "leaveRoom":
          WebSocketController.handleLeaveRoom(ws, data);
          break;

        case "requestOnlineStatus":
          WebSocketController.handleRequestOnlineStatus(ws, data);
          break;

        default:
          WebSocketController.handleUnknownMessage(ws, data);
      }
    } catch (error) {
      console.error("❌ WebSocket 消息解析失败:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          content: "消息格式错误",
          timestamp: Date.now(),
        })
      );
    }
  }

  /**
   * 处理连接建立
   */
  static handleConnection(ws: ExtWebSocket) {
    console.log("🔌 新 WebSocket 客户端连接");

    // 为每个连接添加 userId 属性
    ws.userId = undefined;

    // 发送欢迎消息
    ws.send(
      JSON.stringify({
        type: "system",
        content: "欢迎连接 WebSocket 服务器！",
        timestamp: Date.now(),
      })
    );
  }

  /**
   * 处理连接断开
   */
  static handleDisconnect(ws: ExtWebSocket) {
    WebSocketController.handleDisconnect(ws);
  }

  /**
   * 处理连接错误
   */
  static handleError(ws: ExtWebSocket, error: any) {
    WebSocketController.handleError(ws, error);
  }
}
