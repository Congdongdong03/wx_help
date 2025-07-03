import Taro from "@tarojs/taro";
import { getSocketServerUrl } from "../config/env";

const WS_SERVER_URL = getSocketServerUrl();

let ws: any = null;
let isConnected = false;
let connectionPromise: Promise<any> | null = null;
let connectionTimeout: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 2000; // 2 seconds

const isWeapp = process.env.TARO_ENV === "weapp";

// 消息队列，用于在连接建立前缓存消息
let messageQueue: Array<{ type: string; data: any }> = [];

// 消息回调函数
let messageCallback: ((message: any) => void) | null = null;

// 接收到的消息队列，用于在 messageCallback 未设置时缓存消息
let incomingMessageQueue: any[] = [];

// 设置消息回调
export function setMessageCallback(callback: (message: any) => void) {
  messageCallback = callback;
  // 设置回调后，立即处理所有缓存的传入消息
  while (incomingMessageQueue.length > 0) {
    const queuedMessage = incomingMessageQueue.shift();
    if (queuedMessage && messageCallback) {
      messageCallback(queuedMessage);
    }
  }
}

// 移除消息回调
export function removeMessageCallback() {
  messageCallback = null;
}

export function connectWebSocket(
  userId: string = "dev_openid_123"
): Promise<any> {
  console.log("=== connectWebSocket 开始 ===");
  console.log("当前环境:", process.env.TARO_ENV);
  console.log("isWeapp:", isWeapp);
  console.log("当前连接状态:", {
    ws: !!ws,
    isConnected,
    connectionPromise: !!connectionPromise,
  });

  if (connectionPromise) {
    console.log("已有连接进行中，返回现有 Promise");
    return connectionPromise;
  }

  if (ws && isConnected) {
    console.log("已有连接，直接返回");
    return Promise.resolve(ws);
  }

  connectionPromise = new Promise((resolve, reject) => {
    try {
      console.log("=== 开始建立 WebSocket 连接 ===");
      console.log("目标 URL:", WS_SERVER_URL);

      // 先测试 HTTP 连接
      console.log("开始 HTTP 连接测试...");
      Taro.request({
        url: "http://192.168.20.18:3000/api/health",
        method: "GET",
        timeout: 5000,
        success: (res) => {
          console.log("✅ HTTP 连接测试成功:", res.data);
        },
        fail: (err) => {
          console.error("❌ HTTP 连接测试失败:", err);
        },
      });

      console.log("开始调用 Taro.connectSocket...");
      ws = Taro.connectSocket({
        url: WS_SERVER_URL,
        protocols: ["websocket"],
        success: () => {
          console.log("✅ Taro.connectSocket success 回调执行");
        },
        fail: (err) => {
          console.error("❌ Taro.connectSocket fail 回调执行:", err);
          connectionPromise = null;
          reject(err);
        },
      });
      console.log("Taro.connectSocket 调用完成，ws 对象:", ws);

      // 设置连接超时
      console.log("设置连接超时 (10秒)...");
      connectionTimeout = setTimeout(() => {
        console.error("❌ WebSocket 连接超时");
        connectionPromise = null;
        reject(new Error("连接超时"));
      }, 10000);

      if (isWeapp) {
        console.log("=== 小程序端事件注册 ===");

        console.log("注册 Taro.onSocketOpen...");
        Taro.onSocketOpen(() => {
          console.log("✅ Taro.onSocketOpen 回调执行");
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
            connectionTimeout = null;
            console.log("连接超时已清除");
          }
          isConnected = true;
          reconnectAttempts = 0; // 重置重连次数
          console.log("✅ WebSocket 已连接");

          // 发送队列中的消息
          while (messageQueue.length > 0) {
            const queuedMessage = messageQueue.shift();
            if (queuedMessage) {
              if (queuedMessage.type === "sendMessage") {
                sendWebSocketMessage(
                  queuedMessage.data.content,
                  queuedMessage.data.userId
                );
              } else {
                emitWebSocketEvent(queuedMessage.type, queuedMessage.data);
              }
            }
          }

          // 发送登录/鉴权消息
          setTimeout(() => {
            console.log("发送认证消息...");
            Taro.sendSocketMessage({
              data: JSON.stringify({ type: "auth", userId }),
              success: () => {
                console.log("✅ 认证消息发送成功");
              },
              fail: (err) => {
                console.error("❌ 认证消息发送失败:", err);
              },
            });
          }, 100);
          resolve(ws);
        });

        console.log("注册 Taro.onSocketMessage...");
        Taro.onSocketMessage((msg) => {
          console.log("📨 收到 WebSocket 消息:", msg);
          try {
            const data = JSON.parse(msg.data);
            console.log("📨 解析后的消息:", data);

            // 处理服务器响应
            if (data.type === "auth_success") {
              console.log("✅ 认证成功");
            } else if (data.type === "error") {
              console.error("❌ 服务器错误:", data.content);
            } else {
              // 处理所有其他传入消息，包括 'chat'
              if (messageCallback) {
                // 如果回调已设置，则立即处理
                messageCallback(data);
              } else {
                // 如果回调未设置，则将传入消息暂存队列
                console.log(
                  "ℹ️ messageCallback 未设置，消息暂存 incomingMessageQueue:",
                  data
                );
                incomingMessageQueue.push(data);
              }
            }
          } catch (e) {
            console.error("❌ 消息解析失败", e);
          }
        });

        console.log("注册 Taro.onSocketClose...");
        Taro.onSocketClose(() => {
          console.log("🔌 Taro.onSocketClose 回调执行");
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
            connectionTimeout = null;
          }
          isConnected = false;
          connectionPromise = null;
          console.log("🔌 WebSocket 已关闭");

          // 尝试重连
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            console.log(
              `🔄 尝试重连 (${
                reconnectAttempts + 1
              }/${MAX_RECONNECT_ATTEMPTS})...`
            );
            reconnectAttempts++;
            setTimeout(() => {
              connectWebSocket(userId).catch((err) => {
                console.error("❌ 重连失败:", err);
              });
            }, RECONNECT_DELAY);
          } else {
            console.error("❌ 重连次数已达上限，停止重连");
          }
        });

        console.log("注册 Taro.onSocketError...");
        Taro.onSocketError((err) => {
          console.error("❌ Taro.onSocketError 回调执行:", err);
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
            connectionTimeout = null;
          }
          isConnected = false;
          connectionPromise = null;
          console.error("❌ WebSocket 错误", err);
          reject(err);
        });

        console.log("=== 小程序端事件注册完成 ===");
      } else {
        console.log("=== H5 端事件注册 ===");
        ws.onopen = () => {
          console.log("✅ H5 WebSocket onopen 回调执行");
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
            connectionTimeout = null;
          }
          isConnected = true;
          reconnectAttempts = 0;
          console.log("✅ WebSocket 已连接");

          // 发送队列中的消息
          while (messageQueue.length > 0) {
            const queuedMessage = messageQueue.shift();
            if (queuedMessage) {
              if (queuedMessage.type === "sendMessage") {
                sendWebSocketMessage(
                  queuedMessage.data.content,
                  queuedMessage.data.userId
                );
              } else {
                emitWebSocketEvent(queuedMessage.type, queuedMessage.data);
              }
            }
          }

          ws.send(JSON.stringify({ type: "auth", userId }));
          resolve(ws);
        };
        ws.onmessage = (msg: any) => {
          console.log("📨 H5 收到消息:", msg);
          try {
            const data = JSON.parse(msg.data);
            console.log("📨 H5 解析后的消息:", data);

            // 处理服务器响应
            if (data.type === "auth_success") {
              console.log("✅ H5 认证成功");
            } else if (data.type === "error") {
              console.error("❌ H5 服务器错误:", data.content);
            } else {
              // 处理所有其他传入消息，包括 'chat'
              if (messageCallback) {
                messageCallback(data);
              } else {
                console.log(
                  "ℹ️ H5 messageCallback 未设置，消息暂存 incomingMessageQueue:",
                  data
                );
                incomingMessageQueue.push(data);
              }
            }
          } catch (e) {
            console.error("❌ H5 消息解析失败", e);
          }
        };
        ws.onclose = () => {
          console.log("🔌 H5 WebSocket onclose 回调执行");
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
            connectionTimeout = null;
          }
          isConnected = false;
          connectionPromise = null;
          console.log("🔌 WebSocket 已关闭");

          // 尝试重连
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            console.log(
              `🔄 尝试重连 (${
                reconnectAttempts + 1
              }/${MAX_RECONNECT_ATTEMPTS})...`
            );
            reconnectAttempts++;
            setTimeout(() => {
              connectWebSocket(userId).catch((err) => {
                console.error("❌ 重连失败:", err);
              });
            }, RECONNECT_DELAY);
          } else {
            console.error("❌ 重连次数已达上限，停止重连");
          }
        };
        ws.onerror = (err: any) => {
          console.error("❌ H5 WebSocket onerror 回调执行:", err);
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
            connectionTimeout = null;
          }
          isConnected = false;
          connectionPromise = null;
          console.error("❌ WebSocket 错误", err);
          reject(err);
        };
        console.log("=== H5 端事件注册完成 ===");
      }

      console.log("=== Promise 设置完成 ===");
    } catch (error) {
      console.error("❌ connectWebSocket 异常:", error);
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      connectionPromise = null;
      reject(error);
    }
  });

  console.log("=== connectWebSocket 返回 Promise ===");
  return connectionPromise;
}

