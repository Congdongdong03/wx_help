"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMessageCallback = exports.setMessageCallback = exports.emitWebSocketEvent = exports.isWebSocketConnected = exports.disconnectWebSocket = exports.connectWebSocket = void 0;
const taro_1 = require("@tarojs/taro");
const env_1 = require("../config/env");
const WS_SERVER_URL = (0, env_1.getSocketServerUrl)();
const isWeapp = process.env.TARO_ENV === "weapp";
class WebSocketService {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.connectionPromise = null;
        this.connectionTimeout = null;
        this.reconnectAttempts = 0;
        this.messageQueue = [];
        this.messageCallback = null;
        this.incomingMessageQueue = [];
        this.currentUserId = "";
        this._boundHandleOpen = null;
        this._boundHandleMessage = null;
        this._boundHandleClose = null;
        this._boundHandleError = null;
        this._handleTaroSocketError = (err) => {
            this._handleError(err);
        };
        // Ensure this instance is a singleton if desired, or allow multiple instances
        // For this refactor, we are assuming it's still used as a global singleton via export default new WebSocketService();
    }
    // Set message callback
    setMessageCallback(callback) {
        this.messageCallback = callback;
        // Process all cached incoming messages immediately after setting the callback
        while (this.incomingMessageQueue.length > 0) {
            const queuedMessage = this.incomingMessageQueue.shift();
            if (queuedMessage && this.messageCallback) {
                this.messageCallback(queuedMessage);
            }
        }
    }
    // Remove message callback
    removeMessageCallback() {
        this.messageCallback = null;
    }
    connect(userId = "dev_openid_123") {
        console.log("=== WebSocketService.connect 开始 ===");
        console.log("当前环境:", process.env.TARO_ENV);
        console.log("isWeapp:", isWeapp);
        console.log("当前连接状态:", {
            ws: !!this.ws,
            isConnected: this.isConnected,
            connectionPromise: !!this.connectionPromise,
        });
        this.currentUserId = userId;
        if (this.connectionPromise) {
            console.log("已有连接进行中，返回现有 Promise");
            return this.connectionPromise;
        }
        if (this.ws && this.isConnected) {
            console.log("已有连接，直接返回");
            return Promise.resolve(this.ws);
        }
        this.connectionPromise = new Promise((resolve, reject) => {
            try {
                console.log("=== 开始建立 WebSocket 连接 ===");
                console.log("目标 URL:", WS_SERVER_URL);
                // Test HTTP connection first
                console.log("开始 HTTP 连接测试...");
                taro_1.default.request({
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
                this.ws = taro_1.default.connectSocket({
                    url: WS_SERVER_URL,
                    protocols: ["websocket"],
                    success: () => {
                        console.log("✅ Taro.connectSocket success 回调执行");
                    },
                    fail: (err) => {
                        console.error("❌ Taro.connectSocket fail 回调执行:", err);
                        this.connectionPromise = null;
                        reject(err);
                    },
                });
                console.log("Taro.connectSocket 调用完成，ws 对象:", this.ws);
                // Set connection timeout
                console.log("设置连接超时 (10秒)...");
                this.connectionTimeout = setTimeout(() => {
                    console.error("❌ WebSocket 连接超时");
                    this.connectionPromise = null;
                    reject(new Error("连接超时"));
                }, 10000);
                if (isWeapp) {
                    console.log("=== 小程序端事件注册 ===");
                    this._boundHandleOpen = this._handleOpen.bind(this, resolve);
                    this._boundHandleMessage = this._handleMessage.bind(this);
                    this._boundHandleClose = this._handleClose.bind(this);
                    this._boundHandleError = this._handleTaroSocketError.bind(this);
                    taro_1.default.onSocketOpen(this._boundHandleOpen);
                    taro_1.default.onSocketMessage(this._boundHandleMessage);
                    taro_1.default.onSocketClose(this._boundHandleClose);
                    taro_1.default.onSocketError(this._boundHandleError);
                    console.log("=== 小程序端事件注册完成 ===");
                }
                else {
                    console.log("=== H5 端事件注册 ===");
                    this.ws.onopen = () => this._handleOpen(resolve);
                    this.ws.onmessage = (msg) => this._handleMessage(msg);
                    this.ws.onclose = () => this._handleClose();
                    this.ws.onerror = (err) => this._handleError(err, reject);
                    console.log("=== H5 端事件注册完成 ===");
                }
                console.log("=== Promise 设置完成 ===");
            }
            catch (error) {
                console.error("❌ connectWebSocket 异常:", error);
                if (this.connectionTimeout) {
                    clearTimeout(this.connectionTimeout);
                    this.connectionTimeout = null;
                }
                this.connectionPromise = null;
                reject(error);
            }
        });
        console.log("=== WebSocketService.connect 返回 Promise ===");
        return this.connectionPromise;
    }
    _handleOpen(resolve) {
        console.log("✅ WebSocket onopen/onSocketOpen 回调执行");
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
            console.log("连接超时已清除");
        }
        this.isConnected = true;
        this.reconnectAttempts = 0; // Reset reconnect attempts
        console.log("✅ WebSocket 已连接");
        // Send queued messages
        while (this.messageQueue.length > 0) {
            const queuedMessage = this.messageQueue.shift();
            if (queuedMessage) {
                if (queuedMessage.type === "sendMessage") {
                    this.send(queuedMessage.data.content, queuedMessage.data.userId);
                }
                else {
                    this.emitEvent(queuedMessage.type, queuedMessage.data);
                }
            }
        }
        // Send login/authentication message
        setTimeout(() => {
            console.log("发送认证消息...");
            const authMessage = JSON.stringify({
                type: "auth",
                userId: this.currentUserId,
            });
            if (isWeapp) {
                taro_1.default.sendSocketMessage({
                    data: authMessage,
                    success: () => console.log("✅ 认证消息发送成功"),
                    fail: (err) => console.error("❌ 认证消息发送失败:", err),
                });
            }
            else {
                this.ws.send(authMessage);
                console.log("✅ H5 认证消息发送成功");
            }
        }, 100);
        resolve(this.ws);
    }
    _handleMessage(msg) {
        console.log("📨 收到 WebSocket 消息:", msg);
        try {
            const data = JSON.parse(msg.data);
            console.log("📨 解析后的消息:", data);
            // Handle server responses
            if (data.type === "auth_success") {
                console.log("✅ 认证成功");
            }
            else if (data.type === "error") {
                console.error("❌ 服务器错误:", data.content);
            }
            else {
                // Handle all other incoming messages, including 'chat'
                if (this.messageCallback) {
                    // If callback is set, process immediately
                    this.messageCallback(data);
                }
                else {
                    // If callback is not set, cache incoming messages
                    console.log("ℹ️ messageCallback 未设置，消息暂存 incomingMessageQueue:", data);
                    this.incomingMessageQueue.push(data);
                }
            }
        }
        catch (e) {
            console.error("❌ 消息解析失败", e);
        }
    }
    _handleClose() {
        console.log("🔌 WebSocket onclose/onSocketClose 回调执行");
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }
        this.isConnected = false;
        this.connectionPromise = null;
        console.log("🔌 WebSocket 已关闭");
        // Attempt to reconnect
        // if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        //   console.log(
        //     `🔄 尝试重连 (${this.reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})...`
        //   );
        //   this.reconnectAttempts++;
        //   setTimeout(() => {
        //     this.connect(this.currentUserId).catch((err) => {
        //       console.error("❌ 重连失败:", err);
        //     });
        //   }, RECONNECT_DELAY);
        // } else {
        //   console.error("❌ 重连次数已达上限，停止重连");
        // }
    }
    _handleError(err, reject) {
        console.error("❌ WebSocket onerror/onSocketError 回调执行:", err);
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }
        this.isConnected = false;
        this.connectionPromise = null;
        console.error("❌ WebSocket 错误", err);
        if (reject) {
            reject(err);
        }
    }
    send(content, userId) {
        if (this.ws && this.isConnected) {
            try {
                const message = JSON.stringify({
                    type: "sendMessage",
                    content,
                    userId,
                    timestamp: Date.now(),
                });
                if (isWeapp) {
                    taro_1.default.sendSocketMessage({
                        data: message,
                        success: () => {
                            console.log("✅ 消息发送成功");
                        },
                        fail: (err) => {
                            console.error("❌ 消息发送失败:", err);
                        },
                    });
                }
                else {
                    this.ws.send(message);
                    console.log("✅ H5 消息发送成功");
                }
            }
            catch (error) {
                console.error("❌ 发送消息异常:", error);
            }
        }
        else {
            console.log("⚠️ WebSocket 未连接，消息加入队列");
            this.messageQueue.push({
                type: "sendMessage",
                data: { content, userId },
            });
        }
    }
    disconnect() {
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }
        if (isWeapp) {
            // Clean up Taro global listeners for Mini-program
            console.log("🔌 清理小程序 WebSocket 全局监听器...");
            taro_1.default.offSocketOpen(this._boundHandleOpen);
            taro_1.default.offSocketMessage(this._boundHandleMessage);
            taro_1.default.offSocketClose(this._boundHandleClose);
            taro_1.default.offSocketError(this._boundHandleError);
            this._boundHandleOpen = null;
            this._boundHandleMessage = null;
            this._boundHandleClose = null;
            this._boundHandleError = null;
        }
        if (this.ws) {
            if (isWeapp) {
                taro_1.default.closeSocket();
            }
            else {
                this.ws.close();
            }
            this.ws = null;
            this.isConnected = false;
            this.connectionPromise = null;
        }
        console.log("🔌 WebSocketService.disconnect 已完成");
    }
    isConnectedStatus() {
        return this.isConnected;
    }
    emitEvent(eventName, data) {
        if (!this.ws || !this.isConnected) {
            console.log("⚠️ WebSocket 未连接，事件加入队列:", eventName);
            this.messageQueue.push({ type: eventName, data });
            return;
        }
        try {
            const message = JSON.stringify(Object.assign(Object.assign({ type: eventName }, data), { timestamp: Date.now() }));
            if (isWeapp) {
                taro_1.default.sendSocketMessage({
                    data: message,
                    success: () => {
                        console.log(`✅ 事件发送成功: ${eventName}`);
                    },
                    fail: (err) => {
                        console.error(`❌ 事件发送失败: ${eventName}`, err);
                    },
                });
            }
            else {
                this.ws.send(message);
                console.log(`✅ H5 事件发送成功: ${eventName}`);
            }
        }
        catch (error) {
            console.error(`❌ 发送事件异常: ${eventName}`, error);
        }
    }
    testConnection() {
        this.disconnect();
        return this.connect("");
    }
}
const wsService = new WebSocketService();
// 导出便捷函数
const connectWebSocket = (userId) => wsService.connect(userId);
exports.connectWebSocket = connectWebSocket;
const disconnectWebSocket = () => wsService.disconnect();
exports.disconnectWebSocket = disconnectWebSocket;
const isWebSocketConnected = () => wsService.isConnectedStatus();
exports.isWebSocketConnected = isWebSocketConnected;
const emitWebSocketEvent = (eventName, data) => wsService.emitEvent(eventName, data);
exports.emitWebSocketEvent = emitWebSocketEvent;
const setMessageCallback = (callback) => wsService.setMessageCallback(callback);
exports.setMessageCallback = setMessageCallback;
const removeMessageCallback = () => wsService.removeMessageCallback();
exports.removeMessageCallback = removeMessageCallback;
exports.default = wsService;
//# sourceMappingURL=wsService.js.map