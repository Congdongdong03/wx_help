import { useState, useEffect, useRef, useCallback } from "@tarojs/taro";
import Taro from "@tarojs/taro";
import {
  connectWebSocket,
  disconnectWebSocket,
  isWebSocketConnected,
  emitWebSocketEvent,
  setMessageCallback,
  removeMessageCallback,
} from "../services/wsService";

interface UseWebSocketProps {
  openid: string | undefined;
}

interface UseWebSocketReturn {
  socketConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  connect: () => void;
  disconnect: () => void;
  isConnected: () => boolean;
  emit: (event: string, data: any) => void;
  setMsgCallback: (callback: (msg: any) => void) => void;
  removeMsgCallback: () => void;
}

export const useWebSocket = ({
  openid,
}: UseWebSocketProps): UseWebSocketReturn => {
  const [socketConnected, setSocketConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(async () => {
    if (!openid || isWebSocketConnected()) return;
    setIsConnecting(true);
    setConnectionError(null);
    try {
      await connectWebSocket(openid);
      setSocketConnected(true);
      console.log("Socket连接成功");
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    } catch (error) {
      console.error("Socket连接失败:", error);
      setConnectionError("连接失败，请检查网络");
      setSocketConnected(false);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    } finally {
      setIsConnecting(false);
    }
  }, [openid]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    disconnectWebSocket();
    setSocketConnected(false);
    console.log("Socket断开连接");
  }, []);

  const isConnected = useCallback(() => isWebSocketConnected(), []);

  const emit = useCallback(
    (event: string, data: any) => {
      if (isConnected()) {
        emitWebSocketEvent(event, data);
      } else {
        console.warn(
          "WebSocket not connected, cannot emit event:",
          event,
          data
        );
      }
    },
    [isConnected]
  );

  const setMsgCallback = useCallback((callback: (msg: any) => void) => {
    setMessageCallback(callback);
  }, []);

  const removeMsgCallback = useCallback(() => {
    removeMessageCallback();
  }, []);

  useEffect(() => {
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
