"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = My;
const jsx_runtime_1 = require("react/jsx-runtime");
const taro_1 = require("@tarojs/taro");
const components_1 = require("@tarojs/components");
const hooks_1 = require("../../store/user/hooks");
require("./index.scss");
const react_1 = require("react");
const DEFAULT_AVATAR = "https://picsum.photos/seed/avatar/100"; // Placeholder avatar
const DEFAULT_NICKNAME = "点击设置昵称";
function My() {
    // 使用新的用户状态管理
    const { currentUser, userNickname, userAvatar } = (0, hooks_1.useUser)();
    // 本地状态用于显示
    const [userInfo, setUserInfo] = (0, react_1.useState)({
        nickname: DEFAULT_NICKNAME,
        avatarUrl: DEFAULT_AVATAR,
    });
    // 更新用户信息显示
    (0, react_1.useEffect)(() => {
        if (currentUser && userNickname) {
            setUserInfo({
                nickname: userNickname,
                avatarUrl: userAvatar || DEFAULT_AVATAR,
            });
            console.log("Updated user info from Redux store:", currentUser);
        }
        else {
            setUserInfo({ nickname: DEFAULT_NICKNAME, avatarUrl: DEFAULT_AVATAR });
        }
    }, [currentUser, userNickname, userAvatar]);
    // 监听全局 userInfoUpdated 事件
    (0, react_1.useEffect)(() => {
        const handler = () => {
            console.log("Received userInfoUpdated event");
        };
        taro_1.default.eventCenter.on("userInfoUpdated", handler);
        return () => {
            taro_1.default.eventCenter.off("userInfoUpdated", handler);
        };
    }, []);
    const handleAvatarClick = () => {
        taro_1.default.showActionSheet({
            itemList: ["从相册选择", "拍照"],
            success: (res) => {
                let sourceType;
                if (res.tapIndex === 0) {
                    sourceType = ["album"];
                }
                else if (res.tapIndex === 1) {
                    sourceType = ["camera"];
                }
                else {
                    return; // Should not happen
                }
                taro_1.default.chooseImage({
                    count: 1,
                    sizeType: ["compressed"],
                    sourceType: sourceType, // Cast to satisfy TypeScript
                    success: (imgRes) => {
                        const tempFilePath = imgRes.tempFilePaths[0];
                        console.log("Image chosen:", tempFilePath);
                        // 1. 立即用 tempFilePath 更新 UI
                        const newUserInfo = Object.assign(Object.assign({}, userInfo), { avatarUrl: tempFilePath });
                        setUserInfo(newUserInfo);
                        // 2. 立即更新本地存储（临时路径）
                        try {
                            const loggedInUser = getLoggedInUser();
                            if (loggedInUser) {
                                const updatedLoggedInUser = Object.assign(Object.assign({}, loggedInUser), { avatarUrl: tempFilePath });
                                taro_1.default.setStorageSync("userInfo", updatedLoggedInUser);
                            }
                        }
                        catch (e) { }
                        // 3. 模拟上传
                        setTimeout(() => {
                            const permanentUrl = "https://picsum.photos/seed/new-avatar/100";
                            console.log("模拟上传成功，并拿到了永久URL", permanentUrl);
                            // 4. 用永久URL更新 UI 和本地存储
                            setUserInfo(Object.assign(Object.assign({}, userInfo), { avatarUrl: permanentUrl }));
                            try {
                                const loggedInUser = getLoggedInUser();
                                if (loggedInUser) {
                                    const updatedLoggedInUser = Object.assign(Object.assign({}, loggedInUser), { avatarUrl: permanentUrl });
                                    taro_1.default.setStorageSync("userInfo", updatedLoggedInUser);
                                }
                            }
                            catch (e) { }
                        }, 1500); // 1.5秒模拟上传
                    },
                    fail: (imgErr) => {
                        console.log("Image selection failed:", imgErr);
                        // Check if the error message indicates cancellation
                        if (imgErr.errMsg && !imgErr.errMsg.includes("cancel")) {
                            taro_1.default.showToast({ title: "选择图片失败", icon: "none" });
                        }
                    },
                });
            },
            fail: (err) => {
                console.log("Action sheet failed:", err);
                // Check if the error message indicates cancellation
                if (err.errMsg && !err.errMsg.includes("cancel")) {
                    // Handle other action sheet errors if necessary
                }
            },
        });
    };
    const handleNavigateToMyPosts = () => {
        taro_1.default.navigateTo({
            url: "/pages/my/my-posts/my-posts",
        });
    };
    const handleNavigateToEditNickname = () => {
        taro_1.default.navigateTo({
            // Pass current nickname to prefill, or let edit page fetch it
            url: `/pages/my/edit-nickname/index?nickname=${encodeURIComponent(userInfo.nickname === DEFAULT_NICKNAME ? "" : userInfo.nickname)}`,
        });
    };
    // const handleTestRequest = async () => { ... }; // Removed for brevity now
    return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "my-page", children: [(0, jsx_runtime_1.jsxs)(components_1.View, { className: "user-info-section", children: [userInfo.avatarUrl === DEFAULT_AVATAR || !userInfo.avatarUrl ? ((0, jsx_runtime_1.jsx)(components_1.View, { className: "user-avatar default-avatar-placeholder" // Add a specific class for styling "BB"
                        , onClick: handleAvatarClick, children: (0, jsx_runtime_1.jsx)(components_1.Text, { children: "BB" }) })) : ((0, jsx_runtime_1.jsx)(components_1.Image, { className: "user-avatar", src: userInfo.avatarUrl, onClick: handleAvatarClick })), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "user-details", onClick: handleNavigateToEditNickname, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "user-nickname", children: userInfo.nickname }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "edit-indicator", children: ">" }), " "] })] }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "menu-list", children: [(0, jsx_runtime_1.jsxs)(components_1.View, { className: "menu-item", onClick: handleNavigateToMyPosts, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u6211\u7684\u53D1\u5E03" }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "menu-arrow", children: ">" })] }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "menu-item", onClick: () => taro_1.default.navigateTo({ url: "/pages/my/favorites/index" }), children: [(0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u6211\u7684\u6536\u85CF" }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "menu-arrow", children: ">" })] }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "menu-item", onClick: () => taro_1.default.navigateTo({ url: "/pages/message/index" }), children: [(0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u6211\u7684\u6D88\u606F" }), (0, jsx_runtime_1.jsx)(components_1.View, { style: {
                                    backgroundColor: "red",
                                    borderRadius: "50%",
                                    width: "20rpx",
                                    height: "20rpx",
                                    marginLeft: "auto",
                                    marginRight: "20rpx",
                                } }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "menu-arrow", children: ">" })] }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "menu-item", onClick: () => taro_1.default.navigateTo({ url: "/pages/settings/help-feedback/index" }), children: [(0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u5E2E\u52A9\u4E0E\u53CD\u9988" }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "menu-arrow", children: ">" })] }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "menu-item", onClick: () => taro_1.default.navigateTo({ url: "/pages/settings/about/index" }), children: [(0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u5173\u4E8E\u5E2E\u5E2E" }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "menu-arrow", children: ">" })] })] })] }));
}
//# sourceMappingURL=index.js.map