export function sendWebSocketMessage(content: string, userId: string) {
  if (ws && isConnected) {
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
          success: () => {
            console.log("✅ 消息发送成功");
          },
          fail: (err) => {
            console.error("❌ 消息发送失败:", err);
          },
        });
      } else {
        ws.send(message);
        console.log("✅ H5 消息发送成功");
      }
    } catch (error) {
      console.error("❌ 发送消息异常:", error);
    }
  } else {
    console.log("⚠️ WebSocket 未连接，消息加入队列");
    messageQueue.push({ type: "sendMessage", data: { content, userId } });
  }
}

export function disconnectWebSocket() {
  if (connectionTimeout) {
    clearTimeout(connectionTimeout);
    connectionTimeout = null;
  }
  if (ws) {
    if (isWeapp) {
      Taro.closeSocket();
    } else {
      ws.close();
    }
    ws = null;
    isConnected = false;
    connectionPromise = null;
  }
}

export function isWebSocketConnected() {
  return isConnected;
}

export function emitWebSocketEvent(eventName: string, data: any) {
  if (!ws || !isConnected) {
    console.log("⚠️ WebSocket 未连接，事件加入队列:", eventName);
    messageQueue.push({ type: eventName, data });
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
        success: () => {
          console.log(`✅ 事件发送成功: ${eventName}`);
        },
        fail: (err) => {
          console.error(`❌ 事件发送失败: ${eventName}`, err);
        },
      });
    } else {
      ws.send(message);
      console.log(`✅ H5 事件发送成功: ${eventName}`);
    }
  } catch (error) {
    console.error(`❌ 发送事件异常: ${eventName}`, error);
  }
}

export function testWebSocketConnection() {
  disconnectWebSocket();
  return connectWebSocket("");
}
