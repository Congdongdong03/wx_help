"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const taro_1 = require("@tarojs/taro");
const components_1 = require("@tarojs/components");
const user_1 = require("../../store/user");
const react_redux_1 = require("react-redux");
const actions_1 = require("../../store/user/actions");
require("./index.scss");
// 测试用户数据
const TEST_USERS = {
    userA: {
        id: 1,
        openid: "dev_openid_123",
        nickName: "用户A（卖家）",
        avatarUrl: "https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132",
        gender: 1,
        city: "Sydney",
        province: "NSW",
        country: "Australia",
        language: "zh_CN",
        status: "active",
        token: "test_token_user_a",
    },
    userB: {
        id: 2,
        openid: "dev_openid_456",
        nickName: "用户B（买家）",
        avatarUrl: "https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132",
        gender: 2,
        city: "Melbourne",
        province: "VIC",
        country: "Australia",
        language: "zh_CN",
        status: "active",
        token: "test_token_user_b",
    },
};
const UserSwitcher = ({ isVisible, onClose }) => {
    const { currentUser } = (0, user_1.useUser)();
    const dispatch = (0, react_redux_1.useDispatch)();
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    // 只在开发环境显示
    if (process.env.NODE_ENV !== "development") {
        return null;
    }
    if (!isVisible) {
        return null;
    }
    const handleSwitchUser = async (userKey) => {
        setIsLoading(true);
        try {
            const userData = TEST_USERS[userKey];
            // 先登出当前用户
            if (currentUser) {
                dispatch((0, actions_1.logout)());
            }
            // 模拟登录延迟
            await new Promise((resolve) => setTimeout(resolve, 500));
            // 登录新用户
            dispatch((0, actions_1.loginSuccess)(userData));
            // 存储到本地存储
            taro_1.default.setStorageSync("openid", userData.openid);
            taro_1.default.setStorageSync("userInfo", userData);
            taro_1.default.showToast({
                title: `已切换到${userData.nickName}`,
                icon: "success",
                duration: 2000,
            });
            // 触发全局事件
            taro_1.default.eventCenter.trigger("userInfoUpdated");
            onClose();
        }
        catch (error) {
            console.error("切换用户失败:", error);
            taro_1.default.showToast({
                title: "切换用户失败",
                icon: "none",
                duration: 2000,
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleLogout = async () => {
        setIsLoading(true);
        try {
            dispatch((0, actions_1.logout)());
            taro_1.default.removeStorageSync("openid");
            taro_1.default.removeStorageSync("userInfo");
            taro_1.default.showToast({
                title: "已退出登录",
                icon: "success",
                duration: 2000,
            });
            taro_1.default.eventCenter.trigger("userInfoUpdated");
            onClose();
        }
        catch (error) {
            console.error("退出登录失败:", error);
            taro_1.default.showToast({
                title: "退出登录失败",
                icon: "none",
                duration: 2000,
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    return ((0, jsx_runtime_1.jsx)(components_1.View, { className: "user-switcher-overlay", onClick: onClose, children: (0, jsx_runtime_1.jsxs)(components_1.View, { className: "user-switcher-modal", onClick: (e) => e.stopPropagation(), children: [(0, jsx_runtime_1.jsxs)(components_1.View, { className: "modal-header", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "modal-title", children: "\u6D4B\u8BD5\u7528\u6237\u5207\u6362\u9762\u677F" }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "modal-subtitle", children: "\u4EC5\u5F00\u53D1\u73AF\u5883\u53EF\u89C1" })] }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "current-user-info", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "current-user-label", children: "\u5F53\u524D\u7528\u6237\uFF1A" }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "current-user-name", children: currentUser ? currentUser.nickName : "未登录" })] }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "user-buttons", children: [(0, jsx_runtime_1.jsx)(components_1.Button, { className: `user-button ${(currentUser === null || currentUser === void 0 ? void 0 : currentUser.id) === TEST_USERS.userA.id ? "active" : ""}`, onClick: () => handleSwitchUser("userA"), disabled: isLoading, loading: isLoading, children: "\u4E00\u952E\u767B\u5F55\u4E3A\u7528\u6237A\uFF08\u5356\u5BB6\uFF09" }), (0, jsx_runtime_1.jsx)(components_1.Button, { className: `user-button ${(currentUser === null || currentUser === void 0 ? void 0 : currentUser.id) === TEST_USERS.userB.id ? "active" : ""}`, onClick: () => handleSwitchUser("userB"), disabled: isLoading, loading: isLoading, children: "\u4E00\u952E\u767B\u5F55\u4E3A\u7528\u6237B\uFF08\u4E70\u5BB6\uFF09" }), currentUser && ((0, jsx_runtime_1.jsx)(components_1.Button, { className: "logout-button", onClick: handleLogout, disabled: isLoading, loading: isLoading, children: "\u9000\u51FA\u767B\u5F55" }))] }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "test-tips", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "tips-title", children: "\u6D4B\u8BD5\u8BF4\u660E\uFF1A" }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "tips-content", children: "1. \u7528\u6237A\u662F\u5356\u5BB6\uFF0C\u67E5\u770B\u81EA\u5DF1\u7684\u5E16\u5B50\u65F6\u4E0D\u4F1A\u770B\u5230\"\u79C1\u4FE1\u5356\u5BB6\"\u6309\u94AE" }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "tips-content", children: "2. \u7528\u6237B\u662F\u4E70\u5BB6\uFF0C\u67E5\u770B\u7528\u6237A\u7684\u5E16\u5B50\u65F6\u4F1A\u770B\u5230\"\u79C1\u4FE1\u5356\u5BB6\"\u6309\u94AE" }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "tips-content", children: "3. \u5207\u6362\u7528\u6237\u540E\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u6216\u91CD\u65B0\u8FDB\u5165\u5E16\u5B50\u8BE6\u60C5\u9875" })] }), (0, jsx_runtime_1.jsx)(components_1.Button, { className: "close-button", onClick: onClose, children: "\u5173\u95ED" })] }) }));
};
exports.default = UserSwitcher;
//# sourceMappingURL=index.js.map