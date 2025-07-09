"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LoginModal;
const jsx_runtime_1 = require("react/jsx-runtime");
const taro_1 = require("@tarojs/taro");
const react_1 = require("react");
const components_1 = require("@tarojs/components");
const app_1 = require("../../app");
const hooks_1 = require("../../store/user/hooks");
const debounce_1 = require("../../utils/debounce");
const request_1 = require("../../utils/request");
const api_1 = require("../../config/api");
require("./index.scss");
// Mock API for login simulation (copied from app.tsx for standalone use if needed, or import)
const mockLoginAPI = (profileInfo) => {
    console.log("🔄 mockLoginAPI: Starting login API simulation with profile:", profileInfo);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const shouldFail = Math.random() < 0.1;
            console.log(`🎲 mockLoginAPI: Random failure check - should fail: ${shouldFail}`);
            if (shouldFail) {
                console.log("❌ mockLoginAPI: Simulating network error");
                reject({ errMsg: "Network error or API failure" });
                return;
            }
            const mockUser = Object.assign(Object.assign({}, profileInfo), { avatarUrl: profileInfo.avatarUrl, nickName: profileInfo.nickName, openid: `mock_openid_${Date.now()}`, token: `mock_token_${Date.now()}` });
            console.log("✅ mockLoginAPI: Login simulation successful, returning user:", mockUser);
            resolve(mockUser);
        }, 1000);
    });
};
function LoginModal(props) {
    const [isVisible, setIsVisible] = (0, react_1.useState)(false);
    const [modalType, setModalType] = (0, react_1.useState)("initial");
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    // 使用新的用户状态管理
    const { login, isLoggedIn } = (0, hooks_1.useUser)();
    console.log("🏗️ LoginModal: Component rendered with state:", {
        isVisible,
        modalType,
        isLoading,
    });
    (0, react_1.useEffect)(() => {
        console.log("🔌 LoginModal: Setting up event listeners");
        app_1.loginModalEventBus.on("show", () => {
            console.log("📢 LoginModal: Received show event");
            setIsVisible(true);
            setModalType("initial");
        });
        app_1.loginModalEventBus.on("hide", () => {
            console.log("📢 LoginModal: Received hide event");
            setIsVisible(false);
        });
        return () => {
            console.log("🔌 LoginModal: Cleaning up event listeners");
            app_1.loginModalEventBus.off("show");
            app_1.loginModalEventBus.off("hide");
        };
    }, []);
    // 使用节流处理授权操作
    const handleAuthorize = (0, debounce_1.throttle)(async () => {
        var _a, _b, _c, _d;
        console.log("🔘 LoginModal: Authorize button clicked");
        console.log("🔘 LoginModal: Current modal type:", modalType);
        console.log("🔘 LoginModal: Setting loading state to true");
        setIsLoading(true);
        try {
            // 1. 获取用户信息
            console.log("📱 LoginModal: Calling Taro.getUserProfile...");
            const userProfileRes = await taro_1.default.getUserProfile({
                desc: "用于完善会员资料与登录",
            });
            if (!userProfileRes.userInfo) {
                throw new Error("获取用户信息失败");
            }
            const userInfo = userProfileRes.userInfo;
            console.log("✅ LoginModal: Taro.getUserProfile success, userInfo received:", userInfo);
            // 2. 获取openid
            console.log("📱 LoginModal: Getting openid...");
            const loginRes = await taro_1.default.login();
            if (!loginRes.code) {
                throw new Error("获取登录凭证失败");
            }
            // 开发环境使用测试code
            const code = process.env.NODE_ENV === "development"
                ? "dev_test_code"
                : loginRes.code;
            console.log("🔧 LoginModal: Using code:", code);
            // 3. 调用登录接口
            console.log("🔄 LoginModal: Calling login API...");
            const loginResData = await (0, request_1.request)(api_1.API_CONFIG.getApiUrl("/auth/wechat-login"), {
                method: "POST",
                data: {
                    code: code,
                    userInfo,
                },
                retryCount: 3,
                retryDelay: 1000,
                retryableStatusCodes: [408, 429, 500, 502, 503, 504],
            });
            const loggedInUser = Object.assign(Object.assign({}, loginResData.data), { token: loginResData.data.token || "mock_token_" + Date.now() });
            console.log("✅ LoginModal: Login API successful, user data:", loggedInUser);
            console.log("💾 LoginModal: Storing logged in user...");
            // 确保 openid 存在
            if (!loggedInUser.openid) {
                console.error("❌ LoginModal: loggedInUser.openid is missing!");
                throw new Error("登录响应中缺少 openid");
            }
            // 额外保存 openid 到本地缓存（兼容 request.ts 中的 getCurrentUserId）
            taro_1.default.setStorageSync("openid", loggedInUser.openid);
            console.log("💾 LoginModal: openid saved to storage:", loggedInUser.openid);
            // 使用新的用户状态管理
            login(loggedInUser);
            console.log("✅ LoginModal: User stored successfully");
            console.log("🎉 LoginModal: Showing success toast");
            taro_1.default.showToast({
                title: `欢迎回来，${loggedInUser.nickName}`,
                icon: "success",
                duration: 2000,
            });
            // 新增：触发全局事件并跳转到"我的"页面，确保页面刷新
            taro_1.default.eventCenter.trigger("userInfoUpdated");
            taro_1.default.switchTab({ url: "/pages/my/index" });
            console.log("🚪 LoginModal: Hiding modal (setting isVisible to false)");
            setIsVisible(false);
            console.log("🔄 LoginModal: Setting loading state to false");
            setIsLoading(false);
            console.log("📤 LoginModal: Triggering authSuccess event");
            app_1.loginModalEventBus.trigger("authSuccess", loggedInUser);
            console.log("✅ LoginModal: Authorization process completed successfully");
        }
        catch (err) {
            console.error("❌ LoginModal: Authorization failed with error:", err);
            console.log("🔄 LoginModal: Setting loading state to false due to error");
            setIsLoading(false);
            let errMsg = "授权失败，请稍后重试";
            console.log("🔍 LoginModal: Analyzing error type...");
            if ((_a = err.errMsg) === null || _a === void 0 ? void 0 : _a.includes("getUserProfile:fail auth deny")) {
                console.log("🚫 LoginModal: User explicitly denied authorization");
                errMsg = "您已拒绝授权";
                console.log("🔄 LoginModal: Switching to overlay mode due to user rejection");
                setModalType("overlay");
                console.log("📤 LoginModal: Triggering authReject event");
                app_1.loginModalEventBus.trigger("authReject");
            }
            else if ((_b = err.errMsg) === null || _b === void 0 ? void 0 : _b.includes("Network error")) {
                console.log("🌐 LoginModal: Network error detected");
                errMsg = "网络连接失败，请检查网络后重试";
            }
            else if ((_c = err.message) === null || _c === void 0 ? void 0 : _c.includes("HTTP 429")) {
                console.log("🚫 LoginModal: Rate limit exceeded");
                errMsg = "请求过于频繁，请稍后再试";
            }
            else if ((_d = err.message) === null || _d === void 0 ? void 0 : _d.includes("HTTP 5")) {
                console.log("🚫 LoginModal: Server error");
                errMsg = "服务器暂时不可用，请稍后再试";
            }
            else if (err.message === "获取用户信息失败") {
                errMsg = "获取用户信息失败，请重试";
            }
            else if (err.message === "获取登录凭证失败") {
                errMsg = "登录失败，请重试";
            }
            console.log(`📝 LoginModal: Final error message: "${errMsg}"`);
            console.log(`🔍 LoginModal: Current modalType for error handling: "${modalType}"`);
            if (modalType === "initial" && errMsg !== "您已拒绝授权") {
                console.log("🍞 LoginModal: Showing error toast for initial modal (non-rejection error)");
                taro_1.default.showToast({
                    title: errMsg,
                    icon: "none",
                    duration: 2500,
                });
            }
            else if (modalType === "overlay") {
                console.log("🍞 LoginModal: Showing error toast for overlay modal");
                taro_1.default.showToast({
                    title: errMsg,
                    icon: "none",
                    duration: 2500,
                });
            }
            console.log("❌ LoginModal: Error handling completed");
        }
    }, 1000);
    // 使用节流处理拒绝操作
    const handleRejectInitial = (0, debounce_1.throttle)(() => {
        console.log("🚫 LoginModal: Initial reject button clicked");
        console.log("🚫 LoginModal: Current modalType:", modalType);
        console.log("🔄 LoginModal: Switching modalType from 'initial' to 'overlay'");
        setModalType("overlay");
        console.log("📤 LoginModal: Triggering authReject event");
        app_1.loginModalEventBus.trigger("authReject");
        console.log("✅ LoginModal: Reject handling completed");
    }, 1000);
    console.log("🔍 LoginModal: Checking visibility state before render, isVisible:", isVisible);
    if (!isVisible) {
        console.log("👻 LoginModal: Component not visible, returning null");
        return null;
    }
    console.log("📱 LoginModal: Component is visible, rendering modal");
    console.log("🎭 LoginModal: Checking modal type for rendering, modalType:", modalType);
    if (modalType === "overlay") {
        console.log("📱 LoginModal: Rendering overlay modal");
        return ((0, jsx_runtime_1.jsx)(components_1.View, { className: "login-modal-overlay", children: (0, jsx_runtime_1.jsxs)(components_1.View, { className: "overlay-content", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "overlay-title", children: "\u8BF7\u5148\u767B\u5F55\u540E\u518D\u7EE7\u7EED\u4F7F\u7528\u54E6\uFF5E" }), (0, jsx_runtime_1.jsx)(components_1.Button, { className: "overlay-auth-button", onClick: handleAuthorize, loading: isLoading, disabled: isLoading, children: "\u91CD\u65B0\u6388\u6743" })] }) }));
    }
    // Initial Modal Type
    console.log("📱 LoginModal: Rendering initial modal");
    return ((0, jsx_runtime_1.jsx)(components_1.View, { className: "login-modal", children: (0, jsx_runtime_1.jsxs)(components_1.View, { className: "modal-content", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "modal-title", children: "\u6B22\u8FCE\u4F7F\u7528\u5E2E\u5E2E" }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "modal-subtitle", children: "\u6388\u6743\u540E\u5373\u53EF\u4F7F\u7528\u5B8C\u6574\u529F\u80FD" }), (0, jsx_runtime_1.jsx)(components_1.Button, { className: "auth-button", onClick: handleAuthorize, loading: isLoading, disabled: isLoading, children: "\u5FAE\u4FE1\u4E00\u952E\u767B\u5F55" }), (0, jsx_runtime_1.jsx)(components_1.Button, { className: "reject-button", onClick: handleRejectInitial, disabled: isLoading, children: "\u6682\u4E0D\u767B\u5F55" })] }) }));
}
//# sourceMappingURL=index.js.map