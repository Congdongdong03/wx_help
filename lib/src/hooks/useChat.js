"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChat = void 0;
const taro_1 = require("@tarojs/taro");
const taro_2 = require("@tarojs/taro");
const messageService_1 = require("../services/messageService");
const api_1 = require("../config/api");
const request_1 = require("../utils/request");
const debounce_1 = require("../utils/debounce");
const hooks_1 = require("../store/user/hooks");
const useChat = ({ postId, paramConversationId, otherUserId, otherUserNickname, otherUserAvatarParam, isWebSocketConnected, emitWebSocketEvent, setMessageCallback, removeMessageCallback, }) => {
    const { currentUser } = (0, hooks_1.useUser)();
    const [currentConversationId, setCurrentConversationId] = (0, taro_1.useState)(paramConversationId || null);
    const [chatTitle, setChatTitle] = (0, taro_1.useState)(otherUserNickname ? decodeURIComponent(otherUserNickname) : "聊天");
    const [messageInput, setMessageInput] = (0, taro_1.useState)("");
    const [messages, setMessages] = (0, taro_1.useState)([]);
    const [loading, setLoading] = (0, taro_1.useState)(true);
    const [loadingMore, setLoadingMore] = (0, taro_1.useState)(false);
    const [error, setError] = (0, taro_1.useState)(false);
    const [isOtherUserTyping, setIsOtherUserTyping] = (0, taro_1.useState)(false);
    const [isOtherUserOnline, setIsOtherUserOnline] = (0, taro_1.useState)(false);
    const [pagination, setPagination] = (0, taro_1.useState)(null);
    const [hasInitialized, setHasInitialized] = (0, taro_1.useState)(false); // Keep this state to manage initial data load
    const [scrollToViewId, setScrollToViewId] = (0, taro_1.useState)("");
    const otherUserAvatar = otherUserAvatarParam
        ? decodeURIComponent(otherUserAvatarParam)
        : "https://via.placeholder.com/40";
    const currentUserAvatar = (currentUser === null || currentUser === void 0 ? void 0 : currentUser.avatarUrl) || "";
    // Get or create conversation, and set conversationId
    const initConversation = (0, taro_1.useCallback)(async () => {
        console.log("initConversation called with:", {
            postId,
            currentConversationId,
            otherUserId,
            currentUserOpenid: currentUser === null || currentUser === void 0 ? void 0 : currentUser.openid,
            hasAllRequired: !!(currentConversationId ||
                (postId && otherUserId && (currentUser === null || currentUser === void 0 ? void 0 : currentUser.openid))),
        });
        // If there is already a conversationId, use it directly
        if (currentConversationId) {
            console.log("✅ Using existing conversationId:", currentConversationId);
            setLoading(false);
            return;
        }
        // Check user login status and openid
        if (!(currentUser === null || currentUser === void 0 ? void 0 : currentUser.openid)) {
            console.error("❌ initConversation: currentUser.openid is missing!");
            console.log("currentUser:", currentUser);
            // Try to get openid from local cache
            const cachedOpenid = taro_2.default.getStorageSync("openid");
            console.log("cachedOpenid:", cachedOpenid);
            if (cachedOpenid) {
                console.log("✅ Found openid in cache, using it");
                // If there is openid in the cache, use it
                try {
                    const convId = await messageService_1.messageService.findOrCreateConversation(postId, otherUserId, cachedOpenid);
                    setCurrentConversationId(convId);
                    console.log("Initialized conversation ID:", convId);
                }
                catch (err) {
                    console.error("Error initializing conversation:", err);
                    setError(true);
                    taro_2.default.showToast({ title: "获取对话失败", icon: "none" });
                }
                return;
            }
            else {
                taro_2.default.showToast({ title: "请先登录", icon: "none" });
                return;
            }
        }
        if (!postId || !otherUserId) {
            console.log("initConversation: Missing postId or otherUserId");
            return;
        }
        try {
            setLoading(true);
            console.log("Calling findOrCreateConversation with:", {
                postId: postId,
                otherUserId: otherUserId,
                currentUserOpenid: currentUser.openid,
            });
            const convId = await messageService_1.messageService.findOrCreateConversation(postId, otherUserId, currentUser.openid);
            setCurrentConversationId(convId);
            console.log("Initialized conversation ID:", convId);
        }
        catch (err) {
            console.error("Error initializing conversation:", err);
            setError(true);
            taro_2.default.showToast({ title: "获取对话失败", icon: "none" });
        }
        finally {
            setLoading(false);
        }
    }, [postId, currentConversationId, otherUserId, currentUser.openid]);
    // Debounced function to emit typing event
    const debouncedTyping = (0, taro_1.useCallback)((0, debounce_1.debounce)(() => {
        if (isWebSocketConnected() && currentConversationId) {
            console.log("Emitting stopTyping");
            emitWebSocketEvent("stopTyping", {
                conversationId: currentConversationId,
            });
        }
    }, 1000), [isWebSocketConnected, currentConversationId, emitWebSocketEvent]);
    const sortMessages = (0, taro_1.useCallback)((arr) => arr
        .slice()
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()), []);
    const fetchChatMessages = (0, taro_1.useCallback)(async (page = 1, isLoadMore = false) => {
        if (!currentConversationId || !currentUser.openid)
            return;
        console.log(`[fetchChatMessages] Calling fetchMessages with currentConversationId: ${currentConversationId}, currentUser.openid: ${currentUser.openid}`);
        try {
            if (isLoadMore) {
                setLoadingMore(true);
            }
            else {
                setLoading(true);
            }
            const response = await messageService_1.messageService.fetchMessages(currentConversationId, currentUser.openid, page);
            if (isLoadMore) {
                setMessages((prev) => sortMessages([...response.messages, ...prev]));
            }
            else {
                setMessages(sortMessages(response.messages));
                setHasInitialized(true);
            }
            setPagination(response.pagination);
            setError(false);
        }
        catch (err) {
            console.error("Error fetching messages:", err);
            setError(true);
            taro_2.default.showToast({
                title: "加载消息失败",
                icon: "none",
            });
        }
        finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [currentConversationId, currentUser.openid, sortMessages]);
    const loadMoreMessages = (0, taro_1.useCallback)(async () => {
        var _a;
        if (loadingMore || !(pagination === null || pagination === void 0 ? void 0 : pagination.hasMore)) {
            return;
        }
        const nextPage = pagination.nextPage;
        if (!nextPage) {
            return;
        }
        const firstMessageId = (_a = messages[0]) === null || _a === void 0 ? void 0 : _a.id;
        try {
            await fetchChatMessages(nextPage, true);
            if (firstMessageId) {
                setTimeout(() => {
                    setScrollToViewId(`msg-${firstMessageId}`);
                }, 100);
            }
        }
        catch (error) {
            console.error("Error loading more messages:", error);
            taro_2.default.showToast({
                title: "加载更多消息失败",
                icon: "none",
            });
        }
    }, [
        loadingMore,
        pagination === null || pagination === void 0 ? void 0 : pagination.hasMore,
        pagination === null || pagination === void 0 ? void 0 : pagination.nextPage,
        messages,
        fetchChatMessages,
    ]);
    const markConversationAsRead = (0, taro_1.useCallback)(async () => {
        if (!currentConversationId || !currentUser.openid)
            return;
        console.log(`[markConversationAsRead] Calling markMessagesAsRead with currentConversationId: ${currentConversationId}, currentUser.openid: ${currentUser.openid}`);
        try {
            await messageService_1.messageService.markMessagesAsRead(currentConversationId, currentUser.openid);
        }
        catch (err) {
            console.error("Error marking messages as read:", err);
        }
    }, [currentConversationId, currentUser.openid]);
    // Message handler
    const messageHandler = (0, taro_1.useCallback)((msg) => {
        if (msg.conversationId === currentConversationId && msg.type === "chat") {
            setMessages((prev) => {
                if (msg.clientTempId) {
                    const existingIndex = prev.findIndex((m) => m.clientTempId === msg.clientTempId);
                    if (existingIndex !== -1) {
                        const updatedMessages = [...prev];
                        updatedMessages[existingIndex] = Object.assign(Object.assign({}, updatedMessages[existingIndex]), { id: msg.messageId || updatedMessages[existingIndex].id, status: "sent", timestamp: msg.timestamp || updatedMessages[existingIndex].timestamp });
                        return updatedMessages;
                    }
                }
                // Only add new message if it doesn't already exist by messageId
                if (msg.messageId && prev.some((m) => m.id === msg.messageId)) {
                    return prev;
                }
                // Append new message directly without sorting the whole array
                return [
                    ...prev,
                    Object.assign(Object.assign({}, msg), { id: msg.messageId || Date.now().toString(), status: "sent", type: msg.messageType || "text" }),
                ];
            });
            setLoading(false);
        }
        if (msg.type === "auth_success") {
            setLoading(false);
        }
        if (msg.type === "onlineStatus") {
            setIsOtherUserOnline(msg.onlineCount >= 2);
        }
        if (msg.type === "error" && msg.clientTempId) {
            setMessages((prev) => {
                const existingIndex = prev.findIndex((m) => m.clientTempId === msg.clientTempId);
                if (existingIndex !== -1) {
                    const updatedMessages = [...prev];
                    updatedMessages[existingIndex] = Object.assign(Object.assign({}, updatedMessages[existingIndex]), { status: "failed" });
                    return updatedMessages;
                }
                return prev;
            });
            taro_2.default.showToast({ title: "发送失败", icon: "none" });
        }
    }, [currentConversationId]);
    // Retry message handler
    const handleRetryMessage = (0, taro_1.useCallback)((message) => {
        if (!currentConversationId || !otherUserId || !currentUser.openid)
            return;
        setMessages((prev) => prev.map((msg) => msg.id === message.id ? Object.assign(Object.assign({}, msg), { status: "pending" }) : msg));
        if (isWebSocketConnected()) {
            try {
                emitWebSocketEvent("sendMessage", {
                    conversationId: currentConversationId,
                    toUserId: otherUserId,
                    type: message.type,
                    content: message.content,
                    timestamp: Date.now(),
                    clientTempId: message.clientTempId,
                });
            }
            catch (error) {
                console.error("WebSocket发送消息失败:", error);
            }
        }
    }, [
        currentConversationId,
        otherUserId,
        currentUser.openid,
        isWebSocketConnected,
        emitWebSocketEvent,
    ]);
    const handleInputChange = (e) => {
        setMessageInput(e.detail.value);
        if (isWebSocketConnected() && currentConversationId) {
            try {
                console.log("Emitting typing");
                emitWebSocketEvent("typing", { conversationId: currentConversationId });
                debouncedTyping();
            }
            catch (error) {
                console.error("发送typing事件失败:", error);
            }
        }
    };
    const handleSendMessage = async () => {
        if (!messageInput.trim() ||
            !currentConversationId ||
            !otherUserId ||
            !currentUser.openid)
            return;
        if (currentUser.openid === otherUserId) {
            taro_2.default.showToast({ title: "不能给自己发送消息", icon: "none" });
            return;
        }
        const clientTempId = `temp-${Date.now()}`;
        const optimisticMessage = {
            id: clientTempId,
            clientTempId,
            conversationId: currentConversationId,
            senderId: currentUser.openid,
            receiverId: otherUserId,
            type: "text",
            content: messageInput.trim(),
            timestamp: new Date().toISOString(),
            isRead: false,
            status: "pending",
        };
        setMessages((prevMessages) => [...prevMessages, optimisticMessage] // Directly append without sorting
        );
        setMessageInput("");
        try {
            if (isWebSocketConnected()) {
                emitWebSocketEvent("sendMessage", {
                    conversationId: currentConversationId,
                    toUserId: otherUserId,
                    type: "text",
                    content: optimisticMessage.content,
                    timestamp: Date.now(),
                    clientTempId,
                });
            }
            else {
                throw new Error("WebSocket not connected, falling back to HTTP");
            }
        }
        catch (error) {
            console.error("Sending message via WebSocket failed:", error);
            try {
                console.log(`[handleSendMessage] HTTP fallback calling sendMessage with currentConversationId: ${currentConversationId}, currentUser.openid: ${currentUser.openid}`);
                const sent = await messageService_1.messageService.sendMessage(currentConversationId, currentUser.openid, otherUserId, optimisticMessage.content, "text");
                console.log("HTTP fallback sent:", sent);
                setMessages((prevMessages) => prevMessages.map((msg) => msg.content === sent.content &&
                    msg.senderId === sent.senderId &&
                    msg.status === "pending"
                    ? Object.assign(Object.assign(Object.assign({}, msg), sent), { status: "sent" }) : msg) // Update specific message, no full sort
                );
            }
            catch (err) {
                console.error("Error sending message via HTTP API:", err);
                setMessages((prevMessages) => prevMessages.map((msg) => msg.id === clientTempId ? Object.assign(Object.assign({}, msg), { status: "failed" }) : msg)); // Update specific message, no full sort
                taro_2.default.showToast({ title: "发送失败", icon: "none" });
            }
        }
    };
    const handleChooseImage = () => {
        taro_2.default.chooseImage({
            count: 1,
            sizeType: ["original", "compressed"],
            sourceType: ["album", "camera"],
            success: (res) => {
                const tempFilePath = res.tempFilePaths[0];
                handleSendImage(tempFilePath);
            },
            fail: (err) => {
                if (err.errMsg && !err.errMsg.includes("cancel")) {
                    taro_2.default.showToast({ title: "选择图片失败", icon: "none" });
                }
            },
        });
    };
    const handleSendImage = async (tempFilePath) => {
        if (!currentConversationId || !otherUserId || !currentUser.openid)
            return;
        if (currentUser.openid === otherUserId) {
            taro_2.default.showToast({ title: "不能给自己发送消息", icon: "none" });
            return;
        }
        const clientTempId = `image-${Date.now()}`;
        const optimisticMessage = {
            id: clientTempId,
            conversationId: currentConversationId,
            senderId: currentUser.openid,
            receiverId: otherUserId,
            type: "image",
            content: tempFilePath,
            timestamp: new Date().toISOString(),
            isRead: false,
            status: "pending",
        };
        setMessages((prevMessages) => [...prevMessages, optimisticMessage] // Directly append without sorting
        );
        try {
            taro_2.default.showLoading({ title: "发送中..." });
            console.log("开始上传图片:", tempFilePath);
            console.log("上传URL:", api_1.API_CONFIG.getApiUrl("/posts/upload"));
            const uploadResult = await (0, request_1.uploadFile)(api_1.API_CONFIG.getApiUrl("/posts/upload"), tempFilePath, {
                name: "file",
                retryCount: 3,
                retryDelay: 1000,
            });
            console.log("上传结果:", uploadResult);
            if (uploadResult.code !== 0) {
                throw new Error(uploadResult.message || "上传失败");
            }
            if (!uploadResult.data || !uploadResult.data.url) {
                throw new Error("上传响应格式错误");
            }
            const imageUrl = api_1.API_CONFIG.getImageUrl(uploadResult.data.url);
            console.log("图片URL:", imageUrl);
            setMessages((prevMessages) => prevMessages.map((msg) => msg.id === clientTempId
                ? Object.assign(Object.assign({}, msg), { content: imageUrl, status: "sent" }) : msg) // Update specific message, no full sort
            );
            if (isWebSocketConnected()) {
                try {
                    emitWebSocketEvent("sendMessage", {
                        conversationId: currentConversationId,
                        toUserId: otherUserId,
                        type: "image",
                        content: imageUrl,
                        timestamp: Date.now(),
                        clientTempId,
                    });
                }
                catch (error) {
                    console.error("WebSocket发送图片失败:", error);
                    const sent = await messageService_1.messageService.sendMessage(currentConversationId, currentUser.openid, otherUserId, imageUrl, "image");
                    setMessages((prevMessages) => prevMessages.map((msg) => msg.id === clientTempId
                        ? Object.assign(Object.assign(Object.assign({}, msg), sent), { status: "sent" }) : msg) // Update specific message, no full sort
                    );
                }
            }
            else {
                console.log(`[handleSendImage] HTTP fallback calling sendMessage (for currentConversationId: ${currentConversationId}, currentUser.openid: ${currentUser.openid}`);
                const sent = await messageService_1.messageService.sendMessage(currentConversationId, currentUser.openid, otherUserId, imageUrl, "image");
                setMessages((prevMessages) => prevMessages.map((msg) => msg.id === clientTempId
                    ? Object.assign(Object.assign(Object.assign({}, msg), sent), { status: "sent" }) : msg) // Update specific message, no full sort
                );
            }
            taro_2.default.hideLoading();
        }
        catch (error) {
            console.error("Error sending image:", error);
            taro_2.default.hideLoading();
            setMessages((prevMessages) => prevMessages.map((msg) => msg.id === clientTempId ? Object.assign(Object.assign({}, msg), { status: "failed" }) : msg) // Update specific message, no full sort
            );
            taro_2.default.showToast({ title: "发送失败", icon: "none" });
        }
    };
    // Effect for initializing conversation and fetching data
    (0, taro_1.useEffect)(() => {
        if (currentUser.openid &&
            otherUserId &&
            (currentConversationId || postId)) {
            initConversation();
        }
    }, [
        currentUser.openid,
        currentConversationId,
        postId,
        otherUserId,
        initConversation,
    ]);
    // Effect for fetching messages and marking as read
    (0, taro_1.useEffect)(() => {
        if (!currentConversationId || !currentUser.openid)
            return;
        fetchChatMessages();
        markConversationAsRead();
    }, [
        currentConversationId,
        currentUser.openid,
        fetchChatMessages,
        markConversationAsRead,
    ]);
    // Effect for setting up message handlers and event listeners
    (0, taro_1.useEffect)(() => {
        if (!currentConversationId)
            return;
        // Set navigation bar title
        if (otherUserNickname) {
            const decodedNickname = decodeURIComponent(otherUserNickname);
            taro_2.default.setNavigationBarTitle({
                title: decodedNickname,
            });
        }
        setMessageCallback(messageHandler);
        taro_2.default.eventCenter.on("retryMessage", handleRetryMessage);
        return () => {
            taro_2.default.eventCenter.off("retryMessage", handleRetryMessage);
            removeMessageCallback();
        };
    }, [
        currentConversationId,
        otherUserNickname,
        messageHandler,
        handleRetryMessage,
        setMessageCallback,
        removeMessageCallback,
    ]);
    // Auto-scroll to bottom on new messages (moved into useChat)
    (0, taro_1.useEffect)(() => {
        if (messages.length > 0) {
            setScrollToViewId("");
            setTimeout(() => {
                setScrollToViewId("chat-bottom-anchor");
            }, 100);
        }
    }, [messages]);
    return {
        currentConversationId,
        chatTitle,
        messages,
        messageInput,
        loading,
        loadingMore,
        error,
        isOtherUserTyping,
        isOtherUserOnline,
        pagination,
        scrollToViewId,
        otherUserAvatar,
        currentUserAvatar,
        setMessageInput,
        loadMoreMessages,
        handleSendMessage,
        handleChooseImage,
        handleInputChange,
        handleRetryMessage,
    };
};
exports.useChat = useChat;
//# sourceMappingURL=useChat.js.map