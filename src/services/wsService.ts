import Taro from "@tarojs/taro";
import { getSocketServerUrl } from "../config/env";

const WS_SERVER_URL = getSocketServerUrl();
const isWeapp = process.env.TARO_ENV === "weapp";

interface WebSocketMessage {
  type: string;
  data: any;
}

class WebSocketService {
  private ws: any = null;
  private isConnected: boolean = false;
  private messageCallback: ((message: any) => void) | null = null;
  private currentUserId: string = "";

  public setMessageCallback(callback: (message: any) => void) {
    this.messageCallback = callback;
  }

  public removeMessageCallback() {
    this.messageCallback = null;
  }

  public connect(userId: string = "dev_openid_123"): Promise<any> {
    this.currentUserId = userId;

    if (this.ws && this.isConnected) {
      return Promise.resolve(this.ws);
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = Taro.connectSocket({
          url: WS_SERVER_URL,
          protocols: ["websocket"],
          success: () => {
            console.log("WebSocket connection initiated");
          },
          fail: (err) => {
            console.error("WebSocket connection failed:", err);
            reject(err);
          },
        });

        if (isWeapp) {
          Taro.onSocketOpen(() => this._handleOpen(resolve));
          Taro.onSocketMessage((msg: any) => this._handleMessage(msg));
          Taro.onSocketClose(() => this._handleClose());
          Taro.onSocketError((err: any) => this._handleError(err, reject));
        } else {
          this.ws.onopen = () => this._handleOpen(resolve);
          this.ws.onmessage = (msg: any) => this._handleMessage(msg);
          this.ws.onclose = () => this._handleClose();
          this.ws.onerror = (err: any) => this._handleError(err, reject);
        }
      } catch (error) {
        console.error("WebSocket connection error:", error);
        reject(error);
      }
    });
  }

  private _handleOpen(resolve: (value: any) => void) {
    this.isConnected = true;
    console.log("WebSocket connected");

    // Send login/authentication message
    setTimeout(() => {
      const authMessage = JSON.stringify({
        type: "auth",
        userId: this.currentUserId,
      });
      if (isWeapp) {
        Taro.sendSocketMessage({
          data: authMessage,
          success: () => console.log("Auth message sent successfully"),
          fail: (err) => console.error("Auth message send failed:", err),
        });
      } else {
        this.ws.send(authMessage);
      }
    }, 100);
    resolve(this.ws);
  }

  private _handleMessage(msg: any) {
    try {
      const data = JSON.parse(msg.data);

      if (data.type === "auth_success") {
        console.log("Authentication successful");
      } else if (data.type === "error") {
        console.error("Server error:", data.content);
      } else {
        if (this.messageCallback) {
          this.messageCallback(data);
        }
      }
    } catch (e) {
      console.error("Message parsing failed", e);
    }
  }

  private _handleClose() {
    this.isConnected = false;
    console.log("WebSocket disconnected");
  }

  private _handleError(err: any, reject?: (reason?: any) => void) {
    this.isConnected = false;
    console.error("WebSocket error:", err);
    if (reject) {
      reject(err);
    }
  }

  public send(content: string, userId: string) {
    if (this.ws && this.isConnected) {
      try {
        const message = JSON.stringify({
          type: "sendMessage",
          content,
          userId,
          timestamp: Date.now(),
        });

        if (isWeapp) {
          Taro.sendSocketMessage({
            data: message,
            success: () => console.log("Message sent successfully"),
            fail: (err) => console.error("Message send failed:", err),
          });
        } else {
          this.ws.send(message);
        }
      } catch (error) {
        console.error("Send message error:", error);
      }
    }
  }

  public disconnect() {
    if (this.ws) {
      if (isWeapp) {
        Taro.closeSocket();
      } else {
        this.ws.close();
      }
      this.ws = null;
      this.isConnected = false;
    }
    console.log("WebSocket disconnected");
  }

  public isConnectedStatus(): boolean {
    return this.isConnected;
  }

  public emitEvent(eventName: string, data: any) {
    if (!this.ws || !this.isConnected) {
      return;
    }

    try {
      const message = JSON.stringify({
        type: eventName,
        ...data,
        timestamp: Date.now(),
      });

      if (isWeapp) {
        Taro.sendSocketMessage({
          data: message,
          success: () => console.log(`Event sent: ${eventName}`),
          fail: (err) => console.error(`Event send failed: ${eventName}`, err),
        });
      } else {
        this.ws.send(message);
      }
    } catch (error) {
      console.error(`Send event error: ${eventName}`, error);
    }
  }
}

const wsService = new WebSocketService();

// 导出便捷函数
export const connectWebSocket = (userId: string) => wsService.connect(userId);
export const disconnectWebSocket = () => wsService.disconnect();
export const isWebSocketConnected = () => wsService.isConnectedStatus();
export const emitWebSocketEvent = (eventName: string, data: any) =>
  wsService.emitEvent(eventName, data);
export const setMessageCallback = (callback: (message: any) => void) =>
  wsService.setMessageCallback(callback);
export const removeMessageCallback = () => wsService.removeMessageCallback();

export default wsService;
