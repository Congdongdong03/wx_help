"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWebSocket = void 0;
const taro_1 = require("@tarojs/taro");
const wsService_1 = require("../services/wsService");
const useWebSocket = ({ openid, }) => {
    const [socketConnected, setSocketConnected] = (0, taro_1.useState)(false);
    const [isConnecting, setIsConnecting] = (0, taro_1.useState)(false);
    const [connectionError, setConnectionError] = (0, taro_1.useState)(null);
    const reconnectTimeoutRef = (0, taro_1.useRef)(null);
    const connect = (0, taro_1.useCallback)(async () => {
        if (!openid || (0, wsService_1.isWebSocketConnected)())
            return;
        setIsConnecting(true);
        setConnectionError(null);
        try {
            await (0, wsService_1.connectWebSocket)(openid);
            setSocketConnected(true);
            console.log("Socket连接成功");
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        }
        catch (error) {
            console.error("Socket连接失败:", error);
            setConnectionError("连接失败，请检查网络");
            setSocketConnected(false);
            reconnectTimeoutRef.current = setTimeout(() => {
                connect();
            }, 5000);
        }
        finally {
            setIsConnecting(false);
        }
    }, [openid]);
    const disconnect = (0, taro_1.useCallback)(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        (0, wsService_1.disconnectWebSocket)();
        setSocketConnected(false);
        console.log("Socket断开连接");
    }, []);
    const isConnected = (0, taro_1.useCallback)(() => (0, wsService_1.isWebSocketConnected)(), []);
    const emit = (0, taro_1.useCallback)((event, data) => {
        if (isConnected()) {
            (0, wsService_1.emitWebSocketEvent)(event, data);
        }
        else {
            console.warn("WebSocket not connected, cannot emit event:", event, data);
        }
    }, [isConnected]);
    const setMsgCallback = (0, taro_1.useCallback)((callback) => {
        (0, wsService_1.setMessageCallback)(callback);
    }, []);
    const removeMsgCallback = (0, taro_1.useCallback)(() => {
        (0, wsService_1.removeMessageCallback)();
    }, []);
    (0, taro_1.useEffect)(() => {
        if (openid) {
            connect();
        }
        return () => {
            disconnect();
        };
    }, [openid, connect, disconnect]);
    return {
        socketConnected,
        isConnecting,
        connectionError,
        connect,
        disconnect,
        isConnected,
        emit,
        setMsgCallback,
        removeMsgCallback,
    };
};
exports.useWebSocket = useWebSocket;
//# sourceMappingURL=useWebSocket.js.map