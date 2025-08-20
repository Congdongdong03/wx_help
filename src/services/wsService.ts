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
  private connectionPromise: Promise<any> | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private messageCallback: ((message: any) => void) | null = null;
  private incomingMessageQueue: any[] = [];
  private currentUserId: string = "";

  private _boundHandleOpen: ((value: any) => void) | null = null;
  private _boundHandleMessage: ((msg: any) => void) | null = null;
  private _boundHandleClose: (() => void) | null = null;
  private _boundHandleError: ((err: any) => void) | null = null;

  public setMessageCallback(callback: (message: any) => void) {
    this.messageCallback = callback;
    // Process all cached incoming messages immediately after setting the callback
    while (this.incomingMessageQueue.length > 0) {
      const queuedMessage = this.incomingMessageQueue.shift();
      if (queuedMessage && this.messageCallback) {
        this.messageCallback(queuedMessage);
      }
    }
  }

  public removeMessageCallback() {
    this.messageCallback = null;
  }

  public connect(userId: string = "dev_openid_123"): Promise<any> {
    this.currentUserId = userId;

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.ws && this.isConnected) {
      return Promise.resolve(this.ws);
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.ws = Taro.connectSocket({
          url: WS_SERVER_URL,
          protocols: ["websocket"],
          success: () => {
            console.log("WebSocket connection initiated");
          },
          fail: (err) => {
            console.error("WebSocket connection failed:", err);
            this.connectionPromise = null;
            reject(err);
          },
        });

        // Set connection timeout
        this.connectionTimeout = setTimeout(() => {
          console.error("WebSocket connection timeout");
          this.connectionPromise = null;
          reject(new Error("连接超时"));
        }, 10000);

        if (isWeapp) {
          this._boundHandleOpen = this._handleOpen.bind(this, resolve);
          this._boundHandleMessage = this._handleMessage.bind(this);
          this._boundHandleClose = this._handleClose.bind(this);
          this._boundHandleError = this._handleTaroSocketError.bind(this);

          Taro.onSocketOpen(this._boundHandleOpen);
          Taro.onSocketMessage(this._boundHandleMessage);
          Taro.onSocketClose(this._boundHandleClose);
          Taro.onSocketError(this._boundHandleError);
        } else {
          this.ws.onopen = () => this._handleOpen(resolve);
          this.ws.onmessage = (msg: any) => this._handleMessage(msg);
          this.ws.onclose = () => this._handleClose();
          this.ws.onerror = (err: any) => this._handleError(err, reject);
        }
      } catch (error) {
        console.error("WebSocket connection error:", error);
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private _handleOpen(resolve: (value: any) => void) {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    this.isConnected = true;
    console.log("WebSocket connected");

    // Send queued messages
    while (this.messageQueue.length > 0) {
      const queuedMessage = this.messageQueue.shift();
      if (queuedMessage) {
        if (queuedMessage.type === "sendMessage") {
          this.send(queuedMessage.data.content, queuedMessage.data.userId);
        } else {
          this.emitEvent(queuedMessage.type, queuedMessage.data);
        }
      }
    }

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
        } else {
          this.incomingMessageQueue.push(data);
        }
      }
    } catch (e) {
      console.error("Message parsing failed", e);
    }
  }

  private _handleClose() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    this.isConnected = false;
    this.connectionPromise = null;
    console.log("WebSocket disconnected");
  }

  private _handleError(err: any, reject?: (reason?: any) => void) {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    this.isConnected = false;
    this.connectionPromise = null;
    console.error("WebSocket error:", err);
    if (reject) {
      reject(err);
    }
  }

  private _handleTaroSocketError = (err: any) => {
    this._handleError(err);
  };

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
    } else {
      this.messageQueue.push({
        type: "sendMessage",
        data: { content, userId },
      });
    }
  }

  public disconnect() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (isWeapp) {
      Taro.offSocketOpen(this._boundHandleOpen);
      Taro.offSocketMessage(this._boundHandleMessage);
      Taro.offSocketClose(this._boundHandleClose);
      Taro.offSocketError(this._boundHandleError);

      this._boundHandleOpen = null;
      this._boundHandleMessage = null;
      this._boundHandleClose = null;
      this._boundHandleError = null;
    }

    if (this.ws) {
      if (isWeapp) {
        Taro.closeSocket();
      } else {
        this.ws.close();
      }
      this.ws = null;
      this.isConnected = false;
      this.connectionPromise = null;
    }
    console.log("WebSocket disconnected");
  }

  public isConnectedStatus(): boolean {
    return this.isConnected;
  }

  public emitEvent(eventName: string, data: any) {
    if (!this.ws || !this.isConnected) {
      this.messageQueue.push({ type: eventName, data });
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
