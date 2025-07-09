"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const taro_1 = require("@tarojs/taro");
const components_1 = require("@tarojs/components");
const messageService_1 = require("../../../services/messageService");
const hooks_1 = require("../../../store/user/hooks");
const ConversationItem = ({ conversation, onClick }) => {
    const { otherUserAvatar, otherUserNickname, lastMessagePreview, lastMessageTime, unreadCount, } = conversation;
    const handleClick = () => {
        onClick(conversation);
    };
    return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "conversation-item", style: {
            display: "flex",
            alignItems: "center",
            padding: "10px",
            borderBottom: "1px solid #eee",
        }, onClick: handleClick, children: [(0, jsx_runtime_1.jsx)(components_1.Image, { className: "avatar", src: otherUserAvatar || "https://via.placeholder.com/50", style: {
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    backgroundColor: "#ddd",
                    marginRight: "10px",
                } }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "content", style: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "nickname", style: { fontWeight: "bold" }, children: otherUserNickname }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "last-message", style: { color: "#666", fontSize: "12px" }, children: lastMessagePreview })] }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "meta", style: {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                }, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "updated-at", style: { fontSize: "10px", color: "#999" }, children: lastMessageTime }), unreadCount > 0 && ((0, jsx_runtime_1.jsx)(components_1.View, { className: "unread-badge", style: {
                            backgroundColor: "red",
                            color: "white",
                            borderRadius: "50%",
                            width: "18px",
                            height: "18px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            fontSize: "10px",
                            marginTop: "5px",
                        }, children: unreadCount }))] })] }));
};
const MessageListPage = () => {
    const { currentUser } = (0, hooks_1.useUser)();
    const [conversations, setConversations] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(false);
    const fetchConversations = async (userId) => {
        setLoading(true);
        setError(false);
        try {
            const data = await messageService_1.messageService.fetchConversations(userId);
            setConversations(data);
        }
        catch (err) {
            console.error("Error fetching conversations:", err);
            setError(true);
            taro_1.default.showToast({
                title: "加载会话失败",
                icon: "none",
            });
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        const loadData = () => {
            if (currentUser && currentUser.openid) {
                fetchConversations(currentUser.openid);
            }
            else {
                setConversations([]);
                setLoading(false);
                setError(false);
            }
        };
        loadData();
        taro_1.default.eventCenter.on("userInfoUpdated", loadData);
        return () => {
            taro_1.default.eventCenter.off("userInfoUpdated", loadData);
        };
    }, [currentUser]);
    const handleConversationClick = (conversation) => {
        console.log("跳转前的 conversation:", conversation);
        console.log("postId:", conversation.postId);
        if (!currentUser ||
            !currentUser.openid ||
            !conversation.otherUserId ||
            currentUser.openid === conversation.otherUserId) {
            taro_1.default.showToast({ title: "无法打开此会话", icon: "none" });
            return;
        }
        const navigateUrl = `/pages/messages/chat/index?conversationId=${conversation.id}&postId=${conversation.postId}&otherUserId=${encodeURIComponent(conversation.otherUserId)}&nickname=${encodeURIComponent(conversation.otherUserNickname)}&avatar=${encodeURIComponent(conversation.otherUserAvatar)}`;
        console.log("最终跳转 url:", navigateUrl);
        taro_1.default.navigateTo({
            url: navigateUrl,
        });
    };
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(components_1.View, { className: "message-list-page", style: { textAlign: "center", padding: "20px" }, children: (0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u52A0\u8F7D\u4E2D..." }) }));
    }
    if (!(currentUser === null || currentUser === void 0 ? void 0 : currentUser.openid)) {
        return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "message-list-page", style: { textAlign: "center", padding: "40rpx" }, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u8BF7\u5148\u767B\u5F55\u4EE5\u67E5\u770B\u4F1A\u8BDD" }), (0, jsx_runtime_1.jsx)(components_1.Button, { onClick: () => taro_1.default.navigateTo({ url: "/pages/my/index" }), style: { marginTop: "20rpx" }, children: "\u53BB\u767B\u5F55" })] }));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "message-list-page", style: { textAlign: "center", padding: "20px", color: "red" }, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u3002" }), (0, jsx_runtime_1.jsx)(components_1.Button, { onClick: () => fetchConversations(currentUser.openid), style: { marginTop: "10px" }, children: "\u91CD\u65B0\u52A0\u8F7D" })] }));
    }
    return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "message-list-page", children: [(0, jsx_runtime_1.jsx)(components_1.View, { className: "header", style: {
                    textAlign: "center",
                    padding: "15px",
                    borderBottom: "1px solid #eee",
                    fontWeight: "bold",
                }, children: (0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u6211\u7684\u6D88\u606F" }) }), (0, jsx_runtime_1.jsx)(components_1.ScrollView, { scrollY: true, style: { height: "calc(100vh - 50px)" }, children: conversations.length > 0 ? (conversations.map((conversation) => ((0, jsx_runtime_1.jsx)(ConversationItem, { conversation: conversation, onClick: handleConversationClick }, conversation.id)))) : ((0, jsx_runtime_1.jsx)(components_1.View, { style: { textAlign: "center", padding: "20px", color: "#999" }, children: (0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u6682\u65E0\u4F1A\u8BDD" }) })) })] }));
};
exports.default = MessageListPage;
//# sourceMappingURL=index.js.map