"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const taro_1 = require("@tarojs/taro");
const components_1 = require("@tarojs/components");
const api_1 = require("../../config/api");
const messageService_1 = require("../../services/messageService");
const user_1 = require("../../store/user");
require("./index.scss");
const PostDetailPage = () => {
    var _a, _b, _c, _d;
    const router = (0, taro_1.useRouter)();
    const { id } = router.params;
    const [post, setPost] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(false);
    const [selectedImage, setSelectedImage] = (0, react_1.useState)(null);
    // 获取当前登录用户信息
    const { currentUser, userId } = (0, user_1.useUser)();
    (0, react_1.useEffect)(() => {
        if (id) {
            fetchPostDetail();
        }
        else {
            setError(true);
            setLoading(false);
        }
    }, [id]);
    // 监听用户状态变化，重新获取帖子数据
    (0, react_1.useEffect)(() => {
        if (id && currentUser) {
            console.log("用户状态变化，重新获取帖子数据");
            fetchPostDetail();
        }
    }, [currentUser === null || currentUser === void 0 ? void 0 : currentUser.id]);
    const fetchPostDetail = async () => {
        if (!id)
            return;
        setLoading(true);
        setError(false);
        try {
            console.log("Fetching post detail for ID:", id);
            const res = await taro_1.default.request({
                url: api_1.API_CONFIG.getApiUrl(`/posts/${id}`),
                method: "GET",
                header: {
                    "content-type": "application/json",
                },
            });
            console.log("API Response:", res);
            if (res.statusCode === 200 && res.data) {
                if (res.data.code === 0 && res.data.data) {
                    setPost(res.data.data);
                }
                else {
                    console.error("API returned error:", res.data);
                    setError(true);
                }
            }
            else {
                console.error("API request failed:", res);
                setError(true);
            }
        }
        catch (err) {
            console.error("Error fetching post detail:", err);
            setError(true);
        }
        finally {
            setLoading(false);
        }
    };
    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
    };
    const handleClosePreview = () => {
        setSelectedImage(null);
    };
    const handleMessageSeller = async () => {
        var _a, _b;
        if (!((_a = post === null || post === void 0 ? void 0 : post.users) === null || _a === void 0 ? void 0 : _a.openid) || !((_b = post === null || post === void 0 ? void 0 : post.users) === null || _b === void 0 ? void 0 : _b.nickname) || !id) {
            taro_1.default.showToast({
                title: "用户信息缺失，无法私信",
                icon: "none",
            });
            return;
        }
        try {
            taro_1.default.showLoading({ title: "正在连接..." });
            // 创建或找到对话
            // 获取当前用户的 openid
            const currentUserOpenid = (currentUser === null || currentUser === void 0 ? void 0 : currentUser.openid) || taro_1.default.getStorageSync("openid");
            if (!currentUserOpenid) {
                taro_1.default.hideLoading();
                taro_1.default.showToast({
                    title: "请先登录",
                    icon: "none",
                });
                return;
            }
            console.log("Creating conversation with:", {
                postId: id,
                otherUserId: post.users.openid,
                currentUserOpenid: currentUserOpenid,
            });
            const conversationId = await messageService_1.messageService.findOrCreateConversation(id, post.users.openid, currentUserOpenid);
            taro_1.default.hideLoading();
            // 跳转到聊天窗口
            taro_1.default.navigateTo({
                url: `/pages/messages/chat/index?conversationId=${conversationId}&postId=${id}&otherUserId=${encodeURIComponent(post.users.openid)}&nickname=${encodeURIComponent(post.users.nickname)}&avatar=${encodeURIComponent(post.users.avatar_url || "")}`,
            });
        }
        catch (error) {
            taro_1.default.hideLoading();
            console.error("Error creating conversation:", error);
            taro_1.default.showToast({
                title: "创建对话失败",
                icon: "none",
            });
        }
    };
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(components_1.View, { className: "detail-page", children: (0, jsx_runtime_1.jsx)(components_1.View, { className: "loading-container", children: (0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u52A0\u8F7D\u4E2D..." }) }) }));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsx)(components_1.View, { className: "detail-page", children: (0, jsx_runtime_1.jsxs)(components_1.View, { className: "error-container", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "error-text", children: "\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5" }), (0, jsx_runtime_1.jsx)(components_1.Button, { className: "retry-button", onClick: fetchPostDetail, children: "\u91CD\u65B0\u52A0\u8F7D" })] }) }));
    }
    if (!post) {
        return ((0, jsx_runtime_1.jsx)(components_1.View, { className: "detail-page", children: (0, jsx_runtime_1.jsx)(components_1.View, { className: "error-container", children: (0, jsx_runtime_1.jsx)(components_1.Text, { className: "error-text", children: "\u5E16\u5B50\u4E0D\u5B58\u5728" }) }) }));
    }
    // 兼容 images 字段为字符串、null、undefined等情况，确保 images 一定是数组
    let images = [];
    if (Array.isArray(post.images)) {
        images = post.images;
    }
    else if (typeof post.images === "string") {
        try {
            const parsed = JSON.parse(post.images);
            if (Array.isArray(parsed)) {
                images = parsed;
            }
            else if (parsed) {
                images = [parsed];
            }
        }
        catch (_e) {
            if (post.images)
                images = [post.images];
        }
    }
    else if (post.images) {
        images = [post.images];
    }
    // 判断是否显示联系方式部分
    // 只有当当前登录用户的 openid 不等于帖子发布者 openid 时才显示
    const shouldShowContactInfo = currentUser &&
        ((_a = post === null || post === void 0 ? void 0 : post.users) === null || _a === void 0 ? void 0 : _a.openid) &&
        currentUser.openid !== post.users.openid;
    // 调试信息
    console.log("=== 帖子详情页权限调试 ===");
    console.log("当前用户:", currentUser);
    console.log("帖子发布者:", post === null || post === void 0 ? void 0 : post.users);
    console.log("当前用户openid:", currentUser === null || currentUser === void 0 ? void 0 : currentUser.openid);
    console.log("帖子发布者openid:", (_b = post === null || post === void 0 ? void 0 : post.users) === null || _b === void 0 ? void 0 : _b.openid);
    console.log("是否显示私信按钮:", shouldShowContactInfo);
    return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "detail-page", children: [(0, jsx_runtime_1.jsxs)(components_1.View, { className: "content", children: [images.length > 0 && ((0, jsx_runtime_1.jsx)(components_1.View, { className: "image-grid", children: (0, jsx_runtime_1.jsx)(components_1.View, { className: "grid-container", children: images.map((image, index) => ((0, jsx_runtime_1.jsx)(components_1.View, { className: "grid-item", onClick: () => handleImageClick(image), children: (0, jsx_runtime_1.jsx)(components_1.Image, { className: "image", src: image, mode: "aspectFill" }) }, index))) }) })), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "post-info", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "title", children: post.title }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "description", children: post.content }), post.price && (0, jsx_runtime_1.jsxs)(components_1.Text, { className: "price", children: ["\u00A5", post.price] })] }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "user-info", children: [(0, jsx_runtime_1.jsx)(components_1.Image, { className: "avatar", src: ((_c = post.users) === null || _c === void 0 ? void 0 : _c.avatar_url) || "https://example.com/default-avatar.png" }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "user-details", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "nickname", children: ((_d = post.users) === null || _d === void 0 ? void 0 : _d.nickname) || "未知用户" }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "post-time", children: new Date(post.created_at).toLocaleDateString() })] })] }), shouldShowContactInfo && ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "contact-info", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "contact-title", children: "\u8054\u7CFB\u5356\u5BB6" }), (0, jsx_runtime_1.jsx)(components_1.View, { className: "wechat-id", children: (0, jsx_runtime_1.jsx)(components_1.Button, { className: "message-seller-button", onClick: handleMessageSeller, style: { marginLeft: "0px" }, children: "\u79C1\u4FE1\u5356\u5BB6" }) })] }))] }), selectedImage && ((0, jsx_runtime_1.jsx)(components_1.View, { className: "image-preview-modal", onClick: handleClosePreview, children: (0, jsx_runtime_1.jsx)(components_1.View, { className: "modal-content", children: (0, jsx_runtime_1.jsx)(components_1.Image, { className: "preview-image", src: selectedImage, mode: "aspectFit" }) }) }))] }));
};
exports.default = PostDetailPage;
//# sourceMappingURL=index.js.map