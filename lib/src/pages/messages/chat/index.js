"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const taro_1 = require("@tarojs/taro");
const components_1 = require("@tarojs/components");
const messageService_1 = require("../../../services/messageService");
const api_1 = require("../../../config/api");
const wsService_1 = require("../../../services/wsService");
const debounce_1 = require("../../../utils/debounce");
const request_1 = require("../../../utils/request");
const UserSwitcher_1 = require("../../../components/UserSwitcher");
const hooks_1 = require("../../../store/user/hooks");
const MessageBubble = ({ message, isMyMessage, otherUserAvatar, currentUserAvatar, }) => {
    const { content, status, type } = message;
    const handleImageClick = () => {
        if (type === "image") {
            taro_1.default.previewImage({
                urls: [content],
                current: content,
            });
        }
    };
    return ((0, jsx_runtime_1.jsxs)(components_1.View, { style: {
            display: "flex",
            justifyContent: isMyMessage ? "flex-end" : "flex-start",
            margin: "10rpx 20rpx",
            alignItems: "flex-end",
        }, children: [!isMyMessage && ((0, jsx_runtime_1.jsx)(components_1.Image, { className: "avatar", src: otherUserAvatar || "https://via.placeholder.com/40", style: {
                    width: "80rpx",
                    height: "80rpx",
                    borderRadius: "50%",
                    backgroundColor: "#ddd",
                    marginRight: "20rpx",
                    flexShrink: 0,
                } })), (0, jsx_runtime_1.jsxs)(components_1.View, { style: {
                    backgroundColor: isMyMessage ? "#007AFF" : "#F0F0F0",
                    color: isMyMessage ? "white" : "black",
                    padding: "20rpx",
                    borderRadius: "20rpx",
                    maxWidth: "70%",
                    position: "relative",
                }, children: [type === "text" ? ((0, jsx_runtime_1.jsx)(components_1.Text, { style: { fontSize: "28rpx", lineHeight: "1.4" }, children: decodeURIComponent(content) })) : type === "image" ? ((0, jsx_runtime_1.jsx)(components_1.Image, { src: content, mode: "widthFix", style: {
                            maxWidth: "400rpx",
                            borderRadius: "10rpx",
                        }, onClick: handleImageClick })) : null, isMyMessage && ((0, jsx_runtime_1.jsxs)(components_1.View, { style: {
                            position: "absolute",
                            bottom: "-30rpx",
                            right: "0",
                            fontSize: "20rpx",
                            color: "#999",
                            display: "flex",
                            alignItems: "center",
                        }, children: [status === "pending" && ((0, jsx_runtime_1.jsx)(components_1.Text, { style: { color: "#888" }, children: "\u53D1\u9001\u4E2D..." })), status === "sent" && (0, jsx_runtime_1.jsx)(components_1.Text, { style: { color: "#28a745" }, children: "\u2713" }), status === "failed" && ((0, jsx_runtime_1.jsxs)(components_1.View, { style: { display: "flex", alignItems: "center" }, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: { color: "#dc3545", marginRight: "10rpx" }, children: "\u2717" }), (0, jsx_runtime_1.jsx)(components_1.Button, { size: "mini", style: {
                                            backgroundColor: "#dc3545",
                                            color: "white",
                                            fontSize: "18rpx",
                                            padding: "5rpx 10rpx",
                                            borderRadius: "10rpx",
                                        }, onClick: () => {
                                            // 触发重试事件
                                            taro_1.default.eventCenter.trigger("retryMessage", message);
                                        }, children: "\u91CD\u8BD5" })] }))] })), message.timestamp && ((0, jsx_runtime_1.jsx)(components_1.Text, { style: {
                            display: "block",
                            fontSize: "20rpx",
                            color: "#bbb",
                            marginTop: "8rpx",
                            textAlign: isMyMessage ? "right" : "left",
                        }, children: new Date(message.timestamp).toLocaleString() }))] }), isMyMessage && ((0, jsx_runtime_1.jsx)(components_1.Image, { className: "avatar", src: currentUserAvatar, style: {
                    width: "80rpx",
                    height: "80rpx",
                    borderRadius: "50%",
                    backgroundColor: "#ddd",
                    marginLeft: "20rpx",
                    flexShrink: 0,
                } }))] }));
};
const ConnectionStatus = ({ isConnected, isConnecting, }) => {
    if (isConnecting) {
        return ((0, jsx_runtime_1.jsxs)(components_1.View, { style: {
                backgroundColor: "#ffc107",
                color: "white",
                padding: "10rpx 20rpx",
                borderRadius: "20rpx",
                fontSize: "24rpx",
                display: "flex",
                alignItems: "center",
            }, children: [(0, jsx_runtime_1.jsx)(components_1.View, { style: {
                        width: "20rpx",
                        height: "20rpx",
                        borderRadius: "50%",
                        backgroundColor: "white",
                        marginRight: "10rpx",
                        animation: "pulse 1s infinite",
                    } }), (0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u8FDE\u63A5\u4E2D..." })] }));
    }
    return ((0, jsx_runtime_1.jsxs)(components_1.View, { style: {
            backgroundColor: isConnected ? "#28a745" : "#dc3545",
            color: "white",
            padding: "10rpx 20rpx",
            borderRadius: "20rpx",
            fontSize: "24rpx",
            display: "flex",
            alignItems: "center",
        }, children: [(0, jsx_runtime_1.jsx)(components_1.View, { style: {
                    width: "20rpx",
                    height: "20rpx",
                    borderRadius: "50%",
                    backgroundColor: "white",
                    marginRight: "10rpx",
                } }), (0, jsx_runtime_1.jsx)(components_1.Text, { children: isConnected ? "已连接" : "未连接" })] }));
};
const ChatWindowPage = () => {
    const router = (0, taro_1.useRouter)();
    console.log("Chat page params:", router.params);
    const { postId, conversationId: paramConversationId, otherUserId, nickname: otherUserNickname, avatar: otherUserAvatarParam, } = router.params;
    const { currentUser } = (0, hooks_1.useUser)();
    // 新增 conversationId 状态
    const [currentConversationId, setCurrentConversationId] = (0, react_1.useState)(paramConversationId || null);
    // 调试信息
    console.log("Chat page params:", {
        postId,
        paramConversationId,
        otherUserId,
        otherUserNickname,
        otherUserAvatarParam,
    });
    // 调试当前用户信息
    console.log("Current user info:", {
        currentUser,
        currentUserId: currentUser === null || currentUser === void 0 ? void 0 : currentUser.id,
        currentUserOpenid: currentUser === null || currentUser === void 0 ? void 0 : currentUser.openid,
        hasOpenid: !!(currentUser === null || currentUser === void 0 ? void 0 : currentUser.openid),
    });
    const [chatTitle, setChatTitle] = (0, react_1.useState)(otherUserNickname ? decodeURIComponent(otherUserNickname) : "聊天");
    const [messageInput, setMessageInput] = (0, react_1.useState)("");
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [loadingMore, setLoadingMore] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(false);
    const [isOtherUserTyping, setIsOtherUserTyping] = (0, react_1.useState)(false);
    const [isOtherUserOnline, setIsOtherUserOnline] = (0, react_1.useState)(false);
    const [socketConnected, setSocketConnected] = (0, react_1.useState)(false);
    const [isConnecting, setIsConnecting] = (0, react_1.useState)(false);
    const [connectionError, setConnectionError] = (0, react_1.useState)(null);
    const [pagination, setPagination] = (0, react_1.useState)(null);
    const [hasInitialized, setHasInitialized] = (0, react_1.useState)(false);
    const scrollViewRef = (0, react_1.useRef)(null);
    const [scrollToViewId, setScrollToViewId] = (0, react_1.useState)("");
    const reconnectTimeoutRef = (0, react_1.useRef)(null);
    const otherUserAvatar = otherUserAvatarParam
        ? decodeURIComponent(otherUserAvatarParam)
        : "https://via.placeholder.com/40";
    // 调试信息
    console.log("Chat page final values:", {
        chatTitle,
        otherUserAvatar,
        decodedNickname: otherUserNickname
            ? decodeURIComponent(otherUserNickname)
            : null,
    });
    // 如果没有当前用户或对话ID，则不渲染或显示加载状态
    if (!currentUser || !currentUser.openid || !otherUserId) {
        return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "chat-window-page", style: { textAlign: "center", padding: "40rpx" }, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { children: !(currentUser === null || currentUser === void 0 ? void 0 : currentUser.openid) ? "请先登录" : "加载中..." }), !(currentUser === null || currentUser === void 0 ? void 0 : currentUser.openid) && ((0, jsx_runtime_1.jsx)(components_1.Button, { onClick: () => taro_1.default.navigateTo({ url: "/pages/my/index" }), style: { marginTop: "20rpx" }, children: "\u53BB\u767B\u5F55" }))] }));
    }
    // 检查是否有必要的参数
    if (!currentConversationId && !postId) {
        return ((0, jsx_runtime_1.jsx)(components_1.View, { className: "chat-window-page", style: { textAlign: "center", padding: "40rpx" }, children: (0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u7F3A\u5C11\u5FC5\u8981\u53C2\u6570" }) }));
    }
    // 获取或创建对话，并设置 conversationId
    const initConversation = (0, react_1.useCallback)(async () => {
        console.log("initConversation called with:", {
            postId,
            currentConversationId,
            otherUserId,
            currentUserOpenid: currentUser === null || currentUser === void 0 ? void 0 : currentUser.openid,
            hasAllRequired: !!(currentConversationId ||
                (postId && otherUserId && (currentUser === null || currentUser === void 0 ? void 0 : currentUser.openid))),
        });
        // 如果已经有 conversationId，直接使用
        if (currentConversationId) {
            console.log("✅ Using existing conversationId:", currentConversationId);
            setLoading(false);
            return;
        }
        // 检查用户登录状态和 openid
        if (!(currentUser === null || currentUser === void 0 ? void 0 : currentUser.openid)) {
            console.error("❌ initConversation: currentUser.openid is missing!");
            console.log("currentUser:", currentUser);
            // 尝试从本地缓存获取 openid
            const cachedOpenid = taro_1.default.getStorageSync("openid");
            console.log("cachedOpenid:", cachedOpenid);
            if (cachedOpenid) {
                console.log("✅ Found openid in cache, using it");
                // 如果缓存中有 openid，使用它
                try {
                    const convId = await messageService_1.messageService.findOrCreateConversation(postId, otherUserId, cachedOpenid);
                    setCurrentConversationId(convId);
                    console.log("Initialized conversation ID:", convId);
                }
                catch (err) {
                    console.error("Error initializing conversation:", err);
                    setError(true);
                    taro_1.default.showToast({ title: "获取对话失败", icon: "none" });
                }
                return;
            }
            else {
                taro_1.default.showToast({ title: "请先登录", icon: "none" });
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
            taro_1.default.showToast({ title: "获取对话失败", icon: "none" });
        }
        finally {
            setLoading(false);
        }
    }, [postId, currentConversationId, otherUserId, currentUser.openid]);
    // Debounced function to emit typing event
    const debouncedTyping = (0, react_1.useCallback)((0, debounce_1.debounce)(() => {
        if ((0, wsService_1.isWebSocketConnected)() && currentConversationId) {
            console.log("Emitting stopTyping");
            (0, wsService_1.emitWebSocketEvent)("stopTyping", {
                conversationId: currentConversationId,
            });
        }
    }, 1000), [currentConversationId]);
    // 连接管理
    const handleConnect = (0, react_1.useCallback)(async () => {
        if ((0, wsService_1.isWebSocketConnected)())
            return;
        setIsConnecting(true);
        setConnectionError(null);
        try {
            await (0, wsService_1.connectWebSocket)(currentUser.openid);
            setSocketConnected(true);
            console.log("Socket连接成功");
        }
        catch (error) {
            console.error("Socket连接失败:", error);
            setConnectionError("连接失败，请检查网络");
            setSocketConnected(false);
            reconnectTimeoutRef.current = setTimeout(() => {
                handleConnect();
            }, 5000);
        }
        finally {
            setIsConnecting(false);
        }
    }, [currentUser.openid]);
    // 加入房间
    const handleJoinRoom = (0, react_1.useCallback)(() => {
        if (!currentConversationId || !(0, wsService_1.isWebSocketConnected)())
            return;
        try {
            console.log(`加入房间: ${currentConversationId}`);
            (0, wsService_1.emitWebSocketEvent)("requestOnlineStatus", {
                conversationId: currentConversationId,
            });
        }
        catch (error) {
            console.error("加入房间失败:", error);
        }
    }, [currentConversationId]);
    // 离开房间
    const handleLeaveRoom = (0, react_1.useCallback)(() => {
        if (!currentConversationId)
            return;
        try {
            console.log(`离开房间: ${currentConversationId}`);
        }
        catch (error) {
            console.error("离开房间失败:", error);
        }
    }, [currentConversationId]);
    const sortMessages = (0, react_1.useCallback)((arr) => arr
        .slice()
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()), []);
    const fetchChatMessages = (0, react_1.useCallback)(async (page = 1, isLoadMore = false) => {
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
            taro_1.default.showToast({
                title: "加载消息失败",
                icon: "none",
            });
        }
        finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [currentConversationId, currentUser.openid]);
    const loadMoreMessages = (0, react_1.useCallback)(async () => {
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
            taro_1.default.showToast({
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
    const markConversationAsRead = (0, react_1.useCallback)(async () => {
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
    // 消息处理器
    const messageHandler = (0, react_1.useCallback)((msg) => {
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
                if (msg.messageId && prev.some((m) => m.id === msg.messageId)) {
                    return prev;
                }
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
            taro_1.default.showToast({ title: "发送失败", icon: "none" });
        }
    }, [currentConversationId]);
    // 重试消息处理器
    const handleRetryMessage = (0, react_1.useCallback)((message) => {
        if (!currentConversationId || !otherUserId || !currentUser.openid)
            return;
        setMessages((prev) => prev.map((msg) => msg.id === message.id ? Object.assign(Object.assign({}, msg), { status: "pending" }) : msg));
        if ((0, wsService_1.isWebSocketConnected)()) {
            try {
                (0, wsService_1.emitWebSocketEvent)("sendMessage", {
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
    }, [currentConversationId, otherUserId, currentUser.openid]);
    // Effect for initializing conversation and fetching data
    (0, react_1.useEffect)(() => {
        if (currentUser.openid &&
            otherUserId &&
            (currentConversationId || postId)) {
            initConversation(); // First, initialize the conversation
        }
    }, [
        currentUser.openid,
        currentConversationId,
        postId,
        otherUserId,
        initConversation,
    ]);
    (0, react_1.useEffect)(() => {
        if (currentConversationId) {
            // Only proceed if conversationId is available
            // 1. 建立WebSocket连接
            handleConnect();
            // 2. 加载历史消息
            fetchChatMessages();
            // 3. 标记消息为已读
            markConversationAsRead();
            // 4. 设置导航栏标题
            if (otherUserNickname) {
                const decodedNickname = decodeURIComponent(otherUserNickname);
                taro_1.default.setNavigationBarTitle({
                    title: decodedNickname,
                });
            }
            // 5. 设置消息处理器
            (0, wsService_1.setMessageCallback)(messageHandler);
            // 6. 设置重试消息处理器
            taro_1.default.eventCenter.on("retryMessage", handleRetryMessage);
            return () => {
                taro_1.default.eventCenter.off("retryMessage", handleRetryMessage);
                (0, wsService_1.removeMessageCallback)();
            };
        }
    }, [
        currentConversationId,
        currentUser.openid,
        otherUserNickname,
        handleConnect,
        fetchChatMessages,
        markConversationAsRead,
        messageHandler,
        handleRetryMessage,
    ]);
    // 清理函数
    (0, react_1.useEffect)(() => {
        return () => {
            (0, wsService_1.removeMessageCallback)();
            taro_1.default.eventCenter.off("retryMessage");
        };
    }, []);
    const handleInputChange = (e) => {
        setMessageInput(e.detail.value);
        if ((0, wsService_1.isWebSocketConnected)() && currentConversationId) {
            try {
                console.log("Emitting typing");
                (0, wsService_1.emitWebSocketEvent)("typing", { conversationId: currentConversationId });
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
            taro_1.default.showToast({ title: "不能给自己发送消息", icon: "none" });
            return;
        }
        if (!(0, wsService_1.isWebSocketConnected)()) {
            taro_1.default.showToast({ title: "连接中，请稍后重试", icon: "none" });
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
        setMessages((prevMessages) => sortMessages([...prevMessages, optimisticMessage]));
        setMessageInput("");
        try {
            (0, wsService_1.emitWebSocketEvent)("sendMessage", {
                conversationId: currentConversationId,
                toUserId: otherUserId,
                type: "text",
                content: optimisticMessage.content,
                timestamp: Date.now(),
                clientTempId,
            });
        }
        catch (error) {
            console.error("发送消息失败:", error);
            try {
                console.log(`[handleSendMessage] HTTP fallback calling sendMessage with currentConversationId: ${currentConversationId}, currentUser.openid: ${currentUser.openid}`);
                const sent = await messageService_1.messageService.sendMessage(currentConversationId, currentUser.openid, otherUserId, optimisticMessage.content, "text");
                console.log("HTTP fallback sent:", sent);
                setMessages((prevMessages) => sortMessages(prevMessages.map((msg) => msg.content === sent.content &&
                    msg.senderId === sent.senderId &&
                    msg.status === "pending"
                    ? Object.assign(Object.assign(Object.assign({}, msg), sent), { status: "sent" }) : msg)));
            }
            catch (err) {
                console.error("Error sending message via HTTP API:", err);
                setMessages((prevMessages) => sortMessages(prevMessages.map((msg) => msg.id === clientTempId ? Object.assign(Object.assign({}, msg), { status: "failed" }) : msg)));
                taro_1.default.showToast({ title: "发送失败", icon: "none" });
            }
        }
    };
    const handleChooseImage = () => {
        taro_1.default.chooseImage({
            count: 1,
            sizeType: ["original", "compressed"],
            sourceType: ["album", "camera"],
            success: (res) => {
                const tempFilePath = res.tempFilePaths[0];
                handleSendImage(tempFilePath);
            },
            fail: (err) => {
                if (err.errMsg && !err.errMsg.includes("cancel")) {
                    taro_1.default.showToast({ title: "选择图片失败", icon: "none" });
                }
            },
        });
    };
    const handleSendImage = async (tempFilePath) => {
        if (!currentConversationId || !otherUserId || !currentUser.openid)
            return;
        if (currentUser.openid === otherUserId) {
            taro_1.default.showToast({ title: "不能给自己发送消息", icon: "none" });
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
        setMessages((prevMessages) => sortMessages([...prevMessages, optimisticMessage]));
        try {
            taro_1.default.showLoading({ title: "发送中..." });
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
            setMessages((prevMessages) => sortMessages(prevMessages.map((msg) => msg.id === clientTempId
                ? Object.assign(Object.assign({}, msg), { content: imageUrl, status: "sent" }) : msg)));
            if ((0, wsService_1.isWebSocketConnected)()) {
                try {
                    (0, wsService_1.emitWebSocketEvent)("sendMessage", {
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
                    setMessages((prevMessages) => sortMessages(prevMessages.map((msg) => msg.id === clientTempId
                        ? Object.assign(Object.assign(Object.assign({}, msg), sent), { status: "sent" }) : msg)));
                }
            }
            else {
                console.log(`[handleSendImage] HTTP fallback calling sendMessage (for image) with currentConversationId: ${currentConversationId}, currentUser.openid: ${currentUser.openid}`);
                const sent = await messageService_1.messageService.sendMessage(currentConversationId, currentUser.openid, otherUserId, imageUrl, "image");
                setMessages((prevMessages) => sortMessages(prevMessages.map((msg) => msg.id === clientTempId
                    ? Object.assign(Object.assign(Object.assign({}, msg), sent), { status: "sent" }) : msg)));
            }
            taro_1.default.hideLoading();
        }
        catch (error) {
            console.error("Error sending image:", error);
            taro_1.default.hideLoading();
            setMessages((prevMessages) => sortMessages(prevMessages.map((msg) => msg.id === clientTempId ? Object.assign(Object.assign({}, msg), { status: "failed" }) : msg)));
            taro_1.default.showToast({ title: "发送失败", icon: "none" });
        }
    };
    const handleRetryConnection = () => {
        handleConnect();
    };
    (0, react_1.useEffect)(() => {
        if (messages.length > 0) {
            setScrollToViewId("");
            setTimeout(() => {
                setScrollToViewId("chat-bottom-anchor");
            }, 100);
        }
    }, [messages]);
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(components_1.View, { className: "chat-window-page", style: { textAlign: "center", padding: "40rpx" }, children: (0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u52A0\u8F7D\u4E2D..." }) }));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "chat-window-page", style: { textAlign: "center", padding: "40rpx", color: "red" }, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u3002" }), (0, jsx_runtime_1.jsx)(components_1.Button, { onClick: () => fetchChatMessages(), style: { marginTop: "20rpx" }, children: "\u91CD\u65B0\u52A0\u8F7D" })] }));
    }
    return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "chat-window-page", style: {
            width: "100vw",
            height: "100vh",
            position: "relative",
            background: "#f8f9fa",
        }, children: [(0, jsx_runtime_1.jsxs)(components_1.View, { className: "header", style: {
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "120rpx",
                    zIndex: 1001,
                    padding: "20rpx 30rpx",
                    borderBottom: "2rpx solid #eee",
                    backgroundColor: "white",
                    display: "flex",
                    alignItems: "center",
                }, children: [(0, jsx_runtime_1.jsx)(components_1.Image, { src: otherUserAvatar || "https://via.placeholder.com/40", style: {
                            width: "80rpx",
                            height: "80rpx",
                            borderRadius: "50%",
                            marginRight: "20rpx",
                            backgroundColor: "#eee",
                        }, onError: (e) => console.log("Avatar image error:", e), onLoad: () => console.log("Avatar image loaded successfully") }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: { fontSize: "32rpx", fontWeight: "bold", color: "#000" }, children: chatTitle || "聊天" })] }), process.env.NODE_ENV === "development" && ((0, jsx_runtime_1.jsx)(UserSwitcher_1.default, { isVisible: false, onClose: () => { } })), (0, jsx_runtime_1.jsxs)(components_1.ScrollView, { scrollY: true, style: {
                    position: "absolute",
                    top: "120rpx",
                    bottom: "140rpx",
                    left: 0,
                    right: 0,
                    width: "100vw",
                    padding: "20rpx 0",
                    background: "#f8f9fa",
                }, ref: scrollViewRef, scrollIntoView: scrollToViewId, scrollWithAnimation: true, onScrollToUpper: loadMoreMessages, upperThreshold: 50, enableFlex: true, children: [loadingMore && ((0, jsx_runtime_1.jsx)(components_1.View, { style: {
                            textAlign: "center",
                            padding: "20rpx",
                            color: "#888",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }, children: (0, jsx_runtime_1.jsx)(components_1.Text, { style: { fontSize: "24rpx" }, children: "\u52A0\u8F7D\u66F4\u591A\u6D88\u606F..." }) })), !loadingMore &&
                        pagination &&
                        !pagination.hasMore &&
                        messages.length > 0 && ((0, jsx_runtime_1.jsx)(components_1.View, { style: {
                            textAlign: "center",
                            padding: "20rpx",
                            color: "#999",
                            borderTop: "1rpx solid #eee",
                            marginTop: "10rpx",
                        }, children: (0, jsx_runtime_1.jsx)(components_1.Text, { style: { fontSize: "20rpx" }, children: "\u6CA1\u6709\u66F4\u591A\u6D88\u606F\u4E86" }) })), isOtherUserTyping && ((0, jsx_runtime_1.jsx)(components_1.View, { style: { padding: "10rpx 20rpx", color: "#888" }, children: (0, jsx_runtime_1.jsx)(components_1.Text, { style: { fontSize: "24rpx" }, children: "\u5BF9\u65B9\u6B63\u5728\u8F93\u5165..." }) })), messages.length > 0 ? (messages.map((message, idx, arr) => ((0, jsx_runtime_1.jsxs)(components_1.View, { id: `msg-${message.id}`, children: [(0, jsx_runtime_1.jsx)(MessageBubble, { message: message, isMyMessage: message.senderId === currentUser.openid, otherUserAvatar: otherUserAvatar, currentUserAvatar: currentUser.avatarUrl }), idx === arr.length - 1 && (0, jsx_runtime_1.jsx)(components_1.View, { id: "chat-bottom-anchor" })] }, message.id)))) : ((0, jsx_runtime_1.jsxs)(components_1.View, { style: { textAlign: "center", padding: "40rpx", color: "#999" }, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: { fontSize: "28rpx" }, children: "\u6682\u65E0\u6D88\u606F" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: { fontSize: "24rpx", marginTop: "10rpx" }, children: "\u5F00\u59CB\u804A\u5929\u5427\uFF01" })] }))] }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "input-area", style: {
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    width: "100vw",
                    height: "140rpx",
                    zIndex: 100,
                    display: "flex",
                    padding: "20rpx",
                    borderTop: "2rpx solid #eee",
                    alignItems: "center",
                    backgroundColor: "white",
                }, children: [(0, jsx_runtime_1.jsx)(components_1.Button, { onClick: handleChooseImage, style: {
                            width: "60rpx",
                            height: "60rpx",
                            backgroundColor: "#f0f0f0",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: "20rpx",
                            border: "none",
                            padding: 0,
                        }, children: (0, jsx_runtime_1.jsx)(components_1.Text, { style: { fontSize: "32rpx", color: "#666" }, children: "\uD83D\uDCF7" }) }), (0, jsx_runtime_1.jsx)(components_1.Input, { type: "text", className: "message-input", placeholder: "\u8F93\u5165\u6D88\u606F", value: messageInput, onInput: handleInputChange, style: {
                            flex: 1,
                            border: "2rpx solid #ddd",
                            borderRadius: "20rpx",
                            padding: "16rpx 20rpx",
                            fontSize: "28rpx",
                            backgroundColor: "#f8f9fa",
                        } }), (0, jsx_runtime_1.jsx)(components_1.Button, { onClick: handleSendMessage, disabled: !messageInput.trim(), style: {
                            marginLeft: "20rpx",
                            backgroundColor: messageInput.trim() ? "#007AFF" : "#ccc",
                            color: "white",
                            borderRadius: "20rpx",
                            padding: "16rpx 30rpx",
                            fontSize: "28rpx",
                            border: "none",
                        }, children: "\u53D1\u9001" })] })] }));
};
exports.default = ChatWindowPage;
//# sourceMappingURL=index.js.map