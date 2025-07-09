"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageService = void 0;
const taro_1 = require("@tarojs/taro");
const api_1 = require("../config/api");
// REMOVED: Mock data for demonstration purposes
// let mockConversations: Conversation[] = [...];
// let mockMessages: Message[] = [...];
// REMOVED: Helper to simulate network delay
// const simulateDelay = (ms: number) => new Promise((res) => setTimeout(res, ms));
exports.messageService = {
    /**
     * Fetches a list of conversations for the current user.
     * @param currentUserId The ID of the current logged-in user.
     * @returns A promise that resolves with an array of Conversation objects.
     */
    fetchConversations: async (currentUserId) => {
        try {
            console.log(`[messageService.fetchConversations] Sending x-openid: ${currentUserId}`);
            const res = await taro_1.default.request({
                url: api_1.API_CONFIG.getApiUrl("/conversations/list"),
                method: "GET",
                header: {
                    "content-type": "application/json",
                    "x-openid": String(currentUserId),
                },
            });
            if (res.statusCode === 200 &&
                res.data.code === 0 &&
                Array.isArray(res.data.data)) {
                return res.data.data;
            }
            else {
                console.error("API returned error or invalid data:", res);
                throw new Error("Failed to fetch conversations");
            }
        }
        catch (err) {
            console.error("Error fetching conversations:", err);
            throw err;
        }
    },
    /**
     * Fetches messages for a specific conversation with pagination.
     * @param conversationId The ID of the conversation.
     * @param userOpenId The openId of the current logged-in user (for x-openid header).
     * @param page The page number (default: 1).
     * @param limit The number of messages per page (default: 20, max: 50).
     * @param before Optional timestamp to get messages before this time.
     * @returns A promise that resolves with MessagesResponse object.
     */
    fetchMessages: async (conversationId, userOpenId, page = 1, limit = 20, before) => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: Math.min(limit, 50).toString(),
            });
            if (before) {
                params.append("before", before.toString());
            }
            console.log(`[messageService.fetchMessages] Sending x-openid: ${userOpenId}`);
            const res = await taro_1.default.request({
                url: api_1.API_CONFIG.getApiUrl(`/conversations/${conversationId}/messages?${params}`),
                method: "GET",
                header: {
                    "content-type": "application/json",
                    "x-openid": String(userOpenId),
                },
            });
            if (res.statusCode === 200 &&
                res.data.code === 0 &&
                res.data.data &&
                res.data.data.messages) {
                return res.data.data;
            }
            else {
                console.error("API returned error or invalid data:", res);
                throw new Error("Failed to fetch messages");
            }
        }
        catch (err) {
            console.error("Error fetching messages:", err);
            throw err;
        }
    },
    /**
     * Sends a new message.
     * @param conversationId The ID of the conversation.
     * @param userOpenId The openId of the current logged-in user (for x-openid header).
     * @param receiverId The openid of the receiver.
     * @param content The content of the message.
     * @param type The type of the message (text or image).
     * @returns A promise that resolves with the newly created Message object.
     */
    sendMessage: async (conversationId, userOpenId, receiverId, content, type = "text") => {
        try {
            console.log(`[messageService.sendMessage] Sending x-openid: ${userOpenId}, receiverId: ${receiverId}`);
            const res = await taro_1.default.request({
                url: api_1.API_CONFIG.getApiUrl(`/conversations/${conversationId}/messages`),
                method: "POST",
                header: {
                    "content-type": "application/json",
                    "x-openid": String(userOpenId),
                },
                data: {
                    content,
                    type,
                    receiverId,
                },
            });
            if (res.statusCode === 200 && res.data.code === 0 && res.data.data) {
                return res.data.data;
            }
            else {
                console.error("API returned error or invalid data:", res);
                throw new Error("Failed to send message");
            }
        }
        catch (err) {
            console.error("Error sending message:", err);
            throw err;
        }
    },
    /**
     * Marks messages in a conversation as read.
     * @param conversationId The ID of the conversation.
     * @param userOpenId The openId of the current logged-in user (for x-openid header).
     * @returns A promise that resolves when the operation is complete.
     */
    markMessagesAsRead: async (conversationId, userOpenId) => {
        try {
            console.log(`[messageService.markMessagesAsRead] Sending x-openid: ${userOpenId}`);
            const res = await taro_1.default.request({
                url: api_1.API_CONFIG.getApiUrl(`/conversations/${conversationId}/mark-read`),
                method: "POST",
                header: {
                    "content-type": "application/json",
                    "x-openid": String(userOpenId),
                },
            });
            if (res.statusCode === 200 && res.data.code === 0) {
                console.log("Messages marked as read successfully");
            }
            else {
                console.error("API returned error or invalid data:", res);
                throw new Error("Failed to mark messages as read");
            }
        }
        catch (err) {
            console.error("Error marking messages as read:", err);
            throw err;
        }
    },
    findOrCreateConversation: async (postId, otherUserId, currentUserId) => {
        try {
            // 验证参数
            if (!currentUserId || currentUserId === "undefined") {
                throw new Error("currentUserId is required and cannot be undefined");
            }
            console.log(`[messageService.findOrCreateConversation] Sending x-openid: ${currentUserId}`);
            const res = await taro_1.default.request({
                url: api_1.API_CONFIG.getApiUrl("/conversations/find-or-create"),
                method: "POST",
                header: {
                    "content-type": "application/json",
                    "x-openid": String(currentUserId),
                },
                data: {
                    postId,
                    otherUserId,
                },
            });
            if (res.statusCode === 200 && res.data) {
                if (res.data.code === 0 && res.data.data) {
                    return res.data.data.conversationId;
                }
                else {
                    throw new Error(res.data.message || "创建对话失败");
                }
            }
            else {
                throw new Error("网络请求失败");
            }
        }
        catch (error) {
            console.error("Error finding or creating conversation:", error);
            throw error;
        }
    },
};
//# sourceMappingURL=messageService.js.map